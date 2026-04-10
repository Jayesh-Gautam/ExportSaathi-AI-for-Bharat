#!/bin/bash
set -e

# ExportSaathi AWS EC2 Deployment Script
# ----------------------------------------------------
# Usage: ./deploy.sh
# ----------------------------------------------------

echo "🚀 Starting ExportSaathi Deployment on AWS EC2..."

# 1. System Updates & Dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv nginx curl git redis-server

echo "🗄️ Starting Redis Server..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 2. Node.js Installation
echo "🟢 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Backend Setup
echo "🐍 Setting up Backend (FastAPI)..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "⚠️ .env not found in backend. Copying from .env.example..."
    cp .env.example .env
    echo "🚨 IMPORTANT: Please edit backend/.env with your AWS credentials!"
fi

# Setup systemd service for FastAPI
echo "⚙️ Configuring systemd service for backend..."
cat << 'EOF' | sudo tee /etc/systemd/system/exportsaathi.service
[Unit]
Description=ExportSaathi FastAPI Backend
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/ExportSaathi-AI-for-Bharat/backend
Environment="PATH=/home/ubuntu/ExportSaathi-AI-for-Bharat/backend/venv/bin"
EnvironmentFile=/home/ubuntu/ExportSaathi-AI-for-Bharat/backend/.env
ExecStart=/home/ubuntu/ExportSaathi-AI-for-Bharat/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4

Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable exportsaathi.service
sudo systemctl restart exportsaathi.service

# 4. Frontend Setup
echo "⚛️ Setting up Frontend (React/Vite)..."
cd ../frontend
npm install
echo "🏗️ Building frontend..."
npm run build

# 5. Nginx Configuration
echo "🌐 Configuring Nginx Reverse Proxy..."
cd ..
sudo cp nginx.conf /etc/nginx/sites-available/exportsaathi
sudo ln -sf /etc/nginx/sites-available/exportsaathi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx

echo "✅ Deployment Complete! ExportSaathi is now running on port 80."
echo "👉 Make sure to allow HTTP (80) traffic in your EC2 Security Group."
echo "👉 Don't forget to add your AWS access keys to backend/.env and restart the backend:"
echo "   sudo systemctl restart exportsaathi.service"
