// Gerado por scripts/gerar-escrita.mjs a partir da Instrument Serif itálica (OFL). Não edite à mão.
// Unidades da fonte: unitsPerEm 1000, baseline em y=0, ascendente 990, descendente 310.
// Por letra: d = preenchimento real; w = largura do traço da máscara; sk = traços do esqueleto na ordem da escrita,
// com t (início, ms desde o começo da frase) e du (duração); fim = letra pronta. fim da frase = último traço.
export const UPM = 1000;
export const ASC = 990;
export const DESC = 310;
export type Traco = { d: string; t: number; du: number };
export type Letra = { d: string; w: number; sk: Traco[]; fim: number };
export type Frase = { texto: string; w: number; fim: number; letra: number; pausas: number; letras: Letra[] };
