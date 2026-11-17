// Único lugar com os dados públicos do site. Tudo (links de contato, rodapé, JSON-LD, e-mail do formulário) lê daqui.
export const CONTATO = {
  whatsapp: "5511937792105", // 55 + DDD + número, só dígitos (link wa.me)
  whatsappTexto: "(11) 93779-2105",
  telefoneE164: "+5511937792105",
  email: "renatothomaz.dev@gmail.com",
  linkedinUrl: "https://www.linkedin.com/in/renato-thomaz-silva-26b973432",
  linkedinTexto: "renato-thomaz-silva",
  github: "RenatoThomazDev",
};

// Mensagem que já chega preenchida no WhatsApp de quem clica.
export const MENSAGEM_WHATSAPP = "Olá, Renato! Vi seu portfólio e quero conversar sobre um projeto.";
export const WHATSAPP_URL = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(MENSAGEM_WHATSAPP)}`;

// Endereço público do site, sem barra no fim. Vem de NEXT_PUBLIC_SITE_URL (defina na hospedagem com o domínio
// final, ver .env.example): é o metadataBase e entra no canonical, no og:image, no sitemap, no robots, no JSON-LD
// e nas tags das demos. Sem a variável, vale http://localhost:3010, que só serve para testar localmente.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010").replace(/\/$/, "");


export const DEMOS = ["clinica", "orcamentos", "automacao"] as const;
