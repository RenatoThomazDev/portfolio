# Etapa 1: Construir os assets com Node
FROM node:20 AS build-assets
WORKDIR /app
COPY package*.json vite.config.js tailwind.config.js postcss.config.js ./
COPY resources ./resources
RUN npm install
RUN npm run build

# Etapa 2: Construir o PHP + Laravel
FROM php:8.2-fpm

# Instalar dependências do sistema e extensões PHP
RUN apt-get update && apt-get install -y unzip git libpng-dev libonig-dev libxml2-dev zip curl \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

WORKDIR /var/www/html

# Copiar arquivos do Laravel
COPY . .

# Copiar assets compilados
COPY --from=build-assets /app/public/build ./public/build

# Instalar dependências PHP
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader

# Corrigir permissões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Porta padrão
EXPOSE 9000

CMD ["php-fpm"]
