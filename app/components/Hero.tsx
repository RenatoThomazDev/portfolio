"use client";
import { useEffect, useRef } from "react";
import { EscritaG, EscritaSobre } from "./Escrita";
import aMao from "./escrita/a-mao";
import rodaSozinho from "./escrita/roda-sozinho";

const TITLE = "Automatizo o\u00A0que sua empresa ainda faz à\u00A0mão.";

/* Título com revelação linha por linha. Um script inline no fim do hero mede em que linha
   cada palavra caiu antes da primeira pintura; as animações CSS usam esse valor como atraso, sem esperar o React: assim o título aparece mais cedo (conta para o LCP no mobile). */
const startScript = `(function(){var h=document.querySelector('.hero-title'),l=-1,t=-1e9;h.querySelectorAll('.w').forEach(function(w){if(w.offsetTop>t+4){l++;t=w.offsetTop}w.style.setProperty('--line',l)});var s=h.closest('.hero');if(performance.now()<1500&&document.visibilityState==='visible'){s.classList.add('hero-anim');setTimeout(function(){s.classList.add('hero-fim-t')},700);setTimeout(function(){s.classList.add('hero-fim-d')},2000)}})()`;

function RevealTitle() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // Remede quando a fonte definitiva chega ou a largura muda (só afeta animações futuras).
    const h = ref.current!;
    const measure = () => {
      let line = -1, top = -Infinity;
      h.querySelectorAll<HTMLElement>(".w").forEach((w) => {
        if (w.offsetTop > top + 4) { line++; top = w.offsetTop; }
        w.style.setProperty("--line", String(line));
      });
    };
    document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);
  // Quebras feitas à mão para 1024px ou mais (abaixo disso o texto quebra sozinho).
  const LINES: string[][] = [["Automatizo", "o", "que"], ["sua", "empresa"], ["ainda", "faz"]];
  return (
    <h1 ref={ref} className="hero-title" aria-label={TITLE}>
      {LINES.map((line, li) => (
        <span key={li}>
          {line.map((word) => (
            <span key={word}><span className="w" aria-hidden="true"><span>{word}</span></span>{" "}</span>
          ))}
          {li < 2 && <br className="br-lg" />}
        </span>
      ))}
      <span className="mao">
        {/* "à mão." é escrito letra por letra dentro do tempo do título (começa em 120ms, termina em ~560ms). */}
        <span className="w w-serif" aria-hidden="true"><span className="e-alvo"><EscritaSobre f={aMao} />à{"\u00A0"}mão.</span></span>
        {/* Traço de lápis sob "à mão.": desenhado depois do título, nunca esconde texto. */}
        <svg className="pencil" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
          <path pathLength={1} d="M4 15C46 9 92 17 140 12S236 7 296 13M22 19C80 15 150 20 238 16" />
        </svg>
      </span>
    </h1>
  );
}

const NODES = [
  { t: "Formulário", s: "no seu site" },
  { t: "Planilha", s: "Google Sheets" },
  { t: "WhatsApp", s: "da sua equipe" },
];

function Node({ x, y, w, h, i, end }: { x: number; y: number; w: number; h: number; i: number; end?: boolean }) {
  return (
    <g className={`node r-${i}${end ? " n-end" : ""}`} style={{ ["--i" as string]: i }}>
      <rect x={x} y={y} width={w} height={h} rx="4" />
      {/* contorno que acende quando o pacote chega nesta caixa (vida.css) */}
      {i > 0 && <rect className="recebe" x={x} y={y} width={w} height={h} rx="4" />}
      <text x={x + 20} y={y + h / 2 - 4} className="nt">{NODES[i].t}</text>
      <text x={x + 20} y={y + h / 2 + 18} className="ns">{NODES[i].s}</text>
    </g>
  );
}

/* Cota de desenho técnico: linhas de chamada, traço com marcas a 45 graus e o valor no meio.
   Os valores são as medidas reais do próprio desenho, em unidades do viewBox. */
