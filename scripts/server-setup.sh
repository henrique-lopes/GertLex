#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# GertLex — Server Setup Script
# DigitalOcean Ubuntu 24.04 LTS
# Execute: bash server-setup.sh
# ═══════════════════════════════════════════════════════════════
set -e

# Suprime perguntas interativas do apt
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

DOMAIN="app.gertlex.com.br"
APP_DIR="/var/www/gertlex"
PHP_VERSION="8.3"
REPO="https://github.com/henrique-lopes/GertLex.git"

echo "════════════════════════════════════════"
echo " GertLex — Setup do servidor"
echo "════════════════════════════════════════"

# ── 1. Atualiza o sistema ────────────────────────────────────
echo "→ Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq -o Dpkg::Options::="--force-confold"

# ── 2. Instala dependências base ─────────────────────────────
echo "→ Instalando Nginx, PHP, Redis, MySQL client..."
apt-get install -y -qq \
    nginx \
    redis-server \
    git curl unzip \
    certbot python3-certbot-nginx \
    php${PHP_VERSION}-fpm \
    php${PHP_VERSION}-cli \
    php${PHP_VERSION}-mysql \
    php${PHP_VERSION}-mbstring \
    php${PHP_VERSION}-xml \
    php${PHP_VERSION}-zip \
    php${PHP_VERSION}-curl \
    php${PHP_VERSION}-gd \
    php${PHP_VERSION}-redis \
    php${PHP_VERSION}-intl \
    php${PHP_VERSION}-bcmath

# ── 3. Instala Composer ──────────────────────────────────────
echo "→ Instalando Composer..."
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

# ── 4. Instala Node.js 22 ────────────────────────────────────
echo "→ Instalando Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# ── 5. Cria usuário deploy ───────────────────────────────────
echo "→ Criando usuário deploy..."
id -u deploy &>/dev/null || useradd -m -s /bin/bash deploy
usermod -aG www-data deploy

# ── 6. Clona o repositório ───────────────────────────────────
echo "→ Clonando repositório..."
mkdir -p ${APP_DIR}
git clone ${REPO} ${APP_DIR}
chown -R deploy:www-data ${APP_DIR}
chmod -R 755 ${APP_DIR}
chmod -R 775 ${APP_DIR}/storage
chmod -R 775 ${APP_DIR}/bootstrap/cache

# ── 7. Configura Nginx ───────────────────────────────────────
echo "→ Configurando Nginx..."
cat > /etc/nginx/sites-available/gertlex <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    root ${APP_DIR}/public;
    index index.php;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    client_max_body_size 50M;
}
NGINX

ln -sf /etc/nginx/sites-available/gertlex /etc/nginx/sites-enabled/gertlex
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 8. Configura Supervisor (queue + scheduler) ──────────────
echo "→ Instalando Supervisor..."
apt-get install -y -qq supervisor

cat > /etc/supervisor/conf.d/gertlex-worker.conf <<SUPERVISOR
[program:gertlex-worker]
process_name=%(program_name)s_%(process_num)02d
command=php ${APP_DIR}/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=${APP_DIR}/storage/logs/worker.log
stopwaitsecs=3600

[program:gertlex-scheduler]
command=/bin/bash -c "while true; do php ${APP_DIR}/artisan schedule:run >> ${APP_DIR}/storage/logs/scheduler.log 2>&1; sleep 60; done"
autostart=true
autorestart=true
user=deploy
redirect_stderr=true
stdout_logfile=${APP_DIR}/storage/logs/scheduler.log
SUPERVISOR

supervisorctl reread
supervisorctl update

# ── 9. PHP-FPM tuning ────────────────────────────────────────
sed -i "s/^pm.max_children = .*/pm.max_children = 20/" /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf
sed -i "s/^pm.start_servers = .*/pm.start_servers = 4/" /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf
sed -i "s/^pm.min_spare_servers = .*/pm.min_spare_servers = 2/" /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf
sed -i "s/^pm.max_spare_servers = .*/pm.max_spare_servers = 8/" /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf
systemctl restart php${PHP_VERSION}-fpm

echo ""
echo "════════════════════════════════════════"
echo " ✅ Servidor configurado!"
echo ""
echo " Próximos passos:"
echo " 1. Copie o .env.example para .env e preencha"
echo " 2. php artisan key:generate"
echo " 3. php artisan migrate --seed"
echo " 4. certbot --nginx -d ${DOMAIN}"
echo "════════════════════════════════════════"
