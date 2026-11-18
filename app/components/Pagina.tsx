import Link from "next/link";
import Header from "./Header";
import { SERVICOS, PROJETOS } from "../../config/paginas";
import { SITE_URL } from "../../config/contato";

/* Moldura comum das páginas de projeto e de serviço: cabeçalho do site, trilha (Início / ...), conteúdo, rodapé com
   os links para as outras páginas, e os dados estruturados (BreadcrumbList + o que a página descreve). */
export type Trilha = { nome: string; href?: string }[];

export default function Pagina({ folha, trilha, jsonLd, children }: { folha: string; trilha: Trilha; jsonLd: object; children: React.ReactNode }) {
  const migalhas = {
    "@type": "BreadcrumbList",
    itemListElement: [{ nome: "Início", href: "/" }, ...trilha].map((t, i) => ({
      "@type": "ListItem", position: i + 1, name: t.nome, ...(t.href ? { item: `${SITE_URL}${t.href}` } : {}),
    })),
  };
  const ld = { "@context": "https://schema.org", "@graph": [migalhas, jsonLd] };
  return (
    <>
      <Header sheet={folha} />
      <main id="conteudo" className="pg wrap grid12">
        <nav className="pg-trilha" aria-label="Você está em">
          <ol>
            <li><Link href="/">Início</Link></li>
            {trilha.map((t) => <li key={t.nome}>{t.href ? <a href={t.href}>{t.nome}</a> : <span aria-current="page">{t.nome}</span>}</li>)}
          </ol>
        </nav>
        {children}
        <footer className="pg-rodape">
          <nav aria-label="Serviços">{SERVICOS.map((s) => <a key={s.slug} className="link" href={`/servicos/${s.slug}`}>{s.nome}</a>)}</nav>
          <nav aria-label="Projetos">{PROJETOS.map((p) => <a key={p.slug} className="link" href={`/projetos/${p.slug}`}>{p.title}</a>)}</nav>
        </footer>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}

export const Seta = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" /></svg>
);