function DimH({ x1, x2, y, from, label }: { x1: number; x2: number; y: number; from: number; label: string }) {
  return (
    <g className="dim">
      <path pathLength={1} d={`M${x1} ${from}V${y - 6}M${x2} ${from}V${y - 6}`} />
      <path pathLength={1} d={`M${x1} ${y}H${x2}`} />
      <path pathLength={1} d={`M${x1 - 4} ${y + 4}l8 -8M${x2 - 4} ${y + 4}l8 -8`} />
      <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" className="dt">{label}</text>
    </g>
  );
}
function DimV({ y1, y2, x, from, label }: { y1: number; y2: number; x: number; from: number; label: string }) {
  return (
    <g className="dim">
      <path pathLength={1} d={`M${from} ${y1}H${x + 6}M${from} ${y2}H${x + 6}`} />
      <path pathLength={1} d={`M${x} ${y1}V${y2}`} />
      <path pathLength={1} d={`M${x - 4} ${y1 + 4}l8 -8M${x - 4} ${y2 + 4}l8 -8`} />
      <text x={x + 10} y={(y1 + y2) / 2} className="dt" dominantBaseline="middle" transform={`rotate(90 ${x + 10} ${(y1 + y2) / 2})`} textAnchor="middle">{label}</text>
    </g>
  );
}

/* Sobre o diagrama, com mouse, o cursor vira uma mira fina com as coordenadas em unidades do desenho. */
function useCrosshair(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const fig = ref.current!;
    if (!matchMedia("(pointer: fine)").matches) return;
    const ch = fig.querySelector<HTMLElement>(".crosshair")!, lab = ch.querySelector<HTMLElement>(".ch-l")!;
    const move = (e: PointerEvent) => {
      const svg = [...fig.querySelectorAll("svg")].find((s) => s.getBoundingClientRect().width > 0);
      const r = fig.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let ux = x, uy = y;
      const m = svg?.getScreenCTM();
      if (svg && m) { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); ux = p.x; uy = p.y; }
      ch.style.setProperty("--x", `${x}px`); ch.style.setProperty("--y", `${y}px`);
      lab.textContent = `x ${String(Math.round(ux)).padStart(3, "0")}  y ${String(Math.round(uy)).padStart(3, "0")}`;
      ch.classList.add("on"); document.documentElement.classList.add("in-diagram");
    };
    const leave = () => { ch.classList.remove("on"); document.documentElement.classList.remove("in-diagram"); };
    fig.addEventListener("pointermove", move); fig.addEventListener("pointerleave", leave);
    return () => { fig.removeEventListener("pointermove", move); fig.removeEventListener("pointerleave", leave); };
  }, [ref]);
}

