/* Fita crepe em SVG: contorno com as pontas rasgadas. FLAT é a fita colada (estado final e o de sem JS);
   a animação em sections.css interpola o "d" a partir da fita arqueada até este. Usada nas miniaturas e na foto do Sobre. */
const FLAT = "M1 4 L10 4 L20 4 L30 4 L40 4 L50 4 L60 4 L70 4 L80 4 L90 4 L99 4 L100 8 L98.5 12 L100 16 L99 20 L90 20 L80 20 L70 20 L60 20 L50 20 L40 20 L30 20 L20 20 L10 20 L1 20 L0 16 L1.8 12 L0.3 8 Z";
export default function Tape({ side }: { side: "a" | "b" }) {
  return (
    <span className={`tape tape-${side}`} aria-hidden="true">
      <span className="t-in">
        <svg className="t-svg" viewBox="0 0 100 24" preserveAspectRatio="none">
          <path className="t-sh" d={FLAT} />
          <path className="t-f" d={FLAT} />
          <path className="t-cl" d={FLAT} />
        </svg>
      </span>
    </span>
  );
}
