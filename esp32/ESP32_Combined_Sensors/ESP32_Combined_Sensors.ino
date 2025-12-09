/*
 * ESP32 Multi-Compartment Sensor System (6 Compartments)
 * 
 * Hardware:
 * - 1x ESP32 Dev Board
 * - 6x DHT22 Sensors (Air Temp & Humidity)
 * - 6x DS18B20 Waterproof Sensors (Water Temp)
 * - 6x 4.7kΩ Resistors (for DS18B20 pull-ups)
 * 
 * PIN MAPPING (GPIO):
 * Compartment 1:
 * - DHT22:   PIN 32
 * - DS18B20: PIN 33
 * 
 * Compartment 2:
 * - DHT22:   PIN 25
 * - DS18B20: PIN 26
 * 
 * Compartment 3:
 * - DHT22:   PIN 27
 * - DS18B20: PIN 14
 * 
 * Compartment 4:
 * - DHT22:   PIN 12
 * - DS18B20: PIN 13
 * 
 * Compartment 5:
 * - DHT22:   PIN 4
 * - DS18B20: PIN 5 (Default OneWire)
 * 
 * Compartment 6:
 * - DHT22:   PIN 18
 * - DS18B20: PIN 19
 *
 * NOTE: 
 * - Interval pengiriman set ke 1 detik.
 * - Karena ada 6 request HTTP per detik, pastikan WiFi stabil.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ========== KONFIGURASI WiFi ==========
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// ========== KONFIGURASI SERVER ==========
// Ganti IP ini dengan IP Backend komputer Anda
const char* serverBaseUrl = "http://192.168.1.100:5000/api/sensors"; 

// ========== KONFIGURASI PIN ==========
// Format: {C1, C2, C3, C4, C5, C6}
const int dhtPins[6] = {32, 25, 27, 12, 4, 18};
const int dsPins[6]  = {33, 26, 14, 13, 5, 19};

// ========== OBJEK SENSOR ==========
#define DHTTYPE DHT22
DHT* dhtSensors[6];
OneWire* oneWires[6];
DallasTemperature* dsSensors[6];

// ========== KONFIGURASI TIMING ==========
unsigned long previousMillis = 0;
const long interval = 1000;  // 1 Detik

// ========== VARIABEL DATA ==========
struct CompartmentData {
  float airTemp;
  float airHum;
  float waterTemp;
};

CompartmentData currentData[6];

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==============================================");
  Serial.println("   ESP32 6-COMPARTMENT MONITORING SYSTEM");
  Serial.println("==============================================\n");

  // Inisialisasi Sensor untuk setiap kompartemen
  for (int i = 0; i < 6; i++) {
    Serial.printf("Initializing Compartment %d...\n", i + 1);
    
    // Init DHT
    dhtSensors[i] = new DHT(dhtPins[i], DHTTYPE);
    dhtSensors[i]->begin();
    
    // Init DS18B20
    oneWires[i] = new OneWire(dsPins[i]);
    dsSensors[i] = new DallasTemperature(oneWires[i]);
    dsSensors[i]->begin();
    
    // Set DS18B20 ke mode non-blocking (async) agar lebih cepat
    dsSensors[i]->setWaitForConversion(false);
    
    Serial.printf("  > DHT Pin: %d | DS Pin: %d initialized.\n", dhtPins[i], dsPins[i]);
  }

  connectToWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  // Reconnect WiFi if needed
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    Serial.println("\n════════════════════════════════════════════");
    Serial.println("Reading & Sending Data (All Compartments)...");
    
    // 1. Request Temperature untuk semua DS18B20 (Async Trigger)
    for (int i = 0; i < 6; i++) {
      dsSensors[i]->requestTemperatures();
    }
    
    // 2. Baca DHT selagi menunggu konversi DS18B20
    for (int i = 0; i < 6; i++) {
      float h = dhtSensors[i]->readHumidity();
      float t = dhtSensors[i]->readTemperature();
      
      // Validasi sederhana
      if (isnan(h) || isnan(t)) {
        currentData[i].airHum = 0.0;
        currentData[i].airTemp = 0.0;
        Serial.printf("  [C%d] DHT Read Error!\n", i+1);
      } else {
        currentData[i].airHum = h;
        currentData[i].airTemp = t;
      }
    }
    
    // 3. Beri sedikit waktu agar konversi DS selesai (min 750ms untuk 12bit, tapi DHT read diatas memakan waktu)
    // Jika belum 750ms sejak request, delay sisanya.
    // Asumsi loop DHT diatas memakan waktu > 100-200ms. Kita tambah delay safety.
    delay(500); 

    // 4. Baca nilai DS18B20
    for (int i = 0; i < 6; i++) {
      float tempC = dsSensors[i]->getTempCByIndex(0);
      if (tempC == DEVICE_DISCONNECTED_C || tempC < -100) {
        currentData[i].waterTemp = 0.0; 
      } else {
        currentData[i].waterTemp = tempC;
      }
    }

    // 5. Kirim Data ke Server (Sequential HTTP Requests)
    // Note: Mengirim 6 request beruntun bisa memakan waktu > 1-2 detik.
    for (int i = 0; i < 6; i++) {
      sendData(i + 1, currentData[i]);
    }
  }
}

void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("  IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi Connection Failed.");
  }
}

void sendData(int compartmentId, CompartmentData data) {
  HTTPClient http;
  http.begin(serverBaseUrl);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> doc;
  doc["compartment_id"] = compartmentId;
  doc["temperature_air"] = data.airTemp;
  doc["humidity_air"] = data.airHum;
  doc["temperature_water"] = data.waterTemp;
  doc["interval"] = 1; // 1 detik konstan

  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode == 201) {
    Serial.printf("  [C%d] Sent OK (A:%.1f H:%.1f W:%.1f)\n", 
      compartmentId, data.airTemp, data.airHum, data.waterTemp);
  } else {
    Serial.printf("  [C%d] Failed (%d)\n", compartmentId, httpResponseCode);
  }
  
  http.end();
}
