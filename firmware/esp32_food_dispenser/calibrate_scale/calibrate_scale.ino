/*
 * =====================================================================================
 * HX711 Load Cell Scale Calibration Helper for ESP32
 * 
 * Instructions:
 * 1. Flash this sketch to your ESP32.
 * 2. Open Arduino Serial Monitor at 115200 baud.
 * 3. Make sure the food container / scale platform is EMPTY, then send 't' to tare.
 * 4. Place a known object on the scale (e.g. 100g, 200g, or a 500ml water bottle = 500g).
 * 5. Use '+' or 'a' to increase calibration factor, '-' or 'z' to decrease.
 * 6. Adjust until the reading matches the known weight exactly.
 * 7. Copy that CALIBRATION_FACTOR number into your main esp32_food_dispenser.ino sketch!
 * =====================================================================================
 */

#include "HX711.h"

#define DOUT_PIN 16
#define SCK_PIN  4

HX711 scale;
float calibration_factor = -420.0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- HX711 Load Cell Calibration Tool ---");
  scale.begin(DOUT_PIN, SCK_PIN);
  scale.set_scale();
  scale.tare(); // Zero the scale

  long zero_factor = scale.read_average();
  Serial.print("Zero factor (tare baseline): ");
  Serial.println(zero_factor);
  Serial.println("Place a known weight on the scale.");
  Serial.println("Send '+ / a' to increase factor, '- / z' to decrease factor.");
}

void loop() {
  scale.set_scale(calibration_factor);

  Serial.print("Reading: ");
  Serial.print(scale.get_units(5), 1);
  Serial.print(" g");
  Serial.print(" | Calibration Factor: ");
  Serial.println(calibration_factor);

  if (Serial.available()) {
    char temp = Serial.read();
    if (temp == '+' || temp == 'a') calibration_factor += 10;
    else if (temp == '-' || temp == 'z') calibration_factor -= 10;
    else if (temp == 't' || temp == 'T') scale.tare();
  }
  delay(500);
}
