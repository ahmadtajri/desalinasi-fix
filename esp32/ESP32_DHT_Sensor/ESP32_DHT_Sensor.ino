/*
 * ESP32 DHT Sensor - Monitoring Suhu & Kelembapan Udara
 * 
 * Hardware:
 * - ESP32 Dev Board
 * - DHT22 (atau DHT11) Sensor
 * 
 * Koneksi:
 * - DHT22 VCC  -> 3.3V
 * - DHT22 GND  -> GND
 * - DHT22 DATA -> GPIO 4 (D4)
 * 
 * Library yang dibutuhkan:
 * - DHT sensor library by Adafruit
 * - Adafruit Unified Sensor
 * - ArduinoJson
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ========== KONFIGURASI WiFi ==========
const char* ssid = "NAMA_WIFI_ANDA";           // Ganti dengan nama WiFi Anda
const char* password = "PASSWORD_WIFI_ANDA";   // Ganti dengan password WiFi Anda

// ========== KONFIGURASI SERVER ==========
const char* serverUrl = "http://192.168.1.100:5000/api/sensors";  // Ganti dengan IP komputer Anda
const int compartment_id = 1;  // ID kompartemen (1-6)

// ========== KONFIGURASI DHT ==========
#define DHTPIN 4          // Pin GPIO untuk DHT22
#define DHTTYPE DHT22     // Tipe sensor (DHT22 atau DHT11)
DHT dht(DHTPIN, DHTTYPE);

// ========== KONFIGURASI TIMING ==========
unsigned long previousMillis = 0;
const long interval = 5000;  // Interval pembacaan (5 detik)

// ========== VARIABEL GLOBAL ==========
float temperature_air = 0.0;
float humidity_air = 0.0;
int failedReadings = 0;
const int maxFailedReadings = 3;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("ESP32 DHT Sensor - IoT Destilasi");
  Serial.println("========================================\n");
  
  // Inisialisasi DHT Sensor
  dht.begin();
  Serial.println("✓ DHT Sensor initialized");
  
  // Koneksi ke WiFi
  connectToWiFi();
  
  Serial.println("\n✓ Setup completed!");
  Serial.println("Starting sensor monitoring...\n");
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Cek koneksi WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected! Reconnecting...");
    connectToWiFi();
  }
  
  // Baca sensor setiap interval
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    // Baca data dari sensor DHT
    if (readDHTSensor()) {
      // Kirim data ke server
      sendDataToServer();
    } else {
      failedReadings++;
      Serial.printf("⚠ Failed readings: %d/%d\n", failedReadings, maxFailedReadings);
      
      if (failedReadings >= maxFailedReadings) {
        Serial.println("⚠ Too many failed readings! Restarting DHT sensor...");
        dht.begin();
        failedReadings = 0;
      }
    }
  }
}

// ========== FUNGSI KONEKSI WiFi ==========
void connectToWiFi() {
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
    Serial.println("Restarting in 5 seconds...");
    delay(5000);
    ESP.restart();
  }
}

// ========== FUNGSI BACA SENSOR DHT ==========
bool readDHTSensor() {
  Serial.println("─────────────────────────────────────");
  Serial.println("Reading DHT Sensor...");
  
  // Baca suhu dan kelembapan
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  // Cek apakah pembacaan valid
  if (isnan(h) || isnan(t)) {
    Serial.println("✗ Failed to read from DHT sensor!");
    return false;
  }
  
  // Validasi range nilai
  if (t < -40 || t > 80 || h < 0 || h > 100) {
    Serial.println("✗ Sensor reading out of range!");
    Serial.printf("  Temperature: %.2f°C\n", t);
    Serial.printf("  Humidity: %.2f%%\n", h);
    return false;
  }
  
  // Simpan nilai
  temperature_air = t;
  humidity_air = h;
  failedReadings = 0;
  
  // Tampilkan hasil
  Serial.println("✓ Sensor reading successful:");
  Serial.printf("  🌡️  Temperature: %.2f°C\n", temperature_air);
  Serial.printf("  💧 Humidity: %.2f%%\n", humidity_air);
  
  // Indikator kondisi
  if (temperature_air > 35) {
    Serial.println("  ⚠️  High temperature warning!");
  }
  if (humidity_air > 80) {
    Serial.println("  ⚠️  High humidity warning!");
  }
  
  return true;
}

// ========== FUNGSI KIRIM DATA KE SERVER ==========
void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ Cannot send data: WiFi not connected");
    return;
  }
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Buat JSON payload
  StaticJsonDocument<256> doc;
  doc["compartment_id"] = compartment_id;
  doc["temperature_air"] = temperature_air;
  doc["humidity_air"] = humidity_air;
  doc["temperature_water"] = 0.0;  // ESP32 ini hanya untuk DHT, suhu air = 0
  doc["interval"] = interval / 1000;  // Konversi ke detik
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("\nSending data to server...");
  Serial.print("URL: ");
  Serial.println(serverUrl);
  Serial.print("Payload: ");
  Serial.println(jsonString);
  
  // Kirim HTTP POST request
  int httpResponseCode = http.POST(jsonString);
  
  // Cek response
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("✓ Server response code: %d\n", httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    if (httpResponseCode == 201) {
      Serial.println("✓ Data sent successfully!");
    } else {
      Serial.println("⚠ Data sent but received unexpected response code");
    }
  } else {
    Serial.printf("✗ Error sending data: %s\n", http.errorToString(httpResponseCode).c_str());
    Serial.println("Please check:");
    Serial.println("  1. Server is running");
    Serial.println("  2. Server URL is correct");
    Serial.println("  3. Network connection is stable");
  }
  
  http.end();
  Serial.println("─────────────────────────────────────\n");
}
