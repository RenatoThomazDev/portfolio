// Monta o e-mail da mensagem (assunto, texto e HTML) a partir dos campos já validados pela rota.
// Fica separado da rota para poder ser conferido sem enviar nada.
export type Mensagem = { nome: string; email: string; tipo: string; mensagem: string };

const escapar = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export function montarEmail(p: Mensagem) {
  const linhas: [string, string][] = [
    ["Nome", p.nome],
    ["E-mail", p.email],
    // tipo é opcional no formulário: sem escolha, o e-mail diz isso em vez de deixar a linha vazia
    ["Tipo de projeto", p.tipo || "não informado"],
  ];
  const assunto = `Mensagem pelo portfólio: ${p.nome}${p.tipo ? ` (${p.tipo})` : ""}`;
  const texto = `${linhas.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nMensagem:\n${p.mensagem}`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#2b2722;max-width:600px">
<p style="margin:0 0 12px;font-family:monospace;font-size:12px;color:#6b645a">Mensagem pelo formulário do portfólio</p>
<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;border:1.5px solid #2b2722">
${linhas.map(([k, v]) => `<tr><td style="border:1px solid #c9bfae;font-family:monospace;font-size:12px;color:#6b645a;width:34%">${k}</td><td style="border:1px solid #c9bfae">${escapar(v)}</td></tr>`).join("\n")}
<tr><td colspan="2" style="border:1px solid #c9bfae"><span style="font-family:monospace;font-size:12px;color:#6b645a">Mensagem</span><br><span style="white-space:pre-wrap">${escapar(p.mensagem)}</span></td></tr>
</table></div>`;
  return { assunto, texto, html };
}
