FROM php:8.2-apache

# Instala dependências
RUN apt-get update && apt-get install -y unzip git libpng-dev libonig-dev libxml2-dev zip curl

# Copia arquivos
COPY . /var/www/html

# Define diretório de trabalho
WORKDIR /var/www/html

# Instala o Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Instala dependências do Laravel
RUN composer install --no-dev --optimize-autoloader

# Corrige permissões
RUN chmod -R 777 storage bootstrap/cache

# Instala dependências JS e faz o build do Vite
RUN npm install && npm run build


# Expõe a porta
EXPOSE 80

# Inicia o servidor
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=80"]

