import Image from "next/image";
import Tape from "./Tape";
import FolhaLink from "./FolhaLink";
import type { Projeto } from "../../config/paginas";

/* A captura da demo na mesma moldura de prancheta da home (.p-frame: cotas, fita, sombra, carimbo da folha e
   legenda), estática: aqui não há a animação de colar ao rolar, a moldura já aparece pronta. É de onde a folha sai
   (public/folha.js procura .p-media dentro do bloco [data-demo]).
   - demo: a imagem abre a demonstração com o voo da folha (página do projeto);
   - senão: a imagem é um link comum para a página do projeto (miniatura na página de serviço).
   ALTURA: altura útil de cada captura (de 1200) a partir de 768px, para o recorte terminar numa borda limpa da tela
   em vez de no meio de um bloco; abaixo de 768px vale o recorte do celular (16:10), o mesmo da home. */
const ALTURA: Record<string, number> = { clinica: 760, orcamentos: 1200, automacao: 1200 };

export default function Prancha({ p, demo, sizes }: { p: Projeto; demo?: boolean; sizes: string }) {
  const h = ALTURA[p.slug] ?? 1200;
  const imagens = (
    <>
      <Image className="img-l" src={p.img} alt="" width={1920} height={1200} sizes={sizes} priority={demo} />
      <Image className="img-d" src={p.img.replace(".png", "-escuro.png")} alt="" width={1920} height={1200} sizes={sizes} />
      <Image className="img-lm" src={p.img.replace(".png", "-recorte.png")} alt="" width={1600} height={1000} sizes="100vw" priority={demo} />
      <Image className="img-dm" src={p.img.replace(".png", "-recorte-escuro.png")} alt="" width={1600} height={1000} sizes="100vw" />
      <span className="p-folha"><span className="mono">Folha {p.id}</span></span>
    </>
  );
  const estilo = { ["--pg-ar" as string]: `1920 / ${h}` };
  return (
    <figure className="p-frame pg-prancha">
      <span className="pf-w mono" aria-hidden="true"><span>1920</span></span>
      <span className="pf-h mono" aria-hidden="true"><span>{h}</span></span>
      <span className="p-sombra" aria-hidden="true" />
      {/* a imagem repete um link do texto ao lado: fora da ordem do Tab e do leitor de tela */}
      {demo
        ? <FolhaLink className="p-media pg-media" href={p.href} tabIndex={-1} aria-hidden="true" style={estilo}>{imagens}</FolhaLink>
        : <a className="p-media pg-media" href={`/projetos/${p.slug}`} tabIndex={-1} aria-hidden="true" style={estilo}>{imagens}</a>}
      <Tape side="a" />
      <Tape side="b" />
      <figcaption className="mono">fig. {p.id}: {p.title.toLowerCase()}, tela inicial da demonstração.</figcaption>
    </figure>
  );
}
