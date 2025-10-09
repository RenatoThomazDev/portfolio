# Etapa 1 - Build com Composer
FROM composer:2 AS build

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .

# Etapa 2 - PHP + Apache
FROM php:8.2-apache

WORKDIR /var/www/html

# Copia a aplicação do build
COPY --from=build /app /var/www/html

# Instala extensões necessárias
RUN docker-php-ext-install pdo pdo_mysql

# Ativa o mod_rewrite (necessário para Laravel)
RUN a2enmod rewrite

# Define o DocumentRoot para o diretório public/
COPY ./.docker/vhost.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 80

CMD ["apache2-foreground"]
