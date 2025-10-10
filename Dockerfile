# Etapa 1 - Build do Vite/Tailwind
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN rm -rf node_modules public/build
RUN npm install
COPY . .
RUN npm run build

# Etapa 2 - PHP + Apache
FROM php:8.3-apache

# Instalar dependências básicas e extensões PHP
RUN apt-get update && apt-get install -y unzip git \
    && docker-php-ext-install pdo pdo_mysql

# Copiar Composer da imagem oficial
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar tudo, incluindo o build do Vite
COPY --from=build /app /var/www/html

# Instalar dependências Laravel (sem dev)
RUN composer install --no-dev --optimize-autoloader || true

# Copiar .env (se existir no repositório)

# Gerar chave do Laravel (se ainda não existir)
RUN php -r "file_exists('.env') && !str_contains(file_get_contents('.env'), 'APP_KEY=base64:') && file_put_contents('.env', preg_replace('/^APP_KEY=.*/m', 'APP_KEY=' . 'base64:' . base64_encode(random_bytes(32)), file_get_contents('.env')));" || true

# Permissões de pasta
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Corrigir root do Apache para /public
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite

# Expor porta
EXPOSE 80

# Rodar Apache
CMD ["apache2-foreground"]
