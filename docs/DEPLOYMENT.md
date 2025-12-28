# 🚀 Deployment Guide - Eye Exam YOLO System

## **Opsi 1: Docker Compose (Recommended)**

### Prerequisites:
- Docker & Docker Compose installed
- `.env` file configured with:
  ```
  SUPABASE_URL=your_url
  SUPABASE_KEY=your_key
  ```

### Start Production:
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Akses:** 
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:5000
- Detection API: http://localhost:5001

### Service Dependencies:
```
Frontend (3000)
    ↓ depends on
Backend (5000)
    ↓ depends on
Detection API (5001)
```

---

## **Opsi 2: Systemd Services (Linux Server)**

Untuk production server yang tidak pakai Docker:

### 1. Create service files:

**`/etc/systemd/system/yolo-detection.service`:**
```ini
[Unit]
Description=YOLO Face Detection API
After=network.target
Requires=yolo-backend.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/app/backend/yolo
ExecStart=/usr/bin/python3 detection_api_v2.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**`/etc/systemd/system/yolo-backend.service`:**
```ini
[Unit]
Description=Eye Exam Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/app/backend
ExecStart=/usr/bin/node server.js
Environment="NODE_ENV=production"
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**`/etc/systemd/system/yolo-frontend.service`:**
```ini
[Unit]
Description=Eye Exam Frontend
After=network.target
Requires=yolo-backend.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/app/frontend
ExecStart=/usr/bin/npm run start
Environment="NODE_ENV=production"
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Enable & start services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable yolo-detection yolo-backend yolo-frontend
sudo systemctl start yolo-detection yolo-backend yolo-frontend

# Check status
sudo systemctl status yolo-detection
sudo systemctl status yolo-backend
sudo systemctl status yolo-frontend
```

---

## **Opsi 3: PM2 (Node.js Process Manager)**

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem.config.js in root directory
```

**`ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [
    {
      name: 'backend',
      script: './backend/server.js',
      env: { NODE_ENV: 'production' },
      instances: 'max',
      exec_mode: 'cluster'
    },
    {
      name: 'frontend',
      script: './frontend/dist/index.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'detection-api',
      script: './backend/yolo/detection_api_v2.py',
      interpreter: 'python3',
      env: { FLASK_ENV: 'production' }
    }
  ]
};
```

Start:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## **Environment Variables (.env)**

Template untuk semua deployment options:

```env
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJhbGc...

# Backend
NODE_ENV=production
PORT=5000
FLASK_API_URL=http://localhost:5001

# Frontend
VITE_API_URL=http://your-domain.com

# Python Detection API
FLASK_ENV=production
CUDA_VISIBLE_DEVICES=0
```

---

## **Health Checks**

Verify all services running:

```bash
# Backend health
curl http://localhost:5000/health

# Detection API health
curl http://localhost:5001/health

# Frontend
curl http://localhost:3000
```

---

## **Troubleshooting**

### Detection API tidak konek:
```bash
# Check logs
docker-compose logs detection-api

# Restart service
docker-compose restart detection-api
```

### Port conflict:
```bash
# Change port di docker-compose.yml
# ports:
#   - "8001:5001"
```

### Database/Supabase issue:
```bash
# Check .env variables
cat .env

# Verify connection
curl $SUPABASE_URL
```

---

## **Summary**

| Metode | Untuk | Command |
|--------|-------|---------|
| **Docker Compose** | VPS/Cloud | `docker-compose up -d` |
| **Systemd** | Linux Server | `systemctl start yolo-*` |
| **PM2** | Simple Server | `pm2 start ecosystem.config.js` |

**Recommended: Docker Compose** - Paling mudah, scalable, dan production-ready!
