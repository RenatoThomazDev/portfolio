import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Pagina, { Bloco, Seta } from "../../components/Pagina";
import Prancha from "../../components/Prancha";
import FolhaLink from "../../components/FolhaLink";
import { PROJETOS, projeto, servico } from "../../../config/paginas";
import { SITE_URL } from "../../../config/contato";

export const dynamicParams = false;
export const generateStaticParams = () => PROJETOS.map((p) => ({ slug: p.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = projeto((await params).slug);
  if (!p) return {};
  const url = `/projetos/${p.slug}`;
  return {
    title: p.seoTitulo,
    description: p.descricao,
    alternates: { canonical: url },
    openGraph: { type: "article", title: p.seoTitulo, description: p.descricao, url, images: [{ url: p.img, width: 1920, height: 1200, alt: `${p.title}, tela inicial da demonstração` }] },
  };
}

export default async function ProjetoPage({ params }: Props) {
  const p = projeto((await params).slug);
  if (!p) notFound();
  const s = servico(p.servico)!;
  const jsonLd = {
    "@type": "CreativeWork", name: p.seoTitulo, description: p.descricao, url: `${SITE_URL}/projetos/${p.slug}`,
    image: `${SITE_URL}${p.img}`, inLanguage: "pt-BR", keywords: p.tags.join(", "), author: { "@id": `${SITE_URL}/#renato` },
  };
  const caso = [["A", "Problema", p.problema], ["B", "O que fiz", p.feito], ["C", "Resultado", p.resultado]];
  return (
    <Pagina
      folha={`Folha ${p.id}`} atual={`/projetos/${p.slug}`} demo={p.slug}
      trilha={[{ nome: "Projetos", href: "/#projetos" }, { nome: p.title }]} jsonLd={jsonLd}
      carimbo={{ folha: p.id, titulo: p.title }}
      cabecalho={<>
        <span className="mono">Folha {p.id} / Projeto</span>
        {/* h1 curto (o nome do projeto); o título longo, para a busca, fica no <title> */}
        <h1>{p.title}</h1>
        <p className="pg-lead">{p.descricao}</p>
      </>}
      lateral={<>
        <dl className="pg-ficha">
          <div><dt className="mono">Tipo</dt><dd>{p.kind}</dd></div>
          <div><dt className="mono">Tecnologias</dt><dd><ul className="p-tags mono">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul></dd></div>
        </dl>
        <p className="pg-nota">É uma demonstração: os dados são de exemplo.</p>
        <div className="pg-acoes">
          {/* .p-link: o link que public/folha.js usa no prefetch da demo */}
          <FolhaLink className="btn btn-primary p-link" href={p.href}>Abrir demonstração</FolhaLink>
          <a className="btn btn-secondary" href="#contato">Quero algo assim</a>
        </div>
      </>}
    >
      <Prancha p={p} demo sizes="(min-width: 1024px) 60vw, 100vw" />

      <Bloco n={`${p.id}-A`} id="caso-t" titulo="O caso">
        <ol className="steps pg-caso">
          {caso.map(([n, t, d]) => (
            <li key={n} className="step">
              <span className="step-n mono" aria-hidden="true">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
      </Bloco>

      <Bloco n={`${p.id}-B`} id="mostra-t" titulo="O que a demonstração mostra">
        <ul className="pg-lista">{p.mostra.map((m) => <li key={m}>{m}</li>)}</ul>
      </Bloco>

      <Bloco n={`${p.id}-C`} id="servico-t" titulo="Para o seu negócio">
        <p>{s.intro}</p>
        <div className="pg-ligado">
          <a className="link p-link" href={`/servicos/${s.slug}`}>Ver o serviço: {s.nome} <Seta /></a>
        </div>
      </Bloco>
    </Pagina>
  );
}
