#!/usr/bin/env bash
# Exit on error
set -o errexit

# Instala dependências PHP
composer install --no-dev --optimize-autoloader

# Gera cache do Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Corrige permissões (principal)
chmod -R 777 storage bootstrap/cache
