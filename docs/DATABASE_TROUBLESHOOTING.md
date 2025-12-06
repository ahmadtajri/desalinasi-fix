# 🔧 Panduan Troubleshooting Database

## ❌ Masalah: Database Tidak Terhubung

Jika Anda mengalami error "Database connection failed", ikuti langkah-langkah berikut:

---

## 📋 Checklist Troubleshooting

### 1. ✅ Pastikan MySQL/XAMPP Berjalan

#### Cara Mengecek:
1. Buka **XAMPP Control Panel**
2. Pastikan **MySQL** dalam status **Running** (hijau)
3. Jika belum running, klik tombol **Start** di samping MySQL

#### Jika MySQL Tidak Bisa Start:
- **Port 3306 sudah digunakan aplikasi lain**
  - Buka XAMPP Control Panel → Config (MySQL) → my.ini
  - Ubah port dari 3306 ke port lain (misal 3307)
  - Restart MySQL
  - Update file `.env` dengan port baru

- **Service MySQL error**
  - Klik tombol **Stop** di XAMPP
  - Tunggu beberapa detik
  - Klik **Start** lagi

---

### 2. ✅ Cek Database Sudah Dibuat

#### Cara Mengecek:
1. Buka browser, akses: `http://localhost/phpmyadmin`
2. Lihat di sidebar kiri, apakah ada database bernama **`iot_destilasi`**?

#### Jika Database Belum Ada:
1. Di phpMyAdmin, klik tab **"SQL"** di bagian atas
2. Copy-paste script berikut:

```sql
-- Buat database
CREATE DATABASE IF NOT EXISTS iot_destilasi;
USE iot_destilasi;

-- Buat tabel sensor_data
CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compartment_id INT NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_compartment (compartment_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Buat stored procedure untuk monitoring
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS check_database_status()
BEGIN
    DECLARE total_records INT;
    DECLARE table_size_mb DECIMAL(10,2);
    DECLARE db_size_mb DECIMAL(10,2);
    DECLARE status_msg VARCHAR(20);
    DECLARE message_text VARCHAR(255);
    
    -- Get total records
    SELECT COUNT(*) INTO total_records FROM sensor_data;
    
    -- Get table size in MB
    SELECT ROUND(((data_length + index_length) / 1024 / 1024), 2) INTO table_size_mb
    FROM information_schema.TABLES
    WHERE table_schema = 'iot_destilasi' AND table_name = 'sensor_data';
    
    -- Get database size in MB
    SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) INTO db_size_mb
    FROM information_schema.TABLES
    WHERE table_schema = 'iot_destilasi';
    
    -- Determine status
    IF total_records >= 500000 THEN
        SET status_msg = 'CRITICAL';
        SET message_text = CONCAT('Database hampir penuh! ', total_records, ' records. Segera hapus data lama.');
    ELSEIF total_records >= 100000 THEN
        SET status_msg = 'WARNING';
        SET message_text = CONCAT('Perhatian: Database mencapai ', total_records, ' records. Pertimbangkan untuk menghapus data lama.');
    ELSE
        SET status_msg = 'OK';
        SET message_text = 'Database dalam kondisi normal';
    END IF;
    
    -- Return results
    SELECT 
        total_records,
        table_size_mb,
        db_size_mb,
        status_msg as status,
        message_text as message,
        100000 as warning_threshold,
        500000 as critical_threshold;
END$$

DELIMITER ;
```

3. Klik tombol **"Go"** atau **"Jalankan"**
4. Refresh halaman phpMyAdmin, database `iot_destilasi` seharusnya sudah muncul

---

### 3. ✅ Cek Kredensial Database di `.env`

File `.env` berada di folder: `backend/.env`

#### Format yang Benar:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=iot_destilasi
DB_USER=root
DB_PASSWORD=

