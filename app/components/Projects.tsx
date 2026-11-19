import Annot from "./Annot";
import producao from "./escrita/producao";
import Split from "./Split";
import Image from "next/image";
import ProjectMedia from "./ProjectMedia";
import ProjectLink from "./ProjectLink";
import Colar from "./Colar";
import SecN from "./SecN";
import Tape from "./Tape";
/* Layout da seção em teste: "destaque + 2 menores" (Destaque.tsx). O carrossel anterior (abas + molduras empilhadas)
   continua guardado em Pilha.tsx e pilha.css: para voltar, troque Destaque por Pilha no import abaixo e no JSX
   (as duas recebem as mesmas props). */
import Destaque from "./Destaque";

import { PROJETOS as DEMOS } from "../../config/paginas";

/* Cada demonstração: o problema de quem contrata, o que foi feito e o resultado, em linguagem de cliente. Os
   textos ficam em config/paginas.ts, os mesmos das páginas /projetos/[slug]. */

const ERP = [
  { t: "Venda", s: "pedido aprovado" },
  { t: "NF-e", s: "emissão automática" },
  { t: "Fila WhatsApp", s: "aviso ao cliente" },
  { t: "Painel", s: "tempo real" },
];

// → para links internos, como nas páginas de projeto (Pagina.tsx)
const Seta = () => (
  <svg className="seta-d" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2.5 8h10.5M9 4l4 4-4 4" /></svg>
);
const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4.5 11.5l7-7M5.5 4.5h6v6" /></svg>
);

