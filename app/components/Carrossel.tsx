"use client";
import { useEffect, useRef, useState } from "react";

/* Controles do carrossel de Projetos (o trilho é o .car-trilho logo depois, CSS puro com scroll-snap).
   Anterior/próximo em estilo de cota, contador "02.1 / 02.3" e um indicador por projeto. Setas do teclado mudam de
   slide quando o foco está no próprio trilho. Com movimento reduzido, o salto é direto, sem rolagem suave.
   Sem JS esta barra não aparece (html:not(.js), sections.css); com JS ela já tem a altura reservada, sem CLS. */
type Item = { id: string; title: string };

export default function Carrossel({ itens }: { itens: Item[] }) {
  const barra = useRef<HTMLDivElement>(null);
  const [primeiro, setPrimeiro] = useState(0);
  const [inicio, setInicio] = useState(true);
  const [fim, setFim] = useState(false);
  const trilho = () => barra.current?.parentElement?.querySelector<HTMLElement>(".car-trilho") ?? null;

  // Leva o slide i para o início do trilho (mesma posição do snap).
  const ir = (i: number) => {
    const t = trilho(); if (!t) return;
    const s = t.children[Math.max(0, Math.min(itens.length - 1, i))] as HTMLElement;
    const pad = parseFloat(getComputedStyle(t).scrollPaddingLeft) || 0;
    const left = t.scrollLeft + s.getBoundingClientRect().left - t.getBoundingClientRect().left - pad;
    const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollTo({ left, behavior: suave ? "smooth" : "instant" });
  };

  useEffect(() => {
    const t = trilho(); if (!t) return;
    let raf = 0;
    const medir = () => {
      const pad = parseFloat(getComputedStyle(t).scrollPaddingLeft) || 0, base = t.getBoundingClientRect().left + pad;
      let melhor = 0, d = Infinity;
      [...t.children].forEach((c, k) => { const x = Math.abs(c.getBoundingClientRect().left - base); if (x < d) { d = x; melhor = k; } });
      setPrimeiro(melhor);
      setInicio(t.scrollLeft <= 2);
      setFim(t.scrollLeft >= t.scrollWidth - t.clientWidth - 2);
    };
    const pedir = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(medir); };
    const tecla = (e: KeyboardEvent) => {
      if (e.target !== t || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      e.preventDefault();
      const atual = Number(t.dataset.primeiro ?? 0);
      ir(e.key === "ArrowRight" ? atual + 1 : atual - 1);
    };
    // Tab passando por um card que está fora da tela: o card entra inteiro.
    const foco = (e: FocusEvent) => {
      const s = (e.target as HTMLElement).closest<HTMLElement>(".car-trilho > .project"); if (!s) return;
      const r = s.getBoundingClientRect(), q = t.getBoundingClientRect();
      if (r.left < q.left - 1 || r.right > q.right + 1) ir([...t.children].indexOf(s));
    };
    /* Trackpad / Shift+roda: com a rolagem suave da página ligada (Lenis, SmoothScroll.tsx), o gesto horizontal
       nativo no trilho falhava na maior parte das vezes no Chrome, mesmo sem ninguém cancelar o evento (medido). Aqui
       o gesto horizontal fica com o carrossel: soma o deslocamento e, passando de 40px, vai um slide para o lado; um
       gesto só (a inércia do trackpad continua mandando eventos) não passa mais de um slide. O vertical segue para
       a página. Sem JS não há Lenis, e o navegador rola o trilho sozinho. */
    let soma = 0, travado = 0, ocioso = 0;
    const roda = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault(); e.stopPropagation();
      clearTimeout(ocioso); ocioso = window.setTimeout(() => { soma = 0; travado = 0; }, 180);
      if (travado) return;
      soma += e.deltaX;
      if (Math.abs(soma) < 40) return;
      travado = 1; soma = 0;
      const atual = Number(t.dataset.primeiro ?? 0), fimAgora = t.scrollLeft >= t.scrollWidth - t.clientWidth - 2;
      if (e.deltaX > 0 && !fimAgora) ir(atual + 1); else if (e.deltaX < 0 && t.scrollLeft > 2) ir(atual - 1);
    };
    medir();
    t.addEventListener("scroll", pedir, { passive: true }); addEventListener("resize", pedir);
    t.addEventListener("keydown", tecla); t.addEventListener("focusin", foco); t.addEventListener("wheel", roda, { passive: false });
    return () => { cancelAnimationFrame(raf); clearTimeout(ocioso); t.removeEventListener("scroll", pedir); removeEventListener("resize", pedir); t.removeEventListener("keydown", tecla); t.removeEventListener("focusin", foco); t.removeEventListener("wheel", roda); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liga uma vez ao trilho, que não muda
  }, []);
  // o índice atual também fica no trilho, para o teclado ler sem depender do estado do React
  useEffect(() => { const t = trilho(); if (t) t.dataset.primeiro = String(primeiro); });

  // No fim do trilho (2 cards visíveis no desktop), o contador e o indicador mostram o último projeto.
  const ativo = fim && !inicio ? itens.length - 1 : primeiro;
  return (
    <div ref={barra} className="car-ctrl">
      <span className="car-cont mono" aria-hidden="true">{itens[ativo].id} / {itens[itens.length - 1].id}</span>
      <div className="car-pontos">
        {itens.map((it, k) => (
          <button key={it.id} type="button" className="car-ponto" aria-label={`Ir para o projeto ${k + 1}: ${it.title}`} aria-current={k === ativo ? "true" : undefined} onClick={() => ir(k)}>
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="car-setas">
        <button type="button" className="car-seta mono" aria-label="Projeto anterior" disabled={inicio} onClick={() => ir(primeiro - 1)}>
          <svg viewBox="0 0 32 12" aria-hidden="true"><path d="M31 6H2M6 2L2 6l4 4M31 2v8" /></svg>
        </button>
        <button type="button" className="car-seta mono" aria-label="Próximo projeto" disabled={fim} onClick={() => ir(primeiro + 1)}>
          <svg viewBox="0 0 32 12" aria-hidden="true"><path d="M1 6h29M26 2l4 4-4 4M1 2v8" /></svg>
        </button>
      </div>
    </div>
  );
}
