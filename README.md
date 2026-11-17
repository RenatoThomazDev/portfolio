# Portfólio de Renato Thomaz

Site pessoal de desenvolvedor full stack, com três demonstrações que dá para abrir e testar: agenda de clínica, gerador de orçamentos e automação de contatos (formulário, planilha e WhatsApp). Os dados das demonstrações são fictícios.

Feito com Next.js 15, React 19 e Lenis, sem framework de componentes. O visual segue a ideia de uma prancha de desenho técnico: quatro folhas, papel quadriculado, cotas e anotações à mão.

## Rodar

Com Docker:

```bash
docker compose up -d --build
```

Sem Docker (Node 20):

```bash
npm ci
npm run build
npx next start -p 3010
```

O site abre em http://localhost:3010.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- `NEXT_PUBLIC_SITE_URL`: endereço público, usado em canonical, og:image, sitemap e JSON-LD. Entra no build.
- `RESEND_API_KEY`: chave do Resend para o formulário de contato. Sem ela, o formulário sugere o WhatsApp.
- `RESEND_FROM`: remetente de um domínio verificado no Resend (opcional).

## Estrutura

- `app/`: páginas, componentes e estilos do portfólio; `app/api/contato` envia o formulário.
- `demos/`: as três demonstrações, páginas HTML independentes servidas em `/demos/<nome>`.
- `config/contato.ts`: contatos e endereço público, num lugar só.
- `scripts/`: geradores das anotações à mão e do esqueleto da página.
