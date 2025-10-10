# Etapa 1: Build dos assets com Node
FROM node:20 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: PHP + Nginx + Supervisor
FROM php:8.2-fpm

RUN apt-get update && apt-get install -y nginx supervisor git unzip libpng-dev libjpeg-dev libfreetype6-dev zip \
    && docker-php-ext-install pdo pdo_mysql gd

# Instalar Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Remover config padrão do Nginx
RUN rm -f /etc/nginx/sites-enabled/default

# Copiar código Laravel
WORKDIR /var/www/html
COPY . .

# Copiar os assets buildados do Vite/Tailwind
COPY --from=frontend /app/public/build /var/www/html/public/build

# Instalar dependências do Laravel
RUN composer install --no-dev --optimize-autoloader

# Copiar configs personalizadas
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Corrigir permissões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Criar banco sqlite se necessário
RUN mkdir -p /var/www/html/database && touch /var/www/html/database/database.sqlite

# Expor porta padrão do Nginx
EXPOSE 80

# Iniciar supervisor (gerencia nginx + php-fpm)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
