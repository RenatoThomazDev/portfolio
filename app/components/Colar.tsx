"use client";
import { useEffect } from "react";

/* "Colar a foto no caderno": marca cada .p-frame[data-colar] com .colado quando ela está de fato visível, uma vez só.
   A animação é toda em CSS (sections.css), só transform e opacity. Com movimento reduzido já entra colada. */
export default function Colar() {
  useEffect(() => {
    // .ja: já estava na tela ao abrir (script do layout); entra colada, sem animar.
    const els = [...document.querySelectorAll<HTMLElement>("[data-colar]:not(.ja)")];
    if (!document.documentElement.classList.contains("js-reveal")) {
      els.forEach((e) => e.classList.add("colado"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("colado"); io.unobserve(e.target); } });
    }, { threshold: 0.5, rootMargin: "0px 0px -15% 0px" }); // metade da miniatura visível, acima dos 15% de baixo da tela
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
