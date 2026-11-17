import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Miniaturas servidas em AVIF (ou WebP), no tamanho de cada tela.
  // qualities: só 75 (miniaturas e foto do Sobre); o Next 15 avisa quando "quality" não está na lista.
  images: { formats: ["image/avif", "image/webp"], deviceSizes: [390, 640, 768, 1024, 1280, 1600, 1920], qualities: [75] },
  // Endereços antigos das demonstrações (quando eram arquivos em /public) continuam funcionando.
  redirects: async () => [{ source: "/demos/:demo/index.html", destination: "/demos/:demo", permanent: true }],
};

export default nextConfig;
