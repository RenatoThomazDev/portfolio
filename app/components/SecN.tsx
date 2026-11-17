/* Número grande da folha. O texto em contorno (HTML) é o que aparece sem JS; com .js-reveal ele fica invisível e
   uma cópia em SVG, na mesma posição, se desenha pelo contorno (stroke-dashoffset) quando o cabeçalho entra na tela.
   .bl marca a linha de base do texto HTML: o script de layout.tsx (e Reveal.tsx) põe o "y" do SVG nela. */
export default function SecN({ n }: { n: string }) {
  return (
    <span className="sec-n" aria-hidden="true">
      {n}
      <span className="bl" />
      <svg className="sec-n-svg"><text x="100%" textAnchor="end">{n}</text></svg>
    </span>
  );
}
