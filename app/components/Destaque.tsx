"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";

/* Projetos da home no layout "destaque + 2 menores" (destaque.css). Variação em teste: o carrossel anterior (abas +
   molduras empilhadas) continua em Pilha.tsx / pilha.css; para voltar, troque Destaque por Pilha em Projects.tsx.
   Cada .project dentro de .projects tem data-pos: "0" é o destaque (moldura grande + texto), "1" os outros, que
   ficam escondidos ali e aparecem na lateral como cards menores (os botões abaixo). As três molduras ocupam a mesma
   célula da grade, e os três textos também: a altura do bloco é a do maior e não muda na troca (sem CLS).
   Troca: View Transitions, com a miniatura do card crescendo até a moldura do destaque (view-transition-name por
   projeto); sem suporte, um fade curto; com movimento reduzido, instantânea. Depois da troca o foco vai para o
   título do novo destaque e uma região aria-live anuncia só esse título.
   Sem JS (html:not(.js)) os cards não aparecem e os três projetos ficam completos, em sequência.
   public/folha.js também mexe no data-pos (na volta da demo, sem animação) e avisa com o evento "pilha-ativar". */
type Item = { id: string; title: string; kind: string; img: string };

export default function Destaque({ itens, cabecalho, children }: { itens: Item[]; cabecalho: React.ReactNode; children: React.ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [anuncio, setAnuncio] = useState("");
  const focar = useRef(false);
  const projetos = () => [...(raiz.current?.querySelectorAll<HTMLElement>(".projects > .project") ?? [])];

  useEffect(() => {
    const k = projetos().findIndex((p) => p.dataset.pos === "0");
    if (k > 0) setAtivo(k);
    const ativar = (e: Event) => setAtivo((e as CustomEvent<number>).detail);
    addEventListener("pilha-ativar", ativar);
    return () => removeEventListener("pilha-ativar", ativar);
  }, []);

  // layout effect: precisa valer dentro do flushSync da View Transition, antes do "depois" ser capturado
  const lido = useRef(false);
  useLayoutEffect(() => {
    const r = raiz.current!;
    // primeira vez: a folha pode já ter posto outro projeto no destaque (volta da demo, antes da hidratação); lê
    // do DOM antes de escrever, senão este efeito desfaria a troca
    if (!lido.current) {
      lido.current = true;
      const k = projetos().findIndex((p) => p.dataset.pos === "0");
      if (k > 0 && k !== ativo) { setAtivo(k); return; }
    }
    // a região do destaque (alvo do aria-controls dos cards) e o título focável depois da troca
    const reg = r.querySelector<HTMLElement>(".projects");
    if (reg) { reg.id = "dq-destaque"; reg.setAttribute("role", "region"); reg.setAttribute("aria-label", "Projeto em destaque"); }
    projetos().forEach((p, i) => {
      const frente = i === ativo;
      p.querySelector<HTMLElement>("h3")?.setAttribute("tabindex", "-1");
      p.dataset.pos = frente ? "0" : "1";
      const fig = p.querySelector<HTMLElement>(".p-frame"), corpo = p.querySelector<HTMLElement>(".p-body");
      if (fig) { fig.inert = !frente; fig.toggleAttribute("aria-hidden", !frente); }
      if (corpo) corpo.inert = !frente;
    });
    r.querySelectorAll(".pj-sub").forEach((s) => { s.textContent = "." + itens[ativo].id.split(".")[1]; });
    if (focar.current) {
      focar.current = false;
      r.querySelector<HTMLElement>('.project[data-pos="0"] h3')?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itens não muda
  }, [ativo]);

  const trocar = (k: number) => {
    const r = raiz.current!;
    const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const aplicar = () => { focar.current = true; setAtivo(k); setAnuncio(itens[k].title); };
    const doc = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
    if (!reduzido && doc.startViewTransition) {
      r.classList.add("dq-vt"); // a View Transition já faz o cruzamento: sem o fade do CSS por cima
      doc.startViewTransition(() => flushSync(aplicar)).finished.finally(() => r.classList.remove("dq-vt"));
    } else {
      aplicar();
    }
    // celular: a página sobe até o topo do bloco, para o novo destaque aparecer
    if (innerWidth < 768) {
      const topo = r.querySelector<HTMLElement>(".dq-alvo");
      const q = topo?.getBoundingClientRect();
      if (q && q.top < 64) scrollTo({ top: scrollY + q.top - 72, behavior: reduzido ? "instant" : "smooth" });
    }
  };

  return (
    <div ref={raiz} className="dq">
      {cabecalho}
      {/* âncora do topo do destaque (para a rolagem no celular) */}
      <span className="dq-alvo" aria-hidden="true" />
      {children}
      <ul className="dq-lado" aria-label="Outros projetos">
        {itens.map((it, k) => (
          <li key={it.id} hidden={k === ativo} className="dq-item">
            <button type="button" className="dq-card" aria-controls="dq-destaque" aria-label={`Ver em destaque: ${it.title}`} onClick={() => trocar(k)}
              style={{ "--vt": `dq-${it.id.replace(".", "-")}` } as React.CSSProperties}>
              <span className="dq-mini" aria-hidden="true">
                <Image className="img-l" src={it.img.replace(".png", "-recorte.png")} alt="" width={1600} height={1000} sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 112px" />
                <Image className="img-d" src={it.img.replace(".png", "-recorte-escuro.png")} alt="" width={1600} height={1000} sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 112px" />
              </span>
              <span className="dq-txt">
                <span className="dq-num mono" aria-hidden="true">{it.id}</span>
                <span className="dq-tit">{it.title}</span>
                <span className="dq-tipo mono" aria-hidden="true">{it.kind}</span>
                <span className="dq-ver mono" aria-hidden="true">Ver em destaque →</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">{anuncio}</p>
    </div>
  );
}
