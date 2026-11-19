"use client";
import { useEffect, useRef, useState } from "react";

/* Projetos da home: abas com número e nome (02.1 Clínica...), molduras empilhadas em profundidade.
   Cada .project dentro de .projects tem data-pos: 0 é a moldura da frente (e o texto visível), 1 a de trás, 2 a
   borda mais atrás. O CSS (pilha.css) faz o resto, só com transform e opacity; tudo fica na mesma célula da grade,
   então a altura reservada é a da maior moldura e do maior texto, sem CLS.
   Para mostrar que é um carrossel: abas com nome, linha de progresso em 3 trechos, contador "1 de 3", anterior e
   próximo, a moldura de trás com "Próximo: ..." ao passar o mouse (no celular, a mesma etiqueta fica sempre
   visível abaixo da moldura) e, no celular, a dica de deslizar na primeira visita.
   Anterior/próximo são circulares (de 02.3 volta para 02.1, nunca desativados): a pilha já é circular, a folha de
   trás de 02.3 é a 02.1, e o botão faz o mesmo que clicar nela.
   Sem JS (html:not(.js)) nada disso aparece e os três projetos ficam um embaixo do outro, como antes.
   public/folha.js também mexe no data-pos (na volta da demo): por isso o projeto ativo é lido do DOM na montagem e
   o evento "pilha-ativar" é ouvido. Sem autoplay. */
type Item = { id: string; title: string; curto: string };
const DICA = "pj-dica-vista";

