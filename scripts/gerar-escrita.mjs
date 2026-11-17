// Gera as anotações à mão (Instrument Serif itálica) como dados de SVG, uma vez, no build.
// O navegador nunca carrega opentype.js nem gera nada: recebe só os paths prontos em app/components/escrita-dados.ts.
// Uso: node scripts/gerar-escrita.mjs --gravar   (rode de novo só se mudar alguma frase, a fonte ou uma revisão)
//      node scripts/gerar-escrita.mjs --revisao  (imprime o esqueleto de cada letra, para conferir ordem e direção)
//
// Cada letra tem o preenchimento real (d) e o esqueleto (sk): a linha central, em traços na ordem e direção da
// escrita à mão (scripts/esqueleto.mjs + REVISOES abaixo). No navegador o esqueleto é a máscara do preenchimento.
//
// Ritmo (ms, relativo ao início da frase):
// - cada letra leva 110-170ms, proporcional ao comprimento do esqueleto; cada traço, a fração do seu comprimento;
// - 40ms entre traços da mesma letra (nenhum se o traço continua de onde o outro parou), 70ms entre letras,
//   220ms entre palavras;
// - orçamento por frase (~3s; 440ms em "à mão.", que fica dentro do tempo do título): se não couber, as pausas
//   encolhem primeiro e as letras só depois, para nunca voltar a parecer que a letra "surge".
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import wawoff2 from "wawoff2";
import { esqueleto, comprimento } from "./esqueleto.mjs";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FONTE = path.join(raiz, "scripts/fontes/instrument-serif-italic-latin.woff2");
const SAIDA = path.join(raiz, "app/components/escrita-dados.ts");

const FRASES = {
  // ls: letter-spacing do texto real, em em (o título usa -0.01em em "à mão."); o espaço é o NBSP do título.
  // ws: word-spacing do texto real, em em: o título herda 0.12em do seu corpo e "à mão." tem corpo 1.12x maior.
  "a-mao": { texto: "à mão.", orcamento: 440, ls: -0.01, ws: 0.12 / 1.12 }, // dentro dos ~600ms do título (começa em 120ms)
  "roda-sozinho": { texto: "isso aqui roda sozinho", orcamento: 3000 },
  "whatsapp": { texto: "pelo WhatsApp é mais rápido", orcamento: 3000 },
  "producao": { texto: "em produção há cerca de 2 anos", orcamento: 3000 },
  "enviado": { texto: "mensagem recebida, obrigado!", orcamento: 2600 }, // confirmação do formulário de contato};
const LETRA_MIN = 110, LETRA_MAX = 170;
const P_TRACO = 40, P_LETRA = 70, P_PALAVRA = 220;

// Revisão à mão da saída automática (ordem/direção), por caractere. Índices referem-se à ordem automática.
// ordem: nova sequência dos traços; inverter: traços (já na ordem nova) que mudam de sentido.
// Conferido na folha de revisão (node scripts/gerar-escrita.mjs --revisao): ver o comentário de cada linha.
// O resto da folha ficou como a mão escreve: a (barriga anti-horária, haste descendo, rabicho), m/n/h (entrada,
// haste, arco...), d/q (barriga, serifa+haste), o (laço anti-horário a partir do alto), s/c/2 (um traço do alto),
// i (haste, pingo), acentos/til/cedilha por último.
const REVISOES = {
  r: { ordem: [2, 1, 0], inverter: [0, 2] }, // automático: bandeira primeiro, da ponta para a haste. Mão: entrada, haste, bandeira saindo da haste
};

const ttf = Buffer.from(await wawoff2.decompress(fs.readFileSync(FONTE)));
const fonte = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));
const upm = fonte.unitsPerEm, asc = fonte.ascender, desc = -fonte.descender;
const xh = fonte.tables.os2.sxHeight || 420;

const int = (v) => Math.round(v);
const pathDe = (p) => "M" + p.map(([x, y]) => `${int(x)} ${int(y)}`).join("L");
const limpar = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(+n))).replace(/(-?\d+)([ -]-?\d+)L\1\2(?=[QLCZ])/g, "$1$2");

