import Header from "./components/Header";
import Hero from "./components/Hero";
import Projects, { type Variante } from "./components/Projects";
import About from "./components/About";
import Contact from "./components/Contact";
import Reveal from "./components/Reveal";
import Thread from "./components/Thread";

const VARIANTES: Variante[] = ["grade", "lista", "carrossel"];

/* ?projetos=lista|carrossel|grade troca o layout da seção Projetos, só em desenvolvimento (next dev), para comparar
   as candidatas. No build de produção a condição é falsa: os searchParams nem são lidos, a página continua estática
   e sempre com a grade; o parâmetro não chega ao canonical nem ao sitemap (que não dependem dele). */
export default async function Home({ searchParams }: { searchParams: Promise<{ projetos?: string }> }) {
  let variante: Variante = "grade";
  if (process.env.NODE_ENV === "development") {
    const v = (await searchParams).projetos as Variante | undefined;
    if (v && VARIANTES.includes(v)) variante = v;
  }
  return (
    <>
      <Header />
      <main id="conteudo">
        <Hero />
        <Projects variante={variante} />
        <About />
        <Contact />
      </main>
      <Reveal />
      <Thread />
    </>
  );
}
