// Esqueleto de uma letra: a linha central por onde a caneta passa, em traços ordenados como se escreve à mão.
// Só roda no build (scripts/gerar-escrita.mjs). Passos:
//  1. rasteriza o contorno do glifo (preenchimento nonzero, por linhas de varredura);
//  2. afina o bitmap até 1px com Zhang-Suen e mede a meia-espessura da haste (transformada de distância);
//  3. transforma os pixels do esqueleto num grafo (pontas, junções, arestas, laços) e poda os espinhos curtos que
//     nascem em serifas e terminais;
//  4. junta arestas em traços contínuos (a continuação mais reta em cada junção);
//  5. ordena e orienta os traços pela regra de escrita à mão (ver ordenar()) e aplica as revisões manuais por letra.

const ESC = 0.25; // pixels por unidade da fonte (1000 unidades -> 250px de corpo)

// ---------- 1. raster ----------
function achatar(cmds) {
  const polis = []; let p = null, x = 0, y = 0, x0 = 0, y0 = 0;
  const pt = (a, b) => p.push([a, b]);
  for (const c of cmds) {
    if (c.type === "M") { p = []; polis.push(p); x = x0 = c.x; y = y0 = c.y; pt(x, y); }
    else if (c.type === "L") { x = c.x; y = c.y; pt(x, y); }
    else if (c.type === "Q") { for (let i = 1; i <= 8; i++) { const t = i / 8, u = 1 - t; pt(u * u * x + 2 * u * t * c.x1 + t * t * c.x, u * u * y + 2 * u * t * c.y1 + t * t * c.y); } x = c.x; y = c.y; }
    else if (c.type === "C") { for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; pt(u * u * u * x + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x, u * u * u * y + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y); } x = c.x; y = c.y; }
    else if (c.type === "Z") { pt(x0, y0); x = x0; y = y0; }
  }
  return polis;
}
function rasterizar(cmds) {
  const polis = achatar(cmds);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polis) for (const [a, b] of p) { minX = Math.min(minX, a); minY = Math.min(minY, b); maxX = Math.max(maxX, a); maxY = Math.max(maxY, b); }
  const PAD = 3, ox = minX - PAD / ESC, oy = minY - PAD / ESC;
  const W = Math.ceil((maxX - minX) * ESC) + 2 * PAD + 1, H = Math.ceil((maxY - minY) * ESC) + 2 * PAD + 1;
  const img = new Uint8Array(W * H);
  const arestas = [];
  for (const p of polis) for (let i = 1; i < p.length; i++) arestas.push([(p[i - 1][0] - ox) * ESC, (p[i - 1][1] - oy) * ESC, (p[i][0] - ox) * ESC, (p[i][1] - oy) * ESC]);
  for (let yy = 0; yy < H; yy++) {
    const sy = yy + 0.5, cortes = [];
    for (const [ax, ay, bx, by] of arestas) {
      if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) cortes.push([ax + (sy - ay) / (by - ay) * (bx - ax), ay < by ? 1 : -1]);
    }
    cortes.sort((a, b) => a[0] - b[0]);
    let w = 0;
    for (let k = 0; k < cortes.length - 1; k++) {
      w += cortes[k][1];
      if (w !== 0) for (let xx = Math.max(0, Math.ceil(cortes[k][0] - 0.5)); xx < Math.min(W, Math.ceil(cortes[k + 1][0] - 0.5)); xx++) img[yy * W + xx] = 1;
    }
  }
  return { img, W, H, ox, oy };
}

