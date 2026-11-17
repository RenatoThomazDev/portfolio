import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMOS, SITE_URL } from "../../../config/contato";

/* As três demonstrações são páginas HTML independentes (site/demos/*.html), cada uma com identidade própria e sem
   nada do portfólio. Esta rota só as serve em /demos/<nome>, trocando __SITE__ pelo endereço público (canonical e
   Open Graph precisam de URL absoluta). Geradas no build: em produção são arquivos estáticos. */
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => DEMOS.map((demo) => ({ demo }));

export async function GET(_req: Request, { params }: { params: Promise<{ demo: string }> }) {
  const { demo } = await params;
  const html = await readFile(path.join(process.cwd(), "demos", `${demo}.html`), "utf8");
  return new Response(html.replaceAll("__SITE__", SITE_URL), { headers: { "content-type": "text/html; charset=utf-8" } });
}
