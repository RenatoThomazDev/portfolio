import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// theme-color dos dois temas fica nas metatags (layout.tsx, viewport.themeColor); o manifest aceita uma cor só.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Renato Thomaz | Sites, sistemas e automações",
    short_name: "Renato Thomaz",
    description: "Portfólio de Renato Thomaz, desenvolvedor Full Stack PHP/Laravel.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#F3EBD8",
    theme_color: "#F3EBD8",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icone-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icone-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
