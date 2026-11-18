import Split from "./Split";
import SecN from "./SecN";
// Também nas páginas de serviço (app/servicos/[slug]).
export const STEPS = [
  { t: "Conversa", d: "Você me conta o problema. Pergunto até entender como o seu dia a dia funciona." },
  { t: "Proposta", d: "Envio escopo, prazo e valor por escrito antes de começar." },
  { t: "Entregas parciais", d: "Você acompanha o projeto por um link e pede ajustes ao longo do caminho." },
  { t: "Publicação", d: "Coloco no ar, explico como usar e fico disponível para dúvidas depois da entrega." },
];

import Image from "next/image";
import Tape from "./Tape";
import foto from "../../public/renato.jpg";

// As 5 principais, na ordem do dia a dia.
const TOOLS = ["PHP", "Laravel", "JavaScript", "SQL Server", "Docker"];


export default function About() {
  return (
    <section id="sobre" className="sec wrap grid12" aria-labelledby="sobre-t">
      <div className="sec-head" data-reveal>
          <SecN n="03" />
        <span className="mono">Folha 03 / Sobre</span>
        <h2 id="sobre-t"><Split text="Começo pelo seu problema, não pelo código" /></h2>
      </div>

      {/* Foto colada no caderno: cai no papel e recebe as fitas ao ficar visível (Colar.tsx, mesma animação dos projetos).
          Import estático: largura e altura reais (816x1020, 4:5) vão para o <img>, sem CLS; o Next serve AVIF/WebP
          (JPG para quem não aceita) nas larguras do srcset, até o tamanho do original. */}
      {/* A legenda fica dentro da margem inferior da impressão (como foto revelada): por isso o <figure> é a própria
          moldura, e a legenda cai e gira junto com a foto. */}
      <div className="about-photo" data-colar>
        <div className="ap-wrap" data-cotas>
          <span className="p-sombra" aria-hidden="true" />
          <figure className="frame">
            <Image src={foto} alt="Renato Thomaz, desenvolvedor full stack" quality={75} loading="lazy"
              sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 80vw" />
            <figcaption className="mono">Renato Thomaz</figcaption>
          </figure>
          <Tape side="a" />
          <Tape side="b" />
        </div>
      </div>

      <div className="about-text" data-reveal>
        <p className="about-lead">
          Sou Renato, desenvolvedor Full Stack com foco em PHP e Laravel.
        </p>
        <p>
          Há cerca de dois anos trabalho no ERP de uma empresa do setor industrial, um sistema usado todos os dias por
          vendas, oficina, financeiro e estoque. Nesse trabalho aprendi que código bom é o que resolve o problema de quem usa.
        </p>
        <p>
          Por isso começo entendendo o seu negócio, combino o prazo por escrito e mantenho você informado do andamento.
        </p>
      </div>

      <aside className="about-tools" data-reveal aria-label="Ferramentas que uso">
        <span className="mono">Ferramentas</span>
        <ul className="p-tags mono">{TOOLS.map((t) => <li key={t}>{t}</li>)}</ul>
      </aside>

      <div className="steps-head" data-reveal>
        <h3>Como trabalho</h3>
      </div>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s.t} className="step" data-reveal>
            <span className="step-n mono" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <h4>{s.t}</h4>
            <p>{s.d}</p>
          </li>
        ))}
      </ol>
      <dl className="sheet-stamp mono" aria-label="Carimbo da folha">
        <div><dt>folha</dt><dd>03 de 04</dd></div>
        <div><dt>escala</dt><dd>1:1</dd></div>
        <div><dt>revisão</dt><dd>A</dd></div>
      </dl>
    </section>
  );
}
