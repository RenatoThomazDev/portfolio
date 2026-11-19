"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Rasgo from "./Rasgo";
import Fundo from "./Fundo";

/* Projetos da home: faixa de largura total com troca em fade (classico.css).
   Os slides ficam empilhados na mesma célula de um grid: a faixa tem a altura do maior e trocar não mexe no layout
   (sem CLS). O atual some enquanto o novo aparece, com o fundo num zoom curto e o texto entrando em sequência.
   Troca por setas, pontos, swipe/arrastar e setas do teclado; troca automática a cada 6s, circular, que pausa com o
   mouse em cima, com o foco dentro, com a seção fora da tela e com a aba oculta, e para de vez quando a pessoa troca
   sozinha. Com movimento reduzido ela começa desligada (o botão liga). Sem JS: os três slides em sequência,
   completos, sem controles. public/folha.js também mexe no data-pos (na volta da demo, sem animação) e avisa com
   "carrossel-ativar"; aí a troca automática para. */
type Item = { id: string; title: string; curto: string; img: string };
type Folha = { prefetch?: (el: Element) => void };

// chevrons ‹ › no quadro de 20 x 20, deslocados 0,5 para dentro (centro óptico)
const Esq = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" /></svg>;
const Dir = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5L13 10l-5.5 5.5" /></svg>;
const Pausa = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 5v10M12.5 5v10" /></svg>;
const Tocar = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5l8 5-8 5z" /></svg>;

