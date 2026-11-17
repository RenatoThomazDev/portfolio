# Portfólio (Next.js 15) em produção: build numa etapa, imagem final só com o necessário para "next start".
# NEXT_PUBLIC_SITE_URL entra no build (o Next grava variáveis NEXT_PUBLIC_ no código), por isso é argumento de build.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3010
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# sem "npm prune --omit=dev": o next start lê o next.config.ts e precisa do typescript (senão tenta instalá-lo ao subir)
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3010
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/demos ./demos
COPY --from=build /app/next.config.ts ./
USER node
EXPOSE 3010
CMD ["npx", "next", "start", "-p", "3010"]
