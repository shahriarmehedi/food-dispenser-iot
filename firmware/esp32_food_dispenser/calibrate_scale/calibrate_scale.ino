/*
 * =====================================================================================
 * HX711 Load Cell Scale Calibration Helper for ESP32 (Non-Blocking Safe Edition)
 * 
 * Pin Connections:
 * HX711 VCC -> ESP32 5V (VIN) or 3.3V
 * HX711 GND -> ESP32 GND
 * HX711 DT  (DOUT) -> ESP32 GPIO 16
 * HX711 SCK (CLK)  -> ESP32 GPIO 4
 * 
 * Load Cell 4-Wire Color Code:
 * Red   -> E+
 * Black -> E-
 * White -> A-
 * Green -> A+
 * =====================================================================================
 */

#include "HX711.h"

#define DOUT_PIN 16
#define SCK_PIN  4

HX711 scale;
float calibration_factor = -420.0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("  HX711 Load Cell Scale Calibration Tool for ESP32");
  Serial.println("=======================================================");

  scale.begin(DOUT_PIN, SCK_PIN);

  Serial.println("[SCALE] Checking HX711 connection on GPIO 16 (DT) & GPIO 4 (SCK)...");

  // Check if HX711 is connected with a 2-second timeout to prevent freeze
  unsigned long start = millis();
  while (!scale.is_ready() && (millis() - start < 2000)) {
    delay(50);
  }

  if (!scale.is_ready()) {
    Serial.println("\n[ERROR] HX711 NOT DETECTED!");
    Serial.println("-------------------------------------------------------");
    Serial.println("Troubleshooting checklist:");
    Serial.println("1. Is the HX711 module wired to your ESP32?");
    Serial.println("   - DT / DOUT  -> GPIO 16");
    Serial.println("   - SCK / CLK  -> GPIO 4");
    Serial.println("   - VCC        -> 5V (VIN) or 3.3V");
    Serial.println("   - GND        -> ESP32 GND");
    Serial.println("2. If you only have RFID connected right now, plug in");
    Serial.println("   the HX711 load cell module before running this tool.");
    Serial.println("-------------------------------------------------------\n");
    return;
  }

  Serial.println("[SCALE] HX711 detected successfully!");
  scale.set_scale();
  scale.tare(); // Zero the scale

  long zero_factor = scale.read_average(10);
  Serial.print("[SCALE] Zero baseline tare factor: ");
  Serial.println(zero_factor);
  Serial.println("\nInstructions:");
  Serial.println("1. Place a known object on the scale (e.g. 100g, 200g, or water bottle).");
  Serial.println("2. Send '+' or 'a' in the Serial Monitor to increase calibration factor (+10).");
  Serial.println("3. Send '-' or 'z' to decrease calibration factor (-10).");
  Serial.println("4. Send 't' to tare (zero out container weight).");
  Serial.println("5. When Reading matches the object weight, copy that CALIBRATION_FACTOR number!\n");
}

void loop() {
  if (!scale.is_ready()) {
    Serial.println("[WAITING] HX711 not ready. Check DT/SCK wiring...");
    delay(2000);
    return;
  }

  scale.set_scale(calibration_factor);

  Serial.print("Reading: ");
  Serial.print(scale.get_units(5), 1);
  Serial.print(" g | Calibration Factor: ");
  Serial.println(calibration_factor);

  if (Serial.available()) {
    char temp = Serial.read();
    if (temp == '+' || temp == 'a') calibration_factor += 10;
    else if (temp == '-' || temp == 'z') calibration_factor -= 10;
    else if (temp == 't' || temp == 'T') {
      scale.tare();
      Serial.println("[TARE] Scale zeroed!");
    }
  }
  delay(500);
}
