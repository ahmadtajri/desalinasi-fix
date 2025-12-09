/*
 * ESP32 FIRMWARE - PART A: AIR SENSORS (DHT22)
 * 
 * Scope: 
 * - Monitors 6 Compartments
 * - Sensors: 6x DHT22 (Air Temperature & Humidity)
 * 
 * Hardware:
 * - 1x ESP32 Dev Board (Board A)
 * - 6x DHT22 Sensors
 * 
 * PIN MAPPING (GPIO):
 * - Compartment 1: GPIO 13
 * - Compartment 2: GPIO 12
 * - Compartment 3: GPIO 14
 * - Compartment 4: GPIO 27
 * - Compartment 5: GPIO 26
 * - Compartment 6: GPIO 25
 * 
 * Note: 
 * - Requires Backend to accept partial data (Air data only).
 * - DHT sensors are slow. Reading 6 sensors might take >1 second.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ========== WIFI CONFIG ==========
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// ========== SERVER CONFIG ==========
const char* serverBaseUrl = "http://192.168.1.100:5000/api/sensors"; 

// ========== SENSOR CONFIG ==========
#define DHTTYPE DHT22

// Pin Definitions
const int dhtPins[6] = {13, 12, 14, 27, 26, 25};
DHT* dhtSensors[6];

// Timing
unsigned long previousMillis = 0;
const long interval = 1000; // 1 Second (Target)

// Data Buffer
struct AirData {
  float temp;
  float hum;
  bool valid;
};
AirData currentData[6];

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=== ESP32 AIR MONITORING (6 COMPARTMENTS) ===");
  
  // Initialize Sensors
  for(int i=0; i<6; i++) {
    dhtSensors[i] = new DHT(dhtPins[i], DHTTYPE);
    dhtSensors[i]->begin();
    Serial.printf("Initialized DHT on Pin %d for Compartment %d\n", dhtPins[i], i+1);
  }

  connectToWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    Serial.println("\n--- Reading Air Sensors ---");

    // READ DATA
    for(int i=0; i<6; i++) {
      float h = dhtSensors[i]->readHumidity();
      float t = dhtSensors[i]->readTemperature();

      if (isnan(h) || isnan(t)) {
        currentData[i].valid = false;
        Serial.printf("[C%d] Error reading DHT\n", i+1);
      } else {
        currentData[i].temp = t;
        currentData[i].hum = h;
        currentData[i].valid = true;
      }
    }

    // SEND DATA
    for(int i=0; i<6; i++) {
      if(currentData[i].valid) {
        sendData(i+1, currentData[i]);
      }
    }
  }
}

void connectToWiFi() {
  if(WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected!");
}

void sendData(int id, AirData data) {
  HTTPClient http;
  http.begin(serverBaseUrl);
  http.addHeader("Content-Type", "application/json");

  // JSON Payload (Only Air Data)
  StaticJsonDocument<200> doc;
  doc["compartment_id"] = id;
  doc["temperature_air"] = data.temp;
  doc["humidity_air"] = data.hum;
  // temperature_water REMOVED (Handled by other ESP32)
  doc["interval"] = 1;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);
  
  if (httpCode == 201) {
    Serial.printf("  [C%d] Sent: %.1fC / %.1f%%\n", id, data.temp, data.hum);
  } else {
    Serial.printf("  [C%d] HTTP Error: %d\n", id, httpCode);
  }
  http.end();
}