# Server Configuration
PORT=3000
```

#### Penjelasan:
- **DB_HOST**: Biasanya `localhost` untuk XAMPP lokal
- **DB_PORT**: Default MySQL adalah `3306`
- **DB_NAME**: Harus `iot_destilasi`
- **DB_USER**: Default XAMPP adalah `root`
- **DB_PASSWORD**: Default XAMPP adalah kosong (tidak ada password)

#### Jika Anda Mengubah Password MySQL:
Ubah baris `DB_PASSWORD=` menjadi `DB_PASSWORD=password_anda`

---

### 4. ✅ Test Koneksi Database

Setelah memastikan langkah 1-3, coba jalankan backend:

```bash
cd backend
npm start
```

#### Jika Berhasil, Anda Akan Melihat:
```
═══════════════════════════════════════════════════════
✅ Database connected successfully!
═══════════════════════════════════════════════════════
📊 Database Info:
   - Host: localhost
   - Database: iot_destilasi
   - User: root
═══════════════════════════════════════════════════════

✅ Database synced

🚀 Server is running on http://localhost:3000
📡 API available at http://localhost:3000/api
```

#### Jika Masih Error:
Lihat pesan error yang muncul dan cocokkan dengan solusi di bawah.

---

## 🚨 Error Messages & Solusi

### Error: `ER_ACCESS_DENIED_ERROR`
**Penyebab**: Username atau password salah

**Solusi**:
1. Buka phpMyAdmin
2. Cek username yang Anda gunakan (biasanya `root`)
3. Update file `.env` dengan kredensial yang benar
4. Jika lupa password, reset melalui XAMPP

---

### Error: `ER_BAD_DB_ERROR`
**Penyebab**: Database `iot_destilasi` tidak ada

**Solusi**:
1. Ikuti langkah **"2. Cek Database Sudah Dibuat"** di atas
2. Buat database menggunakan script SQL yang disediakan

---

### Error: `ECONNREFUSED`
**Penyebab**: MySQL tidak berjalan atau port salah

**Solusi**:
1. Pastikan MySQL di XAMPP dalam status **Running**
2. Cek port MySQL di XAMPP Config → my.ini
3. Update `.env` jika port berbeda dari 3306

---

### Error: `ER_NOT_SUPPORTED_AUTH_MODE`
**Penyebab**: MySQL 8.0+ menggunakan autentikasi yang berbeda

**Solusi**:
1. Buka phpMyAdmin
2. Klik tab **SQL**
3. Jalankan query:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
```

---

## 🔄 Mode Mock Data (Temporary Solution)

Jika database masih bermasalah dan Anda ingin aplikasi tetap berjalan, gunakan **Mock Data Mode**:

### Cara Mengaktifkan:
1. Buka file: `backend/src/services/DataService.js`
2. Ubah baris 6:
```javascript
const USE_MOCK_DATA = true;  // Ubah dari false ke true
```
3. Restart backend server

### Catatan:
- Data akan disimpan di memori (tidak persistent)
- Data akan hilang saat server restart
- Gunakan hanya untuk testing/development

### Cara Kembali ke Database:
1. Setelah database berhasil terhubung
2. Ubah kembali ke `const USE_MOCK_DATA = false;`
3. Restart backend server

---

## 📞 Bantuan Tambahan

Jika masih mengalami masalah:

1. **Cek log error** di terminal backend
2. **Screenshot error message** untuk analisis lebih lanjut
3. **Verifikasi versi MySQL** di XAMPP (sebaiknya MySQL 5.7+ atau 8.0+)
4. **Restart komputer** jika semua cara sudah dicoba

---

## ✅ Checklist Akhir

Sebelum menghubungi support, pastikan:

- [ ] XAMPP MySQL sudah running (hijau)
- [ ] Database `iot_destilasi` sudah dibuat
- [ ] File `.env` sudah dikonfigurasi dengan benar
- [ ] Port 3306 tidak diblokir firewall
- [ ] Tidak ada aplikasi lain yang menggunakan port 3306
- [ ] Backend server sudah direstart setelah perubahan

---

**Dibuat**: 2025-12-05  
**Versi**: 1.0  
**Untuk**: IoT Destilasi Monitoring System
