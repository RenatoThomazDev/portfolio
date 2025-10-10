FROM node:18 AS build-frontend
WORKDIR /app
COPY package*.json ./   
RUN npm install
COPY . .
RUN npm run build

FROM php:8.2-fpm

# Instalar dependências
RUN apt-get update && apt-get install -y nginx supervisor git unzip libpng-dev libjpeg-dev libfreetype6-dev zip

# Configurar extensões do PHP necessárias
RUN docker-php-ext-install pdo pdo_mysql gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Remover configuração padrão do nginx
RUN rm -f /etc/nginx/sites-enabled/default

COPY --from=build-frontend /app /var/www/html


# Copiar os arquivos do projeto Laravel
WORKDIR /var/www/html
COPY . .

# Instalar dependências do Laravel
RUN apt-get update && apt-get install -y nginx supervisor \
    && rm -rf /var/lib/apt/lists/*
RUN curl -sS https://getcomposer.org/installer | php && mv composer.phar /usr/local/bin/composer
RUN composer install --no-dev --optimize-autoloader


# Copiar configuração personalizada do nginx e do supervisor
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf



# Dar permissão nas pastas de cache e storage
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expor porta 80
EXPOSE 80

RUN mkdir -p /var/www/html/database && touch /var/www/html/database/database.sqlite

# Iniciar os dois serviços
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
