"use client";
import { useEffect, useRef, useState } from "react";

const SECOES = ["topo", "projetos", "sobre", "contato"];

/* A troca de tema fica no script inline do <head> (layout.tsx), delegada no documento:
   assim o botão responde desde a primeira pintura, antes de o React hidratar e antes de o Lenis iniciar. */

export default function Header({ sheet }: { sheet?: string }) {
  // Na página inicial o número da folha acompanha a seção visível; nas outras páginas vem por prop.
  const [atual, setAtual] = useState(0);
  useEffect(() => {
    if (sheet) return;
    // Folha ativa: a última cujo topo já passou de 40% da altura da tela (o mesmo critério em todas). No fim da
    // página vale a última folha, mesmo que o topo dela não chegue aos 40%.
    const els = SECOES.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    let raf = 0;
    const medir = () => {
      const linha = innerHeight * 0.4;
      let i = 0;
      els.forEach((el, k) => { if (el.getBoundingClientRect().top <= linha) i = k; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) i = els.length - 1;
      setAtual(SECOES.indexOf(els[i].id));
    };
    const pedir = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(medir); };
    medir();
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    return () => { removeEventListener("scroll", pedir); removeEventListener("resize", pedir); cancelAnimationFrame(raf); };
  }, [sheet]);
  // Na página inicial as âncoras ficam relativas (o Lenis rola suave); fora dela voltam para "/".
  const base = sheet ? "/" : "";
  // Na folha 02 o contador mostra também o projeto ativo das abas (Pilha.tsx): "02.2".
  const [proj, setProj] = useState("1");
  useEffect(() => {
    if (sheet) return;
    const w = window as unknown as { projetoAtivo?: string };
    if (w.projetoAtivo) setProj(w.projetoAtivo);
    const ouvir = (e: Event) => setProj((e as CustomEvent<string>).detail);
    addEventListener("projeto-ativo", ouvir);
    return () => removeEventListener("projeto-ativo", ouvir);
  }, [sheet]);
  const num = String(atual + 1).padStart(2, "0");
  /* O ".n" fica sempre no layout (invisível fora da folha 02) e o "/04" é puxado para trás dele com transform: assim
     nenhum texto do cabeçalho muda de posição no layout quando o ".n" aparece (sem CLS). A largura é medida. */
  const sub = useRef<HTMLSpanElement>(null);
  const [pw, setPw] = useState("2ch");
  useEffect(() => { if (sub.current) setPw(sub.current.offsetWidth + "px"); }, []);
  // A rolagem só entra quando a folha muda depois da montagem; na primeira pintura o número já aparece pronto.
  const montou = useRef(false);
  const [rolar, setRolar] = useState(false);
  useEffect(() => { if (montou.current) setRolar(true); montou.current = true; }, [num]);
  // Cabeçalho sempre visível: depois de 80px de rolagem recebe data-fixo (fundo de papel, 52px). O evento de scroll
  // da janela também dispara com o Lenis, que move a rolagem nativa.
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const h = ref.current!;
    let id = 0;
    const ver = () => h.toggleAttribute("data-fixo", scrollY > 80);
    const onScroll = () => { cancelAnimationFrame(id); id = requestAnimationFrame(ver); };
    ver();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(id); };
  }, []);
  // Menu do celular: fecha ao clicar num link, no Esc ou fora do painel; enquanto aberto, o Tab circula só entre o
  // botão e os links. Ao fechar pelo Esc, o foco volta para o botão.
  const menu = useRef<HTMLDetailsElement>(null);
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const d = menu.current!;
    // Rolagem travada com o menu aberto: classe no <html> (overflow hidden) e aviso para o Lenis parar
    // (SmoothScroll.tsx). Destrava na hora de fechar, antes de o Lenis tratar o clique na âncora.
    const travar = (v: boolean) => { document.documentElement.classList.toggle("menu-aberto", v); dispatchEvent(new CustomEvent("rolagem-travada", { detail: v })); };
    const fechar = (focar: boolean) => { travar(false); d.open = false; if (focar) d.querySelector<HTMLElement>("summary")?.focus(); };
    const alternou = () => { setAberto(d.open); travar(d.open); };
    // Link do menu: na página inicial a navegação é nossa, na ordem certa: fecha o menu e destrava a rolagem
    // primeiro, e só então pede a rolagem até a seção (SmoothScroll.tsx, evento "navegar-ancora"). Deixar para o
    // clique nativo fazia o salto acontecer com a página ainda travada, num pulo só.
    const clique = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest(".menu-veu")) { fechar(false); return; }
      const a = t.closest<HTMLAnchorElement>(".menu-painel a");
      if (!a) return;
      fechar(false);
      if (a.pathname !== location.pathname || !document.getElementById(a.hash.slice(1))) return; // outra página: link normal
      // não deixa o clique chegar ao Lenis (que rolaria de novo, por cima desta) nem ao foco de SmoothScroll:
      // a navegação abaixo já faz as duas coisas
      e.preventDefault(); e.stopPropagation();
      dispatchEvent(new CustomEvent("navegar-ancora", { detail: a.hash.slice(1) }));
    };
    const fora = (e: PointerEvent) => { if (d.open && !d.contains(e.target as Node)) fechar(false); };
    const tecla = (e: KeyboardEvent) => {
      if (!d.open) return;
      if (e.key === "Escape") { e.preventDefault(); fechar(true); return; }
      if (e.key !== "Tab") return;
      const itens = [...d.querySelectorAll<HTMLElement>("summary, .menu-painel a")];
      const i = itens.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); itens[itens.length - 1].focus(); }
      else if (!e.shiftKey && (i === itens.length - 1 || i === -1)) { e.preventDefault(); itens[0].focus(); }
    };
    // ao passar para a largura de desktop o menu some; fecha para não ficar aberto escondido
    const mq = matchMedia("(min-width: 768px)");
    const largura = () => { if (mq.matches) fechar(false); };
    d.addEventListener("toggle", alternou); d.addEventListener("click", clique);
    document.addEventListener("pointerdown", fora); document.addEventListener("keydown", tecla); mq.addEventListener("change", largura);
    return () => { travar(false); d.removeEventListener("toggle", alternou); d.removeEventListener("click", clique); document.removeEventListener("pointerdown", fora); document.removeEventListener("keydown", tecla); mq.removeEventListener("change", largura); };
  }, []);
  return (
    <>
    {/* Reserva os 64px do cabeçalho no fluxo: ele é fixo, então mudar de altura ou sumir não move a página (sem CLS). */}
    <div className="hdr-espaco" aria-hidden="true" />
    <header ref={ref} className="site-header wrap">
      <a href={base || "#topo"} className="logo" aria-label="Renato Thomaz, início">RT</a>
      <nav aria-label="Principal" className="nav">
        <a className="link" href={`${base}#projetos`} aria-current={!sheet && atual === 1 ? "location" : undefined}>Projetos</a>
        <a className="link" href={`${base}#sobre`} aria-current={!sheet && atual === 2 ? "location" : undefined}>Sobre</a>
        <a className="link" href={`${base}#contato`} aria-current={!sheet && atual === 3 ? "location" : undefined}>Contato</a>
      </nav>
      {/* Contador de folha: o número troca rolando, como um contador mecânico. */}
      <span className="mono sheet-no" aria-live="off">
        {sheet ?? <><span className="sheet-rot">Folha </span><span className={`sheet-d${rolar ? " rolar" : ""}`}><span key={num}>{num}</span></span><span ref={sub} className={`sheet-d sheet-p${rolar ? " rolar" : ""}`} data-oculto={atual !== 1 || undefined}><span key={proj}>.{proj}</span></span><span className="sheet-t" data-curto={atual !== 1 || undefined} style={{ "--pw": pw } as React.CSSProperties}>/04</span></>}
      </span>
      <button type="button" className="theme" aria-label="Alternar tema claro e escuro">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" /></svg>
      </button>
      {/* Menu do celular (abaixo de 768px). É um <details>: sem JS abre e fecha sozinho e os links continuam
          acessíveis. Com JS (efeito acima) fecha ao escolher um link, no Esc e ao tocar fora, e prende o foco. */}
      <details ref={menu} className="menu-m">
        <summary className="menu-btn" aria-label={aberto ? "Fechar menu" : "Abrir menu"}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            {aberto ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M2 4.5h12M2 8h12M2 11.5h12" />}
          </svg>
        </summary>
        {/* fundo escurecido atrás do painel; tocar nele fecha o menu */}
        <div className="menu-veu" aria-hidden="true" />
        <nav className="menu-painel" aria-label="Seções">
          {[["01", "Topo", "topo"], ["02", "Projetos", "projetos"], ["03", "Sobre", "sobre"], ["04", "Contato", "contato"]].map(([n, rotulo, id], k) => (
            <a key={id} href={`${base}#${id}`} aria-current={!sheet && atual === k ? "location" : undefined}>
              <span className="mono">{n}</span>{rotulo}
            </a>
          ))}
        </nav>
      </details>
    </header>
    </>
  );
}
