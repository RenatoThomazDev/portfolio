import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SmoothScroll from "./components/SmoothScroll";
import Cursor from "./components/Cursor";
import Scribble from "./components/Scribble";
import Vida from "./components/Vida";
import { CONTATO, SITE_URL } from "../config/contato";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
// Geist Mono com "optional" e sem preload: ela está na primeira tela (contador de folha e, nas páginas de projeto e
// serviço, rótulos, cotas e legenda da moldura). Com "swap", a troca da substituta mudava a largura desses textos e
// somava CLS; com preload, ela disputava banda com as fontes do título e a home caía abaixo de 95 no Lighthouse.
// "optional" nunca troca depois de pintar: se não chegou a tempo, a página fica na substituta e a próxima já usa a
// Geist Mono do cache. A substituta é uma mono do sistema (sem a gerada pelo Next, que imita a Arial e não é
// monoespaçada): na primeira visita o texto já sai em mono.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", subsets: ["latin"], display: "optional", preload: false,
  adjustFontFallback: false, fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
});
// Clash Display hospedada no projeto (Fontshare, ITF Free Font License) e pré-carregada:
// chega junto com a primeira pintura. "block" porque o arquivo tem 15 KB e vem do próprio site: em vez de
// mostrar a substituta e trocar (o título mudava de linhas e a página pulava), espera a fonte.
// Instrument Serif itálica: só na expressão "à mão." do título, o traço feito à mão no meio do desenho técnico.
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: "italic", display: "block", preload: true });
const clash = localFont({ src: "./fonts/ClashDisplay-Semibold.woff2", weight: "600", variable: "--font-clash", display: "block", preload: true });

const TITULO = "Renato Thomaz | Sites, sistemas e automações";
const DESCRICAO = "Desenvolvedor Full Stack PHP/Laravel. Landing pages, sistemas sob medida e automações com WhatsApp e planilhas para pequenos negócios.";

export const metadata: Metadata = {
  // SITE_URL vem de NEXT_PUBLIC_SITE_URL (config/contato.ts): defina com o domínio final antes de publicar.
  metadataBase: new URL(SITE_URL),
  title: { default: TITULO, template: "%s | Renato Thomaz" },
  description: DESCRICAO,
  alternates: { canonical: "/" },
  authors: [{ name: "Renato Thomaz" }],
  openGraph: { type: "website", locale: "pt_BR", siteName: "Renato Thomaz", title: TITULO, description: DESCRICAO, url: "/" },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRICAO },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3EBD8" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1814" },
  ],
};

// Dados estruturados: quem é (Person) e o site (WebSite).
const perfis = [CONTATO.linkedinUrl, `https://github.com/${CONTATO.github}`];
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Person", "@id": `${SITE_URL}/#renato`, name: "Renato Thomaz", jobTitle: "Desenvolvedor Full Stack PHP/Laravel", url: SITE_URL, image: `${SITE_URL}/renato.jpg`, email: `mailto:${CONTATO.email}`, telephone: CONTATO.telefoneE164, sameAs: perfis, knowsAbout: ["PHP", "Laravel", "JavaScript", "SQL Server", "Automação de processos"] },
    { "@type": "WebSite", "@id": `${SITE_URL}/#site`, url: SITE_URL, name: "Renato Thomaz", description: DESCRICAO, inLanguage: "pt-BR", author: { "@id": `${SITE_URL}/#renato` } },
  ],
};

// Aplica o tema salvo antes da primeira pintura, para não piscar.
/* .js-reveal liga o estado escondido das revelações ao rolar. Só entra com JS, IntersectionObserver e sem
   movimento reduzido: sem ele (JS desligado, navegador antigo, movimento reduzido) tudo aparece pronto.
   Troca de tema (clique, animação circular, outra aba): public/tema-transicao.js, o mesmo das demonstrações.
   Ida e volta das demonstrações (a folha saindo da prancheta): public/folha.js. */
const themeScript = `(function(){var r=document.documentElement;r.classList.add('js');if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches)r.classList.add('js-reveal');try{var t=localStorage.getItem('tema');if(t)r.dataset.theme=t}catch(e){}})();`;

/* No fim do <body>, antes da primeira pintura: o que já está na tela (ou acima dela, ao abrir com âncora)
   aparece pronto, sem animar nem piscar. Também mede a linha de base dos números grandes de folha (SVG). */
const readyScript = `(function(){var r=document.documentElement;if(!r.classList.contains('js-reveal'))return;
document.querySelectorAll('.sec-n').forEach(function(n){var b=n.querySelector('.bl'),t=n.querySelector('text');if(b&&t)t.setAttribute('y',b.offsetTop)});
var h=innerHeight;document.querySelectorAll('[data-reveal],[data-colar]').forEach(function(e){if(e.getBoundingClientRect().top<h*0.9){if(e.hasAttribute('data-colar'))e.classList.add('colado','ja');else e.classList.add('in','pronto')}})})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable} ${clash.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Botão de tema, animação circular e sincronia entre abas: mesmo arquivo das demonstrações. */}
        <script src="/tema-transicao.js" data-botao="button.theme" data-claro="#F3EBD8" data-escuro="#1A1814" defer />
        {/* Voo da folha entre o portfólio e as demonstrações. Sem defer: na volta, a capa com a cor da demo entra
            antes da primeira pintura. Arquivo pequeno e sem dependências. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- síncrono de propósito (capa antes da pintura) */}
        <script src="/folha.js" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a className="pular" href="#conteudo">Pular para o conteúdo</a>
        <div className="paper-v" aria-hidden="true" />
        <div className="paper-m" aria-hidden="true" />
        {/* Filtros de traço: caneta técnica (variação mínima), carimbo de tinta (borda irregular) e o carimbo final
            (tinta falhada: o ruído recorta pedaços do desenho). */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <filter id="pena" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="4" /><feDisplacementMap in="SourceGraphic" scale="0.9" /></filter>
          <filter id="tinta" x="-2%" y="-10%" width="104%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="9" /><feDisplacementMap in="SourceGraphic" scale="1.4" /></filter>
          <filter id="carimbo" x="-5%" y="-10%" width="110%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.2" result="m" />
            <feComposite in="d" in2="m" operator="in" />
          </filter>
          {/* Fita crepe: trama vertical fina sobre a cor da fita (var --tape, muda com o tema) e o véu claro da parte levantada. */}
          <pattern id="fita-tx" width="4" height="24" patternUnits="userSpaceOnUse">
            <rect width="4" height="24" style={{ fill: "var(--tape)" }} />
            <rect x="3" width="1" height="24" style={{ fill: "var(--tape-fio)" }} />
          </pattern>
          <linearGradient id="fita-claro" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
          </linearGradient>
        </svg>
        <SmoothScroll />
        <Cursor />
        <Scribble />
        <Vida />
        {children}
        <script dangerouslySetInnerHTML={{ __html: readyScript }} suppressHydrationWarning />
      </body>
    </html>
  );
}
