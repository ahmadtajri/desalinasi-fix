/*
 * ESP32 FIRMWARE - PART B: WATER SENSORS (DS18B20)
 * 
 * Scope: 
 * - Monitors 6 Compartments
 * - Sensors: 6x DS18B20 (Water Temperature)
 * 
 * Hardware:
 * - 1x ESP32 Dev Board (Board B)
 * - 6x DS18B20 Waterproof Sensors
 * - 6x 4.7k Resistors
 * 
 * PIN MAPPING (GPIO):
 * - Compartment 1: GPIO 13
 * - Compartment 2: GPIO 12
 * - Compartment 3: GPIO 14
 * - Compartment 4: GPIO 27
 * - Compartment 5: GPIO 26
 * - Compartment 6: GPIO 25
 * (Same Pin Logic as Board A for consistency, but you can change them)
 * 
 * Note: 
 * - Requires Backend to accept partial data (Water data only).
 * - Very fast response time.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ========== WIFI CONFIG ==========
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// ========== SERVER CONFIG ==========
const char* serverBaseUrl = "http://192.168.1.100:5000/api/sensors"; 

// ========== SENSOR CONFIG ==========
const int dsPins[6] = {13, 12, 14, 27, 26, 25};
OneWire* oneWires[6];
DallasTemperature* sensors[6];

// Timing
unsigned long previousMillis = 0;
const long interval = 1000; // 1 Second

float waterTemps[6];

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=== ESP32 WATER MONITORING (6 COMPARTMENTS) ===");
  
  // Initialize Sensors
  for(int i=0; i<6; i++) {
    oneWires[i] = new OneWire(dsPins[i]);
    sensors[i] = new DallasTemperature(oneWires[i]);
    sensors[i]->begin();
    sensors[i]->setWaitForConversion(false); // ASYNC MODE
    Serial.printf("Initialized DS18B20 on Pin %d for Compartment %d\n", dsPins[i], i+1);
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
    
    Serial.println("\n--- Reading Water Sensors ---");

    // 1. Request Temperatures (All at once)
    for(int i=0; i<6; i++) {
      sensors[i]->requestTemperatures();
    }
    
    // 2. Wait for conversion (750ms for 12-bit)
    // Since we are doing nothing else, we delay.
    delay(800);

    // 3. Read & Send
    for(int i=0; i<6; i++) {
      float t = sensors[i]->getTempCByIndex(0);
      
      if(t == DEVICE_DISCONNECTED_C || t < -100) {
        Serial.printf("[C%d] Error reading DS18B20\n", i+1);
      } else {
        waterTemps[i] = t;
        sendData(i+1, t);
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

void sendData(int id, float temp) {
  HTTPClient http;
  http.begin(serverBaseUrl);
  http.addHeader("Content-Type", "application/json");

  // JSON Payload (Only Water Data)
  StaticJsonDocument<200> doc;
  doc["compartment_id"] = id;
  // Air Data removed
  doc["temperature_water"] = temp;
  doc["interval"] = 1;

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);
  
  if (httpCode == 201) {
    Serial.printf("  [C%d] Sent: %.2fC\n", id, temp);
  } else {
    Serial.printf("  [C%d] HTTP Error: %d\n", id, httpCode);
  }
  http.end();
}
