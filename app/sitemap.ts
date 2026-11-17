import type { MetadataRoute } from "next";
import { DEMOS, SITE_URL } from "../config/contato";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    ...DEMOS.map((d) => ({ url: `${SITE_URL}/demos/${d}`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