export default function Pilha({ itens, cabecalho, children }: { itens: Item[]; cabecalho: React.ReactNode; children: React.ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [dica, setDica] = useState(false);
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const n = itens.length;
  const projetos = () => [...(raiz.current?.querySelectorAll<HTMLElement>(".projects > .project") ?? [])];

  useEffect(() => {
    const k = projetos().findIndex((p) => p.dataset.pos === "0");
    if (k > 0) setAtivo(k);
    // a folha também pode ativar depois da hidratação (o pouso espera a captura decodificar)
    const ativar = (e: Event) => setAtivo((e as CustomEvent<number>).detail);
    addEventListener("pilha-ativar", ativar);
    return () => removeEventListener("pilha-ativar", ativar);
  }, []);

  useEffect(() => {
    const r = raiz.current!;
    projetos().forEach((p, i) => {
      const pos = (i - ativo + n) % n, frente = pos === 0;
      p.dataset.pos = String(pos);
      const fig = p.querySelector<HTMLElement>(".p-frame"), corpo = p.querySelector<HTMLElement>(".p-body");
      if (fig) { fig.inert = !frente; fig.toggleAttribute("aria-hidden", !frente); }
      if (corpo) {
        corpo.id = `pj-painel-${i}`; corpo.setAttribute("role", "tabpanel"); corpo.setAttribute("aria-labelledby", `pj-aba-${i}`);
        corpo.inert = !frente;
      }
    });
    // rótulo "Folha 02.n / Projetos" do bloco
    r.querySelectorAll(".pj-sub").forEach((s) => { s.textContent = "." + itens[ativo].id.split(".")[1]; });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itens e n não mudam
  }, [ativo]);

  const ir = (k: number, focar = false) => { const i = (k + n) % n; setAtivo(i); if (focar) abas.current[i]?.focus(); };

  // Dica de deslizar: só em tela de toque, na primeira visita, quando a pilha aparece. Some no primeiro swipe ou
  // depois de 5s; o localStorage guarda que a pessoa já viu.
  const fecharDica = () => { setDica(false); try { localStorage.setItem(DICA, "1"); } catch {} };
  useEffect(() => {
    let visto = false;
    try { visto = localStorage.getItem(DICA) === "1"; } catch {}
    if (visto || !matchMedia("(pointer: coarse)").matches) return;
    const alvo = raiz.current!.querySelector(".projects");
    let t = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect(); setDica(true);
      t = window.setTimeout(fecharDica, 5000);
    }, { threshold: 0.4 });
    // .projects é display: contents (sem caixa): observa a moldura da frente
    const f = raiz.current!.querySelector('.project[data-pos="0"] > .p-frame') ?? alvo;
    if (f) io.observe(f);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  // Swipe na moldura, clique e hover na moldura de trás (ela é inert: o ponteiro passa para o .pj).
  useEffect(() => {
    const r = raiz.current!;
    let x0 = 0, y0 = 0, toque = false;
    const naTras = (x: number, y: number) => {
      const frente = r.querySelector<HTMLElement>('.project[data-pos="0"] > .p-frame .p-media')?.getBoundingClientRect();
      const q = r.querySelector<HTMLElement>('.project[data-pos="1"] > .p-frame .p-media')?.getBoundingClientRect();
      if (!q || x < q.left || x > q.right || y < q.top || y > q.bottom) return false;
      return !frente || x > frente.right || y > frente.bottom || x < frente.left || y < frente.top;
    };
    const ini = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest(".p-frame")) { toque = false; return; }
      toque = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    };
    const fim = (e: TouchEvent) => {
      if (!toque) return; toque = false;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { setAtivo((a) => (a + (dx < 0 ? 1 : -1) + n) % n); fecharDica(); }
    };
    const clique = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.project[data-pos="0"], button, a')) return;
      if (naTras(e.clientX, e.clientY)) setAtivo((a) => (a + 1) % n);
    };
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      r.classList.toggle("pj-sobre", !(e.target as HTMLElement).closest('.project[data-pos="0"]') && naTras(e.clientX, e.clientY));
    };
    const sair = () => r.classList.remove("pj-sobre");
    r.addEventListener("touchstart", ini, { passive: true });
    r.addEventListener("touchend", fim, { passive: true });
    r.addEventListener("click", clique);
    r.addEventListener("pointermove", mover, { passive: true });
    r.addEventListener("pointerleave", sair);
    return () => {
      r.removeEventListener("touchstart", ini); r.removeEventListener("touchend", fim); r.removeEventListener("click", clique);
      r.removeEventListener("pointermove", mover); r.removeEventListener("pointerleave", sair);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liga uma vez
  }, []);

  const tecla = (e: React.KeyboardEvent, k: number) => {
    const m: Record<string, number> = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: n - 1 };
    if (!(e.key in m)) return;
    e.preventDefault(); ir(m[e.key], true);
  };
  const prox = itens[(ativo + 1) % n];

  return (
    <div ref={raiz} className="pj">
      {cabecalho}
      <div className="pj-nav">
        <div className="pj-abas mono" role="tablist" aria-label="Demonstrações">
          {itens.map((it, k) => (
            <button key={it.id} ref={(el) => { abas.current[k] = el; }} id={`pj-aba-${k}`} type="button" role="tab" className="pj-aba" aria-selected={k === ativo} aria-controls={`pj-painel-${k}`}
              tabIndex={k === ativo ? 0 : -1} onClick={() => ir(k)} onKeyDown={(e) => tecla(e, k)}>
              {it.id} <span className="pj-aba-nome">{it.curto}</span><span className="sr-only">: {it.title}</span>
            </button>
          ))}
          {/* progresso: a linha de cota dividida em 3, com o trecho ativo preenchido */}
          <span className="pj-prog" aria-hidden="true"><span style={{ "--k": ativo } as React.CSSProperties} /></span>
        </div>
        <div className="pj-ctrl">
          <span className="pj-cont mono" aria-hidden="true">{ativo + 1} de {n}</span>
          <button type="button" className="pj-seta" aria-label="Projeto anterior" onClick={() => ir(ativo - 1)}>
            <svg viewBox="0 0 32 12" aria-hidden="true"><path d="M31 6H2M6 2L2 6l4 4M31 2v8" /></svg>
          </button>
          <button type="button" className="pj-seta" aria-label="Próximo projeto" onClick={() => ir(ativo + 1)}>
            <svg viewBox="0 0 32 12" aria-hidden="true"><path d="M1 6h29M26 2l4 4-4 4M1 2v8" /></svg>
          </button>
        </div>
      </div>
      {children}
      {/* Celular e tablet: o nome da folha seguinte, sempre visível, logo abaixo da moldura. Repete o "Próximo
          projeto", então fica fora do Tab e do leitor de tela. */}
      <button type="button" className="pj-prox mono" tabIndex={-1} aria-hidden="true" onClick={() => ir(ativo + 1)}>Próximo: {prox.title} →</button>
      {/* dica de deslizar, sobre a captura (nunca sobre o texto) */}
      <span className={`pj-dica mono${dica ? " on" : ""}`} aria-hidden="true">deslize para o lado <span className="pj-dica-m">←→</span></span>
    </div>
  );
}
