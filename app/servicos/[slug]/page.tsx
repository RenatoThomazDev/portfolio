import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Pagina, { Seta } from "../../components/Pagina";
import { STEPS } from "../../components/About";
import { SERVICOS, servico, projeto } from "../../../config/paginas";
import { SITE_URL, WHATSAPP_URL } from "../../../config/contato";

export const dynamicParams = false;
export const generateStaticParams = () => SERVICOS.map((s) => ({ slug: s.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = servico((await params).slug);
  if (!s) return {};
  const url = `/servicos/${s.slug}`;
  return {
    title: s.seoTitulo,
    description: s.descricao,
    alternates: { canonical: url },
    openGraph: { title: s.seoTitulo, description: s.descricao, url },
  };
}

export default async function ServicoPage({ params }: Props) {
  const s = servico((await params).slug);
  if (!s) notFound();
  const p = projeto(s.projeto)!;
  const jsonLd = {
    "@type": "Service", name: s.seoTitulo, description: s.descricao, url: `${SITE_URL}/servicos/${s.slug}`,
    serviceType: s.nome, areaServed: { "@type": "Country", name: "Brasil" }, inLanguage: "pt-BR",
    provider: { "@id": `${SITE_URL}/#renato` },
  };
  return (
    <Pagina folha="Serviço" trilha={[{ nome: "Serviços" }, { nome: s.nome }]} jsonLd={jsonLd}>
      <header className="pg-cab">
        <span className="mono">Serviço / {s.nome}</span>
        <h1>{s.titulo}</h1>
        <p className="pg-lead">{s.intro}</p>
        <div className="pg-acoes">
          <Link className="btn btn-primary" href="/#contato">Pedir orçamento</Link>
          <a className="btn btn-secondary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp<span className="sr-only"> (abre em nova aba)</span></a>
        </div>
      </header>

      <section className="pg-bloco pg-texto" aria-labelledby="quem-t">
        <h2 id="quem-t">Para quem é</h2>
        <ul className="pg-lista">{s.paraQuem.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>

      <section className="pg-bloco pg-texto" aria-labelledby="entra-t">
        <h2 id="entra-t">O que pode entrar</h2>
        <ul className="pg-lista">{s.entra.map((t) => <li key={t}>{t}</li>)}</ul>
        {s.experiencia && <p>{s.experiencia}</p>}
      </section>

      <section className="pg-bloco pg-texto" aria-labelledby="exemplo-t">
        <h2 id="exemplo-t">Um exemplo para testar</h2>
        <p><strong>{p.title}.</strong> {p.problema} {p.feito}</p>
        <div className="pg-ligado">
          <a className="link p-link" href={p.href}>Abrir demonstração <Seta /></a>
          <a className="link p-link" href={`/projetos/${p.slug}`}>Ver detalhes do projeto <Seta /></a>
        </div>
      </section>

      <section className="pg-bloco" aria-labelledby="como-t">
        <h2 id="como-t">Como trabalho</h2>
        <ol className="steps">
          {STEPS.map((st, i) => (
            <li key={st.t} className="step">
              <span className="step-n mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3>{st.t}</h3>
              <p>{st.d}</p>
            </li>
          ))}
        </ol>
      </section>
    </Pagina>
  );
}
