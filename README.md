# Smart Weight-Based Food Dispenser IoT & Admin Gateway

An end-to-end IoT Smart Food Dispenser and Cashless Canteen Management system built with **Next.js 14 (App Router)**, **TypeScript**, **Prisma ORM (Neon PostgreSQL)**, **Tailwind CSS**, and **ESP32 Microcontroller Firmware**.

* **Live Cloud Gateway & Dashboard:** [https://food-dispenser-iot.vercel.app](https://food-dispenser-iot.vercel.app)
* **Default Admin Credentials:** Username: `admin` | Password: `admin123`
* **Target Hardware Hotspot:** SSID: `iPhoneXS` | Password: `00000000`
* 📖 **Hardware & Testing Guide:** [`HARDWARE_SETUP_AND_TEST_GUIDE.md`](./HARDWARE_SETUP_AND_TEST_GUIDE.md)
* 📘 **System Architecture & Team Guide:** [`SYSTEM_ARCHITECTURE_AND_TEAM_GUIDE.md`](./SYSTEM_ARCHITECTURE_AND_TEAM_GUIDE.md)

---

## 🚀 Key Highlights & Hardware Context

* **Low-Latency M2M REST Endpoints:** Dedicated endpoints (`/api/dispenser/auth` and `/api/dispenser/checkout`) with an execution latency of **~40ms** (well below the <250ms hardware SLA).
* **RC522 RFID Card Scanner:** Automatic UID normalization (e.g. `43:a1:b2:c3` $\to$ `43A1B2C3`), balance checks, and instant suspension enforcement.
* **HX711 Load Cell Scale:** Differential weight checkout with noise filtering ($\le 5\text{g}$ noise threshold produces ৳0 charge with zero-weight audit logging).
* **Atomic Transactions:** Uses Prisma's `$transaction` for guaranteed data consistency between student balance updates and financial ledger records.
* **Modern Minimalist UI:** Minimal shades of black (`#090C13` / `#0F1420`) with electric sky-blue accents (`#0084FF` / `#38BDF8`), Google Font **Figtree** strictly capped at `500` font-weight, pill buttons, and responsive multi-column layout.
* **Interactive Data Visualization:** Real-time curved area charts with `recharts` for 7-day weight and revenue tracking.
* **Multi-Tenant Schema Isolation:** Automatically routes database queries to the `food_dispenser` schema in Neon PostgreSQL to ensure **zero conflict** with any other project tables.

---

## 🔌 Hardware Wiring & Pinout Guide (ESP32)

### Pinout Connection Table

| Component | Pin on Component | ESP32 GPIO Pin | Power / Voltage | Notes |
|---|---|---|---|---|
| **RC522 RFID** | **SDA / SS** | **GPIO 5** | 3.3V Only | SPI Chip Select |
| **RC522 RFID** | **SCK** | **GPIO 18** | 3.3V | SPI Clock |
| **RC522 RFID** | **MOSI** | **GPIO 23** | 3.3V | SPI Master Out |
| **RC522 RFID** | **MISO** | **GPIO 19** | 3.3V | SPI Master In |
| **RC522 RFID** | **RST** | **GPIO 22** | 3.3V | Reset pin |
| **RC522 RFID** | **GND / 3.3V** | **GND / 3V3** | 3.3V | ⚠️ Do NOT connect to 5V |
| **HX711 Scale** | **DOUT / DT** | **GPIO 16** | 3.3V / 5V | 24-bit Data Out |
| **HX711 Scale** | **SCK / CLK** | **GPIO 4** | 3.3V / 5V | Clock pin |
| **Servo Motor** | **Signal (PWM)** | **GPIO 2** | 5V (VIN) | SG90 / MG995 / MG996R (0° locked, 90° unlocked) |
| **Lid Switch** | **Pin 1 / Pin 2** | **GPIO 17 & GND** | - | Limit switch (`INPUT_PULLUP`: LOW = Closed) |
| **Active Buzzer** | **(+) / (-)** | **GPIO 15 & GND** | 3.3V | Audio feedback chirps |
| **OLED 0.96" (I2C)**| **SDA / SCL** | **GPIO 21 / 22** | 3.3V | Address `0x3C` (Optional) |

```
                              ┌──────────────────────┐
                              │     ESP32 DevKit     │
                              │                      │
 [RC522 SDA]  ───────────────►│ GPIO 5               │
 [RC522 SCK]  ───────────────►│ GPIO 18              │
 [RC522 MOSI] ───────────────►│ GPIO 23              │
 [RC522 MISO] ───────────────►│ GPIO 19              │
 [RC522 RST]  ───────────────►│ GPIO 22              │
                              │                      │
 [HX711 DOUT] ───────────────►│ GPIO 16              │
 [HX711 SCK]  ───────────────►│ GPIO 4               │
                              │                      │
 [SERVO MOTOR (PWM)] ◄────────│ GPIO 2               │
 [LID LIMIT SWITCH] ─────────►│ GPIO 17 (Pullup)     │
 [BUZZER] ◄───────────────────│ GPIO 15              │
 [OLED I2C SDA] ─────────────►│ GPIO 21              │
 [OLED I2C SCL] ─────────────►│ GPIO 22              │
                              └──────────────────────┘
```

---

## 🛠 ESP32 Flashing Instructions (Arduino IDE)

### 1. Install Arduino IDE & ESP32 Board Core
1. Download [Arduino IDE 2.x](https://www.arduino.cc/en/software).
2. Go to **File > Preferences**, and in "Additional Board Manager URLs", add:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to **Tools > Board > Boards Manager**, search for `esp32` by Espressif, and click **Install**.

### 2. Install Required Libraries
In Arduino IDE, open **Tools > Manage Libraries** (Ctrl+Shift+I) and install:
* **ESP32Servo** (by Kevin Harrington / John K. Bennett) — *Required for servo motor PWM on ESP32*
* **ArduinoJson** (by Benoit Blanchon, v6 or v7)
* **MFRC522** (by GithubCommunity)
* **HX711 Arduino Library** (by Bogdan Necula)
* **Adafruit SSD1306** & **Adafruit GFX Library** (for optional OLED screen)

### 3. Open and Flash the Firmware
1. Open the project firmware in Arduino IDE:
   `firmware/esp32_food_dispenser/esp32_food_dispenser.ino`
2. Connect your ESP32 board to your computer via micro-USB.
3. Select your board: **Tools > Board > ESP32 Arduino > ESP32 Dev Module**.
4. Select the correct **Port** (e.g. `COM3` on Windows).
5. Verify the WiFi settings in the sketch:
   ```cpp
   const char* WIFI_SSID     = "iPhoneXS";
   const char* WIFI_PASSWORD = "00000000";
   const char* SERVER_BASE   = "https://food-dispenser-iot.vercel.app";
   ```
6. Click **Upload** (Arrow icon).

---

## ⚖️ Scale Calibration (HX711)

To ensure accurate gram readings:
1. Open and flash `firmware/esp32_food_dispenser/calibrate_scale/calibrate_scale.ino`.
2. Open Serial Monitor at **115200 baud**.
3. With an empty scale, type `t` to zero/tare.
4. Place a known object on the scale (e.g. a 100g weight or 500ml water bottle = 500g).
5. Adjust calibration using `+` or `-` until the displayed weight matches your object.
6. Copy that `CALIBRATION_FACTOR` into line 54 of `esp32_food_dispenser.ino`.

---

## 🧪 End-to-End Live Test Walkthrough

Follow this step-by-step test to verify everything from hardware to cloud:

### Phase 1: Enroll a Test Student in the Dashboard
1. Open **[https://food-dispenser-iot.vercel.app/login](https://food-dispenser-iot.vercel.app/login)**.
2. Sign in with `admin` / `admin123`.
3. Go to **Students Directory** (`/students`) $\to$ Click **Enroll New Student**.
4. Enter:
   * **Full Name:** `Shahriar Hossain`
   * **Student ID:** `2003001`
   * **Department:** `CSE`
   * **Card UID:** Your RFID card hex UID (e.g. `43A1B2C3` or tap card on NFC Tools mobile app to read).
   * **Initial Balance:** `৳250.00`
5. Click **Enroll Student**.

### Phase 2: Power Up the ESP32 Hardware
1. Turn on your iPhone hotspot with name **`iPhoneXS`** and password **`00000000`**.
2. Power the ESP32. Open the Serial Monitor at 115200 baud.
3. Observe:
   ```text
   [WIFI] Connecting to SSID: 'iPhoneXS'...
   [WIFI] Connected Successfully! IP: 172.20.10.x
   [RFID] RC522 Scanner Initialized.
   [SCALE] Scale tared and zeroed.
   Ready to Serve! Tap RFID Card.
   ```

### Phase 3: The Dispensing Cycle
1. **Tap the RFID card:**
   * ESP32 beeps twice and prints:
     `[AUTH SUCCESS] Student: Shahriar Hossain | Balance: ৳250.00`
   * The **Servo Motor** rotates to 90° and immediately **unlocks** the lid.
   * LCD displays: `"Welcome, Shahriar! Lid Open!"`.
2. **Dispense Food:**
   * Open the lid, scoop food (or lift a 100g test weight from the scale).
3. **Close the Lid:**
   * The limit switch triggers. The **Servo Motor** rotates back to 0° (**locked**).
   * The scale reads the weight difference: e.g. `100.0g`.
   * ESP32 sends `POST /api/dispenser/checkout`.
   * Cloud charges `100g * ৳0.50 = ৳50.00`.
   * ESP32 screen and Serial show:
     `Food Dispensed! Taken: 100g | Billed: ৳50.00 | Remaining: ৳200.00`
4. **Live Dashboard Update:**
   * Look at your computer screen at `/dashboard` — without touching or refreshing the page, the **Live Feed Table** and **KPI Metrics Cards** automatically update via SWR!

---

## 📡 M2M Hardware API Reference

### 1. RFID Card Authorization
* **Route:** `POST /api/dispenser/auth`
* **Request:**
  ```json
  { "cardUid": "43A1B2C3" }
  ```
* **Responses:**
  * `200 OK`: `{ "authorized": true, "studentName": "Shahriar Hossain", "balance": 250.00, "message": "Access granted" }`
  * `403 Forbidden`: `{ "authorized": false, "balance": 8.50, "message": "Low balance" }` or `"Card suspended"`
  * `404 Not Found`: `{ "authorized": false, "message": "Card not registered" }`

### 2. Differential Weight Checkout
* **Route:** `POST /api/dispenser/checkout`
* **Request:**
  ```json
  { "cardUid": "43A1B2C3", "weightTakenGrams": 100.0 }
  ```
* **Responses:**
  * `200 OK`:
    ```json
    {
      "success": true,
      "weightProcessed": 100.0,
      "ratePerGram": 0.50,
      "chargedAmount": 50.00,
      "previousBalance": 250.00,
      "remainingBalance": 200.00,
      "transactionId": "cm...cuid"
    }
    ```
  * If `weightTakenGrams <= 5.00g` (sensor noise threshold), returns `200 OK` with `chargedAmount: 0.00` and no balance deduction.

---

## 💻 Local Developer Commands

```bash
# Install dependencies
npm install

# Push Prisma schema to database
npx prisma db push

# Run local development server (binds to 0.0.0.0:3000 for LAN testing)
npm run dev -- -H 0.0.0.0 -p 3000

# Run automated hardware & API test suite
node test_endpoints.js

# Run admin authentication & UI protection test suite
node test_auth_and_ui.js
```
