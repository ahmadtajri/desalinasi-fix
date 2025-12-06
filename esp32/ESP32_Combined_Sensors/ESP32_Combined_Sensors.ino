/*
 * ESP32 Combined Sensor - DHT22 + DS18B20
 * 
 * Hardware:
 * - ESP32 Dev Board
 * - DHT22 Sensor (Suhu & Kelembapan Udara)
 * - DS18B20 Waterproof Sensor (Suhu Air)
 * - Resistor 4.7kΩ (pull-up untuk DS18B20)
 * 
 * Koneksi:
 * DHT22:
 * - VCC  -> 3.3V
 * - DATA -> GPIO 4 (D4)
 * - GND  -> GND
 * 
 * DS18B20:
 * - VCC (Merah)   -> 3.3V
 * - DATA (Kuning) -> GPIO 5 (D5)
 * - GND (Hitam)   -> GND
 * - Resistor 4.7kΩ antara VCC dan DATA
 * 
 * Library yang dibutuhkan:
 * - DHT sensor library by Adafruit
 * - Adafruit Unified Sensor
 * - OneWire by Paul Stoffregen
 * - DallasTemperature by Miles Burton
 * - ArduinoJson
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
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

// ========== KONFIGURASI DS18B20 ==========
#define ONE_WIRE_BUS 5    // Pin GPIO untuk DS18B20
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ========== KONFIGURASI TIMING ==========
unsigned long previousMillis = 0;
const long interval = 5000;  // Interval pembacaan (5 detik)

// ========== VARIABEL GLOBAL ==========
float temperature_air = 0.0;
float humidity_air = 0.0;
float temperature_water = 0.0;
int failedReadingsDHT = 0;
int failedReadingsDS = 0;
const int maxFailedReadings = 3;
int ds18b20DeviceCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("ESP32 Combined Sensor - IoT Destilasi");
  Serial.println("DHT22 + DS18B20");
  Serial.println("========================================\n");
  
  // Inisialisasi DHT Sensor
  dht.begin();
  Serial.println("✓ DHT22 Sensor initialized");
  
  // Inisialisasi DS18B20 Sensor
  sensors.begin();
  ds18b20DeviceCount = sensors.getDeviceCount();
  Serial.printf("✓ DS18B20 Sensor initialized\n");
  Serial.printf("  Devices found: %d\n", ds18b20DeviceCount);
  
  if (ds18b20DeviceCount == 0) {
    Serial.println("\n⚠ WARNING: No DS18B20 sensors found!");
    Serial.println("  System will continue with DHT22 only");
    Serial.println("  Please check DS18B20 wiring and pull-up resistor\n");
  } else {
    sensors.setResolution(12);  // 12-bit resolution
    Serial.printf("  Resolution: 12-bit (0.0625°C)\n");
  }
  
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
    
    Serial.println("═════════════════════════════════════");
    Serial.println("Reading All Sensors...");
    Serial.println("─────────────────────────────────────");
    
    // Baca DHT22
    bool dhtSuccess = readDHTSensor();
    
    // Baca DS18B20
    bool dsSuccess = readDS18B20Sensor();
    
    // Kirim data jika minimal 1 sensor berhasil dibaca
    if (dhtSuccess || dsSuccess) {
      sendDataToServer();
    } else {
      Serial.println("✗ All sensors failed to read!");
      Serial.println("  Skipping data transmission...");
    }
    
    Serial.println("═════════════════════════════════════\n");
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
  Serial.println("📊 DHT22 Sensor:");
  
  // Baca suhu dan kelembapan
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  // Cek apakah pembacaan valid
  if (isnan(h) || isnan(t)) {
    Serial.println("  ✗ Failed to read from DHT22!");
    failedReadingsDHT++;
    
    if (failedReadingsDHT >= maxFailedReadings) {
      Serial.println("  ⚠ Too many failures, reinitializing...");
      dht.begin();
      failedReadingsDHT = 0;
    }
    return false;
  }
  
  // Validasi range nilai
  if (t < -40 || t > 80 || h < 0 || h > 100) {
    Serial.println("  ✗ Reading out of range!");
    Serial.printf("    Temperature: %.2f°C\n", t);
    Serial.printf("    Humidity: %.2f%%\n", h);
    failedReadingsDHT++;
    return false;
  }
  
  // Simpan nilai
  temperature_air = t;
  humidity_air = h;
  failedReadingsDHT = 0;
  
  // Tampilkan hasil
  Serial.println("  ✓ Reading successful:");
  Serial.printf("    🌡️  Temperature: %.2f°C", temperature_air);
  if (temperature_air > 35) Serial.print(" ⚠️ HIGH");
  Serial.println();
  
  Serial.printf("    💧 Humidity: %.2f%%", humidity_air);
  if (humidity_air > 80) Serial.print(" ⚠️ HIGH");
  Serial.println();
  
  return true;
}

// ========== FUNGSI BACA SENSOR DS18B20 ==========
bool readDS18B20Sensor() {
  Serial.println("📊 DS18B20 Sensor:");
  
  if (ds18b20DeviceCount == 0) {
    Serial.println("  ⚠ No devices found (skipped)");
    temperature_water = 0.0;
    return false;
  }
  
  // Request temperature
  sensors.requestTemperatures();
  
  // Baca suhu
  float tempC = sensors.getTempCByIndex(0);
  
  // Cek apakah pembacaan valid
  if (tempC == DEVICE_DISCONNECTED_C || tempC == -127.0) {
    Serial.println("  ✗ Failed to read from DS18B20!");
    failedReadingsDS++;
    
    if (failedReadingsDS >= maxFailedReadings) {
      Serial.println("  ⚠ Too many failures, reinitializing...");
      sensors.begin();
      ds18b20DeviceCount = sensors.getDeviceCount();
      failedReadingsDS = 0;
    }
    return false;
  }
  
  // Validasi range nilai
  if (tempC < -10 || tempC > 120) {
    Serial.println("  ✗ Reading out of range!");
    Serial.printf("    Temperature: %.2f°C\n", tempC);
    failedReadingsDS++;
    return false;
  }
  
  // Simpan nilai
  temperature_water = tempC;
  failedReadingsDS = 0;
  
  // Tampilkan hasil
  Serial.println("  ✓ Reading successful:");
  Serial.printf("    🌡️  Water Temp: %.2f°C", temperature_water);
  
  if (temperature_water > 90) {
    Serial.print(" ⚠️ NEAR BOILING");
  } else if (temperature_water > 70) {
    Serial.print(" ℹ️ DISTILLATION RANGE");
  } else if (temperature_water < 10) {
    Serial.print(" ❄️ COLD");
  }
  Serial.println();
  
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
  doc["temperature_water"] = temperature_water;
  doc["interval"] = interval / 1000;  // Konversi ke detik
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("─────────────────────────────────────");
  Serial.println("📤 Sending data to server...");
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
    
    if (httpResponseCode == 201) {
      Serial.println("✓ Data sent successfully!");
      
      // Parse response untuk mendapatkan ID
      StaticJsonDocument<512> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error && responseDoc.containsKey("id")) {
        int dataId = responseDoc["id"];
        Serial.printf("  Data ID: %d\n", dataId);
      }
    } else {
      Serial.println("⚠ Data sent but received unexpected response code");
      Serial.print("Response: ");
      Serial.println(response);
    }
  } else {
    Serial.printf("✗ Error sending data: %s\n", http.errorToString(httpResponseCode).c_str());
    Serial.println("Please check:");
    Serial.println("  1. Server is running");
    Serial.println("  2. Server URL is correct");
    Serial.println("  3. Network connection is stable");
  }
  
  http.end();
}
