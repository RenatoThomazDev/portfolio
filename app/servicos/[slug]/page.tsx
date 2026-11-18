import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Pagina, { Bloco, Seta } from "../../components/Pagina";
import Prancha from "../../components/Prancha";
import FolhaLink from "../../components/FolhaLink";
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
    // openGraph próprio substitui o da raiz inteiro, inclusive a imagem: repete a imagem de compartilhamento do site
    openGraph: { title: s.seoTitulo, description: s.descricao, url, images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }] },
  };
}

export default async function ServicoPage({ params }: Props) {
  const s = servico((await params).slug);
  if (!s) notFound();
  const p = projeto(s.projeto)!;
  const n = `S.${SERVICOS.indexOf(s) + 1}`;
  const jsonLd = {
    "@type": "Service", name: s.seoTitulo, description: s.descricao, url: `${SITE_URL}/servicos/${s.slug}`,
    serviceType: s.nome, areaServed: { "@type": "Country", name: "Brasil" }, inLanguage: "pt-BR",
    provider: { "@id": `${SITE_URL}/#renato` },
  };
  return (
    <Pagina
      folha={`Folha ${n}`} atual={`/servicos/${s.slug}`} demo={p.slug}
      trilha={[{ nome: "Serviços" }, { nome: s.nome }]} jsonLd={jsonLd}
      carimbo={{ folha: n, titulo: s.nome }}
      cabecalho={<>
        <span className="mono">Folha {n} / Serviço</span>
        <h1>{s.titulo}</h1>
        <p className="pg-lead">{s.intro}</p>
      </>}
      lateral={<>
        <section aria-labelledby="quem-t">
          <h2 id="quem-t" className="mono pg-lado-t">Para quem é</h2>
          <ul className="pg-lista">{s.paraQuem.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
        <section aria-labelledby="exemplo-t">
          <h2 id="exemplo-t" className="mono pg-lado-t">Um exemplo para testar</h2>
          <Prancha p={p} sizes="(min-width: 1024px) 30vw, 100vw" />
          <p><strong>{p.title}.</strong> {p.problema} {p.feito}</p>
          <div className="pg-ligado">
            {/* primeiro .p-link do bloco: o da demo (prefetch em public/folha.js); abre com o voo da folha */}
            <FolhaLink className="link p-link" href={p.href}>Abrir demonstração <Seta /></FolhaLink>
            <a className="link p-link" href={`/projetos/${p.slug}`}>Ver detalhes do projeto <Seta /></a>
          </div>
        </section>
        <div className="pg-acoes">
          <a className="btn btn-primary" href="#contato">Pedir orçamento</a>
          <a className="btn btn-secondary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp<span className="sr-only"> (abre em nova aba)</span></a>
        </div>
      </>}
    >
      <Bloco n={`${n}-A`} id="entra-t" titulo="O que pode entrar">
        <ul className="pg-lista">{s.entra.map((t) => <li key={t}>{t}</li>)}</ul>
        {s.experiencia && <p>{s.experiencia}</p>}
      </Bloco>

      <Bloco n={`${n}-B`} id="como-t" titulo="Como trabalho">
        <ol className="steps">
          {STEPS.map((st, i) => (
            <li key={st.t} className="step">
              <span className="step-n mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <h3>{st.t}</h3>
              <p>{st.d}</p>
            </li>
          ))}
        </ol>
      </Bloco>
    </Pagina>
  );
}
