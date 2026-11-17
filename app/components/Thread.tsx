"use client";
import { useEffect, useRef } from "react";

/* O fio do hero é o protagonista da rolagem: sai do último nó do diagrama, desce até a abertura de Projetos,
   corre pela linha da folha até a margem esquerda e segue pela margem, com um nó em cada junção de folha.
   Desenha conforme a rolagem (stroke-dashoffset), espessura constante. Também cuida do parallax dos números. */
export default function Thread() {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = svg.current!, path = el.querySelector("path")!, nodes = el.querySelector("g")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Mapa rolagem -> comprimento desenhado: pares (y da ponta na página, comprimento acumulado), lineares entre si.
    // A ponta fica no meio da tela (scrollY + 50% da altura). Cada trecho vertical avança 1:1 com a rolagem;
    // o trecho horizontal leva 80px de rolagem, centrados na quina (a ponta adianta ou atrasa no máximo 40px); as marquinhas de cada folha entram de uma vez ao chegar nela.
    const dot = el.querySelector<SVGCircleElement>(".ponta")!;
    let pts: [number, number][] = [], total = 1, joints: number[] = [], id = 0;
    const style = document.createElement("style"); document.head.appendChild(style);
    const scrollTL = !reduce && CSS.supports("animation-timeline: scroll()");
    const at = (y: number) => {
      if (!pts.length) return 0;
      if (y <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) {
        const [ya, la] = pts[i - 1], [yb, lb] = pts[i];
        return yb === ya ? lb : la + (lb - la) * (y - ya) / (yb - ya);
      }
      return total;
    };
    const place = () => {
      const node = [...document.querySelectorAll<SVGGElement>(".diagram .n-end")].find((n) => n.getBoundingClientRect().width > 0);
      const heads = [...document.querySelectorAll<HTMLElement>(".sec-head")];
      if (!node || !heads.length) return;
      // A altura vem do próprio SVG (top 0 e bottom 0 no <body>, sections.css), nunca do scrollHeight do documento:
      // com height fixo em px o fio segurava a página na altura antiga e sobravam milhares de px abaixo do rodapé.
      const H = el.getBoundingClientRect().height, W = document.documentElement.clientWidth;
      el.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const r = node.getBoundingClientRect();
      const margin = heads[0].getBoundingClientRect().left;
      const x0 = r.left + r.width / 2, y0 = r.bottom + scrollY, mx = Math.round(margin / 2);
      const ys = heads.map((h) => h.getBoundingClientRect().top + scrollY);
      const yEnd = document.querySelector<HTMLElement>(".site-footer")!.getBoundingClientRect().top + scrollY;
      const tick = margin - mx;
      let d = `M${x0} ${y0}V${ys[0]}H${mx}`, L = ys[0] - y0;
      // No topo só aparece a ponta (20px saindo da caixa, a caneta encostada no papel); daí até a quina o traço
      // cresce um pouco mais rápido que a rolagem e alcança o meio da tela, sem salto.
      const half = innerHeight / 2, STUB = 20;
      pts = [[Math.min(half, ys[0] - 41), STUB], [ys[0] - 40, L - 40]];
      dot.setAttribute("cx", String(x0)); dot.setAttribute("cy", String(y0 + STUB));
      L += x0 - mx; pts.push([ys[0] + 40, L]);
      joints = [L];
      let prev = ys[0], py = ys[0] + 40;
      ys.slice(1).concat(yEnd).forEach((y) => {
        d += `V${y}H${margin}M${mx} ${y}`;
        L += y - prev; pts.push([Math.max(y, py + 1), L]); joints.push(L);
        L += tick; pts.push([Math.max(y, py + 1) + 1, L]);
        prev = y; py = Math.max(y, py + 1) + 1;
      });
      total = L;
      path.setAttribute("d", d);
      nodes.innerHTML = [...ys, yEnd].map((y) => `<circle cx="${mx}" cy="${y}" r="4" />`).join("");
      if (reduce) path.style.strokeDashoffset = "0";
      else if (scrollTL) {
        // Navegadores com scroll-timeline: o traço anda no compositor, sem JS durante a rolagem.
        const max = Math.max(1, H - innerHeight);
        const ks = [[0, at(half)], ...pts.map(([y, l]) => [y - half, l]).filter(([s]) => s > 0 && s < max), [max, at(max + half)]]
          .map(([s, l]) => `${(s / max * 100).toFixed(3)}%{stroke-dashoffset:${(1 - l / total).toFixed(5)}}`).join("");
        style.textContent = `@keyframes fio{${ks}}.thread path{animation:fio linear both;animation-timeline:scroll(root block)}`;
      }
      update();
    };
    const update = () => {
      const dist = reduce ? total : at(scrollY + innerHeight / 2);
      if (!reduce && !scrollTL) path.style.strokeDashoffset = String(1 - dist / total);
      // Ponto na ponta só enquanto a página está no topo.
      dot.classList.toggle("on", !reduce && pts.length > 0 && scrollY < 2);
      const max = document.documentElement.scrollHeight - innerHeight;
      document.documentElement.style.setProperty("--read", String(max > 0 ? Math.min(1, scrollY / max) : 0));
      [...nodes.children].forEach((c, i) => c.classList.toggle("on", dist >= (joints[i] ?? Infinity) - 1));
      if (!reduce) document.querySelectorAll<HTMLElement>(".sec-n").forEach((n) => {
        const b = n.parentElement!.getBoundingClientRect();
        n.style.transform = `translate3d(0, ${Math.max(-12, Math.min(12, Math.round((b.top + b.height / 2 - innerHeight / 2) * -0.04)))}px, 0)`;
      });
    };
    const onScroll = () => { cancelAnimationFrame(id); id = requestAnimationFrame(update); };
    // O fio só aparece depois de rolar: calcula fora do carregamento (não pesa no tempo de bloqueio).
    let t = 0;
    const later = () => { clearTimeout(t); t = window.setTimeout(place, 120); };
    const idle = (window as Window & { requestIdleCallback?: (f: () => void, o?: object) => number }).requestIdleCallback;
    if (idle) idle(place, { timeout: 2000 }); else setTimeout(place, 600);
    // Pontos de luz do diagrama: animação de SVG roda na thread principal; começa só depois do carregamento.
    const startPulse = () => setTimeout(() => document.documentElement.classList.add("pulsing"), 2500);
    if (document.readyState === "complete") startPulse(); else addEventListener("load", startPulse, { once: true });
    document.fonts.ready.then(later);
    const ro = new ResizeObserver(later); ro.observe(document.body);
    addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(t); ro.disconnect(); removeEventListener("scroll", onScroll); cancelAnimationFrame(id); style.remove(); };
  }, []);
  return (
    <>
    <div className="ruler" aria-hidden="true"><span /></div>
    <svg ref={svg} className="thread" aria-hidden="true" preserveAspectRatio="none">
      <path pathLength={1} />
      <g />
      <circle className="ponta" r="2" />
    </svg>
    </>
  );
}