export default function Projects() {
  return (
    <section id="projetos" className="sec wrap grid12" aria-labelledby="projetos-t">
      <Colar />
      {/* Destaque + 2 menores (Destaque.tsx, destaque.css). Sem JS, os três projetos em sequência. */}
      <Destaque itens={DEMOS.map((p) => ({ id: p.id, title: p.title, curto: p.curto, kind: p.kind, img: p.img }))} cabecalho={
        <div className="sec-head" data-reveal>
            <SecN n="02" />
          {/* ".n" do projeto ativo: só com JS (pilha.css), atualizado por Destaque.tsx */}
          <span className="mono">Folha 02<span className="pj-sub">.1</span> / Projetos</span>
          <h2 id="projetos-t"><Split text="Três demonstrações que você pode abrir e testar" /></h2>
        </div>
      }>
      <div className="projects">
        {DEMOS.map((p, i) => (
          <div key={p.id} className="project" data-demo={p.slug} data-cotas data-pos={i} style={{ "--vt": `dq-${p.id.replace(".", "-")}` } as React.CSSProperties}>
            {/* Prancha: cotas de largura e altura em volta da miniatura e a legenda da figura. */}
            <figure className="p-frame" data-colar>
              <span className="pf-w mono" aria-hidden="true"><span className="d-lg">1920</span><span className="d-sm">1600</span></span>
              <span className="pf-h mono" aria-hidden="true"><span className="d-lg">1200</span><span className="d-sm">1000</span></span>
              {/* Sombra larga da foto ainda no ar: some (opacity) quando ela pousa no papel. */}
              <span className="p-sombra" aria-hidden="true" />
              {/* A imagem repete o link "Abrir demonstração": fica fora da ordem do Tab e do leitor de tela. */}
              <ProjectMedia href={p.href} folha={p.id}>
              <Image className="img-l" src={p.img} alt="" width={1920} height={1200} sizes="(min-width: 1024px) 52vw, 100vw" />
              <Image className="img-d" src={p.img.replace(".png", "-escuro.png")} alt="" width={1920} height={1200} sizes="(min-width: 1024px) 52vw, 100vw" />
              {/* Abaixo de 768px: recorte ampliado do topo da demo, legível na largura do celular. */}
              <Image className="img-lm" src={p.img.replace(".png", "-recorte.png")} alt="" width={1600} height={1000} sizes="100vw" />
              <Image className="img-dm" src={p.img.replace(".png", "-recorte-escuro.png")} alt="" width={1600} height={1000} sizes="100vw" />
              </ProjectMedia>
              <Tape side="a" />
              <Tape side="b" />
              <figcaption className="mono">fig. {p.id}: {p.title.toLowerCase()}, tela inicial da demonstração.</figcaption>
              {/* Só com JS, na moldura de trás (pilha.css): o nome da folha seguinte, ao passar o mouse. */}
              <span className="pj-tras mono" aria-hidden="true">Próximo: {p.title} →</span>
            </figure>
            <div className="p-body" data-reveal>
              <dl className="p-stamp mono">
                <dt>folha</dt><dd>{p.id}</dd>
                <dt>tipo</dt><dd>{p.kind}</dd>
              </dl>
              <h3>{p.title}</h3>
              {/* Resumo: só o resultado. Problema, o que foi feito e o resultado completos ficam em /projetos/[slug]. */}
              <p className="p-resumo">{p.resultado}</p>
              <ul className="p-tags mono" aria-label="Tecnologias">
                {p.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <div className="p-acoes">
                {/* links internos com →; o ↗ fica só para o link externo (código) */}
                <ProjectLink href={p.href}>Abrir demonstração<span className="sr-only">: {p.title}</span> <Seta /></ProjectLink>
                <a className="link p-link" href={`/projetos/${p.slug}`}>Ver detalhes<span className="sr-only"> do projeto {p.title}</span> <Seta /></a>
                {p.code &&<a className="link p-link" href={p.code} target="_blank" rel="noopener noreferrer">Ver código<span className="sr-only">: {p.title} (abre em nova aba)</span> <Arrow /></a>}
              </div>
            </div>
          </div>
        ))}
      </div>
      </Destaque>

      <article className="work" data-reveal>
        <figure className="erp-fig" aria-label="Fluxo do ERP: a venda gera a nota fiscal, que entra na fila de mensagens do WhatsApp e aparece no painel em tempo real">
          <svg className="e-h" viewBox="0 0 760 152" aria-hidden="true">
            <g className="e-dim"><path d="M8 24H752M8 16V32M752 16V32M4 28l8 -8M748 28l8 -8" /></g>
            <text x="380" y="12" textAnchor="middle" className="e-dt">da venda ao painel, sem digitação entre as etapas</text>
            {ERP.map((n, i) => (
              <g key={n.t}>
                <rect x={8 + i * 192} y={48} width={168} height={88} rx="4" className="e-node" />
                <text x={28 + i * 192} y={88} className="e-nt">{n.t}</text>
                <text x={28 + i * 192} y={110} className="e-ns">{n.s}</text>
                {i < 3 && <><path d={`M${176 + i * 192} 92H${194 + i * 192}`} className="e-wire" /><path d={`M${192 + i * 192} 87L${200 + i * 192} 92L${192 + i * 192} 97z`} className="e-tip" /></>}
              </g>
            ))}
          </svg>
          {/* 1024px ou mais: grade 2x2 em "S", para o desenho ocupar a altura do texto ao lado. */}
          <svg className="e-g" viewBox="0 0 520 344" aria-hidden="true">
            <g className="e-dim"><path d="M8 24H512M8 16V32M512 16V32M4 28l8 -8M508 28l8 -8" /></g>
            <text x="260" y="12" textAnchor="middle" className="e-dt">da venda ao painel, sem digitação entre as etapas</text>
            {ERP.map((n, i) => {
              const x = [8, 304, 304, 8][i], y = [64, 64, 232, 232][i];
              return (
                <g key={n.t}>
                  <rect x={x} y={y} width={208} height={104} rx="4" className="e-node" />
                  <text x={x + 24} y={y + 48} className="e-nt">{n.t}</text>
                  <text x={x + 24} y={y + 72} className="e-ns">{n.s}</text>
                </g>
              );
            })}
            <path d="M216 116H294" className="e-wire" /><path d="M292 111L300 116L292 121z" className="e-tip" />
            <path d="M408 168V222" className="e-wire" /><path d="M403 220L408 228L413 220z" className="e-tip" />
            <path d="M304 284H226" className="e-wire" /><path d="M228 279L220 284L228 289z" className="e-tip" />
          </svg>
          <svg className="e-v" viewBox="0 0 320 448" aria-hidden="true">
            {ERP.map((n, i) => (
              <g key={n.t}>
                <rect x={8} y={8 + i * 112} width={304} height={80} rx="4" className="e-node" />
                <text x={28} y={44 + i * 112} className="e-nt">{n.t}</text>
                <text x={28} y={66 + i * 112} className="e-ns">{n.s}</text>
                {i < 3 && <><path d={`M160 ${88 + i * 112}V${114 + i * 112}`} className="e-wire" /><path d={`M155 ${110 + i * 112}L160 ${120 + i * 112}L165 ${110 + i * 112}z`} className="e-tip" /></>}
              </g>
            ))}
          </svg>
          <figcaption className="mono">fig. 02.4: como uma venda percorre o ERP. Diagrama genérico, sem telas nem dados da empresa.</figcaption>
        </figure>
        <div className="work-body">
        <dl className="p-stamp mono">
          <dt>folha</dt><dd>02.4</dd>
          <dt>tipo</dt><dd>Experiência profissional</dd>
        </dl>
        <h3>ERP de uma indústria</h3>
        <Annot className="an-erp" tone="pencil" escrita={producao} text="em produção há cerca de 2 anos" arrow="M60 40C40 36 20 26 10 4M6 16L9 3L21 7" />
        {/* Estudo de caso sem demonstração pública: é sistema de empresa. Nada aqui identifica a empresa. */}
        <p className="work-nota mono">Estudo de caso. Sistema interno de empresa, por isso sem demonstração pública.</p>
        <dl className="p-caso caso-erp">
          <div><dt className="mono">Contexto</dt><dd>Uma indústria em que vendas, oficina, financeiro e estoque usam o mesmo sistema, todos os dias.</dd></div>
          <div><dt className="mono">Desafio</dt><dd>Tirar das pessoas as tarefas repetidas, como digitar nota fiscal, avisar o cliente e conferir o andamento, sem parar a operação.</dd></div>
          <div><dt className="mono">O que construí</dt><dd>
            <ul className="caso-lista">
              <li>Telas de vendas e de ordens de serviço da oficina</li>
              <li>Emissão automática de nota fiscal (NF-e) depois da venda</li>
              <li>Fila de mensagens que avisa o cliente pelo WhatsApp</li>
              <li>Painel em tempo real para acompanhar o que está em andamento</li>
            </ul>
          </dd></div>
          <div><dt className="mono">Como pensei</dt><dd>Uma etapa de cada vez. Cada automação entra em uso, é acompanhada de perto e só então a próxima começa. Nota fiscal não aceita erro, então toda emissão passa por um único caminho, fácil de conferir.</dd></div>
          <div><dt className="mono">O que aprendi</dt><dd>Sistema bom é o que as pessoas usam sem pensar nele. Antes de escrever código, ouço quem faz o trabalho.</dd></div>
        </dl>

        {/* Para leitores técnicos. Recolhível (details nativo: funciona sem JS e com teclado). Só arquitetura em
            linhas gerais: sem nomes, telas, dados ou números da empresa. */}
        <details className="capo">
          <summary>Por baixo do capô</summary>
          <div className="capo-corpo">
            <h4 className="mono">Arquitetura em linhas gerais</h4>
            <p>Monólito em Laravel 12 (PHP 8.3) com telas em Blade e Alpine.js, rodando em Docker. Os dados principais vivem num banco SQL Server legado, que o sistema antigo ainda usa em paralelo; tabelas novas ficam num banco à parte, com migrations. Como o banco legado não foi feito para o Laravel, cada model declara tabela e chave, e as gravações que tocam mais de uma tabela rodam em transação.</p>
            <h4 className="mono">Filas, workers e novas tentativas</h4>
            <p>Tudo que depende de serviço externo sai da requisição e vai para filas, processadas por workers sob o Supervisor, cada fila com o seu. Um job que falha é tentado de novo, e a falha fica registrada para alguém ver, em vez de sumir.</p>
            <h4 className="mono">Eventos em tempo real</h4>
            <p>O painel de acompanhamento recebe eventos por WebSocket com o Laravel Reverb: quando algo muda, a tela atualiza sem recarregar.</p>
            <h4 className="mono">Emissão automática de NF-e</h4>
            <p>Depois da venda, uma rotina decide se ela pode ser faturada sozinha. A emissão em si passa sempre pelo mesmo serviço usado pelo botão manual, então a automação e a pessoa geram a mesma nota, e há um só lugar para conferir e corrigir.</p>
            <h4 className="mono">Fila de WhatsApp</h4>
            <p>Os avisos ao cliente entram numa fila própria, separada das outras, para que um pico de mensagens não atrase a emissão de notas nem o resto do sistema.</p>
            <h4 className="mono">O que eu construí</h4>
            <ul className="caso-lista">
              <li>As telas de vendas e de ordens de serviço</li>
              <li>A emissão automática de NF-e depois da venda</li>
              <li>A fila de mensagens de WhatsApp para o cliente</li>
              <li>O painel em tempo real</li>
            </ul>
          </div>
        </details>

        <ul className="p-tags mono" aria-label="Tecnologias">
          {["Laravel", "SQL Server", "Alpine.js", "WebSockets", "Docker"].map((t) => <li key={t}>{t}</li>)}
        </ul>
        </div>
      </article>
      <dl className="sheet-stamp mono" aria-label="Carimbo da folha">
        <div><dt>folha</dt><dd>02 de 04</dd></div>
        <div><dt>escala</dt><dd>1:1</dd></div>
        <div><dt>revisão</dt><dd>A</dd></div>
      </dl>
    </section>
  );
}
