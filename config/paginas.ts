// Conteúdo das páginas de projeto (/projetos/[slug]) e de serviço (/servicos/[slug]). A home (Projects.tsx) lê os
// projetos daqui também, para o texto ser um só. Tudo sai do que o site já dizia: sem preço, número ou resultado
// que não exista. São demonstrações, então não há métrica real para citar.

export type Projeto = {
  id: string; slug: string; kind: string; title: string;
  problema: string; feito: string; resultado: string;
  tags: string[]; href: string; img: string; code?: string;
  // página própria: título para a busca, descrição curta e a lista do que a demonstração mostra
  seoTitulo: string; descricao: string; mostra: string[]; servico: string;
};

export const PROJETOS: Projeto[] = [
  {
    id: "02.1",
    slug: "clinica",
    kind: "Landing page",
    title: "Clínica odontológica",
    problema: "Quem pesquisa um dentista à noite ou no intervalo do trabalho não quer ligar. Se o site não deixa marcar, a pessoa vai para o próximo.",
    feito: "Página com tratamentos, preços iniciais, dúvidas e os horários da semana. O paciente escolhe dia e horário e a mensagem para o WhatsApp já sai pronta.",
    resultado: "O paciente chega ao WhatsApp sabendo o que quer. A recepção só precisa confirmar.",
    tags: ["HTML", "CSS", "JavaScript"],
    href: "/demos/clinica",
    img: "/projetos/clinica.png",
    seoTitulo: "Landing page para clínica odontológica com agendamento pelo WhatsApp",
    descricao: "Demonstração de landing page para clínica odontológica: tratamentos, preços iniciais, dúvidas e horários, com a mensagem de agendamento pronta para o WhatsApp.",
    mostra: ["Tratamentos e preços iniciais", "Dúvidas frequentes", "Horários da semana", "Escolha de dia e horário com a mensagem pronta para o WhatsApp"],
    servico: "landing-page",
  },
  {
    id: "02.2",
    slug: "orcamentos",
    kind: "Sistema web",
    title: "Gerador de orçamentos",
    problema: "Orçamento montado no Word ou na planilha demora, sai cada vez de um jeito e depois ninguém acha a última versão.",
    feito: "Sistema com catálogo de serviços, itens e desconto calculados na hora, histórico dos orçamentos e PDF pronto para enviar.",
    resultado: "O orçamento sai em poucos minutos, numerado e sempre com a mesma apresentação.",
    tags: ["JavaScript", "Histórico no navegador", "PDF"],
    href: "/demos/orcamentos",
    img: "/projetos/orcamentos.png",
    seoTitulo: "Sistema gerador de orçamentos em PDF",
    descricao: "Demonstração de sistema web para montar orçamentos: catálogo de serviços, itens e desconto calculados na hora, histórico e PDF pronto para enviar.",
    mostra: ["Catálogo de serviços", "Itens e desconto calculados na hora", "Histórico dos orçamentos", "PDF pronto para enviar"],
    servico: "sistema-sob-medida",
  },
  {
    id: "02.3",
    slug: "automacao",
    kind: "Automação",
    title: "Formulário para planilha e WhatsApp",
    problema: "Contato do site que cai só no e-mail fica dias sem resposta, e alguém ainda precisa copiar os dados para a planilha.",
    feito: "Cada envio do formulário vira uma linha na planilha e um aviso no WhatsApp da equipe. A demonstração mostra cada etapa acontecendo.",
    resultado: "Ninguém copia dados à mão, e a equipe responde enquanto o cliente ainda está interessado.",
    tags: ["JavaScript", "Planilha (simulada)", "WhatsApp (simulado)"],
    href: "/demos/automacao",
    img: "/projetos/automacao.png",
    seoTitulo: "Automação de formulário para planilha e WhatsApp",
    descricao: "Demonstração de automação: cada envio do formulário do site vira uma linha na planilha e um aviso no WhatsApp da equipe, sem copiar dados à mão.",
    mostra: ["Formulário do site", "Linha nova na planilha a cada envio", "Aviso no WhatsApp da equipe", "Cada etapa acontecendo na tela"],
    servico: "automacao-whatsapp-planilha",
  },
];

