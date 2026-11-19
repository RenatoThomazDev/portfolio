import Image from "next/image";

/* Fundo de um slide da faixa de projetos: a captura do projeto, desfocada e escurecida (classico.css). Decorativa.
   Sem priority: a seção não está na primeira tela. Só a imagem do tema e da largura aparece; as outras
   (display: none, lazy) não são baixadas. Abaixo de 768px é o recorte do topo com sizes="100vw": o mesmo endereço da
   imagem da moldura (img-lm/img-dm), então no celular o fundo não baixa nada a mais.
   Com JS ele fica na camada de fundos do carrossel inteiro (Classico.tsx); sem JS, dentro de cada slide. */
export default function Fundo({ img, ativo }: { img: string; ativo?: boolean }) {
  return (
    <div className="p-fundo" aria-hidden="true" data-on={ativo || undefined}>
      <Image className="pf-l" src={img} alt="" width={1920} height={1200} sizes="100vw" />
      <Image className="pf-d" src={img.replace(".png", "-escuro.png")} alt="" width={1920} height={1200} sizes="100vw" />
      <Image className="pf-lm" src={img.replace(".png", "-recorte.png")} alt="" width={1600} height={1000} sizes="100vw" />
      <Image className="pf-dm" src={img.replace(".png", "-recorte-escuro.png")} alt="" width={1600} height={1000} sizes="100vw" />
    </div>
  );
}