// ---------- 2. Zhang-Suen + espessura ----------
function zhangSuen(src, W, H) {
  const im = Uint8Array.from(src); let mudou = true;
  const v = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : im[y * W + x]);
  while (mudou) {
    mudou = false;
    for (const passo of [0, 1]) {
      const apaga = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!im[y * W + x]) continue;
        const n = [v(x, y - 1), v(x + 1, y - 1), v(x + 1, y), v(x + 1, y + 1), v(x, y + 1), v(x - 1, y + 1), v(x - 1, y), v(x - 1, y - 1)];
        const B = n.reduce((a, b) => a + b, 0); if (B < 2 || B > 6) continue;
        let A = 0; for (let i = 0; i < 8; i++) if (!n[i] && n[(i + 1) % 8]) A++;
        if (A !== 1) continue;
        if (passo === 0 ? (n[0] * n[2] * n[4] || n[2] * n[4] * n[6]) : (n[0] * n[2] * n[6] || n[0] * n[4] * n[6])) continue;
        apaga.push(y * W + x);
      }
      for (const i of apaga) im[i] = 0;
      if (apaga.length) mudou = true;
    }
  }
  return im;
}
function distancia(img, W, H) {
  // chanfro 3-4 em duas passadas; resultado em pixels
  const d = new Float32Array(W * H).fill(1e9);
  for (let i = 0; i < W * H; i++) if (!img[i]) d[i] = 0;
  const f = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!d[i]) continue; d[i] = Math.min(d[i], f(x - 1, y) + 3, f(x, y - 1) + 3, f(x - 1, y - 1) + 4, f(x + 1, y - 1) + 4); }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!d[i]) continue; d[i] = Math.min(d[i], f(x + 1, y) + 3, f(x, y + 1) + 3, f(x + 1, y + 1) + 4, f(x - 1, y + 1) + 4); }
  for (let i = 0; i < W * H; i++) d[i] /= 3;
  return d;
}

// ---------- 3. grafo ----------
const VIZ = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function grafo(sk, W, H) {
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && sk[y * W + x];
  const viz = (i) => { const x = i % W, y = (i / W) | 0; return VIZ.filter(([a, b]) => on(x + a, y + b)).map(([a, b]) => (y + b) * W + x + a); };
  const pix = []; for (let i = 0; i < W * H; i++) if (sk[i]) pix.push(i);
  // Número de cruzamentos (transições 0->1 no anel de 8 vizinhos): 1 = ponta, 2 = meio de linha, 3+ = junção.
  // Contar só vizinhos faria cada "degrau" de uma diagonal virar junção e picotaria a letra.
  const ANEL = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const cn = (i) => { const x = i % W, y = (i / W) | 0; let t = 0; for (let k = 0; k < 8; k++) { const [a, b] = ANEL[k], [c, d] = ANEL[(k + 1) % 8]; if (!on(x + a, y + b) && on(x + c, y + d)) t++; } return t; };
  const no = new Set(pix.filter((i) => cn(i) !== 2 || viz(i).length === 0));
  const arestas = [], visto = new Set(), usado = new Set();
  const chave = (a, b) => (a < b ? a + "," + b : b + "," + a);
  // de cada nó, segue cada ramo até outro nó; pixels do meio só são usados uma vez
  const seguir = (s, n0) => {
    const cam = [s]; let at = n0; const no_cam = new Set([s]);
    while (true) {
      cam.push(at); no_cam.add(at);
      if (no.has(at)) break;
      visto.add(at);
      const prox = viz(at).filter((n) => !no_cam.has(n) && !visto.has(n));
      if (!prox.length) break;
      // preferir um nó vizinho (fecha o ramo) e depois o vizinho em cruz (evita cortar o degrau na diagonal)
      prox.sort((a, b) => (no.has(b) - no.has(a)) || (Math.abs(a - at) === 1 || Math.abs(a - at) === W ? -1 : 1));
      at = prox[0];
    }
    return cam;
  };
  for (const s of no) for (const n0 of viz(s)) {
    if (visto.has(n0) || (no.has(n0) && usado.has(chave(s, n0)))) continue;
    if (no.has(n0)) usado.add(chave(s, n0));
    arestas.push(seguir(s, n0));
  }
  // pixel isolado (ponto final, pingo afinado até 1px)
  for (const s of no) if (!viz(s).length) arestas.push([s]);
  // laços sem nenhuma ponta ou junção (o "o")
  for (const s of pix) {
    if (visto.has(s) || no.has(s)) continue;
    visto.add(s);
    const cam = [s]; let at = s;
    while (true) { const prox = viz(at).filter((n) => !visto.has(n)); if (!prox.length) break; at = prox[0]; visto.add(at); cam.push(at); }
    cam.push(s); arestas.push(cam);
  }
  return arestas.map((c) => c.map((i) => [i % W, (i / W) | 0]));
}

