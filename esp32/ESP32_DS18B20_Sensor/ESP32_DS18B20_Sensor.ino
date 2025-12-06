/*
 * ESP32 DS18B20 Sensor - Monitoring Suhu Air
 * 
 * Hardware:
 * - ESP32 Dev Board
 * - DS18B20 Waterproof Temperature Sensor
 * - Resistor 4.7kΩ (pull-up)
 * 
 * Koneksi:
 * - DS18B20 VCC (Merah)    -> 3.3V
 * - DS18B20 GND (Hitam)    -> GND
 * - DS18B20 DATA (Kuning)  -> GPIO 5 (D5)
 * - Resistor 4.7kΩ antara VCC dan DATA
 * 
 * Library yang dibutuhkan:
 * - OneWire by Paul Stoffregen
 * - DallasTemperature by Miles Burton
 * - ArduinoJson
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ========== KONFIGURASI WiFi ==========
const char* ssid = "NAMA_WIFI_ANDA";           // Ganti dengan nama WiFi Anda
const char* password = "PASSWORD_WIFI_ANDA";   // Ganti dengan password WiFi Anda

// ========== KONFIGURASI SERVER ==========
const char* serverUrl = "http://192.168.1.100:5000/api/sensors";  // Ganti dengan IP komputer Anda
const int compartment_id = 1;  // ID kompartemen (1-6)

// ========== KONFIGURASI DS18B20 ==========
#define ONE_WIRE_BUS 5    // Pin GPIO untuk DS18B20
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ========== KONFIGURASI TIMING ==========
unsigned long previousMillis = 0;
const long interval = 5000;  // Interval pembacaan (5 detik)

// ========== VARIABEL GLOBAL ==========
float temperature_water = 0.0;
int failedReadings = 0;
const int maxFailedReadings = 3;
int deviceCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("ESP32 DS18B20 Sensor - IoT Destilasi");
  Serial.println("========================================\n");
  
  // Inisialisasi DS18B20 Sensor
  sensors.begin();
  deviceCount = sensors.getDeviceCount();
  
  Serial.printf("✓ DS18B20 Sensor initialized\n");
  Serial.printf("  Devices found: %d\n", deviceCount);
  
  if (deviceCount == 0) {
    Serial.println("\n✗ ERROR: No DS18B20 sensors found!");
    Serial.println("Please check:");
    Serial.println("  1. Sensor wiring (VCC, GND, DATA)");
    Serial.println("  2. 4.7kΩ pull-up resistor between VCC and DATA");
    Serial.println("  3. Sensor is not damaged");
    Serial.println("\nRestarting in 10 seconds...");
    delay(10000);
    ESP.restart();
  }
  
  // Set resolusi sensor (9-12 bit)
  sensors.setResolution(12);  // 12-bit = 0.0625°C resolution
  Serial.printf("  Resolution: 12-bit (0.0625°C)\n");
  
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
    
    // Baca data dari sensor DS18B20
    if (readDS18B20Sensor()) {
      // Kirim data ke server
      sendDataToServer();
    } else {
      failedReadings++;
      Serial.printf("⚠ Failed readings: %d/%d\n", failedReadings, maxFailedReadings);
      
      if (failedReadings >= maxFailedReadings) {
        Serial.println("⚠ Too many failed readings! Reinitializing sensor...");
        sensors.begin();
        deviceCount = sensors.getDeviceCount();
        Serial.printf("  Devices found: %d\n", deviceCount);
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

// ========== FUNGSI BACA SENSOR DS18B20 ==========
bool readDS18B20Sensor() {
  Serial.println("─────────────────────────────────────");
  Serial.println("Reading DS18B20 Sensor...");
  
  // Request temperature dari semua sensor
  sensors.requestTemperatures();
  
  // Baca suhu dari sensor pertama (index 0)
  float tempC = sensors.getTempCByIndex(0);
  
  // Cek apakah pembacaan valid
  if (tempC == DEVICE_DISCONNECTED_C || tempC == -127.0) {
    Serial.println("✗ Failed to read from DS18B20 sensor!");
    Serial.println("  Sensor might be disconnected or damaged");
    return false;
  }
  
  // Validasi range nilai (untuk air biasanya 0-100°C)
  if (tempC < -10 || tempC > 120) {
    Serial.println("✗ Sensor reading out of range!");
    Serial.printf("  Temperature: %.2f°C\n", tempC);
    return false;
  }
  
  // Simpan nilai
  temperature_water = tempC;
  failedReadings = 0;
  
  // Tampilkan hasil
  Serial.println("✓ Sensor reading successful:");
  Serial.printf("  🌡️  Water Temperature: %.2f°C\n", temperature_water);
  
  // Indikator kondisi
  if (temperature_water > 90) {
    Serial.println("  ⚠️  High temperature warning! (Near boiling point)");
  } else if (temperature_water > 70) {
    Serial.println("  ℹ️  Temperature is high (Distillation range)");
  } else if (temperature_water < 10) {
    Serial.println("  ❄️  Low temperature");
  }
  
  // Jika ada lebih dari 1 sensor, tampilkan semua
  if (deviceCount > 1) {
    Serial.println("\n  Additional sensors:");
    for (int i = 1; i < deviceCount; i++) {
      float temp = sensors.getTempCByIndex(i);
      Serial.printf("  Sensor %d: %.2f°C\n", i + 1, temp);
    }
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
  doc["temperature_air"] = 0.0;  // ESP32 ini hanya untuk DS18B20, suhu udara = 0
  doc["humidity_air"] = 0.0;     // ESP32 ini hanya untuk DS18B20, kelembapan = 0
  doc["temperature_water"] = temperature_water;
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
