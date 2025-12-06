/*
 * ESP32 Sensor Test - Diagnostic Tool
 * 
 * Program ini untuk testing sensor tanpa koneksi WiFi/Server
 * Gunakan untuk memastikan sensor bekerja dengan baik
 * 
 * Cara pakai:
 * 1. Upload code ini ke ESP32
 * 2. Buka Serial Monitor (115200 baud)
 * 3. Lihat hasil pembacaan sensor
 */

#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ========== KONFIGURASI ==========
#define DHTPIN 4          // Pin DHT22
#define DHTTYPE DHT22     // DHT22 atau DHT11
#define ONE_WIRE_BUS 5    // Pin DS18B20

DHT dht(DHTPIN, DHTTYPE);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║   ESP32 Sensor Diagnostic Tool        ║");
  Serial.println("║   Testing DHT22 + DS18B20              ║");
  Serial.println("╚════════════════════════════════════════╝\n");
  
  // Test DHT22
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("🔍 Testing DHT22 Sensor...");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  dht.begin();
  delay(2000);
  
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (isnan(h) || isnan(t)) {
    Serial.println("❌ DHT22 FAILED!");
    Serial.println("\nPossible issues:");
    Serial.println("  • Check wiring (VCC, DATA, GND)");
    Serial.println("  • DHT22 DATA pin should be on GPIO 4");
    Serial.println("  • Sensor might be damaged");
    Serial.println("  • Try different GPIO pin");
  } else {
    Serial.println("✅ DHT22 WORKING!");
    Serial.printf("  Temperature: %.2f°C\n", t);
    Serial.printf("  Humidity: %.2f%%\n", h);
    
    // Validasi range
    if (t < -40 || t > 80) {
      Serial.println("  ⚠️  Temperature out of normal range!");
    }
    if (h < 0 || h > 100) {
      Serial.println("  ⚠️  Humidity out of normal range!");
    }
  }
  
  Serial.println();
  
  // Test DS18B20
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("🔍 Testing DS18B20 Sensor...");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  sensors.begin();
  int deviceCount = sensors.getDeviceCount();
  
  Serial.printf("Devices found: %d\n", deviceCount);
  
  if (deviceCount == 0) {
    Serial.println("❌ DS18B20 NOT FOUND!");
    Serial.println("\nPossible issues:");
    Serial.println("  • Check wiring (VCC, DATA, GND)");
    Serial.println("  • DS18B20 DATA pin should be on GPIO 5");
    Serial.println("  • ⚠️  MISSING 4.7kΩ pull-up resistor!");
    Serial.println("  • Sensor might be damaged");
    Serial.println("  • Try different GPIO pin");
    Serial.println("\n⚠️  IMPORTANT: DS18B20 REQUIRES 4.7kΩ resistor");
    Serial.println("   between VCC and DATA pin!");
  } else {
    Serial.println("✅ DS18B20 WORKING!");
    
    sensors.setResolution(12);
    sensors.requestTemperatures();
    
    for (int i = 0; i < deviceCount; i++) {
      float tempC = sensors.getTempCByIndex(i);
      
      if (tempC == DEVICE_DISCONNECTED_C || tempC == -127.0) {
        Serial.printf("  Device %d: ❌ DISCONNECTED\n", i);
      } else {
        Serial.printf("  Device %d: %.2f°C", i, tempC);
        
        // Validasi range
        if (tempC < -10 || tempC > 120) {
          Serial.print(" ⚠️  Out of range!");
        }
        Serial.println();
      }
    }
    
    // Tampilkan address sensor
    Serial.println("\nSensor Addresses:");
    for (int i = 0; i < deviceCount; i++) {
      DeviceAddress addr;
      if (sensors.getAddress(addr, i)) {
        Serial.printf("  Device %d: ", i);
        for (uint8_t j = 0; j < 8; j++) {
          Serial.printf("%02X", addr[j]);
          if (j < 7) Serial.print(":");
        }
        Serial.println();
      }
    }
  }
  
  Serial.println();
  
  // Test GPIO Pins
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("🔍 GPIO Pin Status");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("DHT22 Pin (GPIO 4):");
  Serial.printf("  Digital Read: %d\n", digitalRead(DHTPIN));
  Serial.println("DS18B20 Pin (GPIO 5):");
  Serial.printf("  Digital Read: %d\n", digitalRead(ONE_WIRE_BUS));
  Serial.println();
  
  // Summary
  Serial.println("╔════════════════════════════════════════╗");
  Serial.println("║           DIAGNOSTIC SUMMARY           ║");
  Serial.println("╚════════════════════════════════════════╝");
  
  bool dhtOk = !isnan(h) && !isnan(t);
  bool dsOk = deviceCount > 0;
  
  Serial.print("DHT22:    ");
  Serial.println(dhtOk ? "✅ OK" : "❌ FAILED");
  
  Serial.print("DS18B20:  ");
  Serial.println(dsOk ? "✅ OK" : "❌ FAILED");
  
  Serial.println();
  
  if (dhtOk && dsOk) {
    Serial.println("🎉 ALL SENSORS WORKING!");
    Serial.println("You can now upload the main program.");
  } else {
    Serial.println("⚠️  SOME SENSORS FAILED!");
    Serial.println("Please fix the issues above before proceeding.");
  }
  
  Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Serial.println("Starting continuous monitoring...");
  Serial.println("(Reading every 5 seconds)");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

void loop() {
  delay(5000);
  
  Serial.println("─────────────────────────────────────────");
  
  // Read DHT22
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  Serial.print("DHT22:    ");
  if (!isnan(h) && !isnan(t)) {
    Serial.printf("%.2f°C, %.2f%%", t, h);
    
    // Heat index
    float heatIndex = dht.computeHeatIndex(t, h, false);
    Serial.printf(" (HI: %.2f°C)", heatIndex);
  } else {
    Serial.print("ERROR");
  }
  Serial.println();
  
  // Read DS18B20
  sensors.requestTemperatures();
  float tempC = sensors.getTempCByIndex(0);
  
  Serial.print("DS18B20:  ");
  if (tempC != DEVICE_DISCONNECTED_C && tempC != -127.0) {
    Serial.printf("%.2f°C", tempC);
  } else {
    Serial.print("ERROR");
  }
  Serial.println();
  
  Serial.println("─────────────────────────────────────────\n");
}
