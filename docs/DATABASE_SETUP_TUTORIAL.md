# Tutorial Setup Database MySQL untuk IoT Desalinasi

## 📋 Daftar Isi
1. [Instalasi XAMPP](#1-instalasi-xampp)
2. [Konfigurasi MySQL](#2-konfigurasi-mysql)
3. [Membuat Database](#3-membuat-database)
4. [Membuat Tabel](#4-membuat-tabel)
5. [Konfigurasi Backend](#5-konfigurasi-backend)
6. [Testing Koneksi](#6-testing-koneksi)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Instalasi XAMPP

### Download XAMPP
1. Buka browser dan kunjungi: https://www.apachefriends.org/
2. Klik tombol **Download** untuk Windows
3. Pilih versi terbaru (disarankan versi 8.x atau lebih tinggi)
4. Tunggu hingga download selesai (~150 MB)

### Install XAMPP
1. **Jalankan installer** yang sudah didownload
2. Jika muncul **User Account Control**, klik **Yes**
3. Jika muncul peringatan antivirus, klik **OK**
4. **Setup Wizard:**
   - Klik **Next**
   - Pilih komponen yang akan diinstall (pastikan **MySQL** dan **phpMyAdmin** tercentang)
   - Klik **Next**
5. **Pilih lokasi instalasi:**
   - Default: `C:\xampp`
   - Klik **Next**
6. **Bahasa:**
   - Pilih **English**
   - Klik **Next**
7. Klik **Next** untuk memulai instalasi
8. Tunggu proses instalasi selesai (±5 menit)
9. **Uncheck** "Do you want to start the Control Panel now?" (kita akan jalankan manual)
10. Klik **Finish**

### Menjalankan XAMPP
1. Buka **XAMPP Control Panel** dari Start Menu atau Desktop
2. Klik tombol **Start** di samping **Apache**
3. Klik tombol **Start** di samping **MySQL**
4. Tunggu hingga kedua service berwarna **hijau**

**Status yang benar:**
```
Apache  [Running] [Port: 80, 443]
MySQL   [Running] [Port: 3306]
```

> ⚠️ **Troubleshooting Port:**
> - Jika Apache error karena port 80 digunakan Skype/IIS, ubah port di Config → httpd.conf
> - Jika MySQL error karena port 3306 digunakan, ubah port di Config → my.ini

---

## 2. Konfigurasi MySQL

### Mengakses phpMyAdmin
1. Pastikan **Apache** dan **MySQL** sudah running
2. Buka browser (Chrome/Firefox/Edge)
3. Ketik di address bar: `http://localhost/phpmyadmin`
4. Tekan **Enter**
5. Anda akan masuk ke halaman phpMyAdmin

### Login phpMyAdmin
- **Username:** `root`
- **Password:** *(kosongkan, default tidak ada password)*
- Klik **Go** atau tekan Enter

> 💡 **Tips Keamanan:**
> Untuk production, sebaiknya set password untuk user root. Tapi untuk development lokal, password kosong sudah cukup.

---

## 3. Membuat Database

### Cara 1: Menggunakan phpMyAdmin (GUI)

1. Di phpMyAdmin, klik tab **Databases** di menu atas
2. Di bagian **Create database:**
   - **Database name:** `iot_desalinasi`
   - **Collation:** `utf8mb4_general_ci` (default)
3. Klik tombol **Create**
4. Database baru akan muncul di sidebar kiri

### Cara 2: Menggunakan SQL Query

1. Klik tab **SQL** di menu atas
2. Ketik query berikut:
```sql
CREATE DATABASE iot_desalinasi 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;
```
3. Klik tombol **Go**
4. Akan muncul pesan sukses: "Database iot_desalinasi has been created"

---

## 4. Membuat Tabel

### Pilih Database
1. Di sidebar kiri, klik database **iot_desalinasi**
2. Database akan terbuka dan menampilkan "No tables found in database"

### Buat Tabel sensor_data

#### Cara 1: Menggunakan SQL Query (Disarankan)

1. Klik tab **SQL**
2. Copy-paste query berikut:

```sql
CREATE TABLE `sensor_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `compartment_id` int(11) NOT NULL,
  `temperature_air` float NOT NULL,
  `humidity_air` float NOT NULL,
  `temperature_water` float NOT NULL,
  `interval` int(11) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_compartment` (`compartment_id`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

3. Klik **Go**
4. Tabel berhasil dibuat!

#### Cara 2: Menggunakan GUI

1. Klik **Create table**
2. **Name:** `sensor_data`
3. **Number of columns:** `7`
4. Klik **Go**
5. Isi kolom-kolom berikut:

| Name | Type | Length/Values | Default | Attributes | Null | Index | A_I |
|------|------|---------------|---------|------------|------|-------|-----|
| id | INT | 11 | None | UNSIGNED | ❌ | PRIMARY | ✅ |
| compartment_id | INT | 11 | None | | ❌ | INDEX | ❌ |
| temperature_air | FLOAT | | None | | ❌ | | ❌ |
| humidity_air | FLOAT | | None | | ❌ | | ❌ |
| temperature_water | FLOAT | | None | | ❌ | | ❌ |
| interval | INT | 11 | NULL | | ✅ | | ❌ |
| timestamp | DATETIME | | CURRENT_TIMESTAMP | | ❌ | INDEX | ❌ |

6. Klik **Save**

### Verifikasi Tabel
1. Klik nama tabel **sensor_data** di sidebar
2. Klik tab **Structure**
3. Pastikan semua kolom sudah sesuai

---

## 5. Konfigurasi Backend

### Buat File .env

1. Buka folder backend: `d:\IoT destilasi\Programing\backend`
2. Buat file baru bernama `.env` (gunakan text editor atau VS Code)
3. Isi dengan konfigurasi berikut:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=iot_desalinasi

# Server Configuration
PORT=3000
```

### Penjelasan Konfigurasi:
- **DB_HOST:** `localhost` (karena MySQL di komputer yang sama)
- **DB_USER:** `root` (default user XAMPP)
- **DB_PASSWORD:** *(kosong, karena default XAMPP tidak pakai password)*
- **DB_NAME:** `iot_desalinasi` (nama database yang kita buat)
- **PORT:** `3000` (port untuk backend server)

> ⚠️ **Penting:** File `.env` sudah ada di `.gitignore`, jadi tidak akan ter-commit ke Git (aman untuk kredensial)

---

## 6. Testing Koneksi

### Test 1: Jalankan Backend

1. Buka **Command Prompt** atau **Terminal**
2. Masuk ke folder backend:
```bash
cd "d:\IoT destilasi\Programing\backend"
```

3. Install dependencies (jika belum):
```bash
npm install
```

4. Jalankan backend:
```bash
npm start
```

5. **Output yang benar:**
```
✅ Database connected and synced
🚀 Server is running on http://localhost:3000
📡 API available at http://localhost:3000/api
```

6. **Jika ada error:**
```
⚠️  Database connection failed: [Error message]
⚠️  Server will run without database (using mock data)
```
→ Cek troubleshooting di bawah

### Test 2: Insert Data Manual

1. Buka phpMyAdmin → database `iot_desalinasi` → tabel `sensor_data`
2. Klik tab **Insert**
3. Isi data test:
   - **compartment_id:** `1`
   - **temperature_air:** `27.5`
   - **humidity_air:** `65.0`
   - **temperature_water:** `22.3`
   - **interval:** `5`
   - **timestamp:** *(biarkan default)*
4. Klik **Go**
5. Data berhasil ditambahkan!

### Test 3: Test API dengan Browser

1. Pastikan backend sudah running
2. Buka browser
3. Akses: `http://localhost:3000/api/sensors`
4. Anda akan melihat data dalam format JSON:

```json
[
  {
    "id": 1,
    "compartment_id": 1,
    "temperature_air": 27.5,
    "humidity_air": 65,
    "temperature_water": 22.3,
    "interval": 5,
    "timestamp": "2025-12-02T08:00:00.000Z"
  }
]
```

### Test 4: Test dengan Frontend

1. Jalankan frontend:
```bash
cd "d:\IoT destilasi\Programing\frontend"
npm start
```

2. Buka browser: `http://localhost:5173` (atau port yang ditampilkan)
3. Buka halaman **Dashboard**
4. Data dari database akan muncul di kartu compartment
5. Buka halaman **Report**
6. Data akan muncul di tabel

---

## 7. Troubleshooting

### ❌ Error: "Database connection failed"

**Penyebab & Solusi:**

1. **MySQL belum running**
   - Buka XAMPP Control Panel
   - Klik Start di MySQL
   - Tunggu hingga hijau

2. **Database belum dibuat**
   - Buka phpMyAdmin
   - Buat database `iot_desalinasi`
   - Buat tabel `sensor_data`

3. **Kredensial salah di .env**
   - Pastikan `DB_USER=root`
   - Pastikan `DB_PASSWORD=` (kosong)
   - Pastikan `DB_NAME=iot_desalinasi`

4. **Port MySQL berubah**
   - Default port: 3306
   - Jika berubah, tambahkan di .env:
   ```env
   DB_PORT=3307
   ```
   - Update `database.js`:
   ```javascript
   port: process.env.DB_PORT || 3306
   ```

### ❌ Error: "Access denied for user 'root'@'localhost'"

**Solusi:**
1. Buka phpMyAdmin
2. Klik **User accounts**
3. Edit user **root** dengan host **localhost**
4. Ubah password atau set ke "No password"
5. Klik **Go**
6. Restart MySQL di XAMPP

### ❌ Error: "Table 'iot_desalinasi.sensor_data' doesn't exist"

**Solusi:**
1. Buka phpMyAdmin
2. Pilih database `iot_desalinasi`
3. Jalankan SQL query untuk membuat tabel (lihat bagian 4)

### ❌ Frontend tidak menampilkan data

**Checklist:**
- ✅ Backend running di port 3000
- ✅ Database berisi data
- ✅ Tidak ada error di browser console (F12)
- ✅ API endpoint bisa diakses: `http://localhost:3000/api/sensors`

**Solusi:**
1. Buka browser console (F12 → Console)
2. Lihat error message
3. Pastikan tidak ada CORS error
4. Refresh halaman (Ctrl+F5)

### ❌ XAMPP MySQL tidak bisa start

**Penyebab:**
- Port 3306 sudah digunakan aplikasi lain

**Solusi:**
1. Cek aplikasi yang menggunakan port 3306:
   ```bash
   netstat -ano | findstr :3306
   ```
2. Tutup aplikasi tersebut, atau
3. Ubah port MySQL di XAMPP:
   - XAMPP Control Panel → MySQL → Config → my.ini
   - Cari `port=3306`
   - Ubah ke `port=3307`
   - Save dan restart MySQL

---

## 📊 Struktur Database Final

```
Database: iot_desalinasi
└── Table: sensor_data
    ├── id (INT, PRIMARY KEY, AUTO_INCREMENT)
    ├── compartment_id (INT, NOT NULL)
    ├── temperature_air (FLOAT, NOT NULL)
    ├── humidity_air (FLOAT, NOT NULL)
    ├── temperature_water (FLOAT, NOT NULL)
    ├── interval (INT, NULL)
    └── timestamp (DATETIME, DEFAULT CURRENT_TIMESTAMP)
```

---

## 🎯 Checklist Setup

- [ ] XAMPP terinstall
- [ ] Apache & MySQL running (hijau)
- [ ] phpMyAdmin bisa diakses
- [ ] Database `iot_desalinasi` sudah dibuat
- [ ] Tabel `sensor_data` sudah dibuat
- [ ] File `.env` sudah dibuat di folder backend
- [ ] Backend bisa connect ke database (✅ di log)
- [ ] API endpoint bisa diakses di browser
- [ ] Frontend bisa menampilkan data dari database

---

## 🚀 Next Steps

Setelah database setup selesai:

1. **Test Data Logger:**
   - Buka halaman Report
   - Aktifkan Data Logger
   - Pilih interval (5s, 10s, atau 60s)
   - Klik Start Logging
   - Data akan otomatis tersimpan ke database

2. **Test CRUD Operations:**
   - Create: Gunakan Data Logger atau POST ke `/api/sensors`
   - Read: Buka Dashboard atau Report
   - Delete: Klik tombol delete di Report
   - Delete All: Klik tombol Delete All di Report

3. **Export Data:**
   - Buka halaman Report
   - Klik tombol "Export CSV"
   - File akan terdownload

---

## 📞 Support

Jika masih ada masalah:
1. Cek error message di terminal backend
2. Cek error message di browser console (F12)
3. Pastikan semua service running
4. Restart XAMPP jika perlu

**Selamat! Database MySQL Anda sudah siap digunakan! 🎉**
