# Imagem base com PHP, Composer e extensões necessárias
FROM richarvey/nginx-php-fpm:latest

# Define diretório de trabalho
WORKDIR /var/www/html

# Copia todos os arquivos do Laravel
COPY . /var/www/html

# Instala dependências do Composer
RUN composer install --no-dev --optimize-autoloader

# Gera chave do Laravel
RUN php artisan key:generate

# Corrige permissões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Define variáveis de ambiente do Laravel
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV APP_URL=https://portfolio_js8.onrender.com

# Build dos assets (caso use Laravel Mix ou Vite)
RUN npm install && npm run build

# Expõe a porta 80
EXPOSE 80

# Inicia Nginx e PHP-FPM via supervisord
CMD ["supervisord", "-n", "-c", "/etc/supervisord.conf"]
