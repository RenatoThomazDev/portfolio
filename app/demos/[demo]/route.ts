import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMOS, SITE_URL } from "../../../config/contato";

/* As três demonstrações são páginas HTML independentes (site/demos/*.html), cada uma com identidade própria e sem
   nada do portfólio. Esta rota só as serve em /demos/<nome>, trocando __SITE__ pelo endereço público (canonical e
   Open Graph precisam de URL absoluta). Geradas no build: em produção são arquivos estáticos. */
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => DEMOS.map((demo) => ({ demo }));

/* "Voltar ao portfólio": no HTML é /#projetos (vale sem JS, vindo da home ou abrindo a demo direto). Se a pessoa
   veio de uma página de projeto ou de serviço, o link passa a levar de volta para ela (e a folha pousa na moldura de
   lá, public/folha.js). A origem vem do referrer do mesmo site; sem referrer, do sessionStorage que folha.js grava no
   clique e que a demo consome ao abrir (uma vez: abrir a demo direto depois não herda uma origem antiga). Só aceita
   /projetos/<slug> e /servicos/<slug>. */
// Em desenvolvimento também aceita /comparar-projetos (a página de comparação das variações da home). No build de
// produção o trecho fica vazio e o script da demo sai igual ao de antes.
const COMPARAR = process.env.NODE_ENV === "development" ? "|^\\/comparar-projetos$" : "";
const VOLTA = `<script>(function(){var ok=/^\\/(projetos|servicos)\\/[a-z-]+$${COMPARAR}/,o=null;
try{var r=document.referrer&&new URL(document.referrer);if(r&&r.origin===location.origin)o=r.pathname}catch(e){}
try{if(!document.referrer)o=sessionStorage.getItem('folha-origem');sessionStorage.removeItem('folha-origem')}catch(e){}
if(!o||!ok.test(o))return;
document.querySelectorAll('a[href="/#projetos"]').forEach(function(a){a.href=o})})()</script>`;

export async function GET(_req: Request, { params }: { params: Promise<{ demo: string }> }) {
  const { demo } = await params;
  const html = await readFile(path.join(process.cwd(), "demos", `${demo}.html`), "utf8");
  const pagina = html.replaceAll("__SITE__", SITE_URL).replace("</body>", `${VOLTA}</body>`);
  return new Response(pagina, { headers: { "content-type": "text/html; charset=utf-8" } });
}
