# Etapa 1: construir assets com Node
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: rodar Laravel com PHP
FROM php:8.3-apache

WORKDIR /var/www/html/public

# Instalar extensões necessárias
RUN docker-php-ext-install pdo pdo_mysql

# Copiar código da aplicação
COPY --from=build /app /var/www/html

RUN chown -R www-data:www-data /var/www/html

# Configurar permissões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Habilitar mod_rewrite do Apache
RUN a2enmod rewrite

# Expor porta
EXPOSE 80

# Configurar Apache para servir a pasta /public
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf

# Iniciar servidor Apache
CMD ["apache2-foreground"]
