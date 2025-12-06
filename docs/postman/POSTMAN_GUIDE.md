# Panduan Postman API & Integrasi - IoT Desalinasi

## 📚 Overview
Panduan ini mencakup cara menggunakan Postman untuk testing API, daftar endpoint terbaru, dan cara integrasi dengan frontend/ESP32.

**Link Dokumentasi Published:**
[https://documenter.getpostman.com/view/50456447/2sB3dMvpvC](https://documenter.getpostman.com/view/50456447/2sB3dMvpvC) (*Pastikan untuk menggunakan versi terbaru dari collection lokal*)

---

## 🛠️ Setup Postman

### 1. Import Collection & Environment
File terletak di folder ini:
- `ESP32_IoT_API.postman_collection.json` (Koleksi API)
- `ESP32_IoT_Local.postman_environment.json` (Environment Variable)

**Langkah-langkah:**
1. Buka Postman.
2. Klik **Import** -> Upload kedua file tersebut.
3. Di pojok kanan atas, pilih Environment **"ESP32 IoT Local"**.

---

## 📡 Daftar Endpoint Lengkap

### 1. Sensor Data
CRUD operasi untuk data sensor.

| Method | Endpoint | Deskripsi | Query Params |
|--------|----------|-----------|--------------|
| `GET` | `/sensors` | Ambil semua data | `limit`, `compartment` |
| `POST` | `/sensors` | Simpan data baru | - |
| `DELETE`| `/sensors/:id` | Hapus satu data | - |
| `DELETE`| `/sensors` | Hapus SEMUA data | - |
| `DELETE`| `/sensors/interval/:seconds` | Hapus berdasarkan interval (misal: 5s) | - |
| `DELETE`| `/sensors/compartment/:id` | Hapus berdasarkan compartment | - |

**Contoh URL:** `{{base_url}}/api/sensors?compartment=1`

### 2. Background Logger
Mengontrol proses logging otomatis di server.

| Method | Endpoint | Deskripsi | Body (JSON) |
|--------|----------|-----------|-------------|
| `GET` | `/logger/status` | Cek status running/stopped | - |
| `POST` | `/logger/start` | Mulai logging background | - |
| `POST` | `/logger/stop` | Stop logging | - |
| `POST` | `/logger/config` | Ubah interval logging | `{"interval": 5000}` |

### 3. Database Status
Monitoring kesehatan database.

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/database/status` | Cek ukuran & jumlah record DB |

---

## 🧪 Skenario Testing

### Skenario 1: Simpan Data Sensor (ESP32 Simulation)
**Request:** `POST {{base_url}}/api/sensors`
**Body:**
```json
{
  "compartment_id": 1,
  "temperature_air": 28.5,
  "humidity_air": 65.0,
  "temperature_water": 23.5
}
```
**Harapan:** Response 201 Created.

### Skenario 2: Hapus Data "Sampah" (Interval Cepat)
Jika Anda ingin membersihkan data yang direkam setiap 5 detik:
**Request:** `DELETE {{base_url}}/api/sensors/interval/5`
**Harapan:** Semua data dengan interval 5 detik terhapus.

---

## 🏗️ Integrasi Frontend & ESP32

### Frontend (React/Axios)
```javascript
const api = axios.create({
    baseURL: 'http://localhost:3000/api'
});

// Ambil data
const response = await api.get('/sensors?limit=10');

// Start Logger
await api.post('/logger/start');
```

### ESP32 (C++)
```cpp
// Kirim data sensor
HTTPClient http;
http.begin("http://192.168.1.100:3000/api/sensors");
http.addHeader("Content-Type", "application/json");
http.POST("{\"compartment_id\":1...}");
```

---

## 📝 Catatan Penting
- Pastikan backend berjalan (`npm start` atau `npm run dev`).
- Jika database belum disetup, backend akan menggunakan **Mock Data** (data palsu sementara).
- Postman Collection di folder ini sudah diupdate dengan endpoint terbaru (Logger & Delete Interval).