const comp = (p) => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
const igual = (a, b) => Math.abs(a[0] - b[0]) <= 1.5 && Math.abs(a[1] - b[1]) <= 1.5;
const fechado = (p) => p.length > 3 && igual(p[0], p[p.length - 1]);

// ---------- 4. traços ----------
function podarEJuntar(arestas, raio) {
  // arestas minúsculas entre pixels de uma mesma junção (mas um ponto isolado fica: é o pingo ou o ponto final)
  const toca = (a, b) => [a[0], a[a.length - 1]].some((e) => [b[0], b[b.length - 1]].some((f) => igual(e, f)));
  let ar = arestas.filter((a) => comp(a) > 1.5 || fechado(a) || !arestas.some((b) => b !== a && toca(a, b)));
  const pontas = () => { const m = new Map(); for (const a of ar) for (const e of [a[0], a[a.length - 1]]) { const k = e.join(","); m.set(k, (m.get(k) || 0) + 1); } return m; };
  const grauDe = (e, m) => { let g = 0; for (const [k, v] of m) { const [x, y] = k.split(",").map(Number); if (Math.abs(x - e[0]) <= 1.5 && Math.abs(y - e[1]) <= 1.5) g += v; } return g; };
  // espinhos: aresta com uma ponta solta e comprimento até ~1,6x a meia-espessura (serifas, terminais)
  for (let volta = 0; volta < 2; volta++) {
    const m = pontas();
    ar = ar.filter((a) => { if (fechado(a)) return true; const g0 = grauDe(a[0], m), g1 = grauDe(a[a.length - 1], m); const solta = (g0 === 1) !== (g1 === 1); return !(solta && comp(a) < raio * 1.6) || ar.length === 1; });
  }
  // junta em cada nó a dupla de arestas com a continuação mais reta (até 70 graus de desvio)
  const dirFim = (a, inicio) => { const p = inicio ? a : [...a].reverse(); const q = p[Math.min(p.length - 1, 6)]; return Math.atan2(q[1] - p[0][1], q[0] - p[0][0]); };
  let juntou = true;
  while (juntou) {
    juntou = false;
    for (let i = 0; i < ar.length && !juntou; i++) for (let j = i + 1; j < ar.length && !juntou; j++) {
      const a = ar[i], b = ar[j]; if (fechado(a) || fechado(b)) continue;
      for (const [ea, eb] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
        const pa = ea ? a[a.length - 1] : a[0], pb = eb ? b[b.length - 1] : b[0];
        if (!igual(pa, pb)) continue;
        // quantas outras arestas tocam esse ponto: com só essas duas, junta sempre; em junção, só se for reta
        const outras = ar.filter((c, k) => k !== i && k !== j && (igual(c[0], pa) || igual(c[c.length - 1], pa))).length;
        const da = dirFim(a, !ea), db = dirFim(b, !eb);
        let dev = Math.abs(((da - db + Math.PI * 3) % (Math.PI * 2)) - Math.PI); // 0 = segue reto
        if (outras && dev > (70 * Math.PI) / 180) continue;
        const A = ea ? a : [...a].reverse(), B = eb ? [...b].reverse() : b;
        ar.splice(j, 1); ar[i] = [...A, ...B.slice(1)]; juntou = true; break;
      }
    }
  }
  return ar;
}

