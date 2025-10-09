FROM php:8.2-fpm

# Instala dependências do sistema e Node.js
RUN apt-get update && apt-get install -y \
    git unzip curl nodejs npm

# Copia os arquivos
WORKDIR /var/www/html
COPY . .

# Instala dependências do Laravel e faz build
RUN composer install --no-dev --optimize-autoloader
RUN npm install && npm run build

# Garante permissões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

CMD php artisan serve --host=0.0.0.0 --port=10000
