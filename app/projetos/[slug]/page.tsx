import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FolhaLink from "../../components/FolhaLink";
import { notFound } from "next/navigation";
import Pagina, { Seta } from "../../components/Pagina";
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
  return (
    <Pagina folha={`Folha ${p.id}`} trilha={[{ nome: "Projetos", href: "/#projetos" }, { nome: p.title }]} jsonLd={jsonLd}>
      {/* data-demo: bloco que public/folha.js reconhece (prefetch da demo e voo da folha a partir da imagem) */}
      <div className="pg-demo" data-demo={p.slug}>
        <header className="pg-cab">
          <span className="mono">Projeto / {p.kind}</span>
          <h1>{p.seoTitulo}</h1>
          <p className="pg-lead">{p.descricao}</p>
          <div className="pg-acoes">
            <FolhaLink className="btn btn-primary p-link" href={p.href}>Abrir demonstração</FolhaLink>
            <Link className="btn btn-secondary" href="/#contato">Quero algo assim</Link>
          </div>
        </header>

        <figure className="pg-fig">
          {/* a imagem repete o botão "Abrir demonstração": fora da ordem do Tab e do leitor de tela */}
          <FolhaLink className="pg-media" href={p.href} tabIndex={-1} aria-hidden="true">
            <Image className="pg-img-l" src={p.img} alt="" width={1920} height={1200} sizes="(min-width: 1024px) 80vw, 100vw" priority />
            <Image className="pg-img-d" src={p.img.replace(".png", "-escuro.png")} alt="" width={1920} height={1200} sizes="(min-width: 1024px) 80vw, 100vw" />
          </FolhaLink>
        </figure>
      </div>

      <section className="pg-bloco pg-texto" aria-labelledby="caso-t">
        <h2 id="caso-t">O caso</h2>
        <dl className="p-caso">
          <div><dt className="mono">Problema</dt><dd>{p.problema}</dd></div>
          <div><dt className="mono">O que fiz</dt><dd>{p.feito}</dd></div>
          <div><dt className="mono">Resultado</dt><dd>{p.resultado}</dd></div>
        </dl>
      </section>

      <section className="pg-bloco pg-texto" aria-labelledby="mostra-t">
        <h2 id="mostra-t">O que a demonstração mostra</h2>
        <ul className="pg-lista">{p.mostra.map((m) => <li key={m}>{m}</li>)}</ul>
        <ul className="p-tags mono" aria-label="Tecnologias">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        <p className="mono">É uma demonstração: os dados são de exemplo.</p>
      </section>

      <section className="pg-bloco pg-texto" aria-labelledby="servico-t">
        <h2 id="servico-t">Para o seu negócio</h2>
        <p>{s.intro}</p>
        <div className="pg-ligado">
          <a className="link p-link" href={`/servicos/${s.slug}`}>Ver o serviço: {s.nome} <Seta /></a>
          <Link className="link p-link" href="/#contato">Pedir orçamento <Seta /></Link>
        </div>
      </section>
    </Pagina>
  );
}
