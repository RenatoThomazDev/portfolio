"use client";
import { useEffect } from "react";

/* Momentos de vida da planta que dependem de JS (estilos em vida.css). Tudo entra depois do carregamento, fora do
   caminho do título, e nada disso existe com movimento reduzido.
   1. Mira nas réguas: marcador que segue o cursor, x na régua do topo e y na lateral, com a coordenada em mono.
      Só com ponteiro fino (mouse).
   2. Cotas no hover/foco: em [data-cotas] (cards de projeto, foto do Sobre), linhas de cota se desenham em volta do
      elemento com a largura e a altura reais em px, e saem desenhando ao contrário.
   3. Malha de construção: a tecla G mostra e esconde colunas, margens e linhas de base. Uma etiqueta discreta avisa
      o atalho depois de 30s na página (só com mouse; some sozinha).
   4. Fluxo do diagrama: pausa quando a primeira tela sai da vista (classe hero-fora no <html>). */
export default function Vida() {
  useEffect(() => {
    const html = document.documentElement;
    const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fino = matchMedia("(pointer: fine)").matches;
    const limpar: (() => void)[] = [];

    // 4. pausa do fluxo (vale também com toque)
    const hero = document.getElementById("topo");
    if (hero && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(([e]) => html.classList.toggle("hero-fora", !e.isIntersecting));
      io.observe(hero); limpar.push(() => io.disconnect());
    }

    // 3. malha de construção (tecla G)
    let malha: HTMLDivElement | null = null, dica: HTMLDivElement | null = null, usouMalha = false;
    const alternarMalha = () => {
      if (!malha) {
        malha = document.createElement("div"); malha.className = "malha"; malha.setAttribute("aria-hidden", "true");
        malha.innerHTML = `<div class="malha-cols wrap grid12">${"<i></i>".repeat(12)}</div><span class="mono malha-leg">malha: 12 colunas, linha de base de 8px. G para esconder</span>`;
        document.body.appendChild(malha);
      }
      // presa à folha: top 0 e bottom 0 no <body> (vida.css), as linhas de base rolam junto com o texto
      void malha.offsetWidth;
      malha.classList.toggle("on"); usouMalha = true; dica?.classList.remove("on");
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "g" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      alternarMalha();
    };
    addEventListener("keydown", tecla); limpar.push(() => { removeEventListener("keydown", tecla); malha?.remove(); dica?.remove(); });
    // cotas fixas das pranchas (pf-w/pf-h): medida renderizada da imagem em px, não a do arquivo. Vale com
    // movimento reduzido (é medida, não movimento) e se atualiza ao redimensionar.
    const medir = new ResizeObserver((es) => es.forEach((e) => {
      const f = e.target.closest(".p-frame"); if (!f) return;
      // caixa de layout (getBoundingClientRect sem a inclinação temporária do hover), que é o tamanho na tela
      const bb = e.borderBoxSize[0], r = { width: bb.inlineSize, height: bb.blockSize };
      const w = f.querySelector(".pf-w"), h = f.querySelector(".pf-h");
      // um <span> só com o número (o fade do número fica no filho; as variantes d-lg/d-sm saem)
      const pôr = (alvo: Element | null, n: number) => { if (!alvo) return; const s = document.createElement("span"); s.textContent = String(Math.round(n)); alvo.replaceChildren(s); };
      pôr(w, r.width); pôr(h, r.height);
    }));
    document.querySelectorAll(".p-frame .p-media").forEach((m) => medir.observe(m));
    limpar.push(() => medir.disconnect());
    // a malha vale também com movimento reduzido (aparece sem transição); o resto abaixo é movimento
    if (reduz) return () => limpar.forEach((f) => f());

    if (fino) {
      // etiqueta do atalho, 30s depois
      const tDica = window.setTimeout(() => {
        if (usouMalha) return;
        dica = document.createElement("div"); dica.className = "malha-dica mono"; dica.setAttribute("aria-hidden", "true");
        dica.innerHTML = "<kbd>G</kbd> malha de construção";
        document.body.appendChild(dica); void dica.offsetWidth; dica.classList.add("on");
        // A etiqueta é fixa no canto: se estiver por cima de algo clicável (link, botão, campo), some até sair de
        // cima. Como ela tem pointer-events: none, elementFromPoint devolve o que está embaixo dela.
        const cobre = () => {
          if (!dica) return;
          const r = dica.getBoundingClientRect();
          const pontos = [[r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2], [r.left + r.width / 2, r.top + r.height / 2]];
          dica.classList.toggle("cobre", pontos.some(([x, y]) => document.elementFromPoint(x, y)?.closest("a, button, input, textarea, select, label, summary, [role=button]")));
        };
        cobre(); addEventListener("scroll", cobre, { passive: true }); addEventListener("resize", cobre);
        window.setTimeout(() => { dica?.classList.remove("on"); removeEventListener("scroll", cobre); removeEventListener("resize", cobre); }, 9000);
        limpar.push(() => { removeEventListener("scroll", cobre); removeEventListener("resize", cobre); });
      }, 30000);
      limpar.push(() => clearTimeout(tDica));

      // 1. mira nas réguas
      const mx = document.createElement("div"), my = document.createElement("div");
      mx.className = "mira mira-x mono"; my.className = "mira mira-y mono";
      mx.setAttribute("aria-hidden", "true"); my.setAttribute("aria-hidden", "true");
      mx.innerHTML = "<i></i><span></span>"; my.innerHTML = "<i></i><span></span>";
      // régua lateral: par da régua de leitura que já existe no topo
      const ry = document.createElement("div"); ry.className = "regua-y"; ry.setAttribute("aria-hidden", "true");
      document.body.append(ry, mx, my); limpar.push(() => ry.remove());
      const lx = mx.querySelector("span")!, ly = my.querySelector("span")!;
      let x = 0, y = 0, raf = 0;
      const pintar = () => {
        raf = 0;
        mx.style.transform = `translate3d(${x}px, 0, 0)`; my.style.transform = `translate3d(0, ${y}px, 0)`;
        lx.textContent = `x ${String(Math.round(x)).padStart(4, "0")}`;
        ly.textContent = `y ${String(Math.round(y + scrollY)).padStart(5, "0")}`; // posição na folha, não na janela
      };
      const mover = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        x = e.clientX; y = e.clientY; html.classList.add("mira-on");
        const cab = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 64;
        html.classList.toggle("mira-cab", y < cab + 24); // rótulos fora dos links do cabeçalho
        if (!raf) raf = requestAnimationFrame(pintar);
      };
      const sair = () => html.classList.remove("mira-on");
      const rolar = () => { if (!raf) raf = requestAnimationFrame(pintar); };
      addEventListener("pointermove", mover, { passive: true }); addEventListener("scroll", rolar, { passive: true });
      document.addEventListener("pointerleave", sair);
      limpar.push(() => { removeEventListener("pointermove", mover); removeEventListener("scroll", rolar); document.removeEventListener("pointerleave", sair); cancelAnimationFrame(raf); mx.remove(); my.remove(); });
    }

    // 2. cotas no hover e no foco
    const cotas = new WeakMap<Element, HTMLElement>(), vigias = new Map<Element, ResizeObserver>();
    limpar.push(() => vigias.forEach((ro) => ro.disconnect()));
    const entrar = (el: HTMLElement) => {
      if (cotas.has(el)) return;
      const r = el.getBoundingClientRect();
      const c = document.createElement("span"); c.className = "cotas mono"; c.setAttribute("aria-hidden", "true");
      c.innerHTML = `<span class="cota-w"><i></i><b>${Math.round(r.width)}</b></span><span class="cota-h"><i></i><b>${Math.round(r.height)}</b></span>`;
      el.appendChild(c); cotas.set(el, c);
      // segue a medida real enquanto a cota está na tela (redimensionar a janela com o mouse em cima)
      const ro = new ResizeObserver(() => { const q = el.getBoundingClientRect(); const b = c.querySelectorAll("b"); b[0].textContent = String(Math.round(q.width)); b[1].textContent = String(Math.round(q.height)); });
      ro.observe(el); vigias.set(el, ro);
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add("on")));
    };
    const sairCota = (el: HTMLElement) => {
      const c = cotas.get(el); if (!c) return;
      cotas.delete(el); c.classList.remove("on"); vigias.get(el)?.disconnect(); vigias.delete(el);
      window.setTimeout(() => c.remove(), 360); // sai desenhando ao contrário (transição de 320ms)
    };
    const alvos = [...document.querySelectorAll<HTMLElement>("[data-cotas]")];
    alvos.forEach((el) => {
      const dentro = () => entrar(el), fora = () => sairCota(el);
      const focoSai = (e: FocusEvent) => { if (!el.contains(e.relatedTarget as Node)) sairCota(el); };
      if (fino) { el.addEventListener("pointerenter", dentro); el.addEventListener("pointerleave", fora); }
      el.addEventListener("focusin", dentro); el.addEventListener("focusout", focoSai);
      limpar.push(() => { el.removeEventListener("pointerenter", dentro); el.removeEventListener("pointerleave", fora); el.removeEventListener("focusin", dentro); el.removeEventListener("focusout", focoSai); });
    });
    return () => limpar.forEach((f) => f());
  }, []);
  return null;
}
