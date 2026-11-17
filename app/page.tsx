import Header from "./components/Header";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import About from "./components/About";
import Contact from "./components/Contact";
import Reveal from "./components/Reveal";
import Thread from "./components/Thread";

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo">
        <Hero />
        <Projects />
        <About />
        <Contact />
      </main>
      <Reveal />
      <Thread />
    </>
  );
}
