# 📡 Dokumentasi Lengkap ESP32 - IoT Desalinasi

## 📋 Daftar Isi
1. [Overview & Struktur Project](#1-overview--struktur-project)
2. [Quick Start (Mulai Cepat 5 Menit)](#2-quick-start-mulai-cepat)
3. [Perbandingan Implementasi (1 vs 2 ESP32)](#3-perbandingan-implementasi)
4. [Daftar Belanja Hardware](#4-daftar-belanja-hardware)
5. [Wiring Diagram Lengkap](#5-wiring-diagram-lengkap)
6. [Instalasi & Konfigurasi Software](#6-instalasi--konfigurasi-software)
7. [Testing & Troubleshooting](#7-testing--troubleshooting)
8. [FAQ](#8-faq)

---

## 1. Overview & Struktur Project

Sistem monitoring IoT Desalinasi ini dirancang menggunakan **ESP32** untuk membaca sensor lingkungan dan mengirimkannya ke server backend via WiFi.

### 📂 Struktur Folder
*   `ESP32_Combined_Sensors/`: Code untuk 1 ESP32 (DHT22 + DS18B20). **(Recommended untuk Hemat Biaya)**
*   `ESP32_DHT_Sensor/`: Code Khusus sensor Udara (DHT22).
*   `ESP32_DS18B20_Sensor/`: Code Khusus sensor Air (DS18B20).
*   `ESP32_Sensor_Test/`: Code diagnosa untuk cek hardware.
*   `config.example.h`: Template konfigurasi WiFi & Server.

---

## 2. Quick Start (Mulai Cepat)

### Langkah 1: Persiapan Hardware
*   [ ] ESP32 Dev Board
*   [ ] Sensor DHT22 (Udara)
*   [ ] Sensor DS18B20 (Air) + Resistor 4.7kΩ **(WAJIB!)**
*   [ ] Kabel Jumper & Breadboard

### Langkah 2: Setup Software
1.  **Install Arduino IDE**.
2.  Tambah Board Manager URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3.  Install Board: Search "esp32" by Espressif Systems.
4.  Install Library:
    *   `DHT sensor library`
    *   `OneWire`
    *   `DallasTemperature`
    *   `ArduinoJson`

### Langkah 3: Upload Code
1.  Buka `ESP32_Combined_Sensors.ino` (jika pakai 1 ESP32).
2.  Edit bagian konfigurasi (WiFi SSID, Password, Server IP).
3.  Upload ke board ESP32.
4.  Cek **Serial Monitor** (115200 baud).

---

## 3. Perbandingan Implementasi

Anda bisa memilih menggunakan 1 ESP32 gabungan atau 2 ESP32 terpisah.

### Opsi A: 2 ESP32 Terpisah (Best for Reliability)
*   **Kelebihan**: Jika satu rusak, yang lain tetap jalan. Mudah troubleshooting. Wiring lebih simpel per board.
*   **Kekurangan**: Biaya lebih mahal (~Rp 260.000).

### Opsi B: 1 ESP32 Combined (Best for Budget)
*   **Kelebihan**: Hemat biaya (~Rp 180.000). Data sinkron.
*   **Kekurangan**: Wiring sedikit lebih padat. Jika ESP rusak, semua sensor mati.

**Rekomendasi:** Gunakan **Opsi B (Combined)** untuk project/skripsi. Gunakan **Opsi A** untuk industri.

---

## 4. Daftar Belanja Hardware

### Komponen Utama
| Komponen | Qty (1 ESP32) | Qty (2 ESP32) | Estimasi Harga Satuan |
|----------|---------------|---------------|-----------------------|
| ESP32 Dev Board (30 pin) | 1 | 2 | Rp 80.000 |
| DHT22 Sensor (Udara) | 1 | 1 | Rp 50.000 |
| DS18B20 Waterproof (Air) | 1 | 1 | Rp 40.000 |
| Resistor 4.7kΩ | 1 | 1 | Rp 500 |
| Kabel Jumper & Breadboard | 1 set | 2 set | Rp 20.000 |

**Catatan Pembelian:**
*   Pilih DHT22, bukan DHT11 (DHT11 kurang akurat).
*   Pilih DS18B20 tipe **Waterproof**.
*   Jangan lupa **Resistor 4.7kΩ**, tanpa ini DS18B20 tidak akan terbaca!

---

## 5. Wiring Diagram Lengkap

### DHT22 (Udara)
```
DHT22 Pin      ESP32 Pin
────────────────────────
VCC (+)    →   3.3V
DATA       →   GPIO 4
GND (-)    →   GND
```

### DS18B20 (Air)
```
DS18B20 Wire   ESP32 Pin
────────────────────────
Merah (VCC)  →  3.3V
Kuning (DATA)→  GPIO 5
Hitam (GND)  →  GND

⚠️ PENTING: Pasang Resistor 4.7kΩ antara VCC (Merah) dan DATA (Kuning)!
```

### Setup Combined (1 ESP32)
Gunakan kedua wiring di atas pada satu board ESP32. Pastikan daya (3.3V dan GND) dibagi via breadboard.

---

## 6. Instalasi & Konfigurasi Software

### Cek IP Server Backend
Sebelum upload, Anda harus tahu IP komputer tempat backend berjalan.
*   **Windows**: Buka CMD, ketik `ipconfig`. Cari IPv4 Address (misal `192.168.1.100`).

### Konfigurasi Code (`.ino`)
Ubah baris berikut di bagian atas file `.ino`:

```cpp
const char* ssid     = "NAMA_WIFI";
const char* password = "PASSWORD_WIFI";
const char* serverUrl = "http://192.168.1.100:3000/api/sensors"; // Ganti IP sesuai PC Anda
const int compartment_id = 1; // ID Compartment (1-6)
```

---

## 7. Testing & Troubleshooting

### Checklist Masalah Umum

#### ❌ WiFi Tidak Connect
*   **Solusi**: Pastikan SSID & Password benar (Case Sensitive). Pastikan pakai WiFi 2.4GHz (ESP32 tidak support 5GHz).

#### ❌ Sensor DHT Return `NaN`
*   **Solusi**: Cek kabel. Coba ganti pin GPIO. Beri delay 2 detik saat startup.

#### ❌ DS18B20 Tidak Terdeteksi (`No sensors found`)
*   **Solusi**: **Cek Resistor 4.7kΩ**. Ini penyebab 90% masalah DS18B20. Cek apaka kabel kuning (DATA) tersambung ke pin yang benar.

#### ❌ Data Tidak Masuk ke Backend
*   **Solusi**:
    1.  Cek apakah backend running (`npm start`).
    2.  Cek IP Address di code ESP32.
    3.  Pastikan Laptop dan ESP32 di jaringan WiFi yang sama.
    4.  Cek Firewall laptop (coba matikan sementara).

### Cara Testing Hardware Saja
Upload file `ESP32_Sensor_Test/ESP32_Sensor_Test.ino`. Code ini hanya mengecek sensor tanpa koneksi WiFi. Jika ini berhasil tapi program utama gagal, berarti masalah ada di jaringan/backend.

---

## 8. FAQ

**Q: Apa beda DHT11 dan DHT22?**
A: DHT22 lebih akurat dan range suhunya lebih luas. DHT11 lebih murah tapi kurang presisi.

**Q: Kenapa ESP32 saya restart terus?**
A: Biasanya kekurangan daya. Ganti kabel USB yang lebih bagus atau pakai power supply eksternal 5V 2A.

**Q: Bisakah saya pakai Hotspot HP?**
A: Bisa, dan sangat disarankan untuk testing karena jaringan lebih simpel daripada WiFi kampus/kantor.
