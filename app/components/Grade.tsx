/* Projetos da home na variação "os 3 lado a lado" (grade.css). Só HTML e CSS: funciona igual sem JS.
   Candidatas guardadas para comparar: lista com prévia (Lista.tsx) e carrossel clássico (Classico.tsx); antigas:
   Pilha.tsx e Destaque.tsx. Em desenvolvimento, ?projetos=lista|carrossel|grade troca a variação (page.tsx).
   A linha de cota passa por cima das três molduras, com a largura total. Recebe as mesmas props das outras
   variações; os itens não são usados aqui. */
export default function Grade({ cabecalho, children }: { itens?: unknown; cabecalho: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="gr">
      {cabecalho}
      <span className="gr-cota mono" aria-hidden="true"><span>3 folhas, 02.1 a 02.3</span></span>
      {children}
    </div>
  );
}
