import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../components/Header";
import Projects from "../components/Projects";
import Reveal from "../components/Reveal";
import "./comparar.css";

/* Só em desenvolvimento: as duas candidatas da seção Projetos, uma embaixo da outra, para comparar. Cada uma
   funciona sozinha (ids com sufixo -a/-b em Projects.tsx; a folha guarda o bloco de origem em public/folha.js).
   No build de produção a página não existe: notFound() na geração, e /comparar-projetos responde 404. Fica fora
   do sitemap (app/sitemap.ts não a lista) e tem noindex. */
export const metadata: Metadata = {
  title: "Comparar projetos",
  robots: { index: false, follow: false },
};

const BLOCOS = [
  { sufixo: "-a", variante: "lista", rotulo: "Variação A: lista com prévia" },
  { sufixo: "-b", variante: "carrossel", rotulo: "Variação B: carrossel clássico" },
] as const;

export default function CompararProjetos() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <>
      <Header sheet="Folha 02/04" />
      <main id="conteudo" className="cmp">
        {BLOCOS.map((b) => (
          <div key={b.sufixo} className="cmp-bloco">
            <p className="cmp-rot mono wrap"><span>{b.rotulo}</span></p>
            <Projects variante={b.variante} sufixo={b.sufixo} />
          </div>
        ))}
      </main>
      <Reveal />
    </>
  );
}
