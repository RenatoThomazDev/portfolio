"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/* Projetos da home na variação "lista com prévia" (lista.css). Variações anteriores guardadas para comparar:
   abas + molduras empilhadas (Pilha.tsx / pilha.css) e destaque + 2 menores (Destaque.tsx / destaque.css). Para
   trocar, mude o import e o JSX em Projects.tsx (as três recebem as mesmas props).
   Desktop (≥ 1024px, com JS): à esquerda a <ol> de links para /projetos/[slug]; passar o mouse ou focar um item
   ativa a prévia (a moldura grande à direita, fixa enquanto a lista está na tela) e o resumo com os botões abaixo
   da lista. Tirar o mouse não volta para o primeiro. Cada .project tem data-pos: "0" é o ativo.
   Abaixo de 1024px, e sem JS em qualquer largura, a lista não aparece: os três projetos ficam completos, empilhados.
   A prévia é aria-hidden (o mesmo conteúdo está nos links e na página do projeto); o resumo do ativo é anunciado
   por uma região aria-live. public/folha.js também mexe no data-pos (na volta da demo) e avisa com "pilha-ativar".
   Sem autoplay. */
type Item = { id: string; title: string; kind: string; slug: string; resultado: string };
type Folha = { prefetch?: (el: Element) => void };

export default function Lista({ itens, cabecalho, children }: { itens: Item[]; cabecalho: React.ReactNode; children: React.ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [anuncio, setAnuncio] = useState("");
  const montou = useRef(false);
  const projetos = () => [...(raiz.current?.querySelectorAll<HTMLElement>(".projects > .project") ?? [])];

  // Layout effect (não useEffect): o aviso da folha pode chegar logo depois da hidratação, e um useEffect ainda não
  // estaria ouvindo (medido: a volta deixava o projeto certo na prévia e o 02.1 marcado na lista).
  useLayoutEffect(() => {
    // só o aviso deste bloco (na página de comparação há duas variações na mesma página); vindo da janela, vale
    const ativar = (e: Event) => { if (e.target instanceof Node && !raiz.current?.contains(e.target)) return; setAtivo((e as CustomEvent<number>).detail); };
    addEventListener("pilha-ativar", ativar);
    return () => removeEventListener("pilha-ativar", ativar);
  }, []);

  useLayoutEffect(() => {
    // primeira vez: a folha pode já ter ativado outro projeto (volta da demo, antes da hidratação); lê do DOM antes
    if (!montou.current) {
      montou.current = true;
      const k = projetos().findIndex((p) => p.dataset.pos === "0");
      if (k > 0 && k !== ativo) { setAtivo(k); return; }
    } else {
      setAnuncio(`${itens[ativo].title}: ${itens[ativo].resultado}`);
    }
    // inert só no desktop, onde os inativos ficam escondidos; abaixo de 1024px os três blocos estão inteiros
    const desk = matchMedia("(min-width: 1024px)").matches;
    projetos().forEach((p, i) => {
      const frente = i === ativo;
      p.dataset.pos = frente ? "0" : "1";
      const fig = p.querySelector<HTMLElement>(".p-frame"), corpo = p.querySelector<HTMLElement>(".p-body");
      if (fig) fig.setAttribute("aria-hidden", "true");
      if (corpo) corpo.inert = desk && !frente;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itens não muda
  }, [ativo]);

  // ao cruzar os 1024px, o inert dos blocos muda junto
  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px)");
    const mudou = () => projetos().forEach((p) => { const c = p.querySelector<HTMLElement>(".p-body"); if (c) c.inert = mq.matches && p.dataset.pos !== "0"; });
    mq.addEventListener("change", mudou);
    return () => mq.removeEventListener("change", mudou);
  }, []);

  // ativa a prévia e já faz o prefetch da demo daquele projeto (public/folha.js)
  const ver = (k: number) => {
    setAtivo(k);
    const p = projetos()[k], f = (window as unknown as { folha?: Folha }).folha;
    if (p && f?.prefetch) f.prefetch(p);
  };

  return (
    <div ref={raiz} className="ls">
      {cabecalho}
      <ol className="ls-lista" aria-label="Projetos">
        {itens.map((it, k) => (
          <li key={it.id}>
            <a className="ls-item" href={`/projetos/${it.slug}`} data-ativo={k === ativo || undefined}
              onPointerEnter={(e) => { if (e.pointerType === "mouse") ver(k); }} onFocus={() => ver(k)}>
              <span className="ls-num mono">{it.id}</span>
              <span className="ls-tit">{it.title}</span>
              <span className="ls-tipo mono">{it.kind}</span>
              <svg className="ls-seta" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2.5 8h10.5M9 4l4 4-4 4" /></svg>
            </a>
          </li>
        ))}
      </ol>
      {children}
      <p className="sr-only" aria-live="polite">{anuncio}</p>
    </div>
  );
}
