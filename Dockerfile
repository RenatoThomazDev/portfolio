FROM php:8.2-fpm

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev nodejs npm

# Copiar os arquivos do projeto
WORKDIR /var/www/html
COPY . .

# Instalar dependências do PHP
RUN curl -sS https://getcomposer.org/installer | php && \
    php composer.phar install --no-dev --optimize-autoloader

# Criar arquivo de banco e cache
RUN mkdir -p /var/www/html/database && touch /var/www/html/database/database.sqlite

# Build do front-end
RUN npm install && npm run build

# Permissões
RUN chown -R www-data:www-data /var/www/html

# Configurar o supervisor
CMD ["php-fpm"]