// Douglas-Peucker
function simplificar(p, tol) {
  if (p.length < 3) return p;
  if (fechado(p)) { // laço: corta no ponto mais distante do início, senão o traço inteiro colapsa num ponto
    let k = 0, m = 0; p.forEach((q, i) => { const d = Math.hypot(q[0] - p[0][0], q[1] - p[0][1]); if (d > m) { m = d; k = i; } });
    return [...simplificar(p.slice(0, k + 1), tol).slice(0, -1), ...simplificar(p.slice(k), tol)];
  }
  const [a, b] = [p[0], p[p.length - 1]];
  let m = 0, k = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const d = Math.abs((b[1] - a[1]) * p[i][0] - (b[0] - a[0]) * p[i][1] + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1);
    if (d > m) { m = d; k = i; }
  }
  if (m <= tol) return [a, b];
  return [...simplificar(p.slice(0, k + 1), tol).slice(0, -1), ...simplificar(p.slice(k), tol)];
}
const area = (p) => p.reduce((s, q, i) => s + (i ? p[i - 1][0] * q[1] - q[0] * p[i - 1][1] : 0), 0);

// ---------- 5. ordem de escrita ----------
// Regra geral: acentos, til, pingos e cedilha por último; os demais da esquerda para a direita.
// Traço aberto começa pela ponta de cima (ou pela da esquerda, se for quase horizontal).
// Laço (o, barriga do a, d, q) começa no ponto mais alto e gira no sentido anti-horário, como a mão faz.
function ordenar(tracos, xh) {
  const info = tracos.map((p, idx) => {
    const ys = p.map((q) => q[1]), xs = p.map((q) => q[0]);
    const top = Math.min(...ys), bot = Math.max(...ys), esq = Math.min(...xs);
    const sinal = bot < -xh * 1.02 || top > 20; // inteiro acima da altura-x ou abaixo da linha de base
    return { p: orientar(p), idx, top, bot, esq, sinal };
  });
  info.sort((a, b) => (a.sinal - b.sinal) || (a.esq - b.esq) || (a.top - b.top));
  const corpo = info.filter((i) => !i.sinal).map((i) => i.p), sinais = info.filter((i) => i.sinal).map((i) => i.p);
  return [...encaixar(corpo), ...sinais];
}

