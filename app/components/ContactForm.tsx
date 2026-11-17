"use client";
import { useRef, useState } from "react";
import Annot from "./Annot";
import enviado from "./escrita/enviado";
import { WHATSAPP_URL } from "../../config/contato";

/* Formulário da Folha 04. Com JS, envia por fetch para app/api/contato (Resend) e mostra enviando, sucesso e erro
   dentro do próprio bloco; no sucesso a folha dobra em avião de papel (vida.css) e aparece a confirmação escrita à mão.
   Sem JS, o mesmo <form> faz POST normal para a rota, que responde com uma página curta de confirmação ou de erro.
   Os limites e as opções são os mesmos da rota. */
type Estado = "pronto" | "enviando" | "voando" | "enviado" | "erro";
type Campo = "nome" | "email" | "mensagem";
type Erros = Partial<Record<Campo, string>>;

export const TIPOS = ["Site", "Sistema", "Automação", "Outro"];

function validar(d: Record<Campo, string>): Erros {
  const e: Erros = {};
  const n = d.nome.trim(), m = d.email.trim(), t = d.mensagem.trim();
  if (n.length < 2) e.nome = "Escreva seu nome.";
  else if (n.length > 80) e.nome = "Use até 80 caracteres.";
  if (!/^\S+@\S+\.\S+$/.test(m)) e.email = "Informe um e-mail válido, para eu conseguir responder.";
  else if (m.length > 120) e.email = "Use até 120 caracteres.";
  if (t.length < 10) e.mensagem = "Conte em uma ou duas frases o que você quer resolver.";
  else if (t.length > 2000) e.mensagem = "Use até 2000 caracteres; o resto a gente conversa.";
  return e;
}

const Aviao = () => (
  <svg className="btn-aviao" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 9.5L17.5 3l-4 14-3.5-5.5L2.5 9.5ZM10 11.5L17.5 3" /></svg>
);

export default function ContactForm() {
  const [estado, setEstado] = useState<Estado>("pronto");
  const [erros, setErros] = useState<Erros>({});
  const [falha, setFalha] = useState("");
  const form = useRef<HTMLFormElement>(null);

  const enviar = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (estado === "enviando") return;
    const fd = new FormData(ev.currentTarget);
    const s = (k: string) => String(fd.get(k) ?? "");
    const dados = { nome: s("nome"), email: s("email"), tipo: s("tipo"), mensagem: s("mensagem"), site: s("site") };
    const e = validar(dados);
    setErros(e);
    const primeiro = (["nome", "email", "mensagem"] as const).find((k) => e[k]);
    if (primeiro) { form.current?.querySelector<HTMLElement>(`[name="${primeiro}"]`)?.focus(); return; }
    setEstado("enviando");
    try {
      const r = await fetch("/api/contato", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(dados) });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setFalha(j.erro === "limite" ? "Você já mandou algumas mensagens agora há pouco. Espere uns minutos ou" : j.erro === "validacao" ? "Confira os campos e tente de novo, ou" : "Não consegui enviar agora,");
        setEstado("erro");
        return;
      }
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) setEstado("enviado");
      else { setEstado("voando"); setTimeout(() => setEstado("enviado"), 1250); }
    } catch {
      setFalha("Não consegui enviar agora,");
      setEstado("erro");
    }
  };
  const limpar = (k: Campo) => () => { if (erros[k]) setErros((a) => ({ ...a, [k]: undefined })); if (estado === "erro") setEstado("pronto"); };

  if (estado === "enviado") {
    return (
      <div className="c-form c-ok" role="status" tabIndex={-1} ref={(el) => el?.focus({ preventScroll: true })}>
        <h3 className="c-tit">Mensagem enviada</h3>
        <Annot className="an-ok" escrita={enviado} text="mensagem recebida, obrigado!" arrow="M6 40C18 30 34 22 58 20M46 12L59 20L48 30" />
        <p>Respondo em até 24 horas, no e-mail que você informou.</p>
        <button type="button" className="btn btn-secondary" onClick={() => setEstado("pronto")}>Enviar outra mensagem</button>
      </div>
    );
  }
  const ocupado = estado === "enviando" || estado === "voando";
  const campo = (k: Campo, rotulo: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={`campo${erros[k] ? " ruim" : ""}`}>
      <label htmlFor={`c-${k}`}>{rotulo}</label>
      <input id={`c-${k}`} name={k} onInput={limpar(k)} aria-invalid={!!erros[k]} aria-describedby={`c-${k}-e`} {...extra} />
      <span className="campo-erro" id={`c-${k}-e`} role="alert">{erros[k]}</span>
    </div>
  );
  return (
    <div className={`c-form${estado === "voando" ? " voa" : ""}`}>
      {/* A folha que vira avião: só existe durante o voo, por cima do formulário que some. */}
      {estado === "voando" && <span className="aviao" aria-hidden="true" />}
      <form ref={form} action="/api/contato" method="post" onSubmit={enviar} noValidate aria-labelledby="c-form-t">
        <h3 id="c-form-t" className="c-tit">Envie uma mensagem</h3>
        {/* Honeypot: fora da tela, fora do Tab e do leitor de tela. Robô que preenche é descartado no servidor. */}
        <div className="c-mel" aria-hidden="true"><label htmlFor="c-site">Site</label><input id="c-site" name="site" tabIndex={-1} autoComplete="off" /></div>
        <div className="campos-2">
          {campo("nome", "Nome", { autoComplete: "name", maxLength: 80 })}
          {campo("email", "E-mail", { type: "email", autoComplete: "email", inputMode: "email", maxLength: 120 })}
        </div>
        <fieldset className="campo">
          <legend>Tipo de projeto</legend>
          <div className="chips">
            {TIPOS.map((o) => (
              <label key={o} className="chip"><input type="radio" name="tipo" value={o} /><span>{o}</span></label>
            ))}
          </div>
        </fieldset>
        <div className={`campo${erros.mensagem ? " ruim" : ""}`}>
          <label htmlFor="c-mensagem">Mensagem</label>
          <textarea id="c-mensagem" name="mensagem" rows={4} maxLength={2000} placeholder="O que o seu negócio faz e o que você quer melhorar" onInput={limpar("mensagem")} aria-invalid={!!erros.mensagem} aria-describedby="c-mensagem-e" />
          <span className="campo-erro" id="c-mensagem-e" role="alert">{erros.mensagem}</span>
        </div>
        <p className="c-estado" role="alert">{estado === "erro" && <>{falha} me chame no <a className="link" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp<span className="sr-only"> (abre em nova aba)</span></a>.</>}</p>
        <button type="submit" className="btn btn-primary c-enviar" disabled={ocupado} aria-busy={ocupado}>
          {ocupado ? <><span className="c-gira" aria-hidden="true" />Enviando</> : <>Enviar mensagem<Aviao /></>}
        </button>
      </form>
    </div>
  );
}