export type Servico = {
  slug: string; nome: string; seoTitulo: string; descricao: string;
  titulo: string; intro: string; paraQuem: string[]; entra: string[]; projeto: string; experiencia?: string;
};

// Os três serviços que o site já oferece ("landing pages, sistemas sob medida e automações para pequenos negócios").
export const SERVICOS: Servico[] = [
  {
    slug: "landing-page",
    nome: "Landing page",
    seoTitulo: "Landing page para pequenos negócios",
    descricao: "Landing page para pequenos negócios que leva o visitante direto para o WhatsApp, com serviços, preços iniciais, dúvidas e horários na mesma página.",
    titulo: "Landing page que leva o visitante a falar com você",
    intro: "Uma página só, com o que o cliente precisa saber para decidir: o que você faz, quanto custa para começar, as dúvidas mais comuns e como chamar você. O contato chega pelo WhatsApp com a mensagem pronta.",
    paraQuem: [
      "Quem recebe visitas no site, mas pouca mensagem",
      "Negócios em que o cliente pesquisa fora do horário comercial e não quer ligar",
    ],
    entra: ["Serviços e preços iniciais", "Dúvidas frequentes", "Horários de atendimento", "Botão para o WhatsApp com a mensagem já escrita"],
    projeto: "clinica",
  },
  {
    slug: "sistema-sob-medida",
    nome: "Sistema sob medida",
    seoTitulo: "Sistema web sob medida para pequenas empresas",
    descricao: "Sistema web sob medida para tirar da planilha e do Word o que sua empresa faz todo dia, como orçamentos, cadastros e acompanhamento.",
    titulo: "Sistema feito para o jeito que a sua empresa trabalha",
    intro: "Quando a planilha e o Word já não dão conta, um sistema faz a mesma tarefa sempre do mesmo jeito e guarda o histórico. Começo entendendo como o trabalho acontece hoje e construo em cima disso.",
    paraQuem: [
      "Quem monta orçamento, pedido ou cadastro à mão toda vez",
      "Equipes que perdem tempo procurando a última versão de um arquivo",
    ],
    entra: ["Telas para as tarefas do dia a dia", "Cálculos feitos na hora", "Histórico guardado", "Documento em PDF pronto para enviar"],
    projeto: "orcamentos",
    experiencia: "Há cerca de dois anos trabalho no ERP de uma empresa do setor industrial, usado todos os dias por vendas, oficina, financeiro e estoque.",
  },
  {
    slug: "automacao-whatsapp-planilha",
    nome: "Automação com WhatsApp e planilhas",
    seoTitulo: "Automação com WhatsApp e planilhas",
    descricao: "Automação que leva o contato do formulário do site para a planilha e avisa sua equipe no WhatsApp, sem ninguém copiar dados à mão.",
    titulo: "O contato do site vai sozinho para a planilha e para o WhatsApp",
    intro: "Cada mensagem que chega pelo site vira uma linha na planilha e um aviso no WhatsApp da equipe. Ninguém precisa copiar dados, e o cliente recebe resposta enquanto ainda está interessado.",
    paraQuem: [
      "Quem recebe contatos por e-mail e demora dias para responder",
      "Equipes que copiam os dados de cada contato para uma planilha",
    ],
    entra: ["Formulário do site ligado à planilha", "Aviso no WhatsApp da equipe a cada contato", "Dados organizados, uma linha por contato"],
    projeto: "automacao",
    experiencia: "No ERP em que trabalho, construí a fila de mensagens que avisa o cliente pelo WhatsApp.",
  },
];

export const projeto = (slug: string) => PROJETOS.find((p) => p.slug === slug);
export const servico = (slug: string) => SERVICOS.find((s) => s.slug === slug);
