/* Borda de papel rasgado da faixa de projetos (classico.css). Os dois caminhos foram gerados uma vez (pseudoaleatório
   com semente fixa) e ficam fixos aqui: o servidor e o cliente desenham o mesmo, sem diferença na hidratação. Cada
   um tem 480 x 28 e começa e termina na mesma altura, então repete na horizontal sem emenda. O de cima e o de baixo
   são diferentes. O desenho vira máscara (mask-image) de um elemento na cor do papel da página (--paper), e uma
   sombra leve no elemento de fora faz o papel parecer por cima da imagem. */
const TOPO = "M0 0H480V15.4L468.5 19.5L462.3 14L450.2 7L441.3 15.1L435 23.9L426.6 26.7L422.5 6.5L414 16.1L400 22.6L384.3 26.3L368.8 23.7L354.7 11.1L339.7 23.9L326.8 7L316 20.8L311.1 16.5L304.3 19.9L291.3 25.6L283.3 15.4L274 18.6L267.5 21.7L259.3 11.9L246.2 15.2L233.1 24.5L226.6 18.9L219.3 9.7L211.4 23.2L201.6 15.1L189.9 13.3L175.3 24.8L162.2 24.9L153 9.1L142 22.6L135.8 14.7L127.3 25.1L119.5 18.8L111.8 12.3L104.6 22.7L99.6 19.9L94.2 7.9L84.8 8.2L78.6 12.4L65.6 7.7L57.3 21.3L48.3 20L37 15.9L26.6 24.1L22 25.9L6.9 17L0 15.4Z";
const BASE = "M0 28H480V12.6L474.7 7.9L460.2 20.8L452.5 1.4L447.2 1.5L436.2 8.9L429.4 17.7L416.8 9.4L408.9 3.3L394.9 16.3L388 5.6L380.2 12.8L366.1 16.1L353.4 1.4L348.7 7.4L334.1 3.6L328.4 21.7L315.6 19.9L307.4 17.1L297.7 10L282.1 7L277.4 9.9L269.5 18.4L265.2 21.8L254.8 20L243.2 15L233.2 10.1L220.9 18L209.5 19.9L200.3 11.3L191.7 3.2L180.4 9.9L174.3 1L162 21.3L147.9 3.6L141.8 11.6L132.9 10.5L124.1 3.8L119.7 13.7L115.2 6.1L102.3 4.5L91.2 19.3L86.8 19.5L79.1 19.3L68.8 13.5L55.6 15L46.6 15.8L34.3 10.4L20.8 2.5L15.8 7.4L11.7 2.7L7.3 19.7L0 12.6Z";
const url = (d: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 28" preserveAspectRatio="none"><path d="${d}"/></svg>`)}")`;
const MASCARA = { topo: url(TOPO), base: url(BASE) };

export default function Rasgo({ lado }: { lado: "topo" | "base" }) {
  const m = MASCARA[lado];
  return (
    <span className={`rasgo rasgo-${lado}`} aria-hidden="true">
      <i style={{ WebkitMaskImage: m, maskImage: m }} />
    </span>
  );
}
