"use client";
import { useEffect } from "react";

/* Revelação ao rolar, no idioma de "desenho sendo feito" (estilos em sections.css, sob html.js-reveal).
   Marca [data-reveal] com .in quando ~30% dele entra na tela, acima dos 10% de baixo; cada elemento uma vez só.
   O que já está na tela ao abrir (ou ao voltar no histórico / abrir com âncora) entra com .pronto: aparece no
   estado final sem transição, e .pronto sai dois quadros depois (os valores já são os finais, nada anima). */
export default function Reveal() {
  useEffect(() => {
    const html = document.documentElement;
    // Linha de base do número grande da folha: o "y" do texto SVG acompanha o texto HTML (a fonte pode trocar).
    const base = () => document.querySelectorAll<HTMLElement>(".sec-n").forEach((n) => {
      const b = n.querySelector<HTMLElement>(".bl"), t = n.querySelector("text");
      if (b && t) t.setAttribute("y", String(b.offsetTop));
    });
    document.fonts.ready.then(base); addEventListener("resize", base);
    if (!html.classList.contains("js-reveal")) return () => removeEventListener("resize", base);

    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const tirar = (e: HTMLElement) => requestAnimationFrame(() => requestAnimationFrame(() => e.classList.remove("pronto")));
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        el.style.setProperty("--stagger", `${Math.min(n++, 2) * 40}ms`); // no máximo 80ms: o texto não espera
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0.3, rootMargin: "0px 0px -10% 0px" });
    // Já na tela (ou acima dela): pronto, sem animar.
    const visiveis = () => els.forEach((e) => {
      if (e.classList.contains("in")) return;
      if (e.getBoundingClientRect().top < innerHeight * 0.9) { e.classList.add("in", "pronto"); tirar(e); io.unobserve(e); }
    });
    visiveis();
    els.forEach((e) => { if (e.classList.contains("pronto")) tirar(e); else if (!e.classList.contains("in")) io.observe(e); });
    // Ao voltar no histórico ou abrir com âncora, o navegador restaura a rolagem depois do carregamento:
    // o que estiver na tela nesse primeiro salto também aparece pronto.
    const nav = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
    const salto = nav === "back_forward" || location.hash.length > 1;
    const t0 = performance.now();
    const cedo = () => { if (performance.now() - t0 < 1500) visiveis(); else removeEventListener("scroll", cedo); };
    if (salto) addEventListener("scroll", cedo, { passive: true });
    const show = (e: PageTransitionEvent) => { if (e.persisted) visiveis(); };
    addEventListener("pageshow", show);
    // Rolagem rápida: o que passou inteiro por cima da tela, ou o fim da página, aparece na hora.
    const passou = () => {
      const fim = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      els.forEach((e) => {
        if (e.classList.contains("in")) return;
        if (fim || e.getBoundingClientRect().bottom < 0) { e.style.setProperty("--stagger", "0ms"); e.classList.add("in"); io.unobserve(e); }
      });
    };
    addEventListener("scroll", passou, { passive: true });
    // Navegação por âncora (SmoothScroll.tsx): antes de a rolagem começar, o que fica acima do destino aparece
    // pronto (sem animar) e o que fica na tela de destino começa a se revelar já, para terminar antes da chegada.
    const revelarAte = (e: Event) => {
      const topo = (e as CustomEvent<number>).detail;
      els.forEach((el) => {
        if (el.classList.contains("in")) return;
        const r = el.getBoundingClientRect(), y = r.top + scrollY;
        if (y + r.height <= topo) { el.classList.add("in", "pronto"); tirar(el); }
        else if (y < topo + innerHeight * 0.9) { el.style.setProperty("--stagger", "0ms"); el.classList.add("in"); }
        else return;
        io.unobserve(el);
      });
    };
    addEventListener("revelar-ate", revelarAte);
    return () => { io.disconnect(); removeEventListener("revelar-ate", revelarAte); removeEventListener("scroll", passou); removeEventListener("scroll", cedo); removeEventListener("pageshow", show); removeEventListener("resize", base); };
  }, []);
  return null;
}
