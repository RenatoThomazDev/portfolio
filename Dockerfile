# Etapa 1: build do Laravel + Vite
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: PHP + Nginx
FROM php:8.2-fpm

# Instala dependências necessárias
RUN apt-get update && apt-get install -y nginx zip unzip curl git

# Configura diretório de trabalho
WORKDIR /var/www/html

# Copia código e build
COPY . .
COPY --from=build /app/public/build /var/www/html/public/build

# Instala dependências do Composer
RUN curl -sS https://getcomposer.org/installer | php && \
    php composer.phar install --no-dev --optimize-autoloader

# Configura nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta esperada pelo Render
EXPOSE 10000

# Define variável de ambiente de porta
ENV PORT=10000

# Inicia PHP-FPM e Nginx juntos
CMD service nginx start && php-fpm
