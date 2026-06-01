#!/bin/bash
# deploy_server.sh — Configuración en el servidor mariandev
# Se ejecuta DENTRO del servidor después de copiar el proyecto.

set -e
APP_DIR="/home/$USER/amvet"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIST="$APP_DIR/frontend/dist"

echo "===== [1/6] Actualizando paquetes del sistema ====="
sudo apt-get update -y && sudo apt-get install -y python3 python3-pip python3-venv nginx

echo "===== [2/6] Instalando dependencias Python ====="
cd "$BACKEND_DIR"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "===== [3/6] Configurando nginx para el frontend ====="
sudo tee /etc/nginx/sites-available/amvet > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    root /home/USERPLACEHOLDER/amvet/frontend/dist;
    index index.html;

    # Frontend (React SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

# Sustituir USERPLACEHOLDER por el usuario real
sudo sed -i "s/USERPLACEHOLDER/$USER/g" /etc/nginx/sites-available/amvet
sudo ln -sf /etc/nginx/sites-available/amvet /etc/nginx/sites-enabled/amvet
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "===== [4/6] Creando servicio systemd para el backend ====="
sudo tee /etc/systemd/system/amvet-backend.service > /dev/null <<UNIT
[Unit]
Description=AMVet FastAPI Backend
After=network.target

[Service]
User=$USER
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
ExecStart=$BACKEND_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

echo "===== [5/6] Habilitando e iniciando servicios ====="
sudo systemctl daemon-reload
sudo systemctl enable amvet-backend
sudo systemctl restart amvet-backend

echo "===== [6/6] Estado final ====="
sudo systemctl status amvet-backend --no-pager
echo ""
echo "✅  Despliegue completado."
echo "   Frontend: http://$(curl -s ifconfig.me)"
echo "   Backend API: http://$(curl -s ifconfig.me):8000"
echo "   Admin login: admin@amvet.bo / admin123"
