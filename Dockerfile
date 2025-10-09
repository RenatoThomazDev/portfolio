# -----------------------------
# Etapa 1: build do Laravel + dependências
# -----------------------------
FROM php:8.2-fpm AS build

# Instala extensões necessárias e Composer
RUN apt-get update && apt-get install -y \
    git zip unzip curl libpng-dev libonig-dev libxml2-dev && \
    docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd

# Instala o Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copia os arquivos do projeto para dentro do container
WORKDIR /var/www/html
COPY . .

# Instala dependências do Laravel
RUN composer install --no-dev --optimize-autoloader

# Gera cache do Laravel
RUN php artisan config:cache && php artisan route:cache && php artisan view:cache

# -----------------------------
# Etapa 2: ambiente de produção com servidor Nginx
# -----------------------------
FROM nginx:alpine

# Copia os arquivos do Laravel do container anterior
COPY --from=build /var/www/html /var/www/html

# Copia configuração do Nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta padrão do Nginx
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
