"use client";
import { decolar } from "./ProjectMedia";

// "Abrir demonstração": a miniatura do mesmo projeto é a origem da transição (se estiver na tela).
export default function ProjectLink({ href, children }: { href: string; children: React.ReactNode }) {
  const click = (e: React.MouseEvent<HTMLAnchorElement>) => decolar(e, e.currentTarget.closest(".project")?.querySelector<HTMLElement>(".p-media"));
  return <a className="link p-link" href={href} onClick={click}>{children}</a>;
}
