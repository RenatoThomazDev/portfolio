"use client";
import { useEffect } from "react";

/* Rabisco no papel: segurando o botão esquerdo numa área vazia, o cursor desenha um traço de grafite.
   O traço fica gravado na folha: o SVG é absoluto em relação ao documento (não fixo), cobre a altura da página e os
   pontos são gravados com o scroll somado (pageX/pageY), então o desenho rola junto com a página.

   Apaga como se faz no papel: uma borracha (visível, em traço técnico) esfrega a REGIÃO, não o caminho do traço.
   - Grupos: traços cujas caixas (com 24px de folga) se tocam ou se cruzam formam um grupo; traços afastados ficam em
     grupos separados (um traço isolado é um grupo de um traço só).
   - Varredura: passadas de vaivém em diagonal (~45°) cobrindo a altura (ou a largura) inteira da área do grupo,
     avançando ~11px a cada ida ou volta, do lado onde começou o traço mais antigo até o lado oposto. As passadas são
     recortadas na área e o tempo de cada uma é proporcional ao comprimento: os cantos (passadas curtas) passam rápido
     e a borracha nunca fica parada sobre papel vazio. Avanço médio ~100px/s, com aceleração e frenagem leves.
   - Ordem e tempo: grupos do mais antigo para o mais novo; a varredura começa ~3s depois do último traço do grupo.
     Entre grupos prontos a borracha viaja direto até o próximo (200ms).
   - Resto de tinta: a primeira passada deixa ~15% da tinta; uma segunda, 0,4s atrás, limpa o resto. A segunda termina
     sozinha enquanto a borracha já segue para o próximo grupo.
   - Traço desenhado perto de um grupo que já está sendo apagado entra no grupo, mas só é apagado pelo trecho da
     varredura que ainda não passou.
   Como: cada traço tem a própria <mask> (branco = tinta visível). As passadas são paths pretos grossos (a primeira com
   85% de opacidade) copiados para a máscara de cada traço do grupo. No fim, os traços que já existiam quando a
   varredura começou saem do DOM com a máscara; os que entraram no meio formam um grupo novo.
   Borracha visível: grupo SVG dentro do mesmo SVG do rabisco (presa à folha), movido só por transform e opacity.
   Só mouse (nunca toque), nunca com movimento reduzido, nunca sobre texto, links, imagens ou controles.
   SVG em vez de canvas: um canvas da altura da página inteira seria um buffer de pixels enorme; o SVG só guarda os traços. */
const ESPERA = 3000;   // do último traço do grupo ao começo da varredura
const FOLGA = 24;      // px: caixas mais próximas que isso formam um grupo
const VEL = 0.1;       // px por ms na direção do avanço (média)
const BORRACHA = 16;   // px, ponta redonda
const PASSO = 11;      // px de avanço por ida ou volta (10-12 com a variação)
const ATRASO_2 = 400;  // segunda passada, logo atrás
const RESTO = 0.15;    // tinta que a primeira passada deixa
const ENTRADA = 150, VIAGEM = 200, SAIDA = 220; // ms
const MOLA = 80;       // ms: a borracha segue o ponto ativo com esse atraso
const MIGALHAS_MAX = 12;
const NS = "http://www.w3.org/2000/svg";
const BLOQUEIA = "a, button, input, textarea, select, label, img, picture, video, svg, canvas, [contenteditable], .p-media, .channel, .bubble, .stamp, .p-stamp, .sheet-stamp";

function vazio(el: Element | null): boolean {
  if (!el || el.closest(BLOQUEIA)) return false;
  // Elemento com texto próprio (parágrafo, título, item): não é papel vazio.
  for (const n of Array.from(el.childNodes)) if (n.nodeType === 3 && n.textContent!.trim()) return false;
  return true;
}

