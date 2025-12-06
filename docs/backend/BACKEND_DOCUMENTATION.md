# Backend - IoT Desalinasi Monitoring

## 📋 Overview
Panduan lengkap untuk pengembangan, setup, dan monitoring backend sistem IoT Desalinasi. Backend ini mendukung mode **Mock Data** (tanpa database) dan mode **Production** (dengan MySQL).

---

## 📁 Struktur Project

```
backend/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   ├── controllers/
│   │   ├── sensorController.js   # Request handlers + Mock Data
│   │   └── LoggerController.js   # Background logger control
│   ├── routes/
│   │   └── index.js              # API routes definition
│   ├── services/
│   │   ├── DataService.js        # Data service (Database/Mock abstraction)
│   │   └── BackgroundLogger.js   # Background logging service
│   ├── models/
│   │   └── SensorData.js         # Sequelize model
│   └── config/
│       └── database.js           # Database configuration
├── database/                     # SQL Scripts
├── .env                          # Environment variables
└── package.json
```

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Buat file `.env` di folder `backend/`:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=iot_desalinasi
DB_PORT=3306
```

### 3. Running the Server

**Development Mode (Auto-restart):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

---

## 🔌 API Endpoints

### Sensor Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sensors` | Get all sensor data (supports filters) |
| `POST` | `/api/sensors` | Create new sensor data entry |
| `DELETE` | `/api/sensors/:id` | Delete specific data by ID |
| `DELETE` | `/api/sensors` | Delete ALL sensor data |
| `DELETE` | `/api/sensors/compartment/:id` | Delete data by compartment ID |
| `DELETE` | `/api/sensors/interval/:interval` | Delete data by interval (e.g., 5s) |

#### Query Parameters (GET /api/sensors):
- `limit`: Number of records (default: 100)
- `compartment`: Filter by compartment ID (1-6)
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)

### Logger Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/logger/status` | Get background logger status |
| `POST` | `/api/logger/start` | Start background logger |
| `POST` | `/api/logger/stop` | Stop background logger |
| `POST` | `/api/logger/config` | update logger interval |

### Database Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/database/status` | Check database health & size |

---

## 📊 Database Monitoring System

Sistem ini menggantikan auto-delete. Backend akan memonitor ukuran database dan memberikan warning.

### Status Thresholds
| Status | Jumlah Records | Aksi |
|--------|---------------|------|
| **OK** | < 100,000 | Normal |
| **WARNING** | 100,000 - 499,999 | Pertimbangkan hapus data lama |
| **CRITICAL** | ≥ 500,000 | Segera hapus data lama |

### Setup Monitoring
Jalankan script `backend/database/database_monitoring.sql` di MySQL untuk mengaktifkan fitur ini.

---

## 🎭 Mock Data Mode

Jika database tidak terhubung, server otomatis masuk ke **Mock Data Mode**.

**Karakteristik Mock Data:**
- Data disimpan di memory (hilang saat restart)
- Generate 50 data awal
- Random values untuk suhu dan kelembapan
- Mendukung semua operasi CRUD (Create, Read, Update, Delete)

---

## 🛠️ Testing

### Manual Testing (cURL)

**Get All Data:**
```bash
curl http://localhost:3000/api/sensors
```

**Create Data:**
```bash
curl -X POST http://localhost:3000/api/sensors \
  -H "Content-Type: application/json" \
  -d "{\"compartment_id\":1,\"temperature_air\":27.5,\"humidity_air\":65.3,\"temperature_water\":22.8}"
```

**Check DB Status:**
```bash
curl http://localhost:3000/api/database/status
```

---

## 🔒 Security Best Practices
- Selalu validasi input di sisi server
- Gunakan `.env` untuk kredensial sensitif
- Sanitasi input untuk mencegah SQL Injection (sudah ditangani oleh Sequelize)
