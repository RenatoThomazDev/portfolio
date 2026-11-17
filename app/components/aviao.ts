/* O bloco do formulário vira avião de papel (ContactForm.tsx, estilos em vida.css).
   Quem dobra é uma cópia exata do bloco (cloneNode copia o que foi digitado e o chip marcado), tirada no clique e
   posta por cima dele no <body>: o bloco real fica no lugar, invisível, segurando o espaço. Só transform, opacity,
   clip-path e stroke animam.
   0–150ms   o quadro solta da prancheta: marcas de esquadro se afastam e somem, sombra de papel, scale 0.98
   150–350   a metade de baixo gira em rotateX sobre a de cima e mostra o verso (--paper-3)
   350–470   os cantos de cima dobram para o centro e formam a ponta
   470–550   fecha ao meio no comprimento
   550–750   as asas abrem, com uma leve rotação
   750–1400  voa em arco até a margem esquerda e para o alto, diminuindo, com um rastro pontilhado curto */
const T = 1400;
const CURVA = "cubic-bezier(0.5, 0, 0.2, 1)";

// cubic-bezier(0.5, 0, 0.2, 1) avaliada em JS, para o voo amostrado andar no mesmo ritmo do rastro
function curva(u: number) {
  const x1 = 0.5, y1 = 0, x2 = 0.2, y2 = 1;
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  let a = 0, b = 1;
  for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (bx(m) < u) a = m; else b = m; }
  return by((a + b) / 2);
}

const pose = (x: number, y: number, r: number, sx: number, sy: number) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;