type Caixa = [number, number, number, number];
type Ponto = { x: number; y: number; t: number };
type Traco = { pts: Ponto[]; linha: SVGPolylineElement; mask: SVGMaskElement; fundo: SVGRectElement; fim: number; caixa: Caixa };
type Grupo = { tracos: Traco[]; idade: number; ultimo: number };
// Caminho da varredura: pontos com o comprimento acumulado; k = índice da passada (para o balanço e as migalhas),
// desce = sentido da passada que termina nesse ponto.
type Vertice = { x: number; y: number; l: number; k: number; desce: boolean };
type Copia = { tr: Traco; l0: number; p1: SVGPathElement; p2: SVGPathElement };
type Varredura = {
  grupo: Grupo; area: Caixa; cam: Vertice[]; total: number; inicio: number; dur: number;
  l1: number; copias: Copia[]; tardios: Traco[]; sentido: 1 | -1; horiz: boolean; primeiraFeita: boolean;
};

// Semente fixa (mulberry32): a varredura varia, mas sempre igual para o mesmo grupo.
function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const tocam = (a: Caixa, b: Caixa, f: number) => a[0] - f <= b[2] && b[0] - f <= a[2] && a[1] - f <= b[3] && b[1] - f <= a[3];
const uniao = (cs: Caixa[]): Caixa => [Math.min(...cs.map((c) => c[0])), Math.min(...cs.map((c) => c[1])), Math.max(...cs.map((c) => c[2])), Math.max(...cs.map((c) => c[3]))];

// Passadas diagonais recortadas na área. Eixo de avanço: o lado maior (u); cada passada cruza o lado menor (v).
// Passada = reta a ~45° presa pelo meio em u = c; a seguinte ~11px adiante, no sentido contrário (vaivém).
function varredura(area: Caixa, origem: Ponto, semente: number) {
  const rnd = aleatorio(semente);
  const [x0, y0, x1, y1] = area, W = x1 - x0, H = y1 - y0;
  const horiz = W >= H, U = horiz ? W : H, V = horiz ? H : W;
  // avança a partir do lado onde começou o traço mais antigo
  const sentido: 1 | -1 = horiz ? (origem.x <= (x0 + x1) / 2 ? 1 : -1) : (origem.y <= (y0 + y1) / 2 ? 1 : -1);
  const pagina = (u: number, v: number) => { const uu = sentido > 0 ? u : U - u; return horiz ? { x: x0 + uu, y: y0 + v } : { x: x0 + v, y: y0 + uu }; };
  const cam: Vertice[] = [];
  let desce = true, k = 0;
  for (let c = -V / 2; c <= U + V / 2; c += PASSO * (0.9 + rnd() * 0.2)) {
    // 45° ± 2° (com mais variação, passadas vizinhas deixam de ser paralelas e abrem frestas na borda)
    const inc = Math.tan(((45 + (rnd() - 0.5) * 4) * Math.PI) / 180);
    // recorta a reta u = c + (v - V/2)·inc no retângulo 0..U × 0..V e deixa passar um pouco da borda (0-8px)
    let va = Math.max(0, V / 2 - c / inc), vb = Math.min(V, V / 2 + (U - c) / inc);
    if (vb - va < 1) continue;
    va = Math.max(-8, va - rnd() * 8); vb = Math.min(V + 8, vb + rnd() * 8);
    const p = pagina(c + (va - V / 2) * inc, va), q = pagina(c + (vb - V / 2) * inc, vb);
    const [a, b] = desce ? [p, q] : [q, p];
    for (const [pt, ehFim] of [[a, false], [b, true]] as const) {
      const ult = cam[cam.length - 1];
      const l = ult ? ult.l + Math.hypot(pt.x - ult.x, pt.y - ult.y) : 0;
      cam.push({ x: pt.x, y: pt.y, l, k, desce: ehFim ? desce : !desce });
    }
    desce = !desce; k++;
  }
  return { cam, total: cam[cam.length - 1].l, sentido, horiz, avanco: U + V };
}
// Avanço com aceleração e frenagem leves: 85% linear + 15% senoide (o começo anda a ~80% da velocidade do meio).
const curva = (u: number) => 0.85 * u + 0.15 * (0.5 - 0.5 * Math.cos(Math.PI * u));
// Ponto do caminho a l px do começo, com o vértice do trecho atual.
function em(cam: Vertice[], l: number) {
  let i = 1; while (i < cam.length - 1 && cam[i].l < l) i++;
  const a = cam[i - 1], b = cam[i], f = Math.min(1, Math.max(0, (l - a.l) / Math.max(0.001, b.l - a.l)));
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, i, f, passada: a.k === b.k, k: b.k, desce: b.desce };
}
// Trecho do caminho entre l0 e l1 px.
function trecho(cam: Vertice[], l0: number, l1: number) {
  if (l1 <= l0) return "";
  const a = em(cam, l0), b = em(cam, l1);
  const pts = [a, ...cam.slice(a.i, b.i), b];
  return "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("L");
}

