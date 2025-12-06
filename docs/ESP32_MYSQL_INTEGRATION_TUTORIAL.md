# 📡 Tutorial Lengkap: Integrasi ESP32 dengan MySQL Database (XAMPP)

## 📋 Daftar Isi
1. [Persiapan dan Instalasi](#1-persiapan-dan-instalasi)
2. [Setup Database MySQL](#2-setup-database-mysql)
3. [Konfigurasi Backend Node.js](#3-konfigurasi-backend-nodejs)
4. [Pemrograman ESP32](#4-pemrograman-esp32)
5. [Testing dan Troubleshooting](#5-testing-dan-troubleshooting)
6. [Tips dan Best Practices](#6-tips-dan-best-practices)

---

## 1. Persiapan dan Instalasi

### 1.1 Hardware yang Dibutuhkan
- **ESP32 Development Board** (ESP32-DevKitC atau sejenisnya)
- **Sensor DHT22** (untuk suhu dan kelembapan udara)
- **Sensor DS18B20** (untuk suhu air)
- **Kabel jumper**
- **Breadboard**
- **Kabel USB untuk programming**

### 1.2 Software yang Dibutuhkan

#### A. XAMPP
1. Download XAMPP dari [https://www.apachefriends.org](https://www.apachefriends.org)
2. Install XAMPP di komputer Anda
3. Jalankan XAMPP Control Panel
4. Start **Apache** dan **MySQL**

#### B. Arduino IDE
1. Download Arduino IDE dari [https://www.arduino.cc/en/software](https://www.arduino.cc/en/software)
2. Install Arduino IDE
3. Install ESP32 Board Support:
   - Buka **File → Preferences**
   - Tambahkan URL berikut di **Additional Board Manager URLs**:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Buka **Tools → Board → Boards Manager**
   - Cari "ESP32" dan install **esp32 by Espressif Systems**

#### C. Library Arduino yang Diperlukan
Install library berikut melalui **Sketch → Include Library → Manage Libraries**:
- `WiFi` (built-in dengan ESP32)
- `HTTPClient` (built-in dengan ESP32)
- `ArduinoJson` by Benoit Blanchon
- `DHT sensor library` by Adafruit
- `OneWire` by Paul Stoffregen
- `DallasTemperature` by Miles Burton

#### D. Node.js dan Dependencies
1. Install Node.js dari [https://nodejs.org](https://nodejs.org)
2. Pastikan backend sudah terinstall (lihat folder `backend/`)

---

## 2. Setup Database MySQL

### 2.1 Membuat Database

1. **Buka phpMyAdmin**:
   - Buka browser dan akses `http://localhost/phpmyadmin`
   - Login (default: username `root`, password kosong)

2. **Import Database**:
   - Klik tab **"SQL"**
   - Copy dan paste isi file `backend/database/database_setup.sql`
   - Klik **"Go"** untuk menjalankan

   Atau bisa juga:
   - Klik **"New"** untuk membuat database baru
   - Nama database: `iot_desalinasi`
   - Collation: `utf8mb4_general_ci`
   - Klik **"Create"**
   - Pilih database `iot_desalinasi`
   - Klik tab **"Import"**
   - Pilih file `database_setup.sql`
   - Klik **"Go"**

3. **Verifikasi Database**:
   ```sql
   -- Jalankan query ini di tab SQL
   USE iot_desalinasi;
   SHOW TABLES;
   DESCRIBE sensor_data;
   SELECT * FROM sensor_data LIMIT 10;
   ```

### 2.2 Struktur Tabel sensor_data

```sql
CREATE TABLE `sensor_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `compartment_id` int(11) NOT NULL COMMENT 'ID Compartment (1-6)',
  `temperature_air` float NOT NULL COMMENT 'Suhu Udara (°C)',
  `humidity_air` float NOT NULL COMMENT 'Kelembapan Udara (%)',
  `temperature_water` float NOT NULL COMMENT 'Suhu Air (°C)',
  `interval` int(11) DEFAULT NULL COMMENT 'Interval Logging (detik)',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_compartment` (`compartment_id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_interval` (`interval`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.3 Mendapatkan IP Address Komputer

ESP32 perlu tahu IP address komputer yang menjalankan XAMPP:

**Windows:**
```cmd
ipconfig
```
Cari **IPv4 Address** pada adapter yang terhubung ke jaringan lokal
Contoh: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
```
atau
```bash
ip addr show
```

**Catatan Penting:**
- Pastikan ESP32 dan komputer terhubung ke **jaringan WiFi yang sama**
- Catat IP address ini, akan digunakan di kode ESP32

---

## 3. Konfigurasi Backend Node.js

### 3.1 Setup File .env

1. Buka folder `backend/`
2. Copy file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit file `.env`:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=iot_desalinasi
   DB_PORT=3306

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

### 3.2 Mengaktifkan Database Mode

Edit file `backend/src/services/DataService.js`:

```javascript
// Ubah baris ini dari true menjadi false
const USE_MOCK_DATA = false;  // ← Pastikan false untuk menggunakan database
```

### 3.3 Install Dependencies dan Jalankan Backend

```bash
cd backend
npm install
npm start
```

Output yang benar:
```
Server running on port 3000
Database connection successful!
```

### 3.4 Test Backend API

Buka browser atau Postman dan test:

```
http://localhost:3000/api/
```

Response:
```json
{
  "message": "ESP32 IoT Data Logger API",
  "version": "1.0",
  "mode": "Database Mode",
  "endpoints": { ... }
}
```

---

## 4. Pemrograman ESP32

### 4.1 Wiring Diagram

#### DHT22 (Suhu & Kelembapan Udara)
```
DHT22 Pin    →    ESP32 Pin
VCC          →    3.3V
GND          →    GND
DATA         →    GPIO 4
```

#### DS18B20 (Suhu Air)
```
DS18B20 Pin  →    ESP32 Pin
VCC (Red)    →    3.3V
GND (Black)  →    GND
DATA (Yellow)→    GPIO 5
```

**Catatan:** DS18B20 memerlukan **pull-up resistor 4.7kΩ** antara DATA dan VCC

### 4.2 Kode ESP32 Lengkap

Buat file baru di Arduino IDE dan simpan sebagai `ESP32_IoT_Destilasi.ino`:

```cpp
/*
 * ESP32 IoT Desalinasi - Sensor Data Logger
 * 
 * Hardware:
 * - ESP32 DevKit
 * - DHT22 (Suhu & Kelembapan Udara) → GPIO 4
 * - DS18B20 (Suhu Air) → GPIO 5
 * 
 * Fungsi:
 * - Membaca data sensor
 * - Mengirim data ke MySQL database via REST API
 * - Auto-reconnect WiFi
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ==================== KONFIGURASI ====================
// WiFi Credentials
const char* ssid = "NAMA_WIFI_ANDA";           // ← Ganti dengan nama WiFi
const char* password = "PASSWORD_WIFI_ANDA";   // ← Ganti dengan password WiFi

// Server Configuration
const char* serverIP = "192.168.1.100";        // ← Ganti dengan IP komputer Anda
const int serverPort = 3000;
String serverURL = "http://" + String(serverIP) + ":" + String(serverPort) + "/api/sensors";

// Compartment ID (1-6)
const int COMPARTMENT_ID = 1;                  // ← Ganti sesuai compartment

// Sensor Pins
#define DHT_PIN 4          // GPIO 4 untuk DHT22
#define DS18B20_PIN 5      // GPIO 5 untuk DS18B20

// Sensor Configuration
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

// Timing Configuration
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 5000;  // Kirim data setiap 5 detik

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("ESP32 IoT Desalinasi Data Logger");
  Serial.println("=================================\n");
  
  // Initialize Sensors
  Serial.println("Initializing sensors...");
  dht.begin();
  ds18b20.begin();
  Serial.println("✓ Sensors initialized\n");
  
  // Connect to WiFi
  connectWiFi();
  
  // Print Configuration
  Serial.println("\n--- Configuration ---");
  Serial.print("Compartment ID: ");
  Serial.println(COMPARTMENT_ID);
  Serial.print("Server URL: ");
  Serial.println(serverURL);
  Serial.print("Send Interval: ");
  Serial.print(SEND_INTERVAL / 1000);
  Serial.println(" seconds\n");
  
  Serial.println("System ready! Starting data logging...\n");
}

// ==================== MAIN LOOP ====================
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    connectWiFi();
  }
  
  // Send data at specified interval
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = currentTime;
    
    // Read sensors and send data
    readAndSendData();
  }
  
  delay(100);
}

// ==================== FUNCTIONS ====================

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    Serial.println("Please check your WiFi credentials and try again.");
  }
}

void readAndSendData() {
  Serial.println("--- Reading Sensors ---");
  
  // Read DHT22 (Air Temperature & Humidity)
  float tempAir = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Read DS18B20 (Water Temperature)
  ds18b20.requestTemperatures();
  float tempWater = ds18b20.getTempCByIndex(0);
  
  // Validate readings
  if (isnan(tempAir) || isnan(humidity)) {
    Serial.println("✗ Failed to read DHT22 sensor!");
    return;
  }
  
  if (tempWater == DEVICE_DISCONNECTED_C) {
    Serial.println("✗ Failed to read DS18B20 sensor!");
    return;
  }
  
  // Print sensor readings
  Serial.print("Temperature Air: ");
  Serial.print(tempAir);
  Serial.println(" °C");
  
  Serial.print("Humidity Air: ");
  Serial.print(humidity);
  Serial.println(" %");
  
  Serial.print("Temperature Water: ");
  Serial.print(tempWater);
  Serial.println(" °C");
  
  // Send to server
  sendToServer(tempAir, humidity, tempWater);
}

void sendToServer(float tempAir, float humidity, float tempWater) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi not connected. Skipping send.");
    return;
  }
  
  HTTPClient http;
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["compartment_id"] = COMPARTMENT_ID;
  doc["temperature_air"] = round(tempAir * 10) / 10.0;  // Round to 1 decimal
  doc["humidity_air"] = round(humidity * 10) / 10.0;
  doc["temperature_water"] = round(tempWater * 10) / 10.0;
  doc["interval"] = SEND_INTERVAL / 1000;  // Convert to seconds
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("\n--- Sending to Server ---");
  Serial.print("URL: ");
  Serial.println(serverURL);
  Serial.print("Payload: ");
  Serial.println(jsonPayload);
  
  // Send HTTP POST request
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonPayload);
  
  // Handle response
  if (httpResponseCode > 0) {
    Serial.print("✓ Response code: ");
    Serial.println(httpResponseCode);
    
    String response = http.getString();
    Serial.print("Response: ");
    Serial.println(response);
    
    if (httpResponseCode == 201) {
      Serial.println("✓ Data saved successfully!");
    }
  } else {
    Serial.print("✗ Error sending data: ");
    Serial.println(http.errorToString(httpResponseCode));
    Serial.println("Please check:");
    Serial.println("  1. Server is running (npm start)");
    Serial.println("  2. Server IP address is correct");
    Serial.println("  3. Firewall allows port 3000");
  }
  
  http.end();
  Serial.println("========================\n");
}
```

### 4.3 Konfigurasi Kode ESP32

Edit bagian konfigurasi di kode:

```cpp
// 1. WiFi Credentials
const char* ssid = "NAMA_WIFI_ANDA";           // Nama WiFi rumah/kantor
const char* password = "PASSWORD_WIFI_ANDA";   // Password WiFi

// 2. Server IP (dari langkah 2.3)
const char* serverIP = "192.168.1.100";        // IP komputer yang menjalankan XAMPP

// 3. Compartment ID
const int COMPARTMENT_ID = 1;                  // ID compartment (1-6)

// 4. Send Interval (opsional)
const unsigned long SEND_INTERVAL = 5000;      // Kirim setiap 5 detik (5000 ms)
```

### 4.4 Upload ke ESP32

1. Hubungkan ESP32 ke komputer via USB
2. Di Arduino IDE:
   - **Tools → Board** → Pilih **ESP32 Dev Module**
   - **Tools → Port** → Pilih port COM yang sesuai
   - **Tools → Upload Speed** → 115200
3. Klik tombol **Upload** (→)
4. Tunggu hingga upload selesai
5. Buka **Serial Monitor** (Ctrl+Shift+M)
6. Set baud rate ke **115200**

### 4.5 Monitoring Output Serial

Output yang benar di Serial Monitor:

```
=================================
ESP32 IoT Desalinasi Data Logger
=================================

Initializing sensors...
✓ Sensors initialized

Connecting to WiFi: MyWiFi
.....
✓ WiFi connected!
IP Address: 192.168.1.105
Signal Strength: -45 dBm

--- Configuration ---
Compartment ID: 1
Server URL: http://192.168.1.100:3000/api/sensors
Send Interval: 5 seconds

System ready! Starting data logging...

--- Reading Sensors ---
Temperature Air: 27.5 °C
Humidity Air: 65.2 %
Temperature Water: 22.3 °C

--- Sending to Server ---
URL: http://192.168.1.100:3000/api/sensors
Payload: {"compartment_id":1,"temperature_air":27.5,"humidity_air":65.2,"temperature_water":22.3,"interval":5}
✓ Response code: 201
Response: {"id":1,"compartment_id":1,"temperature_air":27.5,...}
✓ Data saved successfully!
========================
```

---

## 5. Testing dan Troubleshooting

### 5.1 Verifikasi Data di Database

1. **Via phpMyAdmin**:
   ```sql
   SELECT * FROM sensor_data 
   ORDER BY timestamp DESC 
   LIMIT 10;
   ```

2. **Via Backend API**:
   ```
   http://localhost:3000/api/sensors?compartment=1&limit=10
   ```

3. **Via Frontend**:
   - Jalankan frontend: `cd frontend && npm start`
   - Buka `http://localhost:5173`
   - Pilih Compartment 1
   - Data akan muncul di grafik dan tabel

### 5.2 Troubleshooting Common Issues

#### Problem 1: ESP32 tidak bisa connect ke WiFi
**Gejala:**
```
Connecting to WiFi: MyWiFi
....................
✗ WiFi connection failed!
```

**Solusi:**
- ✅ Periksa nama WiFi dan password (case-sensitive!)
- ✅ Pastikan WiFi 2.4GHz (ESP32 tidak support 5GHz)
- ✅ Coba restart ESP32
- ✅ Coba WiFi lain atau hotspot HP

---

#### Problem 2: Error sending data ke server
**Gejala:**
```
✗ Error sending data: connection refused
```

**Solusi:**
- ✅ Pastikan backend running (`npm start` di folder backend)
- ✅ Periksa IP address komputer (gunakan `ipconfig`)
- ✅ Pastikan ESP32 dan komputer di jaringan WiFi yang sama
- ✅ Cek firewall Windows:
  - Buka **Windows Defender Firewall**
  - Klik **Allow an app through firewall**
  - Cari **Node.js** dan centang **Private** dan **Public**
- ✅ Test server dari browser: `http://192.168.1.100:3000/api/`

---

#### Problem 3: Sensor DHT22 return NaN
**Gejala:**
```
✗ Failed to read DHT22 sensor!
```

**Solusi:**
- ✅ Periksa wiring DHT22
- ✅ Pastikan DHT22 mendapat power 3.3V
- ✅ Coba ganti pin (misal dari GPIO 4 ke GPIO 15)
- ✅ Tambahkan delay setelah `dht.begin()`:
  ```cpp
  dht.begin();
  delay(2000);  // Tunggu sensor ready
  ```

---

#### Problem 4: DS18B20 return -127°C
**Gejala:**
```
Temperature Water: -127.0 °C
✗ Failed to read DS18B20 sensor!
```

**Solusi:**
- ✅ Periksa wiring DS18B20
- ✅ **PENTING:** Pasang pull-up resistor 4.7kΩ antara DATA dan VCC
- ✅ Coba ganti pin
- ✅ Test sensor dengan kode sederhana:
  ```cpp
  ds18b20.requestTemperatures();
  float temp = ds18b20.getTempCByIndex(0);
  Serial.println(temp);
  ```

---

#### Problem 5: Data tidak masuk ke database
**Gejala:**
- ESP32 kirim data (response 201)
- Tapi data tidak muncul di phpMyAdmin

**Solusi:**
- ✅ Periksa `DataService.js`:
  ```javascript
  const USE_MOCK_DATA = false;  // Harus false!
  ```
- ✅ Periksa koneksi database di backend console:
  ```
  Database connection successful!  ← Harus ada ini
  ```
- ✅ Test manual insert di phpMyAdmin:
  ```sql
  INSERT INTO sensor_data 
  (compartment_id, temperature_air, humidity_air, temperature_water) 
  VALUES (1, 27.5, 65.0, 22.0);
  ```

---

#### Problem 6: XAMPP MySQL tidak bisa start
**Gejala:**
```
Error: MySQL shutdown unexpectedly
```

**Solusi:**
- ✅ Port 3306 sudah dipakai aplikasi lain
- ✅ Buka XAMPP Config → MySQL → my.ini
- ✅ Ubah port:
  ```ini
  port=3307
  ```
- ✅ Update `.env`:
  ```env
  DB_PORT=3307
  ```

---

### 5.3 Testing Checklist

Gunakan checklist ini untuk memastikan semua berjalan dengan baik:

- [ ] XAMPP Apache dan MySQL running
- [ ] Database `iot_desalinasi` sudah dibuat
- [ ] Tabel `sensor_data` ada dan strukturnya benar
- [ ] File `.env` sudah dikonfigurasi dengan benar
- [ ] `USE_MOCK_DATA = false` di `DataService.js`
- [ ] Backend running dan menampilkan "Database connection successful!"
- [ ] Test API `http://localhost:3000/api/` berhasil
- [ ] ESP32 terhubung ke WiFi
- [ ] ESP32 bisa membaca sensor DHT22
- [ ] ESP32 bisa membaca sensor DS18B20
- [ ] ESP32 berhasil kirim data (response 201)
- [ ] Data muncul di phpMyAdmin
- [ ] Data muncul di frontend dashboard

---

## 6. Tips dan Best Practices

### 6.1 Optimasi Performa

#### 1. Gunakan Static IP untuk ESP32
Tambahkan di `setup()`:
```cpp
IPAddress local_IP(192, 168, 1, 105);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

if (!WiFi.config(local_IP, gateway, subnet)) {
  Serial.println("STA Failed to configure");
}
WiFi.begin(ssid, password);
```

#### 2. Implementasi Deep Sleep (Hemat Baterai)
```cpp
const int SLEEP_TIME = 60;  // Sleep 60 detik

void loop() {
  readAndSendData();
  
  Serial.println("Going to sleep...");
  esp_sleep_enable_timer_wakeup(SLEEP_TIME * 1000000);
  esp_deep_sleep_start();
}
```

#### 3. Batching Data (Kirim Multiple Records)
```cpp
// Simpan data di array, kirim sekaligus setiap 10 pembacaan
const int BATCH_SIZE = 10;
StaticJsonDocument<2000> batchDoc;
JsonArray dataArray = batchDoc.createNestedArray("data");

// ... tambahkan data ke array ...
// Kirim saat array penuh
```

### 6.2 Security Best Practices

#### 1. Gunakan HTTPS (Production)
```cpp
// Untuk production, gunakan HTTPS
#include <WiFiClientSecure.h>
WiFiClientSecure client;
client.setInsecure();  // Atau gunakan certificate
```

#### 2. Implementasi API Key
```cpp
http.addHeader("X-API-Key", "your-secret-api-key");
```

#### 3. Enkripsi WiFi Credentials
Simpan di EEPROM atau SPIFFS, jangan hardcode di kode.

### 6.3 Monitoring dan Logging

#### 1. Log ke SD Card
```cpp
#include <SD.h>
#include <SPI.h>

void logToSD(String data) {
  File logFile = SD.open("/log.txt", FILE_APPEND);
  logFile.println(data);
  logFile.close();
}
```

#### 2. Implementasi Watchdog Timer
```cpp
#include <esp_task_wdt.h>

void setup() {
  esp_task_wdt_init(30, true);  // 30 detik timeout
  esp_task_wdt_add(NULL);
}

void loop() {
  esp_task_wdt_reset();  // Reset watchdog
  // ... kode lainnya ...
}
```

### 6.4 Multiple ESP32 Setup

Untuk monitoring 6 compartment dengan 6 ESP32:

```cpp
// ESP32 #1
const int COMPARTMENT_ID = 1;

// ESP32 #2
const int COMPARTMENT_ID = 2;

// ... dst hingga ESP32 #6
```

Atau gunakan **MAC Address** untuk auto-assign:
```cpp
void setup() {
  String mac = WiFi.macAddress();
  
  if (mac == "AA:BB:CC:DD:EE:01") COMPARTMENT_ID = 1;
  else if (mac == "AA:BB:CC:DD:EE:02") COMPARTMENT_ID = 2;
  // ... dst
}
```

### 6.5 Database Maintenance

#### Auto-cleanup Old Data
Jalankan script ini secara berkala (cron job):
```sql
-- Hapus data lebih dari 30 hari
DELETE FROM sensor_data 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

#### Backup Database
```bash
# Windows (via XAMPP)
cd C:\xampp\mysql\bin
mysqldump -u root iot_destilasi > backup.sql

# Restore
mysql -u root iot_destilasi < backup.sql
```

---

## 📊 Diagram Arsitektur Sistem

```
┌─────────────────┐
│   ESP32 #1-6    │
│  (Sensor Nodes) │
│                 │
│  - DHT22        │
│  - DS18B20      │
└────────┬────────┘
         │ WiFi (HTTP POST)
         │ JSON: {compartment_id, temp_air, humidity, temp_water}
         ▼
┌─────────────────────────────────┐
│   Backend Server (Node.js)      │
│   Port: 3000                    │
│                                 │
│   Routes:                       │
│   POST /api/sensors             │
│   GET  /api/sensors             │
│   GET  /api/sensors?compartment │
└────────┬────────────────────────┘
         │ Sequelize ORM
         │ MySQL Driver
         ▼
┌─────────────────────────────────┐
│   MySQL Database (XAMPP)        │
│   Port: 3306                    │
│                                 │
│   Database: iot_destilasi       │
│   Table: sensor_data            │
│   - id (PK)                     │
│   - compartment_id              │
│   - temperature_air             │
│   - humidity_air                │
│   - temperature_water           │
│   - interval                    │
│   - timestamp                   │
└────────┬────────────────────────┘
         │ HTTP API
         │ GET /api/sensors
         ▼
┌─────────────────────────────────┐
│   Frontend (React + Vite)       │
│   Port: 5173                    │
│                                 │
│   - Dashboard                   │
│   - Real-time Charts            │
│   - Data Table                  │
│   - Report Export               │
└─────────────────────────────────┘
```

---

## 🎯 Kesimpulan

Setelah mengikuti tutorial ini, Anda akan memiliki:

✅ **Database MySQL** yang berjalan di XAMPP
✅ **Backend API** yang terhubung ke database
✅ **ESP32** yang membaca sensor dan mengirim data
✅ **Frontend Dashboard** untuk visualisasi data
✅ **Sistem monitoring** yang lengkap dan real-time

---

## 📚 Referensi

- [ESP32 Official Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [Arduino-ESP32 GitHub](https://github.com/espressif/arduino-esp32)
- [DHT Sensor Library](https://github.com/adafruit/DHT-sensor-library)
- [DallasTemperature Library](https://github.com/milesburton/Arduino-Temperature-Control-Library)
- [ArduinoJson Documentation](https://arduinojson.org/)
- [Sequelize ORM](https://sequelize.org/)

---

## 💡 Bantuan Lebih Lanjut

Jika mengalami masalah:

1. **Cek Serial Monitor** untuk error messages
2. **Cek Backend Console** untuk database errors
3. **Cek phpMyAdmin** untuk verifikasi data
4. **Gunakan Postman** untuk test API secara manual
5. **Baca dokumentasi** di folder `docs/`

---

**Dibuat dengan ❤️ untuk IoT Destilasi Project**

*Last Updated: 2025-12-05*
