"use client";
import { useEffect, useRef, useState } from "react";

/* Projetos da home: abas numeradas (02.1 02.2 02.3) e molduras empilhadas em profundidade.
   Cada .project dentro de .projects tem data-pos: 0 é a moldura da frente (e o texto visível), 1 a de trás, 2 a
   escondida atrás dela. O CSS (pilha.css) faz o resto, só com transform e opacity; tudo fica na mesma célula da
   grade, então a altura reservada é a da maior moldura e do maior texto, sem CLS.
   Sem JS (html:not(.js)) as abas não aparecem e os três projetos ficam um embaixo do outro, como antes.
   public/folha.js também mexe no data-pos (na volta da demo, antes de o React hidratar): por isso o projeto ativo é
   lido do DOM na montagem. Sem autoplay. */
type Item = { id: string; title: string };

export default function Pilha({ itens, cabecalho, children }: { itens: Item[]; cabecalho: React.ReactNode; children: React.ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const n = itens.length;
  const projetos = () => [...(raiz.current?.querySelectorAll<HTMLElement>(".projects > .project") ?? [])];

  // Projeto ativo vindo do DOM (a folha pode ter ativado outro antes da hidratação).
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
    // rótulo "Folha 02.n / Projetos" da seção e o contador do cabeçalho (Header.tsx)
    const sub = itens[ativo].id.split(".")[1];
    r.querySelectorAll(".pj-sub").forEach((s) => { s.textContent = "." + sub; });
    (window as unknown as { projetoAtivo?: string }).projetoAtivo = sub;
    dispatchEvent(new CustomEvent("projeto-ativo", { detail: sub }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itens e n não mudam
  }, [ativo]);

  const ir = (k: number, focar = false) => { const i = (k + n) % n; setAtivo(i); if (focar) abas.current[i]?.focus(); };

  // Swipe horizontal na moldura e clique na moldura de trás (ela é inert: o clique passa para o .pj).
  useEffect(() => {
    const r = raiz.current!;
    let x0 = 0, y0 = 0, toque = false;
    const ini = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest(".p-frame")) { toque = false; return; }
      toque = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    };
    const fim = (e: TouchEvent) => {
      if (!toque) return; toque = false;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) setAtivo((a) => (a + (dx < 0 ? 1 : -1) + n) % n);
    };
    const clique = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.project[data-pos="0"]')) return;
      const tras = r.querySelector<HTMLElement>('.project[data-pos="1"] > .p-frame');
      const q = tras?.getBoundingClientRect();
      if (q && e.clientX >= q.left && e.clientX <= q.right && e.clientY >= q.top && e.clientY <= q.bottom) setAtivo((a) => (a + 1) % n);
    };
    r.addEventListener("touchstart", ini, { passive: true });
    r.addEventListener("touchend", fim, { passive: true });
    r.addEventListener("click", clique);
    return () => { r.removeEventListener("touchstart", ini); r.removeEventListener("touchend", fim); r.removeEventListener("click", clique); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liga uma vez
  }, []);

  const tecla = (e: React.KeyboardEvent, k: number) => {
    const m: Record<string, number> = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: n - 1 };
    if (!(e.key in m)) return;
    e.preventDefault(); ir(m[e.key], true);
  };

  return (
    <div ref={raiz} className="pj">
      {cabecalho}
      <div className="pj-abas mono" role="tablist" aria-label="Demonstrações">
        {itens.map((it, k) => (
          <button key={it.id} ref={(el) => { abas.current[k] = el; }} id={`pj-aba-${k}`} type="button" role="tab" className="pj-aba" aria-selected={k === ativo} aria-controls={`pj-painel-${k}`}
            tabIndex={k === ativo ? 0 : -1} onClick={() => ir(k)} onKeyDown={(e) => tecla(e, k)}>
            {it.id}<span className="sr-only">: {it.title}</span>
          </button>
        ))}
        <span className="pj-traco" aria-hidden="true" style={{ "--k": ativo } as React.CSSProperties} />
      </div>
      {children}
    </div>
  );
}
