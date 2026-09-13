#!/bin/bash
# Installation Suivi Auguste sur Raspberry Pi
set -e

APP_DIR="${HOME}/suiviauguste"
REPO_URL="https://github.com/Loomytunes/suiviauguste.git"

echo "==> Mise à jour du système"
sudo apt update
sudo apt install -y git curl build-essential python3

echo "==> Installation de Node.js 20 (LTS)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "Node: $(node -v) / npm: $(npm -v)"

echo "==> Clonage ou mise à jour du dépôt"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Installation des dépendances"
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

echo "==> Build du frontend"
npm run build

echo "==> Fichier .env (si absent)"
if [ ! -f server/.env ]; then
  cat > server/.env << 'EOF'
PORT=3000
NODE_ENV=production
PARENT_PASSWORD=auguste
# PARENT_EMAIL=
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=
EOF
  echo "Créé server/.env — changez PARENT_PASSWORD !"
fi

echo "==> Service systemd"
SERVICE_USER="$(whoami)"
SERVICE_FILE="/tmp/suivi-auguste.service"
sed "s|/home/pi/suiviauguste|${APP_DIR}|g; s|User=pi|User=${SERVICE_USER}|g" \
  deploy/raspberry/suivi-auguste.service > "$SERVICE_FILE"
# Corriger WorkingDirectory dans le fichier généré
sed -i "s|WorkingDirectory=.*|WorkingDirectory=${APP_DIR}|g" "$SERVICE_FILE"
sed -i "s|EnvironmentFile=.*|EnvironmentFile=-${APP_DIR}/server/.env|g" "$SERVICE_FILE"

sudo cp "$SERVICE_FILE" /etc/systemd/system/suivi-auguste.service
sudo systemctl daemon-reload
sudo systemctl enable suivi-auguste
sudo systemctl restart suivi-auguste

echo ""
echo "✅ Installation terminée"
echo "   App locale : http://$(hostname -I | awk '{print $1}'):3000"
echo "   Statut     : sudo systemctl status suivi-auguste"
echo ""
echo "Étape suivante : Cloudflare Tunnel (voir deploy/raspberry/README.md)"
