"use client";
import { useId, type CSSProperties } from "react";
import { ASC, DESC, UPM, type Frase } from "./escrita-dados";

/* Anotação escrita à mão com caneta: cada letra é o preenchimento real da Instrument Serif, revelado por uma <mask>.
   Dentro da máscara, o esqueleto da letra (a linha central, na ordem e direção da escrita, gerado no build por
   scripts/gerar-escrita.mjs) é um traço branco grosso; a animação de stroke-dashoffset nesse traço faz a letra aparecer
   exatamente por onde a caneta passa. --t é o início do traço em ms, --du a duração (proporcional ao comprimento).
   .e-full cobre a letra inteira no instante em que o último traço termina (pega as pontas de serifa que o esqueleto
   não alcança). Sem animação (sem JS, movimento reduzido) a máscara já está toda aberta: a anotação aparece pronta. */
function Letras({ f }: { f: Frase }) {
  const base = useId().replace(/:/g, "");
  return (
    <>
      {f.letras.map((l, i) => {
        const id = `${base}-${i}`;
        return (
          <g key={i}>
            {/* área da máscara: a frase inteira com folga (as letras ficam em x de 0 até f.w unidades) */}
            <mask id={id} maskUnits="userSpaceOnUse" x={-500} y={-1500} width={f.w + 1000} height={2500}>
              {l.sk.map((s, k) => (
                <path key={k} className="e-sk" d={s.d} pathLength={1} strokeWidth={l.w}
                  style={{ "--t": `${s.t}ms`, "--du": `${s.du}ms` } as CSSProperties} />
              ))}
              <rect className="e-full" x={-500} y={-1500} width={f.w + 1000} height={2500}style={{ "--t": `${l.fim}ms` } as CSSProperties} />
            </mask>
            <path className="e-ti" d={l.d} mask={`url(#${id})`} />
          </g>
        );
      })}
    </>
  );
}

/* Dentro de um SVG existente (diagrama): x, y é a linha de base, size o corpo em unidades do desenho. */
export function EscritaG({ f, x, y, size }: { f: Frase; x: number; y: number; size: number }) {
  return (
    <g className="escrita" transform={`translate(${x} ${y}) scale(${size / UPM})`} aria-hidden="true">
      <Letras f={f} />
    </g>
  );
}

/* Sobre um texto HTML: vem antes do texto real, que continua no lugar (transparente) guardando a largura e a leitura
   para leitores de tela. O SVG é inline e fica na linha de base do próprio texto (vertical-align: -descendente), então
   alinha com qualquer métrica de linha. As margens negativas tiram o SVG do cálculo da linha: não muda a altura nem a
   largura do texto (sem CLS). */
export function EscritaSobre({ f }: { f: Frase }) {
  const w = f.w / UPM, alt = (ASC + DESC) / UPM;
  return (
    <svg className="escrita escrita-sobre" viewBox={`0 ${-ASC} ${f.w} ${ASC + DESC}`} aria-hidden="true"
      style={{ width: `${w}em`, height: `${alt}em`, verticalAlign: `${-DESC / UPM}em`, margin: `-${alt}em -${w}em 0 0` }}>
      <Letras f={f} />
    </svg>
  );
}