export default function Scribble() {
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let sv: SVGSVGElement | null = null, defs: SVGDefsElement | null = null;
    let raf = 0, espera = 0, seq = 0, ultimoQuadro = 0;
    let atual: Traco | null = null;
    let grupos: Grupo[] = []; // à espera, do mais antigo para o mais novo
    let ativa: Varredura | null = null;         // a que a borracha está percorrendo
    const terminando: Varredura[] = [];        // primeira passada feita, segunda ainda andando
    // diagnóstico: só registra se a página tiver window.__borrachaLog (criado por quem está medindo)
    const log = (window as unknown as { __borrachaLog?: unknown[] }).__borrachaLog;

    // ---- borracha visível ----
    // Fase: fora, entrando (de 40px fora da área até o começo), varrendo, viajando (até o próximo grupo), saindo.
    type Fase = { nome: "fora" | "entrando" | "varrendo" | "viajando" | "saindo"; t0: number; de: { x: number; y: number }; para: { x: number; y: number } };
    let fase: Fase = { nome: "fora", t0: 0, de: { x: 0, y: 0 }, para: { x: 0, y: 0 } };
    let gB: SVGGElement | null = null, corpo: SVGGElement | null = null;
    const pos = { x: 0, y: 0 }; let inclina = -25, ultimaPassada = -1, passadasDesdeMigalha = 0, proxMigalha = 2;
    let migalhas = 0;

    // Altura: o SVG é absoluto no <body> (relative) com top 0 e bottom 0 (globals.css). Acompanha a página sem
    // nunca definir a altura dela; antes um height fixo em px segurava o documento na altura antiga.
    const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      return e;
    };
    const montar = () => {
      if (sv) return;
      sv = document.createElementNS(NS, "svg"); sv.setAttribute("class", "scribble"); sv.setAttribute("aria-hidden", "true");
      defs = document.createElementNS(NS, "defs"); sv.appendChild(defs);
      // Borracha escolar em traço técnico: bloco 44x22 com cantos levemente arredondados e a faixa da capa.
      // A ponta de apagar (lado esquerdo, x=0) fica na origem: é ela que vai no ponto ativo da varredura.
      gB = el("g", { class: "borracha" });
      corpo = el("g", { class: "borracha-corpo" });
      corpo.append(
        el("rect", { x: 0.75, y: -10.25, width: 42.5, height: 20.5, rx: 3.5 }),
        el("path", { d: "M17 -10.25V10.25M20.5 -10.25V10.25" }), // borda da capa (dupla, como a dobra do papel)
        el("path", { class: "borracha-fio", d: "M27 -3.5H38M27 0.5H35" }), // marca na capa, em traço fino
      );
      gB.appendChild(corpo);
      sv.appendChild(gB);
      document.body.appendChild(sv);
    };
    const ajustarCaixa = (tr: Traco) => {
      // A máscara só cobre a caixa do traço (com folga): mascarar a página inteira custaria caro a cada quadro.
      const [x0, y0, x1, y1] = tr.caixa, f = 8;
      for (const e of [tr.mask, tr.fundo]) { e.setAttribute("x", String(x0 - f)); e.setAttribute("y", String(y0 - f)); e.setAttribute("width", String(x1 - x0 + 2 * f)); e.setAttribute("height", String(y1 - y0 + 2 * f)); }
    };
    const pontos = (pts: Ponto[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

    const novoTraco = (p: Ponto) => {
      const id = `rabisco-${++seq}`;
      const mask = el("mask", { id, maskUnits: "userSpaceOnUse" });
      const fundo = el("rect", { fill: "#fff" });
      mask.appendChild(fundo); defs!.appendChild(mask);
      const linha = el("polyline", { mask: `url(#${id})` });
      linha.style.opacity = String(0.6 + Math.random() * 0.3); // grafite: cada traço com pressão um pouco diferente
      sv!.insertBefore(linha, gB); // a borracha fica sempre por cima dos traços
      const tr: Traco = { pts: [p], linha, mask, fundo, fim: 0, caixa: [p.x, p.y, p.x, p.y] };
      linha.setAttribute("points", pontos(tr.pts)); ajustarCaixa(tr);
      return tr;
    };
    const somar = (tr: Traco, p: Ponto) => {
      const u = tr.pts[tr.pts.length - 1];
      if (u.x === p.x && u.y === p.y) return;
      tr.pts.push(p);
      tr.caixa = [Math.min(tr.caixa[0], p.x), Math.min(tr.caixa[1], p.y), Math.max(tr.caixa[2], p.x), Math.max(tr.caixa[3], p.y)];
      tr.linha.setAttribute("points", pontos(tr.pts)); ajustarCaixa(tr);
    };
    const borracha = (tr: Traco, l0: number): Copia => {
      const p = (op: number) => { const c = el("path", { fill: "none", stroke: "#000", "stroke-opacity": op, "stroke-width": BORRACHA, "stroke-linecap": "round", "stroke-linejoin": "round" }); tr.mask.appendChild(c); return c; };
      return { tr, l0, p1: p(1 - RESTO), p2: p(1) };
    };

    // ---- agrupamento ----
    const caixaGrupo = (g: Grupo) => uniao(g.tracos.map((t) => t.caixa));
    const entrar = (tr: Traco) => {
      // perto do grupo que está sendo apagado: entra nele, só a partir de onde a borracha está agora
      if (ativa && tocam(tr.caixa, ativa.area, FOLGA)) {
        ativa.copias.push(borracha(tr, ativa.l1)); ativa.tardios.push(tr); ativa.grupo.tracos.push(tr);
        return;
      }
      // junta todos os grupos à espera que ele toca (o traço pode ligar dois grupos)
      const juntos = grupos.filter((g) => tocam(tr.caixa, caixaGrupo(g), FOLGA));
      grupos = grupos.filter((g) => !juntos.includes(g));
      const tracos = [...juntos.flatMap((g) => g.tracos), tr];
      grupos.push({ tracos, idade: Math.min(...tracos.map((t) => t.pts[0].t)), ultimo: Math.max(...tracos.map((t) => t.fim)) });
      grupos.sort((a, b) => a.idade - b.idade);
    };

    // ---- varredura ----
    const preparar = (g: Grupo, agora: number): Varredura => {
      const [x0, y0, x1, y1] = caixaGrupo(g), m = BORRACHA / 2;
      const area: Caixa = [x0 - m, y0 - m, x1 + m, y1 + m];
      const antigo = g.tracos.reduce((a, b) => (a.pts[0].t <= b.pts[0].t ? a : b));
      const v = varredura(area, antigo.pts[0], Math.round(antigo.pts[0].x * 31 + antigo.pts[0].y * 17));
      return { grupo: g, area, cam: v.cam, total: v.total, inicio: agora, dur: Math.max(600, v.avanco / VEL), l1: 0, copias: g.tracos.map((t) => borracha(t, 0)), tardios: [], sentido: v.sentido, horiz: v.horiz, primeiraFeita: false };
    };
    // Começa o grupo mais antigo, se já passou o tempo de espera dele; senão agenda. A borracha entra (vinda de fora)
    // se estava fora, ou viaja direto (200ms) se acabou de terminar outro grupo.
    const agendar = () => {
      if (ativa || !grupos.length) { sairSePreciso(); return; }
      clearTimeout(espera); espera = 0;
      const g = grupos[0];
      const agora = performance.now();
      const falta = g.ultimo + ESPERA - agora;
      if (falta > 0) { sairSePreciso(); espera = window.setTimeout(agendar, falta); return; }
      grupos.shift();
      const vindo = fase.nome === "varrendo" || fase.nome === "viajando";
      const espera0 = vindo ? VIAGEM : ENTRADA;
      ativa = preparar(g, agora + espera0);
      const p0 = ativa.cam[0];
      if (vindo) fase = { nome: "viajando", t0: agora, de: { ...pos }, para: { x: p0.x, y: p0.y } };
      else {
        // entra de ~40px fora da área, do lado de onde a varredura começa, caindo um pouco
        const dx = ativa.horiz ? -40 * ativa.sentido : 0, dy = ativa.horiz ? -12 : -40 * ativa.sentido;
        fase = { nome: "entrando", t0: agora, de: { x: p0.x + dx, y: p0.y + dy }, para: { x: p0.x, y: p0.y } };
        pos.x = p0.x + dx; pos.y = p0.y + dy;
      }
      if (!raf) raf = requestAnimationFrame(quadro);
    };
    const sairSePreciso = () => {
      if (ativa || fase.nome === "fora" || fase.nome === "saindo") return;
      fase = { nome: "saindo", t0: performance.now(), de: { ...pos }, para: { x: pos.x + 6, y: pos.y - 24 } };
      if (!raf) raf = requestAnimationFrame(quadro);
    };
    const fechar = (v: Varredura) => {
      // os traços que já existiam quando a varredura começou ficaram dentro da área inteira: saem do DOM
      for (const t of v.grupo.tracos) if (!v.tardios.includes(t)) { t.linha.remove(); t.mask.remove(); }
    };

    const migalha = (x: number, y: number) => {
      if (migalhas >= MIGALHAS_MAX || !sv) return;
      migalhas++;
      const r = Math.random;
      const m = r() < 0.5 ? el("circle", { cx: 0, cy: 0, r: 1 + r() }) : el("path", { d: `M0 0l${(2 + r() * 2).toFixed(1)} ${(r() - 0.5).toFixed(1)}` });
      m.setAttribute("class", "migalha");
      const st = (m as SVGElement).style;
      st.setProperty("--x", `${x.toFixed(1)}px`); st.setProperty("--y", `${y.toFixed(1)}px`);
      st.setProperty("--dx", `${((r() - 0.5) * 10).toFixed(1)}px`); st.setProperty("--dy", `${(10 + r() * 10).toFixed(1)}px`);
      st.setProperty("--r", `${((r() - 0.5) * 120).toFixed(0)}deg`);
      m.addEventListener("animationend", () => { m.remove(); migalhas--; }, { once: true });
      sv.insertBefore(m, gB);
    };

    const quadro = () => {
      raf = 0;
      const agora = performance.now();
      const dt = ultimoQuadro ? Math.min(64, agora - ultimoQuadro) : 16;
      ultimoQuadro = agora;
      // segundas passadas terminando em paralelo
      for (const v of [...terminando]) {
        const l2 = v.total * curva(Math.min(1, Math.max(0, (agora - v.inicio - ATRASO_2) / v.dur)));
        for (const c of v.copias) c.p2.setAttribute("d", trecho(v.cam, c.l0, l2));
        if (agora >= v.inicio + v.dur + ATRASO_2) { fechar(v); terminando.splice(terminando.indexOf(v), 1); }
      }
      // varredura ativa: primeira passada (deixa 15%) e a segunda, 0,4s atrás
      let alvo: ReturnType<typeof em> | null = null;
      if (ativa) {
        const v = ativa, u = (agora - v.inicio) / v.dur;
        v.l1 = u <= 0 ? 0 : v.total * curva(Math.min(1, u));
        const l2 = v.total * curva(Math.min(1, Math.max(0, (agora - v.inicio - ATRASO_2) / v.dur)));
        for (const c of v.copias) { c.p1.setAttribute("d", trecho(v.cam, c.l0, v.l1)); c.p2.setAttribute("d", trecho(v.cam, c.l0, l2)); }
        log?.push({ t: agora, l: v.l1, total: v.total, area: v.area.join(","), fase: fase.nome });
        alvo = em(v.cam, v.l1);
        if (u >= 1) {
          // primeira passada feita: a segunda termina sozinha; os traços que entraram no meio viram um grupo novo
          terminando.push(v); ativa = null;
          for (const t of v.tardios) entrar(t);
          agendar();
        }
      }
      // ---- borracha visível ----
      if (gB && corpo && fase.nome !== "fora") {
        const tf = agora - fase.t0;
        let alvoX = pos.x, alvoY = pos.y, op = 1, queda = 0, balanco = 0, aperto = 1;
        if (fase.nome === "entrando" || fase.nome === "viajando") {
          const k = Math.min(1, tf / (fase.nome === "entrando" ? ENTRADA : VIAGEM)), e = 1 - (1 - k) * (1 - k);
          alvoX = fase.de.x + (fase.para.x - fase.de.x) * e; alvoY = fase.de.y + (fase.para.y - fase.de.y) * e;
          if (fase.nome === "entrando") { op = k; queda = (1 - e) * -8; }
          pos.x = alvoX; pos.y = alvoY;
          if (ativa && agora >= ativa.inicio) fase = { ...fase, nome: "varrendo", t0: agora };
        } else if (fase.nome === "varrendo" && alvo) {
          // segue o ponto ativo com atraso de mola (~80ms)
          const a = 1 - Math.exp(-dt / MOLA);
          pos.x += (alvo.x - pos.x) * a; pos.y += (alvo.y - pos.y) * a;
          if (alvo.passada) {
            // balanço ±6° acompanhando o vaivém e leve achatamento (pressão) no meio de cada passada
            const s = Math.sin(Math.PI * alvo.f);
            balanco = (alvo.desce ? 6 : -6) * s; aperto = 1 - 0.05 * s;
            if (alvo.k !== ultimaPassada) {
              ultimaPassada = alvo.k;
              if (++passadasDesdeMigalha >= proxMigalha) {
                passadasDesdeMigalha = 0; proxMigalha = 2 + Math.round(Math.random());
                const n = 1 + Math.round(Math.random());
                for (let i = 0; i < n; i++) migalha(alvo.x + (Math.random() - 0.5) * 8, alvo.y + (Math.random() - 0.5) * 6);
              }
            }
          }
        } else if (fase.nome === "saindo") {
          const k = Math.min(1, tf / SAIDA), e = k * k;
          pos.x = fase.de.x + (fase.para.x - fase.de.x) * e; pos.y = fase.de.y + (fase.para.y - fase.de.y) * e; op = 1 - k;
          if (k >= 1) { fase = { ...fase, nome: "fora" }; op = 0; }
        }
        // inclinada ~25° na direção do avanço (espelhada quando o avanço vai para a esquerda/para cima)
        const base = ativa ? (ativa.sentido > 0 ? -25 : 25) : inclina;
        inclina += (base - inclina) * (1 - Math.exp(-dt / 120));
        const espelho = ativa ? (ativa.sentido > 0 ? 1 : -1) : 1;
        gB.style.transform = `translate(${pos.x.toFixed(1)}px, ${(pos.y + queda).toFixed(1)}px) rotate(${(inclina + balanco).toFixed(1)}deg) scale(${espelho}, ${aperto.toFixed(3)})`;
        gB.style.opacity = op.toFixed(2);
      }
      const ocupado = ativa || terminando.length || (fase.nome !== "fora");
      // só um laço: agendar() pode ter pedido o próximo quadro aqui dentro (sem a guarda, viravam dois laços por quadro)
      if (ocupado) { if (!raf) raf = requestAnimationFrame(quadro); } else ultimoQuadro = 0;
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (!vazio(e.target as Element)) return;
      e.preventDefault(); // evita seleção de texto durante o rabisco
      montar();
      document.documentElement.classList.add("scribbling");
      atual = novoTraco({ x: e.pageX, y: e.pageY, t: performance.now() });
    };
    // Sem o rótulo "segure e arraste para rabiscar" que seguia o cursor: ele caía em cima do texto.
    const move = (e: PointerEvent) => {
      if (atual) somar(atual, { x: e.pageX, y: e.pageY, t: performance.now() });
    };
    const up = () => {
      if (!atual) return;
      atual.fim = performance.now(); entrar(atual); atual = null;
      document.documentElement.classList.remove("scribbling");
      agendar();
    };

    document.addEventListener("pointerdown", down);
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerup", up); addEventListener("blur", up);
    return () => {
      document.removeEventListener("pointerdown", down); removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("blur", up);
      cancelAnimationFrame(raf); clearTimeout(espera); sv?.remove();
    };
  }, []);
  return null;
}
