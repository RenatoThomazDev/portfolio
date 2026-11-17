"use client";
import { useEffect } from "react";
import Lenis from "lenis";

/* Rolagem suave (Lenis). "lerp" em vez de duração fixa: a página responde na hora ao gesto e assenta rápido, sem a
   sensação de patinar. É o único laço de rolagem do site: o Lenis move a rolagem nativa, e o que depende dela (linha
   conectora, régua de leitura, cabeçalho) lê o evento de scroll do próprio navegador, no mesmo quadro.
   Âncoras: rolagem de 1,1s com easeOutCubic até a seção e foco no destino (leitor de tela e Tab continuam de lá). */
const DURACAO = 1.1;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export default function SmoothScroll() {
  useEffect(() => {
    const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null, id = 0, t = 0, anim = 0;
    const focar = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!a || a.pathname !== location.pathname) return;
      const alvo = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!alvo) return;
      if (!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex", "-1");
      alvo.focus({ preventScroll: true });
    };
    document.addEventListener("click", focar);

    // Navegação pedida pelo menu do celular (Header.tsx), já com o menu fechado e a rolagem destravada.
    // O destino fica logo abaixo do cabeçalho fixo (52px depois de rolar); o topo vai para 0.
    const navegar = (e: Event) => {
      const id = (e as CustomEvent<string>).detail, alvo = document.getElementById(id);
      if (!alvo) return;
      const cab = 52;
      const max = document.documentElement.scrollHeight - innerHeight;
      const topo = id === "topo" ? 0 : Math.min(max, Math.max(0, Math.round(alvo.getBoundingClientRect().top + scrollY - cab)));
      // Reveal.tsx deixa pronto o que fica acima e no destino antes de a rolagem começar: nada aparece vazio
      dispatchEvent(new CustomEvent("revelar-ate", { detail: topo }));
      history.replaceState(null, "", `#${id}`);
      if (!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex", "-1");
      alvo.focus({ preventScroll: true });
      cancelAnimationFrame(anim);
      if (reduz) { scrollTo({ top: topo, behavior: "instant" }); return; }
      if (lenis) { lenis.start(); lenis.scrollTo(topo, { duration: DURACAO, easing: easeOutCubic, force: true }); return; }
      // Lenis ainda não iniciou (primeiros ~1,5s): a mesma curva, quadro a quadro na rolagem nativa
      const de = scrollY, t0 = performance.now();
      const passo = (agora: number) => {
        const p = Math.min(1, (agora - t0) / (DURACAO * 1000));
        scrollTo({ top: de + (topo - de) * easeOutCubic(p), behavior: "instant" });
        if (p < 1) anim = requestAnimationFrame(passo);
      };
      anim = requestAnimationFrame(passo);
    };
    addEventListener("navegar-ancora", navegar);
    // menu do celular aberto: a página não rola (Header.tsx)
    const travar = (e: Event) => { if ((e as CustomEvent<boolean>).detail) lenis?.stop(); else lenis?.start(); };
    addEventListener("rolagem-travada", travar);
    const limpar = () => { removeEventListener("navegar-ancora", navegar); removeEventListener("rolagem-travada", travar); document.removeEventListener("click", focar); cancelAnimationFrame(anim); };
    if (reduz) return limpar;

    // Inicia depois do carregamento, fora do tempo de bloqueio do primeiro acesso.
    const start = () => {
      // Âncoras fora do menu: mesma duração e curva. Roda e toque continuam no lerp.
      lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1, anchors: { duration: DURACAO, easing: easeOutCubic } });
      if (document.documentElement.classList.contains("menu-aberto")) lenis.stop();
      const raf = (time: number) => { lenis!.raf(time); id = requestAnimationFrame(raf); };
      id = requestAnimationFrame(raf);
    };
    const later = () => { t = window.setTimeout(start, 1500); };
    if (document.readyState === "complete") later(); else addEventListener("load", later, { once: true });
    return () => { limpar(); clearTimeout(t); cancelAnimationFrame(id); lenis?.destroy(); removeEventListener("load", later); };
  }, []);
  return null;
}
