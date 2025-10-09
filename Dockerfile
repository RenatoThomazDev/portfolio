# -----------------------------
# Base PHP com FPM
# -----------------------------
FROM php:8.2-fpm

# Instalar dependências e extensões PHP
RUN apt-get update && apt-get install -y \
    nginx supervisor git zip unzip curl libpng-dev libonig-dev libxml2-dev && \
    docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Definir diretório de trabalho
WORKDIR /var/www/html

# Copiar projeto Laravel
COPY . .

# Instalar dependências Laravel
RUN composer install --no-dev --optimize-autoloader

# Criar cache do Laravel
RUN php artisan config:cache && php artisan route:cache && php artisan view:cache

# Copiar configuração do Nginx e Supervisor
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Permissões para o Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
    

# Expor porta 80
EXPOSE 80

# Comando inicial
CMD ["/usr/bin/supervisord"]
