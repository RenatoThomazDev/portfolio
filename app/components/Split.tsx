/* Título de seção dividido em palavras para o reveal por máscara, linha a linha.
   O texto continua real (lido pelo leitor de tela); sem JS ele aparece pronto.
   .guias: três linhas finas de construção (ascendente, altura-x, base) na primeira linha do título. Elas se desenham
   antes de o título entrar e esmaecem depois (vida.css); sem animação, não aparecem. */
export default function Split({ text }: { text: string }) {
  return (
    <>
      <span className="guias" aria-hidden="true"><i /><i /><i /></span>
      {text.split(" ").map((w, i) => (
        <span key={i}><span className="w"><span>{w}</span></span>{" "}</span>
      ))}
    </>
  );
}