function Diagram() {
  const ref = useRef<HTMLElement>(null);
  useCrosshair(ref);
  // Largura real do desenho visível (limitado pela altura da tela): a legenda usa 66% dela e termina antes do fio azul.
  useEffect(() => {
    const fig = ref.current;
    if (!fig) return;
    const ro = new ResizeObserver(() => {
      const svg = [...fig.querySelectorAll("svg")].find((s) => s.getBoundingClientRect().width > 0);
      if (svg) fig.style.setProperty("--dw", `${svg.getBoundingClientRect().width}px`);
    });
    fig.querySelectorAll("svg").forEach((s) => ro.observe(s));
    return () => ro.disconnect();
  }, []);
  return (
    <figure ref={ref} className="diagram" aria-label="Fluxo de um novo contato: do formulário do site para a planilha e para o WhatsApp da equipe">
      {/* Horizontal: 768px ou mais */}
      <svg className="d-h" viewBox="0 0 520 440" aria-hidden="true">
        <DimH x1={8} x2={472} y={40} from={88} label="464" />
        <DimH x1={8} x2={184} y={232} from={192} label="176" />
        <DimV y1={96} y2={384} x={500} from={480} label="288" />
        <Node x={8} y={96} w={176} h={88} i={0} />
        <Node x={296} y={96} w={176} h={88} i={1} />
        <Node x={296} y={296} w={176} h={88} i={2} end />
        <path className="wire" pathLength={1} d="M184 140H288" />
        <path className="wire" pathLength={1} d="M384 184V288" />
        <path className="tip" d="M282 135L292 140L282 145z" />
        <path className="tip" d="M379 282L384 292L389 282z" />
        <text x="240" y="128" textAnchor="middle" className="dt">A</text>
        <text x="396" y="244" className="dt">B</text>
        {/* Linha de chamada: onde o fluxo termina. */}
        <g className="callout"><circle cx="296" cy="352" r="2.5" /><path pathLength={1} d="M296 352H212L196 368" /><text x="192" y="384" textAnchor="end" className="dt">mensagem enviada</text></g>
        {/* Anotação à mão: aponta para o trecho que acontece sem ninguém tocar. */}
        <g className="note"><EscritaG f={rodaSozinho}x={20} y={312} size={22} /><path pathLength={1} className="note-a" d="M206 300C252 296 300 282 370 246M358 244L371 245L365 257" /></g>
        {/* Pontos de luz percorrendo o fluxo em loop lento (só transform e opacity). */}
        <g className="pulse p-a"><circle cx="184" cy="140" r="7" className="halo" /><circle cx="184" cy="140" r="3" /></g>
        <g className="pulse p-b"><circle cx="384" cy="184" r="7" className="halo" /><circle cx="384" cy="184" r="3" /></g>
      </svg>
      {/* Em linha: 960px ou mais em telas baixas, para título e diagrama inteiro caberem na primeira tela. */}
      <svg className="d-w" viewBox="0 0 760 248" aria-hidden="true">
        <DimH x1={8} x2={752} y={24} from={52} label="744" />
        <DimH x1={8} x2={208} y={192} from={156} label="200" />
        <Node x={8} y={56} w={200} h={96} i={0} />
        <Node x={280} y={56} w={200} h={96} i={1} />
        <Node x={552} y={56} w={200} h={96} i={2} end />
        <path className="wire" pathLength={1} d="M208 104H272" />
        <path className="wire" pathLength={1} d="M480 104H544" />
        <path className="tip" d="M266 99L276 104L266 109z" />
        <path className="tip" d="M538 99L548 104L538 109z" />
        <text x="240" y="94" textAnchor="middle" className="dt">A</text>
        <text x="512" y="94" textAnchor="middle" className="dt">B</text>
        <g className="callout"><circle cx="580" cy="152" r="2.5" /><path pathLength={1} d="M580 152V176L564 192H528" /><text x="522" y="196" textAnchor="end" className="dt">mensagem enviada</text></g>
        <g className="note"><EscritaG f={rodaSozinho}x={232} y={238} size={22} /><path pathLength={1} className="note-a" d="M226 230C214 206 222 160 238 118M230 128L238 116L245 128" /></g>
        <g className="pulse pw-a"><circle cx="208" cy="104" r="7" className="halo" /><circle cx="208" cy="104" r="3" /></g>
        <g className="pulse pw-b"><circle cx="480" cy="104" r="7" className="halo" /><circle cx="480" cy="104" r="3" /></g>
      </svg>
      {/* L compacto: 1280px ou mais, ao lado do título. Formulário e Planilha na horizontal, só o WhatsApp desce;
          a proporção (480x276) deixa o desenho inteiro mais baixo que as 3 linhas do título. */}
      <svg className="d-l" viewBox="0 0 480 276" aria-hidden="true">
        <DimH x1={8} x2={472} y={22} from={38} label="464" />
        <Node x={8} y={40} w={176} h={76} i={0} />
        <Node x={296} y={40} w={176} h={76} i={1} />
        <Node x={296} y={196} w={176} h={76} i={2} end />
        <path className="wire" pathLength={1} d="M184 78H288" />
        <path className="wire" pathLength={1} d="M384 116V188" />
        <path className="tip" d="M282 73L292 78L282 83z" />
        <path className="tip" d="M379 182L384 192L389 182z" />
        <text x="240" y="68" textAnchor="middle" className="dt">A</text>
        <text x="396" y="154" dominantBaseline="middle" className="dt">B</text>
        <g className="note"><EscritaG f={rodaSozinho}x={16} y={176} size={22} /><path pathLength={1} className="note-a" d="M196 160C250 150 318 154 372 154M360 148L373 154L360 160" /></g>
        <g className="pulse pl-a"><circle cx="184" cy="78" r="7" className="halo" /><circle cx="184" cy="78" r="3" /></g>
        <g className="pulse pl-b"><circle cx="384" cy="116" r="7" className="halo" /><circle cx="384" cy="116" r="3" /></g>
      </svg>
      {/* Vertical: abaixo de 768px */}
      <svg className="d-v" viewBox="0 0 358 424" aria-hidden="true">
        <DimV y1={8} y2={392} x={20} from={44} label="384" />
        <Node x={52} y={8} w={306} h={80} i={0} />
        <Node x={52} y={160} w={306} h={80} i={1} />
        <Node x={52} y={312} w={306} h={80} i={2} end />
        <path className="wire" pathLength={1} d="M205 88V152" />
        <path className="wire" pathLength={1} d="M205 240V304" />
        <path className="tip" d="M200 146L205 156L210 146z" />
        <path className="tip" d="M200 298L205 308L210 298z" />
        <text x="217" y="126" className="dt">A</text>
        <text x="217" y="278" className="dt">B</text>
        <g className="pulse pv-a"><circle cx="205" cy="88" r="7" className="halo" /><circle cx="205" cy="88" r="3" /></g>
        <g className="pulse pv-b"><circle cx="205" cy="240" r="7" className="halo" /><circle cx="205" cy="240" r="3" /></g>
      </svg>
      <div className="crosshair" aria-hidden="true"><span className="ch-v" /><span className="ch-h" /><span className="ch-l mono" /></div>
      <figcaption className="mono"><span className="cap-mask">fig. 01: fluxo de um novo contato. Cotas em unidades do desenho.</span></figcaption>
    </figure>
  );
}

