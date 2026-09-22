/*
 * =====================================================================================
 * Smart Weight-Based Food Dispenser - ESP32 Firmware (Servo Motor Edition)
 * 
 * Hardware Modules:
 * 1. ESP32 Dev Module (WROOM-32)
 * 2. RC522 RFID Module (13.56 MHz SPI)
 * 3. HX711 24-Bit ADC + Load Cell Scale (Differential Weight Sensor)
 * 4. Servo Motor (SG90 / MG995 / MG996R) for Lid Unlock / Lock Mechanism
 * 5. Limit Switch / Magnetic Reed Switch (Lid Closed Detector)
 * 6. Active Buzzer / LED Indicator (Audio/Visual Feedback)
 * 7. (Optional) 0.96" I2C OLED SSD1306 (128x64)
 * 
 * Cloud Gateway:
 * Hosted on Vercel: https://food-dispenser-iot.vercel.app
 * 
 * Target WiFi Hotspot:
 * SSID: "iPhoneXS"
 * Password: "00000000"
 * =====================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <HX711.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// -------------------------------------------------------------------------------------
// 1. PIN CONFIGURATIONS
// -------------------------------------------------------------------------------------
// RC522 RFID (SPI)
#define SS_PIN          5   // SDA / SS pin
#define RST_PIN         22  // RST pin
// (Default VSPI: SCK = 18, MISO = 19, MOSI = 23)

// HX711 Load Cell
#define HX711_DOUT_PIN  16  // Data Out pin
#define HX711_SCK_PIN   4   // Clock pin

// Actuators & Sensors
#define SERVO_PIN       2   // PWM pin to Servo Motor signal wire (Orange/Yellow)
#define LID_SWITCH_PIN  17  // Limit Switch / Reed Switch (INPUT_PULLUP: LOW = Closed, HIGH = Open)
#define BUZZER_PIN      15  // Active Buzzer / Feedback Beeper

// Servo Position Angles (Adjust to match your dispenser mechanical latch)
const int SERVO_LOCKED_ANGLE   = 0;   // 0 degrees = Latch Locked
const int SERVO_UNLOCKED_ANGLE = 90;  // 90 degrees = Latch Open

// OLED Display (I2C)
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64
#define OLED_RESET      -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// -------------------------------------------------------------------------------------
// 2. NETWORK & CLOUD ENDPOINTS
// -------------------------------------------------------------------------------------
const char* WIFI_SSID     = "iPhoneXS";
const char* WIFI_PASSWORD = "00000000";
const char* SERVER_BASE   = "https://food-dispenser-iot.vercel.app";

// -------------------------------------------------------------------------------------
// 3. SCALE CALIBRATION CONSTANTS
// -------------------------------------------------------------------------------------
// Adjust CALIBRATION_FACTOR by putting a known weight (e.g. 100g) on your load cell.
// Use the companion calibrate_scale.ino sketch to find this value.
float CALIBRATION_FACTOR = -420.0;

// -------------------------------------------------------------------------------------
// 4. INSTANCES & SYSTEM STATE
// -------------------------------------------------------------------------------------
MFRC522 rfid(SS_PIN, RST_PIN);
HX711 scale;
Servo dispenserServo;

enum DispenserState {
  STATE_IDLE_WAIT_CARD,
  STATE_AUTHENTICATING,
  STATE_DISPENSING,
  STATE_CALCULATING_WEIGHT,
  STATE_CHECKOUT
};

DispenserState currentState = STATE_IDLE_WAIT_CARD;

String activeCardUid = "";
String activeStudentName = "";
float activeStudentBalance = 0.0;
float initialWeightGrams = 0.0;
unsigned long dispenseStartTime = 0;
const unsigned long MAX_DISPENSE_TIMEOUT_MS = 60000; // 60 seconds auto-lock safety timeout

// -------------------------------------------------------------------------------------
// 5. HELPER FUNCTIONS: HARDWARE CONTROL & DISPLAY
// -------------------------------------------------------------------------------------
void beep(int durationMs, int count = 1) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (count > 1) delay(80);
  }
}

void lockLid() {
  dispenserServo.write(SERVO_LOCKED_ANGLE);
  Serial.printf("[SERVO] Rotated to %d deg (LOCKED)\n", SERVO_LOCKED_ANGLE);
}

void unlockLid() {
  dispenserServo.write(SERVO_UNLOCKED_ANGLE);
  Serial.printf("[SERVO] Rotated to %d deg (UNLOCKED)\n", SERVO_UNLOCKED_ANGLE);
}

bool isLidClosed() {
  // Limit switch connected to GND with INPUT_PULLUP:
  // When lid closes, switch is pressed -> pin reads LOW
  return digitalRead(LID_SWITCH_PIN) == LOW;
}

void showScreen(String line1, String line2 = "", String line3 = "") {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Smart Food Dispenser");
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 18);
  display.println(line1);

  if (line2.length() > 0) {
    display.setCursor(0, 34);
    display.println(line2);
  }
  if (line3.length() > 0) {
    display.setCursor(0, 50);
    display.println(line3);
  }
  display.display();
}

// -------------------------------------------------------------------------------------
// 6. HELPER FUNCTIONS: CLOUD REST API CLIENTS
// -------------------------------------------------------------------------------------
bool apiAuthenticateCard(String cardUid, String &outName, float &outBalance, String &outMsg) {
  if (WiFi.status() != WL_CONNECTED) {
    outMsg = "WiFi Offline";
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure(); // SSL without storing root certificate

  HTTPClient https;
  String url = String(SERVER_BASE) + "/api/dispenser/auth";
  https.begin(client, url);
  https.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> doc;
  doc["cardUid"] = cardUid;
  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("[API] POST /api/dispenser/auth for " + cardUid);
  int httpCode = https.POST(requestBody);

  if (httpCode > 0) {
    String response = https.getString();
    Serial.printf("[API] Auth Code: %d | Body: %s\n", httpCode, response.c_str());

    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);

    bool authorized = resDoc["authorized"] | false;
    outMsg = resDoc["message"] | "Error";

    if (httpCode == 200 && authorized) {
      outName = resDoc["studentName"].as<String>();
      outBalance = resDoc["balance"].as<float>();
      https.end();
      return true;
    }
  } else {
    outMsg = "HTTP " + https.errorToString(httpCode);
    Serial.printf("[API] Connection Error: %s\n", outMsg.c_str());
  }

  https.end();
  return false;
}

bool apiCheckoutFood(String cardUid, float weightTakenGrams, float &outCharged, float &outRemBalance, String &outMsg) {
  if (WiFi.status() != WL_CONNECTED) {
    outMsg = "WiFi Offline";
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = String(SERVER_BASE) + "/api/dispenser/checkout";
  https.begin(client, url);
  https.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> doc;
  doc["cardUid"] = cardUid;
  doc["weightTakenGrams"] = weightTakenGrams;
  String requestBody;
  serializeJson(doc, requestBody);

  Serial.printf("[API] POST /api/dispenser/checkout: UID=%s, Weight=%.2fg\n", cardUid.c_str(), weightTakenGrams);
  int httpCode = https.POST(requestBody);

  if (httpCode > 0) {
    String response = https.getString();
    Serial.printf("[API] Checkout Code: %d | Body: %s\n", httpCode, response.c_str());

    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);

    bool success = resDoc["success"] | false;
    outMsg = resDoc["message"] | "";

    if (httpCode == 200 && success) {
      outCharged = resDoc["chargedAmount"].as<float>();
      outRemBalance = resDoc["remainingBalance"].as<float>();
      https.end();
      return true;
    }
  } else {
    outMsg = "HTTP " + https.errorToString(httpCode);
  }

  https.end();
  return false;
}

// -------------------------------------------------------------------------------------
// 7. SETUP
// -------------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=======================================================");
  Serial.println("  Smart Food Dispenser IoT Client Initializing (Servo)...");
  Serial.println("=======================================================");

  // Pin Modes
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LID_SWITCH_PIN, INPUT_PULLUP);

  // Initialize Servo Motor
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  dispenserServo.setPeriodHertz(50); // Standard 50Hz servo
  dispenserServo.attach(SERVO_PIN, 500, 2400); // Standard pulse width for SG90 / MG995
  lockLid();

  // Initialize I2C OLED Display
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    showScreen("Booting up...", "Connecting WiFi...");
  } else {
    Serial.println("[OLED] Warning: Display not found at 0x3C, continuing in Serial mode.");
  }

  // Initialize WiFi
  Serial.printf("[WIFI] Connecting to SSID: '%s'...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected Successfully!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    beep(100, 2); // Two quick chirps for WiFi connected
  } else {
    Serial.println("\n[WIFI] Warning: Could not connect to hotspot. Will retry in loop.");
  }

  // Initialize RC522 RFID Scanner
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[RFID] RC522 Scanner Initialized.");

  // Initialize HX711 Load Cell
  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);
  Serial.println("[SCALE] HX711 Initializing...");
  if (scale.is_ready()) {
    scale.set_scale(CALIBRATION_FACTOR);
    scale.tare(); // Zero the scale on startup with empty container
    Serial.println("[SCALE] Scale tared and zeroed.");
  } else {
    Serial.println("[SCALE] Warning: HX711 not detected. Check DOUT/SCK wiring.");
  }

  showScreen("Ready to Serve!", "Tap RFID Card", "Scale: 0.00g");
  beep(200, 1);
  currentState = STATE_IDLE_WAIT_CARD;
}

// -------------------------------------------------------------------------------------
// 8. MAIN STATE MACHINE LOOP
// -------------------------------------------------------------------------------------
void loop() {
  // Auto-reconnect WiFi if connection drops
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(1000);
    return;
  }

  switch (currentState) {

    // ---------------------------------------------------------
    // STATE 1: IDLE - WAITING FOR STUDENT TO TAP RFID CARD
    // ---------------------------------------------------------
    case STATE_IDLE_WAIT_CARD: {
      lockLid();

      // Look for a new RFID card
      if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
        delay(50);
        return;
      }

      // Convert UID to uppercase hexadecimal string (e.g. "43A1B2C3")
      activeCardUid = "";
      for (byte i = 0; i < rfid.uid.size; i++) {
        if (rfid.uid.uidByte[i] < 0x10) activeCardUid += "0";
        activeCardUid += String(rfid.uid.uidByte[i], HEX);
      }
      activeCardUid.toUpperCase();

      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();

      Serial.println("\n-------------------------------------------------------");
      Serial.println("[CARD DETECTED] Scanned UID: " + activeCardUid);
      beep(80, 1); // Single tap chirp

      currentState = STATE_AUTHENTICATING;
      break;
    }

    // ---------------------------------------------------------
    // STATE 2: AUTHENTICATING WITH CLOUD GATEWAY (<250ms)
    // ---------------------------------------------------------
    case STATE_AUTHENTICATING: {
      showScreen("Verifying Card...", "UID: " + activeCardUid, "Connecting...");

      String message = "";
      bool authorized = apiAuthenticateCard(activeCardUid, activeStudentName, activeStudentBalance, message);

      if (authorized) {
        // Access Granted!
        Serial.printf("[AUTH SUCCESS] Student: %s | Balance: ৳%.2f\n", activeStudentName.c_str(), activeStudentBalance);
        beep(100, 2); // Joyful double chirp

        // Record Initial Weight reading before opening lid
        if (scale.is_ready()) {
          initialWeightGrams = scale.get_units(5); // Average of 5 readings
          if (initialWeightGrams < 0) initialWeightGrams = 0;
        } else {
          initialWeightGrams = 0.0;
        }
        Serial.printf("[SCALE] Initial Weight Baseline: %.2f grams\n", initialWeightGrams);

        // Unlock Lid via Servo Motor
        unlockLid();
        dispenseStartTime = millis();

        showScreen("Welcome!", activeStudentName, "Balance: ৳" + String(activeStudentBalance, 2));
        delay(1200);
        showScreen("Lid Open!", "Take your food", "Close lid when done");

        currentState = STATE_DISPENSING;
      } else {
        // Access Refused (Unregistered, Suspended, or Low Balance)
        Serial.println("[AUTH REFUSED] " + message);
        beep(400, 1); // Long refusal beep

        showScreen("Access Denied", message, "UID: " + activeCardUid);
        delay(3000);

        showScreen("Ready to Serve!", "Tap RFID Card", "Scale: 0.00g");
        currentState = STATE_IDLE_WAIT_CARD;
      }
      break;
    }

    // ---------------------------------------------------------
    // STATE 3: DISPENSING FOOD (WAITING FOR LID TO CLOSE)
    // ---------------------------------------------------------
    case STATE_DISPENSING: {
      // Check if student closed the lid (or if safety timeout exceeded)
      bool closed = isLidClosed();
      bool timedOut = (millis() - dispenseStartTime) > MAX_DISPENSE_TIMEOUT_MS;

      if (closed || timedOut) {
        if (timedOut) {
          Serial.println("[TIMEOUT] Max dispensing time reached, auto-closing.");
        } else {
          Serial.println("[SENSOR] Lid closed by student.");
        }

        // Lock lid immediately via Servo Motor
        lockLid();
        beep(150, 1);

        showScreen("Measuring Weight...", "Please wait...", "Calculating charge");
        currentState = STATE_CALCULATING_WEIGHT;
      } else {
        // Display live scale reminder
        delay(200);
      }
      break;
    }

    // ---------------------------------------------------------
    // STATE 4: WEIGHT DIFFERENTIAL CALCULATION
    // ---------------------------------------------------------
    case STATE_CALCULATING_WEIGHT: {
      // Allow scale to settle for 600ms after servo movement
      delay(600);

      float finalWeightGrams = 0.0;
      if (scale.is_ready()) {
        finalWeightGrams = scale.get_units(10); // Average of 10 readings for accuracy
        if (finalWeightGrams < 0) finalWeightGrams = 0;
      }

      // Weight taken = weight before open - weight after close
      float weightTaken = initialWeightGrams - finalWeightGrams;

      // Handle small negative jitter
      if (weightTaken < 0) weightTaken = 0.0;

      Serial.printf("[SCALE] Initial: %.2fg | Final: %.2fg | Taken: %.2fg\n", 
                    initialWeightGrams, finalWeightGrams, weightTaken);

      // Perform Cloud Checkout
      float chargedAmount = 0.0;
      float remainingBalance = 0.0;
      String checkoutMsg = "";

      bool success = apiCheckoutFood(activeCardUid, weightTaken, chargedAmount, remainingBalance, checkoutMsg);

      if (success) {
        beep(100, 3); // Three celebratory finish beeps

        if (chargedAmount == 0.0) {
          showScreen("Checkout Complete", "Weight: " + String(weightTaken, 1) + "g (Noise)", "Charged: ৳0.00");
        } else {
          showScreen("Food Dispensed!", "Taken: " + String(weightTaken, 1) + "g", "Billed: ৳" + String(chargedAmount, 2));
        }

        delay(2500);
        showScreen("Account Balance", "Rem: ৳" + String(remainingBalance, 2), "Thank you!");
        delay(2500);
      } else {
        Serial.println("[CHECKOUT ERROR] " + checkoutMsg);
        showScreen("Checkout Error", checkoutMsg, "Contact Canteen Staff");
        delay(3500);
      }

      // Reset to idle state
      activeCardUid = "";
      activeStudentName = "";
      showScreen("Ready to Serve!", "Tap RFID Card", "Scale: 0.00g");
      currentState = STATE_IDLE_WAIT_CARD;
      break;
    }

    default:
      currentState = STATE_IDLE_WAIT_CARD;
      break;
  }
}
