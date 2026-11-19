"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Tape from "./Tape";

/* Projetos da home: folha de cópia heliográfica com troca em fade (classico.css).
   Os slides ficam empilhados na mesma célula de um grid: a folha tem a altura do maior e trocar não mexe no layout
   (sem CLS). O atual some enquanto o novo aparece, e o texto do novo entra em sequência.
   Troca por setas, pontos, swipe/arrastar e setas do teclado. Troca automática a cada 6s, circular, ligada por
   padrão (também com movimento reduzido, quando a troca é instantânea): só o botão de pausa a desliga, e a escolha
   fica guardada na sessão. Trocar à mão não desliga, só recomeça a contagem. Ela espera, sem a pessoa ver, com a
   seção fora da tela e com a aba oculta; ao voltar, a contagem recomeça do zero. Sem JS: os três slides em
   sequência, completos, sem controles. public/folha.js também mexe no data-pos (na volta da demo, sem animação) e
   avisa com "carrossel-ativar". */
const CHAVE = "projetos-auto"; // sessionStorage: "0" quando a pessoa pausou
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
  // rodando: a troca automática está ligada (a escolha do botão de pausa). Começa ligada; na montagem lê a sessão.
  // pausas: o que a faz esperar sem a pessoa ver (seção fora da tela, aba oculta).
  const [rodando, setRodando] = useState(true);
  const [pausas, setPausas] = useState({ fora: false, oculta: false });
  const pausado = pausas.fora || pausas.oculta;
  // toque: muda a cada troca feita à mão, para a linha de progresso (e a contagem) recomeçar do zero
  const [toque, setToque] = useState(0);
  const montou = useRef(false);
  const n = itens.length;
  const slides = () => [...(janela.current?.querySelectorAll<HTMLElement>(".projects > .project") ?? [])];
  // troca pela pessoa: não desliga a troca automática, só recomeça a contagem
  const manual = (f: (a: number) => number) => { setVivo("polite"); setToque((t) => t + 1); setAtivo((a) => ((f(a) % n) + n) % n); };
  const ir = (k: number) => manual(() => k);
  const auto = () => { setVivo("off"); setAtivo((a) => (a + 1) % n); };
  const alternar = () => {
    const novo = !rodando;
    setRodando(novo); setVivo(novo ? "off" : "polite");
    try { sessionStorage.setItem(CHAVE, novo ? "1" : "0"); } catch { /* sem sessionStorage: vale só nesta página */ }
  };

  // ouve a folha desde a hidratação (layout effect: um useEffect podia perder o aviso)
  useLayoutEffect(() => {
    const ativar = (e: Event) => { setToque((t) => t + 1); setAtivo((e as CustomEvent<number>).detail); };
    addEventListener("carrossel-ativar", ativar);
    return () => removeEventListener("carrossel-ativar", ativar);
  }, []);

  useLayoutEffect(() => {
    if (!montou.current) {
      montou.current = true;
      // a escolha da sessão: pausada pelo botão numa visita anterior desta aba
      try { if (sessionStorage.getItem(CHAVE) === "0") setRodando(false); } catch { /* sem sessionStorage: fica ligada */ }
      // a folha pode já ter posto outro slide como ativo (volta da demo, antes da hidratação): ele fica
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

  // Esperas: seção fora da tela e aba oculta.
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
      if (Math.abs(dx) > 50) manual((a) => a + (dx < 0 ? 1 : -1));
    };
    // depois de arrastar, o clique que vem junto não abre link nem a demo
    const clique = (e: MouseEvent) => { if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; } };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      e.preventDefault();
      manual((a) => a + (e.key === "ArrowRight" ? 1 : -1));
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
      {/* a folha de cópia heliográfica presa na prancheta: o invólucro gira, faz a sombra e segura as fitas */}
      <div className="cc-prancha">
      <section ref={raiz} className={`cc${rodando ? " cc-auto" : ""}${pausado ? " cc-pausado" : ""}`} aria-roledescription="carrossel" aria-label="Projetos">
        {/* Controles antes da faixa no HTML. No celular e no tablet a linha (seta, pontos, contador, pausa, seta)
            fica acima da faixa; no desktop as setas ficam nas laterais da faixa e o resto embaixo (classico.css). */}
        <div className="cc-nav">
          <button type="button" className="cc-seta cc-ant" aria-label="Projeto anterior" onClick={() => ir(ativo - 1)}><Esq /></button>
          <div className="cc-pontos">
            {itens.map((it, k) => (
              <button key={it.id} type="button" className="cc-ponto" aria-label={`Ir para o projeto ${k + 1}: ${it.title}`} aria-current={k === ativo ? "true" : undefined} onClick={() => ir(k)}>
                <span aria-hidden="true" />
                {/* progresso dos 6s: linha de cota que preenche embaixo do ponto ativo; quando ela termina, troca.
                    Só existe com a troca ligada e sem espera; a key recomeça a animação a cada troca e a cada toque,
                    e ao voltar de uma espera ela nasce de novo, do zero. */}
                {k === ativo && rodando && !pausado && <i key={`${ativo}-${toque}`} className="cc-prog" aria-hidden="true" onAnimationEnd={auto} />}
              </button>
            ))}
            <span className="cc-cont mono" aria-hidden="true">{itens[ativo].id} / {itens[n - 1].id}</span>
            <button type="button" className="cc-seta cc-pausa" aria-label={rodando ? "Pausar troca automática" : "Continuar troca automática"} onClick={alternar}>
              {rodando ? <Pausa /> : <Tocar />}
            </button>
          </div>
          <button type="button" className="cc-seta cc-prox" aria-label="Próximo projeto" onClick={() => ir(ativo + 1)}><Dir /></button>
        </div>
        {/* tabIndex: com o foco aqui, as setas do teclado trocam de slide */}
        <div ref={janela} className="cc-janela" tabIndex={-1}>
          {children}
        </div>
        {/* fundo da folha inteira, atrás da faixa e dos controles: só a cópia azul (a captura fica na moldura) */}
        <div className="cc-fundos" aria-hidden="true" />
        <p className="sr-only" aria-live={vivo}>{anuncio}</p>
      </section>
      {/* fita nos dois cantos de cima: fora da folha (.cc), que tem a máscara do rasgado */}
      <span className="cc-fita cc-fita-a" aria-hidden="true"><Tape side="a" /></span>
      <span className="cc-fita cc-fita-b" aria-hidden="true"><Tape side="a" /></span>
      </div>
    </>
  );
}
