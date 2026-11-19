"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { EscritaSobre } from "./Escrita";
import type { Frase } from "./escrita-dados";

/* Anotação à mão: a frase é escrita letra por letra (Escrita.tsx) quando entra na tela pela primeira vez, e a seta é
   traçada depois do texto. O texto real fica no <em> (transparente sob o desenho), então continua legível para leitores
   de tela. Sem JS ou com movimento reduzido a anotação aparece pronta. */
export default function Annot({ text, escrita, tone = "pen", className = "", arrow }: { text: string; escrita: Frase; tone?: "pen" | "pencil"; className?: string; arrow: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A anotação fica pronta por padrão. Só quando entra na tela ela é zerada e escrita;
    // se o observador nunca disparar, ela continua lá.
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      el.classList.add("armed");
      void el.getBoundingClientRect();
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("on")));
    }, { threshold: 0 }); // escreve assim que a anotação aparece na tela
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span ref={ref} className={`annot annot-${tone} ${className}`} style={{ "--fim": `${escrita.fim}ms` } as CSSProperties}>
      <svg viewBox="0 0 64 48" fill="none" aria-hidden="true"><path pathLength={1} d={arrow} /></svg>
      <em className="e-alvo"><EscritaSobre f={escrita} />{text}</em>
    </span>
  );
}
