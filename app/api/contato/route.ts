import { CONTATO, WHATSAPP_URL } from "../../../config/contato";
import { montarEmail } from "./email";

/* Recebe o formulário de contato e envia um e-mail pelo Resend (API HTTP, sem SDK) para o e-mail de CONTATO.
   - Com JS o formulário manda JSON e recebe JSON. Sem JS, o navegador faz POST normal (form-urlencoded) e a rota
     responde com uma página HTML curta (confirmação ou erro) com o link de volta para o Contato.
   - RESEND_API_KEY no .env (ver .env.example). Sem ela, responde 503 { erro: "indisponivel" } e o formulário
     sugere o WhatsApp.
   - RESEND_FROM opcional: remetente de um domínio verificado no Resend. Sem ele, vale o remetente de teste do
     Resend (onboarding@resend.dev), que só entrega para o e-mail dono da conta, que é o caso aqui.
   - Validação no servidor, honeypot ("site", invisível no formulário) e limite de 3 envios por IP a cada 10 min. */
export const dynamic = "force-dynamic";

const JANELA_MS = 10 * 60 * 1000, MAX_ENVIOS = 3;
// Limite simples em memória: zera quando o servidor reinicia e não é dividido entre instâncias. Suficiente contra
// cliques repetidos e robôs simples; atrás de várias instâncias seria preciso um armazenamento compartilhado.
const envios = new Map<string, number[]>();

const LIMITES = { nome: [2, 80], email: [5, 120], mensagem: [10, 2000] } as const;
// Opções dos chips do formulário (ContactForm.tsx). Vazio = não escolheu; qualquer outro valor é recusado.
const TIPOS = ["", "Site", "Sistema", "Automação", "Outro"];

type Erro = "invalido" | "validacao" | "limite" | "indisponivel" | "falha";
const STATUS: Record<Erro, number> = { invalido: 400, validacao: 422, limite: 429, indisponivel: 503, falha: 502 };
const TEXTO_ERRO: Record<Erro, string> = {
  invalido: "Não entendi o envio.",
  validacao: "Faltou algum campo: nome, um e-mail válido e uma mensagem de pelo menos 10 caracteres.",
  limite: "Você já mandou algumas mensagens agora há pouco. Espere uns minutos.",
  indisponivel: "O envio pelo formulário está fora do ar agora.",
  falha: "Não consegui enviar agora.",
};

const escapar = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
// Página da resposta sem JS: mesmas cores do site, claro e escuro pelo sistema.
function pagina(status: number, titulo: string, texto: string) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapar(titulo)}</title>
<style>:root{color-scheme:light dark;--p:#F3EBD8;--i:#2A2620;--a:#2B44E0}@media(prefers-color-scheme:dark){:root{--p:#1A1814;--i:#ECE4D2;--a:#8C9BFF}}
body{margin:0;background:var(--p);color:var(--i);font:18px/1.5 system-ui,sans-serif}main{max-width:36rem;padding:64px 24px}h1{font-size:2rem;line-height:1.1;margin:0 0 16px}a{color:var(--a)}</style></head>
<body><main><h1>${escapar(titulo)}</h1><p>${texto}</p><p><a href="/#contato">Voltar ao Contato</a></p></main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function validar(d: Record<string, string>) {
  const erros: Record<string, string> = {};
  for (const [k, [min, max]] of Object.entries(LIMITES)) {
    const v = d[k].trim();
    if (v.length < min) erros[k] = "curto";
    else if (v.length > max) erros[k] = "longo";
  }
  if (!erros.email && !/^\S+@\S+\.\S+$/.test(d.email.trim())) erros.email = "formato";
  if (!TIPOS.includes(d.tipo)) erros.tipo = "opcao";
  return erros;
}

export async function POST(req: Request) {
  const json = (req.headers.get("content-type") ?? "").includes("application/json");
  const ok = () => json ? Response.json({ ok: true }) : pagina(200, "Mensagem enviada", "Respondo em até 24 horas, no e-mail que você informou.");
  const erro = (e: Erro, extra: Record<string, unknown> = {}) => json
    ? Response.json({ erro: e, ...extra }, { status: STATUS[e] })
    : pagina(STATUS[e], "Mensagem não enviada", `${escapar(TEXTO_ERRO[e])} Se preferir, me chame no <a href="${escapar(WHATSAPP_URL)}">WhatsApp</a>.`);

  let corpo: Record<string, unknown>;
  try { corpo = json ? await req.json() : Object.fromEntries(await req.formData()); } catch { return erro("invalido"); }
  const s = (k: string) => String(corpo[k] ?? "");
  const d = { nome: s("nome"), email: s("email"), tipo: s("tipo"), mensagem: s("mensagem"), site: s("site") };

  // Honeypot preenchido: robô. Responde como sucesso para não ensinar o robô, e não envia nada.
  if (d.site) return ok();

  const erros = validar(d);
  if (Object.keys(erros).length) return erro("validacao", { campos: erros });

  // Simulação para testar a animação e os erros sem mandar e-mail: ?simular=ok|limite|indisponivel|falha.
  // Só fora de produção (next dev); em produção o parâmetro é ignorado e o envio segue normal.
  const simular = new URL(req.url).searchParams.get("simular");
  if (simular && process.env.NODE_ENV !== "production") {
    await new Promise((ok) => setTimeout(ok, 400));
    return simular === "ok" ? ok() : erro((["limite", "indisponivel", "falha"] as const).find((e) => e === simular) ?? "falha");
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const agora = Date.now(), lista = (envios.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (lista.length >= MAX_ENVIOS) return erro("limite");

  const chave = process.env.RESEND_API_KEY;
  if (!chave) return erro("indisponivel");

  const email = d.email.trim();
  const { assunto, texto, html } = montarEmail({ nome: d.nome.trim(), email, tipo: d.tipo, mensagem: d.mensagem.trim() });
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Portfólio <onboarding@resend.dev>",
      to: [CONTATO.email],
      reply_to: email,
      subject: assunto,
      text: texto,
      html,
    }),
  }).catch(() => null);
  if (!r || !r.ok) return erro("falha");

  lista.push(agora); envios.set(ip, lista);
  return ok();
}
