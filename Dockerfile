# Etapa 1 - build do Laravel (composer + npm)
FROM php:8.2-fpm AS build

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    git unzip curl nodejs npm nginx supervisor

# Copia os arquivos do projeto
WORKDIR /var/www/html
COPY . .

# Instala dependências do Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --no-dev --optimize-autoloader

# Gera build dos assets do Vite
RUN npm install && npm run build

# Etapa 2 - container final
FROM php:8.2-fpm

# Instala dependências
RUN apt-get update && apt-get install -y nginx supervisor curl git unzip libpng-dev libjpeg-dev libfreetype6-dev libzip-dev zip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd zip

# Copia o código
WORKDIR /var/www/html
COPY . .

# Copia configs de nginx e supervisord
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./supervisord.conf /etc/supervisord.conf

# Instala dependências Laravel
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader

# Corrige permissões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expõe a porta usada pelo Render
EXPOSE 10000

# Inicia o supervisor (que gerencia nginx + php-fpm)
CMD ["supervisord", "-c", "/etc/supervisord.conf"]

