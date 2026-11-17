"use client";
import { useEffect, useRef } from "react";

// Cursor mínimo: um ponto que vira um anel sobre links e botões. Só com mouse e sem movimento reduzido.
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current!;
    let x = 0, y = 0, cx = 0, cy = 0, id = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY; el.classList.add("on");
      if (!id) id = requestAnimationFrame(tick);
      el.classList.toggle("hover", !!(e.target as Element).closest("a,button,[data-cursor]"));
      el.classList.toggle("off", !!(e.target as Element).closest("[data-cursor-hide]"));
    };
    const leave = () => el.classList.remove("on");
    const tick = () => {
      cx += (x - cx) * 0.25; cy += (y - cy) * 0.25;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      id = requestAnimationFrame(tick);
    };
    addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    // O laço só começa no primeiro movimento do mouse (não pesa no carregamento).
    return () => { removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); cancelAnimationFrame(id); };
  }, []);
  return <div ref={ref} className="cursor" aria-hidden="true" />;
}
