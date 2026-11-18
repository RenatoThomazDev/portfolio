import Link from "next/link";
import Header from "./components/Header";

export const metadata = { title: "Folha não encontrada" };

export default function NotFound() {
  return (
    <>
      <Header sheet="Folha ?/04" />
      <main className="nf wrap grid12">
        <span className="mono nf-sheet">Erro 404 / Folha não encontrada</span>
        <h1 className="nf-title">Essa folha não está no projeto.</h1>
        <p className="nf-lead">O endereço pode ter mudado ou ter sido digitado com um erro. A página inicial tem os projetos e todos os contatos.</p>
        <div className="nf-ctas">
          <Link href="/" className="btn btn-primary">Voltar para o início</Link>
          <Link href="/#contato" className="btn btn-secondary">Falar comigo</Link>
        </div>
        <svg className="nf-dim" viewBox="0 0 400 40" aria-hidden="true">
          <path d="M0 20H170M230 20H400M0 12V28M400 12V28" />
          <text x="200" y="25" textAnchor="middle">?</text>
        </svg>
      </main>
    </>
  );
}
