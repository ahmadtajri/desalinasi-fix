// ========================================
// KONFIGURASI ESP32 - IoT Destilasi
// ========================================
// Copy file ini dan sesuaikan dengan kebutuhan Anda

// ========== WiFi Configuration ==========
const char* WIFI_SSID = "YourWiFiName";        // Nama WiFi Anda
const char* WIFI_PASSWORD = "YourPassword";     // Password WiFi Anda

// ========== Server Configuration ==========
// Ganti dengan IP komputer yang menjalankan backend
// Cara cek IP: buka CMD, ketik "ipconfig", lihat IPv4 Address
const char* SERVER_IP = "192.168.1.100";        // IP komputer backend
const int SERVER_PORT = 5000;                   // Port backend (default: 5000)

// URL lengkap (jangan diubah kecuali endpoint berubah)
const char* SERVER_URL = "http://192.168.1.100:5000/api/sensors";

// ========== Sensor Configuration ==========
const int COMPARTMENT_ID = 1;                   // ID Kompartemen (1-6)

// ========== Timing Configuration ==========
const long READING_INTERVAL = 5000;             // Interval pembacaan (ms)
                                                // 5000 = 5 detik
                                                // 10000 = 10 detik
                                                // 30000 = 30 detik

// ========== Pin Configuration ==========
// ESP32 #1 (DHT Sensor)
const int DHT_PIN = 4;                          // GPIO untuk DHT22
const int DHT_TYPE = DHT22;                     // DHT22 atau DHT11

// ESP32 #2 (DS18B20 Sensor)
const int DS18B20_PIN = 5;                      // GPIO untuk DS18B20
const int DS18B20_RESOLUTION = 12;              // Resolusi (9-12 bit)

// ========== Advanced Configuration ==========
const int MAX_FAILED_READINGS = 3;              // Max pembacaan gagal sebelum reset
const int WIFI_TIMEOUT_SECONDS = 20;            // Timeout koneksi WiFi
const int HTTP_TIMEOUT_MS = 5000;               // Timeout HTTP request

// ========== Debug Configuration ==========
const bool ENABLE_SERIAL_DEBUG = true;          // Enable/disable Serial output
const long SERIAL_BAUD_RATE = 115200;           // Baud rate Serial Monitor

// ========================================
// CATATAN PENTING:
// ========================================
// 1. Pastikan ESP32 dan komputer backend dalam jaringan WiFi yang sama
// 2. Pastikan firewall tidak memblokir port 5000
// 3. Untuk DS18B20, WAJIB pasang resistor 4.7kΩ pull-up
// 4. Jangan set interval terlalu cepat (<1000ms)
// 5. Setiap ESP32 harus punya COMPARTMENT_ID yang berbeda (jika monitoring kompartemen berbeda)