export default function Classico({ itens, cabecalho, children }: { itens: Item[]; cabecalho: React.ReactNode; children: React.ReactNode }) {
  const raiz = useRef<HTMLElement>(null);
  const janela = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [anuncio, setAnuncio] = useState("");
  // aria-live: "off" quando a troca foi automática, "polite" quando foi a pessoa
  const [vivo, setVivo] = useState<"off" | "polite">("polite");
  // rodando: a troca automática está ligada. Começa desligada no HTML do servidor e liga na montagem, se o
  // movimento não for reduzido. pausas: motivos de pausa temporária (mouse, foco, fora da tela, aba oculta).
  const [rodando, setRodando] = useState(false);
  const [pausas, setPausas] = useState({ mouse: false, foco: false, fora: false, oculta: false });
  const pausado = pausas.mouse || pausas.foco || pausas.fora || pausas.oculta;
  const montou = useRef(false);
  const n = itens.length;
  const slides = () => [...(janela.current?.querySelectorAll<HTMLElement>(".projects > .project") ?? [])];
  // troca pela pessoa: para a troca automática de vez
  const ir = (k: number) => { setRodando(false); setVivo("polite"); setAtivo(((k % n) + n) % n); };
  const auto = () => { setVivo("off"); setAtivo((a) => (a + 1) % n); };

  // ouve a folha desde a hidratação (layout effect: um useEffect podia perder o aviso)
  useLayoutEffect(() => {
    const ativar = (e: Event) => { setRodando(false); setAtivo((e as CustomEvent<number>).detail); };
    addEventListener("carrossel-ativar", ativar);
    return () => removeEventListener("carrossel-ativar", ativar);
  }, []);

  useLayoutEffect(() => {
    if (!montou.current) {
      montou.current = true;
      // a folha pode já ter posto outro slide como ativo (volta da demo, antes da hidratação): ele fica, e a troca
      // automática não liga
      const voltou = raiz.current?.dataset.voltou === "1";
      if (!voltou && !matchMedia("(prefers-reduced-motion: reduce)").matches) setRodando(true);
      const k = slides().findIndex((p) => p.dataset.pos === "0");
      if (k > 0 && k !== ativo) { setAtivo(k); return; }
    } else {
      setAnuncio(itens[ativo].title);
      const p = slides()[ativo], f = (window as unknown as { folha?: Folha }).folha;
      if (p && f?.prefetch) f.prefetch(p); // ao ficar ativo, o slide já busca a demo dele
    }
    slides().forEach((p, i) => {
      p.dataset.pos = i === ativo ? "0" : "1";
      p.inert = i !== ativo;
      p.setAttribute("role", "group"); p.setAttribute("aria-roledescription", "slide");
      p.setAttribute("aria-label", `${itens[i].id} de ${n}: ${itens[i].title}`);
      // a moldura dos slides de trás entra já colada (fita e cotas sem a animação de colar): ela só aparece na troca
      if (i !== ativo) p.querySelector(".p-frame")?.classList.add("colado", "ja");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itens e n não mudam
  }, [ativo]);

  // Pausas temporárias: seção fora da tela e aba oculta (o mouse e o foco vêm dos eventos do JSX).
  useEffect(() => {
    const r = raiz.current!;
    const io = new IntersectionObserver(([e]) => setPausas((p) => ({ ...p, fora: !e.isIntersecting })), { threshold: 0.25 });
    io.observe(r);
    const vis = () => setPausas((p) => ({ ...p, oculta: document.hidden }));
    vis(); document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);

  // Arrastar (dedo e mouse) e setas do teclado.
  useEffect(() => {
    const j = janela.current!, r = raiz.current!;
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
        arrastando = true; moveu = true; j.setPointerCapture(id);
      }
    };
    const fim = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      if (!arrastando) return;
      arrastando = false;
      if (Math.abs(dx) > 50) { setRodando(false); setVivo("polite"); setAtivo((a) => (a + (dx < 0 ? 1 : -1) + n) % n); }
    };
    // depois de arrastar, o clique que vem junto não abre link nem a demo
    const clique = (e: MouseEvent) => { if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; } };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      e.preventDefault();
      setRodando(false); setVivo("polite");
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

  return (
    <>
      {cabecalho}
      <section ref={raiz} className={`cc${rodando ? " cc-auto" : ""}${pausado ? " cc-pausado" : ""}`} aria-roledescription="carrossel" aria-label="Projetos"
        onPointerEnter={(e) => e.pointerType === "mouse" && setPausas((p) => ({ ...p, mouse: true }))}
        onPointerLeave={(e) => e.pointerType === "mouse" && setPausas((p) => ({ ...p, mouse: false }))}
        onFocus={() => setPausas((p) => ({ ...p, foco: true }))}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPausas((p) => ({ ...p, foco: false })); }}>
        {/* Controles antes da faixa no HTML. No celular e no tablet a linha (seta, pontos, contador, pausa, seta)
            fica acima da faixa; no desktop as setas ficam nas laterais da faixa e o resto embaixo (classico.css). */}
        <div className="cc-nav">
          <button type="button" className="cc-seta cc-ant" aria-label="Projeto anterior" onClick={() => ir(ativo - 1)}><Esq /></button>
          <div className="cc-pontos">
            {itens.map((it, k) => (
              <button key={it.id} type="button" className="cc-ponto" aria-label={`Ir para o projeto ${k + 1}: ${it.title}`} aria-current={k === ativo ? "true" : undefined} onClick={() => ir(k)}>
                <span aria-hidden="true" />
                {/* progresso dos 6s: linha de cota que preenche embaixo do ponto ativo; quando ela termina, troca.
                    A key recomeça a animação a cada troca. */}
                {k === ativo && rodando && <i key={ativo} className="cc-prog" aria-hidden="true" onAnimationEnd={auto} />}
              </button>
            ))}
            <span className="cc-cont mono" aria-hidden="true">{itens[ativo].id} / {itens[n - 1].id}</span>
            <button type="button" className="cc-seta cc-pausa" aria-label={rodando ? "Pausar troca automática" : "Continuar troca automática"} onClick={() => { setVivo(rodando ? "polite" : "off"); setRodando(!rodando); }}>
              {rodando ? <Pausa /> : <Tocar />}
            </button>
          </div>
          <button type="button" className="cc-seta cc-prox" aria-label="Próximo projeto" onClick={() => ir(ativo + 1)}><Dir /></button>
        </div>
        {/* tabIndex: com o foco aqui, as setas do teclado trocam de slide */}
        <div ref={janela} className="cc-janela" tabIndex={-1}>
          {children}
        </div>
        {/* Fundos do carrossel inteiro, de borda a borda e de cima até embaixo, atrás da faixa e da linha de
            controles: o do slide ativo aparece (data-on) e troca em fade junto com ele. Embaixo, o rasgado, por cima
            de tudo e parado na troca. */}
        <div className="cc-fundos" aria-hidden="true">
          {itens.map((it, k) => <Fundo key={it.id} img={it.img} ativo={k === ativo} />)}
        </div>
        <Rasgo />
        <p className="sr-only" aria-live={vivo}>{anuncio}</p>
      </section>
    </>
  );
}
