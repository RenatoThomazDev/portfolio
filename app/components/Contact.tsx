import Split from "./Split";
import ContactForm from "./ContactForm";
import { CONTATO, WHATSAPP_URL } from "../../config/contato";
import { SERVICOS } from "../../config/paginas";

/* Folha 04: duas colunas na malha de 12 (5 + 7) a partir de 1024px. À esquerda, título, apoio e canais diretos; à
   direita, o bloco do formulário. A ordem do DOM é a do celular: título, formulário, canais (sections.css, "Folha 04"). */

const Icone = ({ d }: { d: string }) => (
  <svg className="cn-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICONES = {
  // balão de conversa, envelope, "in" num quadrado, sinais de código: desenhos genéricos, sem logotipo de marca
  whatsapp: "M4 16l1.1-3.2A6.5 6.5 0 1 1 7.6 15L4 16Z",
  email: "M3 5.5h14v9H3zM3.5 6l6.5 5 6.5-5",
  linkedin: "M3.5 3.5h13v13h-13zM7 9v4.5M7 6.6v.1M10 13.5V9m0 2.2c0-1.4 1-2.2 2-2.2s1.8.7 1.8 2v2.5",
  github: "M7 6L3 10l4 4M13 6l4 4-4 4M11 4.5l-2 11",
};

// WhatsApp: wa.me/5511937792105 com a mensagem inicial já preenchida (MENSAGEM_WHATSAPP, config/contato.ts).
const CANAIS = [
  { nome: "WhatsApp", valor: CONTATO.whatsappTexto, href: WHATSAPP_URL, ext: true, ico: ICONES.whatsapp },
  { nome: "E-mail", valor: CONTATO.email, href: `mailto:${CONTATO.email}`, ext: false, ico: ICONES.email },
  { nome: "LinkedIn", valor: CONTATO.linkedinTexto, href: CONTATO.linkedinUrl, ext: true, ico: ICONES.linkedin },
  { nome: "GitHub", valor: CONTATO.github, href: `https://github.com/${CONTATO.github}`, ext: true, ico: ICONES.github },
];

export default function Contact() {
  return (
    <>
      <section id="contato" className="sec wrap grid12 ct" aria-labelledby="contato-t">
        <div className="sec-head ct-head" data-reveal>
          <span className="mono">Folha 04 / Contato</span>
          <h2 id="contato-t" className="contact-title"><Split text="Me conte o que você precisa." /></h2>
          <p className="contact-lead">Respondo em até 24h com uma proposta clara.</p>
        </div>

        <div className="ct-bloco" data-reveal>
          <ContactForm />
        </div>

        <nav className="ct-canais" aria-labelledby="ct-canais-t">
          <h3 id="ct-canais-t" className="ct-rot">Canais diretos</h3>
          <ul>
            {CANAIS.map((c) => (
              <li key={c.nome}>
                <a href={c.href} {...(c.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <Icone d={c.ico} />
                  <span className="cn-nome">{c.nome}</span>
                  <span className="cn-valor">{c.valor}</span>
                  <svg className="cn-seta" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                  {c.ext && <span className="sr-only"> (abre em nova aba)</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {/* Faixa final: nome e ano à esquerda; "Voltar ao topo" e o carimbo pequeno à direita. */}
      <footer className="site-footer wrap" data-reveal>
        <p className="foot-nome">Renato Thomaz <span className="mono">{new Date().getFullYear()}</span></p>
        {/* Links para as páginas de serviço: a home também aponta para elas (busca e quem quer ler mais). */}
        <nav className="foot-servicos" aria-label="Serviços">
          {SERVICOS.map((s) => <a key={s.slug} className="link" href={`/servicos/${s.slug}`}>{s.nome}</a>)}
        </nav>
        <div className="foot-dir">
          <a href="#topo" className="link foot-top">Voltar ao topo <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4" /></svg></a>
          {/* Carimbo: bate no papel quando o fim da página entra na tela (vida.css); a tinta irregular vem do filtro
              #carimbo (layout.tsx). Sem animação, aparece batido. */}
          <div className="carimbo-final" data-reveal role="img" aria-label="Carimbo: folha 04 de 04, revisado">
            <svg viewBox="0 0 220 84" aria-hidden="true">
              <g filter="url(#carimbo)">
                <rect x="3" y="3" width="214" height="78" rx="6" /><rect x="9" y="9" width="202" height="66" rx="3" className="fino" />
                <text x="110" y="38" textAnchor="middle" className="c1">FOLHA 04/04</text>
                <path d="M24 48H196" className="fino" />
                <text x="110" y="66" textAnchor="middle" className="c2">REVISADO</text>
              </g>
            </svg>
          </div>
        </div>
      </footer>
    </>
  );
}
