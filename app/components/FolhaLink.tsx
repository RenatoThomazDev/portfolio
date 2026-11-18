"use client";

/* Na página do projeto, a imagem e o "Abrir demonstração" abrem a demo com o mesmo voo da folha da home
   (public/folha.js): a origem é a imagem grande (.pg-media) dentro do bloco [data-demo]. Ctrl/Cmd/Shift/Alt, botão do
   meio, movimento reduzido ou o script ausente: link comum. */
type Folha = { pode: () => boolean; decolar: (media: HTMLElement, href: string) => void };

export default function FolhaLink({ href, className, children, ...resto }: { href: string; className: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const click = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const media = e.currentTarget.closest("[data-demo]")?.querySelector<HTMLElement>(".pg-media");
    const folha = (window as unknown as { folha?: Folha }).folha;
    if (!media || !folha || !folha.pode()) return;
    e.preventDefault();
    folha.decolar(media, e.currentTarget.href);
  };
  return <a {...resto} className={className} href={href} onClick={click}>{children}</a>;
}
