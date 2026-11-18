import type { MetadataRoute } from "next";
import { DEMOS, SITE_URL } from "../config/contato";
import { PROJETOS, SERVICOS } from "../config/paginas";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    ...SERVICOS.map((s) => ({ url: `${SITE_URL}/servicos/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...PROJETOS.map((p) => ({ url: `${SITE_URL}/projetos/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...DEMOS.map((d) => ({ url: `${SITE_URL}/demos/${d}`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
