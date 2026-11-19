"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";

/* Projetos da home: carrossel clássico (classico.css), em todas as larguras.
   Um card por vez; o .projects vira o trilho e anda com transform (--k). Do card seguinte aparece só a moldura na
   borda: o texto dos cards inativos fica invisível. No último card, a borda mostra a moldura do primeiro (.cc-fantasma),
   porque o carrossel é circular. Setas, pontos, contador, clique no card vizinho, swipe/arrastar e setas do teclado.
   Os cards ficam lado a lado no mesmo trilho, que tem a altura do maior: trocar não mexe no layout (sem CLS).
   Sem JS: os três cards em sequência, completos, sem controles. public/folha.js também mexe no data-pos e no --k
   (na volta da demo, sem animação) e avisa com "carrossel-ativar". Sem autoplay. */
type Item = { id: string; title: string; img: string };
type Folha = { prefetch?: (el: Element) => void };

// chevrons ‹ › centrados no quadro de 24; o ajuste óptico (1px para dentro) fica no CSS
const Esq = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" /></svg>;
const Dir = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>;

export default function Classico({ itens, cabecalho, children }: { itens: Item[]; cabecalho: React.ReactNode; children: React.ReactNode }) {
  const raiz = useRef<HTMLElement>(null);
  const janela = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [anuncio, setAnuncio] = useState("");
  const montou = useRef(false);
  const n = itens.length;
  const slides = () => [...(janela.current?.querySelectorAll<HTMLElement>(".projects > .project") ?? [])];
  const ir = (k: number) => setAtivo(((k % n) + n) % n);

  // ouve a folha desde a hidratação (layout effect: um useEffect podia perder o aviso)
  useLayoutEffect(() => {
    const ativar = (e: Event) => setAtivo((e as CustomEvent<number>).detail);
    addEventListener("carrossel-ativar", ativar);
    return () => removeEventListener("carrossel-ativar", ativar);
  }, []);

  useLayoutEffect(() => {
    if (!montou.current) {
      montou.current = true;
      // a folha pode já ter posto outro card como ativo (volta da demo, antes da hidratação)
      const k = slides().findIndex((p) => p.dataset.pos === "0");
      if (k > 0 && k !== ativo) { setAtivo(k); return; }
    } else {
      setAnuncio(itens[ativo].title);
      const p = slides()[ativo], f = (window as unknown as { folha?: Folha }).folha;
      if (p && f?.prefetch) f.prefetch(p); // ao ficar ativo, o card já busca a demo dele
    }
    slides().forEach((p, i) => {
      p.dataset.pos = i === ativo ? "0" : "1";
      p.inert = i !== ativo;
      p.setAttribute("role", "group"); p.setAttribute("aria-roledescription", "slide");
      p.setAttribute("aria-label", `${itens[i].id} de ${n}: ${itens[i].title}`);
      // A moldura do vizinho aparece na borda: já entra colada (sem a animação de colar). Senão ela ficava
      // invisível, porque Colar.tsx só cola com metade da moldura na tela, e do vizinho aparece uma faixa.
      if (i !== ativo) p.querySelector(".p-frame")?.classList.add("colado", "ja");
    });
    janela.current?.querySelector<HTMLElement>(".projects")?.style.setProperty("--k", String(ativo));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itens e n não mudam
  }, [ativo]);

  // Arrastar (dedo e mouse), clique no card vizinho e setas do teclado.
  useEffect(() => {
    const j = janela.current!, r = raiz.current!, trilho = j.querySelector<HTMLElement>(".projects")!;
    let x0 = 0, y0 = 0, dx = 0, id = -1, arrastando = false, moveu = false;
    const ini = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
      id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0; arrastando = false; moveu = false;
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      dx = e.clientX - x0;
      if (!arrastando) {
        if (Math.abs(dx) < 8) return;
        if (Math.abs(e.clientY - y0) > Math.abs(dx)) { id = -1; return; } // gesto vertical: é a página rolando
        arrastando = true; moveu = true; j.setPointerCapture(id); r.classList.add("cc-arrasta");
      }
      trilho.style.setProperty("--arraste", `${dx}px`);
    };
    const fim = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      if (!arrastando) return;
      arrastando = false; r.classList.remove("cc-arrasta"); trilho.style.setProperty("--arraste", "0px");
      if (Math.abs(dx) > 50) setAtivo((a) => (a + (dx < 0 ? 1 : -1) + n) % n);
    };
    // depois de arrastar, o clique que vem junto não abre link nem a demo
    const clique = (e: MouseEvent) => {
      if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; return; }
      const atual = j.querySelector<HTMLElement>('.project[data-pos="0"]');
      if (!atual || (e.target as HTMLElement).closest('.project[data-pos="0"], button')) return;
      // o card vizinho é inert: o clique passa para a janela; à direita do ativo vai para o próximo
      const q = atual.getBoundingClientRect();
      if (e.clientX > q.right) setAtivo((a) => (a + 1) % n);
      else if (e.clientX < q.left) setAtivo((a) => (a - 1 + n) % n);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      e.preventDefault();
      setAtivo((a) => (a + (e.key === "ArrowRight" ? 1 : -1) + n) % n);
    };
    const semArrastarImg = (e: DragEvent) => e.preventDefault();
    j.addEventListener("pointerdown", ini); j.addEventListener("pointermove", mover);
    j.addEventListener("pointerup", fim); j.addEventListener("pointercancel", fim);
    j.addEventListener("click", clique, true); j.addEventListener("dragstart", semArrastarImg);
    r.addEventListener("keydown", tecla);
    return () => {
      j.removeEventListener("pointerdown", ini); j.removeEventListener("pointermove", mover);
      j.removeEventListener("pointerup", fim); j.removeEventListener("pointercancel", fim);
      j.removeEventListener("click", clique, true); j.removeEventListener("dragstart", semArrastarImg);
      r.removeEventListener("keydown", tecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liga uma vez
  }, []);

  const prim = itens[0];
  return (
    <>
      {cabecalho}
      <section ref={raiz} className="cc" aria-roledescription="carrossel" aria-label="Projetos">
        {/* Controles antes do trilho no HTML. No celular eles ficam logo acima da moldura (o mais perto da imagem
            que dá sem medir a legenda, que muda de altura entre os projetos); no desktop as setas ficam nas
            laterais e a linha dos pontos vai para baixo do card (order, classico.css). A ordem do Tab é a mesma
            nas duas: controles, texto do card, botões (a imagem fica fora do Tab). */}
        <div className="cc-nav">
          <button type="button" className="cc-seta cc-ant" aria-label="Projeto anterior" onClick={() => ir(ativo - 1)}><Esq /></button>
          <div className="cc-pontos">
            {itens.map((it, k) => (
              <button key={it.id} type="button" className="cc-ponto" aria-label={`Ir para o projeto ${k + 1}: ${it.title}`} aria-current={k === ativo ? "true" : undefined} onClick={() => ir(k)}>
                <span aria-hidden="true" />
              </button>
            ))}
            <span className="cc-cont mono" aria-hidden="true">{itens[ativo].id} / {itens[n - 1].id}</span>
          </div>
          <button type="button" className="cc-seta cc-prox" aria-label="Próximo projeto" onClick={() => ir(ativo + 1)}><Dir /></button>
        </div>
        {/* tabIndex: com o foco aqui, as setas do teclado trocam de card */}
        <div ref={janela} className="cc-janela" tabIndex={-1}>
          {children}
          {/* moldura do primeiro projeto na borda, depois do último card (o carrossel é circular) */}
          <div className="cc-fantasma" aria-hidden="true" data-on={ativo === n - 1 || undefined}>
            <span className="cc-fantasma-m">
              <Image className="img-l" src={prim.img} alt="" width={1920} height={1200} sizes="10vw" />
              <Image className="img-d" src={prim.img.replace(".png", "-escuro.png")} alt="" width={1920} height={1200} sizes="10vw" />
            </span>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{anuncio}</p>
      </section>
    </>
  );
}
