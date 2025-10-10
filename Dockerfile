FROM php:8.2-fpm

RUN apt-get update && apt-get install -y nginx supervisor git unzip libpng-dev libjpeg-dev libfreetype6-dev zip
RUN docker-php-ext-install pdo pdo_mysql gd

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Remover config padrão do Nginx
RUN rm -f /etc/nginx/sites-enabled/default

# Copiar código do Laravel
WORKDIR /var/www/html
COPY . .

# Instalar dependências
RUN composer install --no-dev --optimize-autoloader

# Copiar configs
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Permissões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

RUN mkdir -p /var/www/html/database && touch /var/www/html/database/database.sqlite

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
