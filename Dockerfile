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

# Instala o Nginx e o Supervisor (para rodar múltiplos serviços)
RUN apt-get update && apt-get install -y nginx supervisor

WORKDIR /var/www/html
COPY --from=build /var/www/html /var/www/html

# Copia o Nginx e configuração do Supervisor
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /var/log/supervisor
COPY ./supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Ajusta permissões
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE ${PORT}

# Inicia o Nginx + PHP-FPM via Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
