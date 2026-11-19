"use client";
import { decolar } from "./ProjectMedia";

// "Abrir demonstração": a miniatura do mesmo projeto é a origem da transição (se estiver na tela).
// className: na home é o botão primário (btn btn-primary p-link); sem ela, o link de texto de antes.
export default function ProjectLink({ href, className = "link p-link", children }: { href: string; className?: string; children: React.ReactNode }) {
  const click = (e: React.MouseEvent<HTMLAnchorElement>) => decolar(e, e.currentTarget.closest(".project")?.querySelector<HTMLElement>(".p-media"));
  return <a className={className} href={href} onClick={click}>{children}</a>;
}