function Magnetic({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width - 0.5) * 8}px`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height - 0.5) * 8}px`);
    };
    const leave = () => { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); };
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);
  return <a ref={ref} href={href} className={className}>{children}</a>;
}

export default function Hero() {
  return (
    <section id="topo" className="hero wrap grid12">
      <RevealTitle />
      <div className="hero-copy">
                <p className="hero-lead">
          Crio landing pages, sistemas sob medida e automações para pequenos negócios. Menos planilha preenchida à mão,
          menos mensagem esquecida, mais contato virando cliente.
        </p>
        <div className="hero-ctas">
          <Magnetic href="#contato" className="btn btn-primary">
            Pedir orçamento
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2.5 8h10.5M9 4l4 4-4 4" /></svg>
          </Magnetic>
          <Magnetic href="#projetos" className="btn btn-secondary">Ver projetos</Magnetic>
        </div>
      </div>
      <Diagram />
      <dl className="stamp mono" aria-label="Identificação">
        <dt>autor</dt><dd>Renato Thomaz</dd>
        <dt>função</dt><dd>Desenvolvedor Full Stack PHP/Laravel</dd>
        <dt>situação</dt><dd><span className="dot" aria-hidden="true" />Aceitando projetos</dd>
      </dl>
      {/* No fim do hero: quando roda, o hero inteiro já foi lido, e a primeira pintura não sai pela metade. */}
      <script dangerouslySetInnerHTML={{ __html: startScript }} suppressHydrationWarning />
    </section>
  );
}