export function dobrarAviao(bloco: HTMLElement, aoTrocar: () => void): Promise<void> {
  const r = bloco.getBoundingClientRect();
  const W = r.width, H = r.height, x0 = r.left + scrollX, y0 = r.top + scrollY;
  // o espaço continua reservado até "Enviar outra mensagem": a confirmação é mais baixa que o formulário
  bloco.style.minHeight = `${H}px`;

  // A cópia, tirada antes de qualquer transform no bloco. Sem id nem name: não duplica rótulos nem grupos de rádio.
  const copia = () => {
    const c = bloco.cloneNode(true) as HTMLElement;
    c.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
    c.querySelectorAll("[name]").forEach((e) => e.removeAttribute("name"));
    c.removeAttribute("data-reveal");
    c.style.cssText = `position:absolute;left:0;width:${W}px;height:${H}px;margin:0;min-height:0`;
    return c;
  };
  const voo = document.createElement("div");
  voo.className = "aviao";
  voo.setAttribute("aria-hidden", "true");
  voo.inert = true;
  voo.style.cssText = `left:${x0}px;top:${y0}px;width:${W}px;height:${H}px`;
  const forma = document.createElement("div"); forma.className = "av-forma";
  const cima = document.createElement("div"); cima.className = "av-cima";
  const baixo = document.createElement("div"); baixo.className = "av-baixo";
  const frente = document.createElement("div"); frente.className = "av-frente";
  const verso = document.createElement("div"); verso.className = "av-verso";
  const c1 = copia(); c1.style.top = "0";
  const c2 = copia(); c2.style.top = `${-H / 2}px`;
  cima.append(c1); frente.append(c2); baixo.append(frente, verso); forma.append(cima, baixo); voo.append(forma);

  // Arco do voo, do centro da folha dobrada (metade de cima) até a margem esquerda e para o alto.
  const sx = x0 + W / 2, sy = y0 + H / 4;
  const ex = scrollX + 24, ey = sy - innerHeight * 0.5;
  const cx = sx - (sx - ex) * 0.75, cy = sy - 10;
  const N = 160, pts: [number, number][] = [], acum = [0];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = (1 - t) ** 2, b = 2 * t * (1 - t), c = t * t;
    pts.push([a * sx + b * cx + c * ex, a * sy + b * cy + c * ey]);
    if (i) acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = acum[N];
  const noArco = (f: number) => { // ponto e direção na fração f do comprimento do arco
    const alvo = f * total; let i = 1;
    while (i < N && acum[i] < alvo) i++;
    const k = (alvo - acum[i - 1]) / (acum[i] - acum[i - 1] || 1);
    const p: [number, number] = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    return { p, ang: (Math.atan2(pts[i][0] - pts[i - 1][0], -(pts[i][1] - pts[i - 1][1])) * 180) / Math.PI };
  };

  // Rastro: linha pontilhada azul ao longo do arco, mostrada só num trecho curto atrás do avião (máscara com traço).
  const m = 40, bx = Math.min(sx, ex, cx) - m, by = Math.min(sy, ey, cy) - m;
  const bw = Math.max(sx, ex, cx) - bx + m, bh = Math.max(sy, ey, cy) - by + m;
  const d = `M${sx - bx} ${sy - by}Q${cx - bx} ${cy - by} ${ex - bx} ${ey - by}`;
  const id = `av-m-${Math.random().toString(36).slice(2, 8)}`;
  const curto = (130 / total) * 1000; // ~130px de rastro, em unidades de pathLength=1000
  const ns = "http://www.w3.org/2000/svg";
  const rastro = document.createElementNS(ns, "svg");
  rastro.setAttribute("class", "av-rastro");
  rastro.setAttribute("aria-hidden", "true");
  rastro.setAttribute("style", `left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px`);
  rastro.innerHTML = `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${bw}" height="${bh}"><path d="${d}" pathLength="1000" fill="none" stroke="#fff" stroke-width="10" stroke-dasharray="${curto} 3000" stroke-dashoffset="${curto}"/></mask><path d="${d}" fill="none" mask="url(#${id})"/>`;

  document.body.append(rastro, voo);

  // 0–150: solta da prancheta
  const sombra = document.createElement("i");
  sombra.className = "av-sombra";
  bloco.append(sombra);
  const o = (ms: number) => ms / T;
  // O bloco: solta em 0–150, some em 150 (a cópia toma o lugar, idêntica nesse quadro) e volta em 650–750 só como
  // moldura vazia (borda, fundo e marcas de esquadro), com o conteúdo ainda escondido. Em 800 entra a confirmação.
  const q = (ms: number) => ms / 750;
  const conteudo = bloco.querySelector<HTMLElement>(".c-form");
  const anims: Animation[] = [
    bloco.animate([
      { offset: 0, transform: "none", opacity: 1, easing: "ease-out" },
      { offset: q(150), transform: "scale(0.98)", opacity: 1 },
      { offset: q(150), transform: "scale(0.98)", opacity: 0 },
      { offset: q(650), transform: "scale(0.98)", opacity: 0, easing: "ease-out" },
      { offset: 1, transform: "none", opacity: 1 },
    ], { duration: 750 }),
    bloco.animate([
      { offset: 0, transform: "scale(1)", opacity: 1, easing: "ease-out" },
      { offset: q(150), transform: "scale(1.06)", opacity: 0 },
      { offset: q(650), transform: "scale(1.06)", opacity: 0, easing: "ease-out" },
      { offset: 1, transform: "scale(1)", opacity: 1 },
    ], { duration: 750, pseudoElement: "::before" }),
    sombra.animate([
      { offset: 0, opacity: 0, easing: "ease-out" }, { offset: q(150), opacity: 1 }, { offset: q(650), opacity: 1 }, { offset: 1, opacity: 0 },
    ], { duration: 750, fill: "forwards" }),
  ];
  const esconde = conteudo?.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 150, delay: 150, fill: "forwards" });
  // Em 800ms (o avião já saiu do retângulo) a confirmação entra no lugar, por cima do fim do voo.
  const gatilho = bloco.animate([], { duration: 800 });
  const troca = gatilho.finished.then(() => {
    aoTrocar();
    esconde?.cancel();
    sombra.remove();
    bloco.querySelector<HTMLElement>(".c-form")?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
  });

  // Pose do avião inteiro, em volta do centro da metade de cima. Em 0–150 casa com o scale(0.98) do bloco,
  // feito em volta do centro do bloco: o deslocamento compensa a diferença de origem.
  const ajuste = (H / 4) * 0.02;
  const quadros: Keyframe[] = [
    { offset: 0, opacity: 0, transform: pose(0, ajuste, 0, 0.98, 0.98) },
    { offset: o(150), opacity: 0, transform: pose(0, ajuste, 0, 0.98, 0.98) },
    { offset: o(150), opacity: 1, transform: pose(0, ajuste, 0, 0.98, 0.98), easing: CURVA },
    { offset: o(470), opacity: 1, transform: pose(0, 0, 0, 0.9, 0.9), easing: CURVA },
    { offset: o(550), opacity: 1, transform: pose(0, 0, 0, 0.16, 0.86), easing: CURVA },
    { offset: o(750), opacity: 1, transform: pose(0, -6, -10, 0.62, 0.78) },
  ];
  const n = 14;
  for (let i = 1; i <= n; i++) {
    const u = i / n, f = curva(u), { p, ang } = noArco(f);
    const giro = Math.min(1, u / 0.3), g = giro * giro * (3 - 2 * giro);
    // nos primeiros 30% do voo o avião vira de -10° para a direção do arco, e depois segue a curva
    const rot = -10 + (ang + 10) * g;
    const s = 1 - f * 0.8;
    quadros.push({ offset: o(750 + 650 * u), opacity: u > 0.78 ? 1 - (u - 0.78) / 0.22 : 1, transform: pose(p[0] - sx, p[1] - sy - 6 * (1 - f), rot, 0.62 * s, 0.78 * s) });
  }
  anims.push(voo.animate(quadros, { duration: T, fill: "forwards" }));

  // A forma: retângulo inteiro (com folga para a metade que gira), depois a folha dobrada com a ponta e o dardo.
  const folga = "polygon(50% -40%, 140% -40%, 140% 140%, -40% 140%, -40% -40%)";
  anims.push(forma.animate([
    { offset: 0, clipPath: folga },
    { offset: o(350), clipPath: folga },
    { offset: o(350), clipPath: "polygon(50% 0%, 100% 0%, 100% 50%, 0% 50%, 0% 0%)", easing: CURVA },
    { offset: o(470), clipPath: "polygon(50% 0%, 100% 26%, 100% 50%, 0% 50%, 0% 26%)", easing: CURVA },
    { offset: o(550), clipPath: "polygon(50% 0%, 100% 26%, 100% 50%, 0% 50%, 0% 26%)", easing: CURVA },
    { offset: o(750), clipPath: "polygon(50% 0%, 100% 50%, 50% 40%, 50% 40%, 0% 50%)" },
    { offset: 1, clipPath: "polygon(50% 0%, 100% 50%, 50% 40%, 50% 40%, 0% 50%)" },
  ], { duration: T, fill: "forwards" }));
  // 150–350: a metade de baixo sobe sobre a de cima
  anims.push(baixo.animate([{ transform: "perspective(1600px) rotateX(0deg)" }, { transform: "perspective(1600px) rotateX(180deg)" }], { duration: 200, delay: 150, easing: CURVA, fill: "both" }));
  // 750–1400: o rastro acompanha o avião (mesmo ritmo) e some no fim
  const traco = rastro.querySelector("mask path") as SVGPathElement;
  anims.push(traco.animate([{ strokeDashoffset: curto }, { strokeDashoffset: curto - 1000 }], { duration: 650, delay: 750, easing: CURVA, fill: "both" }));
  anims.push(rastro.animate([{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 650, delay: 750, fill: "both" }));

  return Promise.all([...anims.map((a) => a.finished), troca]).then(() => {
    voo.remove(); rastro.remove();
  }, () => { voo.remove(); rastro.remove(); });
}

/* prefers-reduced-motion: sem avião, a confirmação entra no lugar do formulário com um fade curto. */
export function surgir(bloco: HTMLElement) {
  bloco.querySelector<HTMLElement>(".c-form")?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
}
