import Link from "next/link";
import Header from "./Header";
import Contact from "./Contact";
import Reveal from "./Reveal";
import { SERVICOS, PROJETOS } from "../../config/paginas";
import { SITE_URL } from "../../config/contato";

/* Moldura comum das páginas de projeto e de serviço, no vocabulário de prancha da home:
   trilha, cabeçalho, lateral (CTA sempre à vista no desktop), corpo em blocos numerados, carimbo de legenda,
   índice das outras folhas e, por fim, a Folha 04 da home (contato e rodapé). Dados estruturados:
   BreadcrumbList + o que a página descreve. */
export type Trilha = { nome: string; href?: string }[];
type Props = {
  folha: string; trilha: Trilha; jsonLd: object; atual: string; demo?: string;
  cabecalho: React.ReactNode; lateral: React.ReactNode; children: React.ReactNode;
  carimbo: { folha: string; titulo: string };
};

// Data da revisão: a do build (as páginas são estáticas e mudam só a cada publicação).
const REVISAO = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date());

export default function Pagina({ folha, trilha, jsonLd, atual, demo, cabecalho, lateral, children, carimbo }: Props) {
  const migalhas = {
    "@type": "BreadcrumbList",
    itemListElement: [{ nome: "Início", href: "/" }, ...trilha].map((t, i) => ({
      "@type": "ListItem", position: i + 1, name: t.nome, ...(t.href ? { item: `${SITE_URL}${t.href}` } : {}),
    })),
  };
  const ld = { "@context": "https://schema.org", "@graph": [migalhas, jsonLd] };
  const grupos = [
    { titulo: "Serviços", itens: SERVICOS.map((s, i) => ({ n: `S.${i + 1}`, nome: s.nome, href: `/servicos/${s.slug}` })) },
    { titulo: "Projetos", itens: PROJETOS.map((p) => ({ n: p.id, nome: p.title, href: `/projetos/${p.slug}` })) },
  ];
  return (
    <>
      <Header sheet={folha} />
      <main id="conteudo">
        {/* data-demo: o bloco que public/folha.js reconhece (prefetch da demo, voo e pouso da folha) */}
        <div id="topo" className="pg wrap grid12" data-demo={demo}>
          <nav className="pg-trilha" aria-label="Você está em">
            <ol>
              <li><Link href="/">Início</Link></li>
              {trilha.map((t) => <li key={t.nome}>{t.href ? <a href={t.href}>{t.nome}</a> : <span aria-current="page">{t.nome}</span>}</li>)}
            </ol>
          </nav>
          <header className="pg-cab">{cabecalho}</header>
          {/* lateral e corpo num bloco só: a lateral fixa (sticky) para no fim do corpo, sem cobrir o carimbo e o índice */}
          <div className={`pg-miolo${demo && atual.startsWith("/projetos/") ? " pg-miolo-proj" : ""}`}>
            <aside className="pg-lado" aria-label="Resumo e contato">{lateral}</aside>
            <div className="pg-corpo">{children}</div>
          </div>

          {/* Legenda de desenho técnico, no canto da folha */}
          <dl className="pg-carimbo mono" aria-label="Carimbo da folha">
            <div><dt>folha</dt><dd>{carimbo.folha}</dd></div>
            <div className="pg-c-titulo"><dt>título</dt><dd>{carimbo.titulo}</dd></div>
            <div><dt>revisão</dt><dd><time dateTime={REVISAO.split("/").reverse().join("-")}>{REVISAO}</time></dd></div>
            <div><dt>desenho</dt><dd>Renato Thomaz</dd></div>
          </dl>

          <nav className="pg-indice" aria-label="Outras folhas">
            {grupos.map((g) => (
              <div key={g.titulo}>
                <h2 className="mono">{g.titulo}</h2>
                <ol>
                  {g.itens.map((it) => (
                    <li key={it.href}>
                      {it.href === atual
                        ? <span className="pg-i-atual" aria-current="page"><span className="mono">{it.n}</span>{it.nome}<span className="pg-i-aqui mono">esta folha</span></span>
                        : <a href={it.href}><span className="mono">{it.n}</span>{it.nome}</a>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </nav>
        </div>
        <Contact />
      </main>
      <Reveal />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}

/* Cabeçalho de bloco numerado (02.1-A, S.2-B...): o número mono acima do título. */
export function Bloco({ n, id, titulo, className, children }: { n: string; id: string; titulo: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`pg-bloco${className ? ` ${className}` : ""}`} aria-labelledby={id}>
      <div className="pg-bh"><span className="mono">{n}</span><h2 id={id}>{titulo}</h2></div>
      {children}
    </section>
  );
}

// Seta para a direita: links internos (a diagonal fica para os que saem do site)
export const Seta = () => (
  <svg className="seta-d" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2.5 8h10.5M9 4l4 4-4 4" /></svg>
);
