#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# LexFlow — Primeiro deploy (rode uma vez após server-setup.sh)
# Execute como usuário deploy: bash first-deploy.sh
# ═══════════════════════════════════════════════════════════════
set -e

APP_DIR="/var/www/lexflow"
cd ${APP_DIR}

echo "→ Instalando dependências PHP..."
composer install --no-dev --optimize-autoloader --no-interaction

echo "→ Copiando .env..."
cp .env.example .env

echo ""
echo "⚠️  EDITE O ARQUIVO .env AGORA antes de continuar!"
echo "   nano ${APP_DIR}/.env"
echo ""
read -p "Pressione ENTER após editar o .env..."

echo "→ Gerando APP_KEY..."
php artisan key:generate

echo "→ Rodando migrations..."
php artisan migrate --force

echo "→ Linkando storage..."
php artisan storage:link

echo "→ Cacheando config/rotas/views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "→ Ajustando permissões..."
chown -R deploy:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo ""
echo "✅ Primeiro deploy concluído!"
echo "   Acesse: https://$(grep APP_URL .env | cut -d= -f2)"