// Hastes no lugar em que a mão as faz. O traço mais longo é o principal; cada traço que encosta nele vira uma haste,
// sempre escrita de cima para baixo, e entra na sequência no ponto em que encosta:
// - se a ponta de BAIXO encosta (haste do "a", do "d", do "q"): o principal vai até ali (a barriga), a haste desce do
//   alto até esse ponto e o principal continua (o rabicho) -> barriga, haste, rabicho;
// - se só a ponta de CIMA encosta (hastes do "m", do "n", do "h"): o principal vai até ali, a haste desce e o principal
//   segue para o próximo arco -> entrada, haste, arco, haste, arco.
// Um traço curto que encosta no alto de uma haste (serifa do "d") vai junto, logo antes dela.
function encaixar(tracos) {
  if (tracos.length < 2) return tracos;
  let iP = 0; tracos.forEach((p, i) => { if (comp(p) > comp(tracos[iP])) iP = i; });
  const principal = tracos[iP];
  const perto = (e, p) => { let k = -1, m = 30; p.forEach((q, i) => { const d = Math.hypot(q[0] - e[0], q[1] - e[1]); if (d < m) { m = d; k = i; } }); return k; };
  const resto = tracos.filter((_, i) => i !== iP);
  const insercoes = []; // [indice no principal, [tracos]]
  const soltos = [];
  const usados = new Set();
  for (const s of resto) {
    if (usados.has(s) || fechado(s)) continue;
    const desce = s[0][1] <= s[s.length - 1][1] ? s : [...s].reverse();
    const alto = desce[0], baixo = desce[desce.length - 1];
    const kB = perto(baixo, principal), kA = perto(alto, principal);
    if (kB < 0 && kA < 0) continue;
    usados.add(s);
    // serifas/entradas encostadas no alto da haste
    const antes = resto.filter((r) => r !== s && !usados.has(r) && !fechado(r) && comp(r) < comp(s) && [r[0], r[r.length - 1]].some((e) => Math.hypot(e[0] - alto[0], e[1] - alto[1]) < 30));
    antes.forEach((r) => usados.add(r));
    const serifas = antes.map((r) => (Math.hypot(r[r.length - 1][0] - alto[0], r[r.length - 1][1] - alto[1]) < 30 ? r : [...r].reverse()));
    insercoes.push([kB >= 0 ? kB : kA, [...serifas, desce]]);
  }
  for (const s of resto) if (!usados.has(s)) soltos.push(s);
  if (!insercoes.length) return tracos;
  insercoes.sort((a, b) => a[0] - b[0]);
  const seq = []; let de = 0;
  for (const [k, ts] of insercoes) {
    if (k > de) seq.push(principal.slice(de, k + 1));
    seq.push(...ts); de = Math.max(de, k);
  }
  if (de < principal.length - 1) seq.push(principal.slice(de));
  // traços que não encostam no principal ficam na ordem da esquerda para a direita, antes ou depois dele
  const x0 = Math.min(...principal.map((q) => q[0]));
  return [...soltos.filter((s) => Math.min(...s.map((q) => q[0])) < x0), ...seq.filter((p) => p.length > 1), ...soltos.filter((s) => Math.min(...s.map((q) => q[0])) >= x0)];
}
function orientar(p) {
  if (fechado(p)) {
    let k = 0; for (let i = 1; i < p.length; i++) if (p[i][1] < p[k][1]) k = i;
    let q = [...p.slice(k, -1), ...p.slice(0, k), p[k]];
    if (area(q) > 0) q = q.reverse(); // y para baixo: área negativa = anti-horário na tela
    return q;
  }
  const a = p[0], b = p[p.length - 1];
  const horiz = Math.abs(b[1] - a[1]) < 0.35 * Math.abs(b[0] - a[0]);
  const inverte = horiz ? b[0] < a[0] : b[1] < a[1];
  return inverte ? [...p].reverse() : p;
}

/** cmds: comandos do path do glifo (unidades da fonte, y para baixo); xh: altura-x. Revisao: { ordem, inverter }. */
export function esqueleto(cmds, xh, revisao = {}) {
  const { img, W, H, ox, oy } = rasterizar(cmds);
  if (!img.some(Boolean)) return { tracos: [], largura: 0 };
  const sk = zhangSuen(img, W, H);
  const dist = distancia(img, W, H);
  let raio = 0; for (let i = 0; i < W * H; i++) if (sk[i]) raio = Math.max(raio, dist[i]);
  let tracos = podarEJuntar(grafo(sk, W, H), raio);
  // em unidades da fonte
  // tolerância de 1px (4 unidades): a máscara é bem mais grossa que isso, e o arquivo fica bem menor
  tracos = tracos.map((p) => simplificar(p, 1).map(([x, y]) => [x / ESC + ox, y / ESC + oy]));
  // ponto final, pingo de 1 pixel: vira um tracinho para a caneta ter por onde passar
  tracos = tracos.map((p) => (p.length === 1 || comp(p) < 4 ? [[p[0][0] - 8, p[0][1] + 8], [p[0][0] + 8, p[0][1] - 8]] : p));
  tracos = ordenar(tracos, xh);
  if (revisao.ordem) tracos = revisao.ordem.map((i) => tracos[i]);
  for (const i of revisao.inverter || []) tracos[i] = [...tracos[i]].reverse();
  // largura do traço da máscara: um pouco mais que a haste mais grossa da letra
  return { tracos, largura: Math.round((2 * raio / ESC) * 1.25) };
}

export const comprimento = comp;