const saida = {}, revisao = {};
for (const [id, { texto, orcamento, ls = 0, ws = 0 }] of Object.entries(FRASES)) {
  const chs = [...texto];
  const letras = [];
  let n = 0, espacos = 0, novaPalavra = false;
  fonte.forEachGlyph(texto, 0, 0, upm, { kerning: true }, (g, x0, y) => {
    // letter-spacing entra depois de cada letra e word-spacing depois de cada espaço, como no CSS
    const x = x0 + n * ls * upm + espacos * ws * upm;
    const c = chs[n];
    if (/\s| /.test(c)) { espacos++; novaPalavra = true; n++; return; }
    n++;
    const caminho = g.getPath(x, y, upm);
    const esq = esqueleto(caminho.commands, xh, REVISOES[c]);
    // Pedacinhos mais curtos que meia largura de caneta (pontas de serifa) não viram traço próprio: a máscara grossa
    // dos vizinhos já passa por eles, e o fim da letra mostra o glifo inteiro (e-full).
    const tracos = esq.tracos.length > 1 ? esq.tracos.filter((p) => comprimento(p) >= esq.largura * 0.5) : esq.tracos;
    letras.push({ c, d: limpar(caminho.toPathData(2)), tracos, largura: esq.largura, x, adv: g.advanceWidth, palavra: novaPalavra });
    novaPalavra = false;
    if (!revisao[c]) revisao[c] = { d: limpar(g.getPath(0, 0, upm).toPathData(2)), tracos: esqueleto(g.getPath(0, 0, upm).commands, xh, REVISOES[c]).tracos.map(pathDe) };
  });
  // tempos. Traço que começa onde o anterior terminou (haste que vira rabicho) segue sem levantar a caneta: sem pausa.
  const continua = (a, b) => Math.hypot(a[a.length - 1][0] - b[0][0], a[a.length - 1][1] - b[0][1]) < 30;
  const pausas = letras.reduce((s, l, i) => s + (i ? (l.palavra ? P_PALAVRA : P_LETRA) : 0) + l.tracos.reduce((a, p, k) => a + (k && !continua(l.tracos[k - 1], p) ? P_TRACO : 0), 0), 0);
  // Tempo de cada letra proporcional ao comprimento do esqueleto, entre LETRA_MIN e LETRA_MAX ("i" e "o" rápidas,
  // "s", "z", "h" lentas); dentro da letra, cada traço leva a fração do seu comprimento.
  const compL = letras.map((l) => l.tracos.reduce((a, p) => a + comprimento(p), 0));
  const cMin = Math.min(...compL), cMax = Math.max(...compL);
  let durL = compL.map((c) => LETRA_MIN + (cMax > cMin ? (c - cMin) / (cMax - cMin) : 0.5) * (LETRA_MAX - LETRA_MIN));
  const desenho = durL.reduce((a, b) => a + b, 0);
  // Orçamento: letras no ritmo pedido; se não couber, as pausas encolhem primeiro (até 35% do pedido) e só depois
  // as letras. Só "à mão." tem orçamento apertado (fica dentro do tempo do título).
  let fp = Math.min(1, Math.max(0.15, (orcamento - desenho) / pausas));
  const fl = Math.min(1, (orcamento - pausas * fp) / desenho);
  durL = durL.map((d) => d * fl);
  let t = 0;
  const out = letras.map((l, i) => {
    if (i) t += (l.palavra ? P_PALAVRA : P_LETRA) * fp;
    const sk = l.tracos.map((p, k) => {
      if (k && !continua(l.tracos[k - 1], p)) t += P_TRACO * fp;
      const du = (durL[i] * comprimento(p)) / compL[i];
      const s = { d: pathDe(p), t: int(t), du: int(du) };
      t += du; return s;
    });
    return { d: l.d, w: l.largura, sk, fim: int(t) };
  });
  const largura = Math.ceil(letras.reduce((m, l) => Math.max(m, l.x + l.adv), 0));
  saida[id] = { texto: texto.replace(/ /g, " "), w: largura, letras: out, fim: int(t), letra: Math.round(fl * 100) / 100, pausas: Math.round(fp * 100) / 100 };
}

if (process.argv.includes("--revisao")) { process.stdout.write(JSON.stringify({ upm, asc, desc, xh, letras: revisao })); process.exit(0); }

const cab = `// Gerado por scripts/gerar-escrita.mjs a partir da Instrument Serif itálica (OFL). Não edite à mão.
// Unidades da fonte: unitsPerEm ${upm}, baseline em y=0, ascendente ${asc}, descendente ${desc}.
// Por letra: d = preenchimento real; w = largura do traço da máscara; sk = traços do esqueleto na ordem da escrita,
// com t (início, ms desde o começo da frase) e du (duração); fim = letra pronta. fim da frase = último traço.
`;
// Um módulo por frase (app/components/escrita/<id>.ts): cada componente só carrega as frases que mostra.
const tipos = cab + `export const UPM = ${upm};\nexport const ASC = ${asc};\nexport const DESC = ${desc};\n` +
  `export type Traco = { d: string; t: number; du: number };\n` +
  `export type Letra = { d: string; w: number; sk: Traco[]; fim: number };\n` +
  `export type Frase = { texto: string; w: number; fim: number; letra: number; pausas: number; letras: Letra[] };\n`;
const conteudo = tipos + Object.entries(saida).map(([id, f]) => `// ${id}\n${JSON.stringify(f)}`).join("\n");
if (process.argv.includes("--gravar")) {
  fs.mkdirSync(path.join(raiz, "app/components/escrita"), { recursive: true });
  fs.writeFileSync(SAIDA, tipos);
  for (const [id, f] of Object.entries(saida)) fs.writeFileSync(path.join(raiz, `app/components/escrita/${id}.ts`), `// Gerado por scripts/gerar-escrita.mjs. Não edite à mão.\nimport type { Frase } from "../escrita-dados";\nconst frase: Frase = ${JSON.stringify(f)};\nexport default frase;\n`);
  for (const [id, f] of Object.entries(saida)) console.error(id, "letras", f.letras.length, "traços", f.letras.reduce((s, l) => s + l.sk.length, 0), "fim", f.fim + "ms", "letras x" + f.letra, "pausas x" + f.pausas,
    "ms por letra", Math.round(Math.min(...f.letras.map((l) => l.fim - l.sk[0].t))) + "-" + Math.round(Math.max(...f.letras.map((l) => l.fim - l.sk[0].t))));
} else process.stdout.write(conteudo);
