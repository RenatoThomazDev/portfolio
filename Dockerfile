# Etapa 1 - Build do Vite/Tailwind
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN rm -rf node_modules public/build
RUN npm install
COPY . .
RUN npm run build

FROM php:8.3-apache

# Instalar dependências do sistema e extensões PHP
RUN apt-get update && apt-get install -y unzip git \
    && docker-php-ext-install pdo pdo_mysql

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar app completo, incluindo o build
COPY --from=build /app /var/www/html

# Instalar dependências do Laravel
RUN composer install --no-dev --optimize-autoloader

# Corrigir permissões
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Corrigir root do Apache para /public
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite

EXPOSE 80

CMD ["apache2-foreground"]
