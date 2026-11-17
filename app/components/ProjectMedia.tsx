"use client";
import { useRef } from "react";

/* Miniatura em moldura de prancha: inclinação de no máximo 2,5 graus seguindo o mouse e um "Abrir" que segue o cursor.
   Ao clicar, a imagem cresce até virar a página da demonstração: é uma View Transition entre documentos
   (@view-transition em globals.css e em cada demo). A miniatura recebe o mesmo view-transition-name que o <body> da
   demo e o navegador faz a passagem. Sem suporte, ou com movimento reduzido, é um link comum. */
export const NOME_VT = "demo-pagina";
export function marcarTransicao(media: HTMLElement | null | undefined) {
  if (!media || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll<HTMLElement>(".p-media").forEach((m) => { m.style.viewTransitionName = ""; });
  media.style.viewTransitionName = NOME_VT;
}

export default function ProjectMedia({ href, children }: { href: string; children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const fine = () => matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const move = (e: React.PointerEvent) => {
    if (!fine()) return;
    const el = ref.current!, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 5).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
    el.style.setProperty("--cx", `${Math.round(e.clientX - r.left)}px`);
    el.style.setProperty("--cy", `${Math.round(e.clientY - r.top)}px`);
  };
  const leave = () => { const el = ref.current!; el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
  return (
    <a ref={ref} href={href} className="p-media" data-cursor-hide onPointerMove={move} onPointerLeave={leave} onClick={() => marcarTransicao(ref.current)} tabIndex={-1} aria-hidden="true">
      {children}
      <span className="p-open mono">Abrir <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 8h10.5M9 4l4 4-4 4" /></svg></span>
    </a>
  );
}
