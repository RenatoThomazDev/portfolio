"use client";
import { useRef } from "react";

/* Miniatura em moldura de prancha: inclinação de no máximo 2,5 graus seguindo o mouse e um "Abrir" que segue o cursor.
   Ao clicar, a folha descola e voa até cobrir a tela, e só então a demonstração abre (public/folha.js).
   Ctrl/Cmd/Shift/Alt, botão do meio, movimento reduzido ou o script ausente: link comum, sem animação. */
type Folha = { pode: () => boolean; decolar: (media: HTMLElement, href: string) => void };
export function decolar(e: React.MouseEvent<HTMLAnchorElement>, media: HTMLElement | null | undefined) {
  if (!media || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const folha = (window as unknown as { folha?: Folha }).folha;
  if (!folha || !folha.pode() || !media.closest(".project")) return;
  e.preventDefault();
  folha.decolar(media, e.currentTarget.href);
}

export default function ProjectMedia({ href, folha, children }: { href: string; folha: string; children: React.ReactNode }) {
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
    <a ref={ref} href={href} className="p-media" data-cursor-hide onPointerMove={move} onPointerLeave={leave} onClick={(e) => decolar(e, ref.current)} tabIndex={-1} aria-hidden="true">
      {children}
      <span className="p-folha"><span className="mono">Folha {folha}</span></span>
      <span className="p-open mono">Abrir <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 8h10.5M9 4l4 4-4 4" /></svg></span>
    </a>
  );
}
