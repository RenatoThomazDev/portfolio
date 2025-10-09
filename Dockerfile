# Etapa 1 — PHP com Composer para build
FROM composer:2 AS build

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .

# Etapa 2 — PHP com Apache
FROM php:8.2-apache

WORKDIR /var/www/html

# Copia a aplicação construída
COPY --from=build /app ./

# Instala extensões necessárias do Laravel
RUN docker-php-ext-install pdo pdo_mysql

# Ativa o mod_rewrite (importante pro Laravel)
RUN a2enmod rewrite

# Define o DocumentRoot para o diretório public/
COPY ./.docker/vhost.conf /etc/apache2/sites-available/000-default.conf

# Expõe a porta padrão
EXPOSE 80

CMD ["apache2-foreground"]
