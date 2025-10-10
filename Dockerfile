# Etapa 1: build do frontend
FROM node:18 AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: servidor PHP
FROM php:8.2-fpm

# Instalar extensões necessárias do Laravel
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/html

# Copiar arquivos da app e build do Vite
COPY --from=build-frontend /app /var/www/html

# Instalar dependências do PHP
RUN apt-get update && apt-get install -y nginx supervisor \
    && rm -rf /var/lib/apt/lists/*
RUN curl -sS https://getcomposer.org/installer | php && mv composer.phar /usr/local/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Configurar Nginx e Supervisor
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
