# Smart Weight-Based Food Dispenser IoT
## Hardware Setup, Firmware Flashing & Live Testing Guide (Servo Motor Edition)

> **Live Production Gateway:** [https://food-dispenser-iot.vercel.app](https://food-dispenser-iot.vercel.app)  
> **Admin Dashboard:** Username: `admin` (Password configured via `ADMIN_PASSWORD` env variable)  
> **Target WiFi Hotspot:** SSID: `iPhoneXS` | Password: `00000000`  
> **Actuator:** PWM Servo Motor (SG90 / MG995 / MG996R) on **GPIO 2**

---

## 1. System Overview & How It Works

The **Smart Weight-Based Food Dispenser** is a fully automated, cashless dining solution:
1. **Student Authorization:** A student taps their 13.56 MHz RFID card on the RC522 scanner.
2. **Sub-50ms Cloud Verification:** The ESP32 sends a `POST /api/dispenser/auth` request to the Next.js server on Vercel. The server queries Neon PostgreSQL to verify registration, active status, and minimum balance.
3. **Mechanical Servo Unlock:** Upon approval, the ESP32 rotates the **Servo Motor** to 90° (unlocked), releasing the food dispenser lid.
4. **Food Dispensing:** The student lifts the lid and dispenses food into their plate/bowl.
5. **Lid Closure & Servo Lock:** When the student closes the lid, a limit switch triggers, and the ESP32 rotates the **Servo Motor** back to 0° (locked).
6. **Differential Weight Calculation:** The internal HX711 24-bit ADC measures the weight difference (`initialWeight - finalWeight`).
7. **Atomic Cloud Billing:** The ESP32 sends `POST /api/dispenser/checkout`. The cloud deducts the exact cost from the student's balance (`weight * price_per_gram`) in an **atomic database transaction**.
8. **Real-Time Live Dashboard:** The canteen staff monitor transactions live on the Next.js dashboard, which auto-refreshes every 3 seconds via SWR without page reloads.

---

## 2. Hardware Bill of Materials (BOM)

| Component | Model / Specs | Purpose | Operating Voltage |
|---|---|---|---|
| **Microcontroller** | ESP32 DevKit V1 (30 or 38 pins) | Main IoT controller & WiFi client | 5V via Micro-USB / VIN |
| **RFID Reader** | RC522 (13.56 MHz RFID/NFC) | Student identification | **3.3V ONLY** (⚠️ 5V will burn it!) |
| **Actuator** | **Servo Motor** (SG90 / MG995 / MG996R) | Physical lid lock/unlock mechanism | 5V (VIN / external 5V) |
| **Weight Sensor** | HX711 + 5kg/10kg Load Cell | Differential gram measurement | 3.3V or 5V |
| **Lid Sensor** | Limit Switch or Magnetic Reed Switch | Detects lid closed event | Logic level (INPUT_PULLUP) |
| **Audio Feedback**| Active Buzzer (5V / 3.3V) | Tap and transaction chirps | 3.3V |
| **Display (Optional)**| 0.96" I2C OLED (SSD1306, 128x64) | Shows student name & billing | 3.3V |
| **Jumper Wires & Breadboard** | Dupont wires (M-M, M-F) | Circuit connections | - |

---

## 3. Complete Pinout & Wiring Connections

### Connection Table

| Component | Pin on Component | ESP32 GPIO Pin | Power Supply | Notes |
|---|---|---|---|---|
| **RC522 RFID** | **SDA (SS)** | **GPIO 5** | 3.3V | SPI Slave Select |
| **RC522 RFID** | **SCK** | **GPIO 18** | 3.3V | SPI Clock |
| **RC522 RFID** | **MOSI** | **GPIO 23** | 3.3V | SPI Master Out |
| **RC522 RFID** | **MISO** | **GPIO 19** | 3.3V | SPI Master In |
| **RC522 RFID** | **RST** | **GPIO 22** | 3.3V | Reset pin |
| **RC522 RFID** | **GND** | **GND** | GND | Ground |
| **RC522 RFID** | **3.3V** | **3V3** | 3.3V | ⚠️ Never connect to VIN/5V |
| **Servo Motor** | **PWM Signal (Orange/Yellow)** | **GPIO 2** | - | PWM Control |
| **Servo Motor** | **VCC (Red)** | **VIN (5V)** | 5V | Power for motor coils |
| **Servo Motor** | **GND (Brown/Black)** | **GND** | GND | Common Ground |
| **HX711 ADC** | **DOUT (Data)** | **GPIO 16** | 3.3V / 5V | Serial data output |
| **HX711 ADC** | **SCK (Clock)** | **GPIO 4** | 3.3V / 5V | Serial clock input |
| **HX711 ADC** | **VCC / GND** | **VIN / GND** | 5V / GND | Load cell amplifier power |
| **Lid Limit Switch**| **Terminal 1** | **GPIO 17** | - | Uses internal `INPUT_PULLUP` |
| **Lid Limit Switch**| **Terminal 2** | **GND** | GND | When lid closes, pin is pulled LOW |
| **Active Buzzer** | **Positive (+)** | **GPIO 15** | 3.3V | High = Beep, Low = Silent |
| **Active Buzzer** | **Negative (-)** | **GND** | GND | Ground |
| **OLED (Optional)**| **SDA / SCL** | **GPIO 21 / 22** | 3.3V | I2C Display (Address `0x3C`) |

### Wiring Schematic Diagram

```
                               ┌──────────────────────────┐
                               │       ESP32 DevKit       │
                               │                          │
  [RC522 SDA]  ───────────────►│ GPIO 5                   │
  [RC522 SCK]  ───────────────►│ GPIO 18                  │
  [RC522 MOSI] ───────────────►│ GPIO 23                  │
  [RC522 MISO] ───────────────►│ GPIO 19                  │
  [RC522 RST]  ───────────────►│ GPIO 22                  │
  [RC522 3.3V] ───────────────►│ 3V3 (3.3V ONLY!)         │
  [RC522 GND]  ───────────────►│ GND                      │
                               │                          │
  [SERVO Signal (Orange)] ◄────│ GPIO 2 (PWM)             │
  [SERVO VCC (Red)] ───────────│ VIN (5V)                 │
  [SERVO GND (Brown)] ─────────│ GND                      │
                               │                          │
  [HX711 DOUT] ───────────────►│ GPIO 16                  │
  [HX711 SCK]  ───────────────►│ GPIO 4                   │
  [HX711 VCC/GND] ─────────────│ VIN (5V) & GND           │
                               │                          │
  [LID SWITCH] ───────────────►│ GPIO 17 & GND (Pull-up)  │
  [BUZZER (+)] ◄───────────────│ GPIO 15 & GND            │
  [OLED SDA/SCL] ─────────────►│ GPIO 21 / GPIO 22        │
                               └──────────────────────────┘
```

> **Why a Servo Motor instead of a Solenoid Lock?**
> * Solenoid locks typically require a 12V external power supply, a 5V relay module, and a flyback diode to prevent reverse-voltage spikes.
> * A **Servo Motor** operates directly from 5V (ESP32 VIN or a simple 5V power bank/adapter), needs no relay, and is controlled directly via a single PWM pin (**GPIO 2**) using smooth angle rotation (0° = locked, 90° = unlocked).

---

## 4. Arduino IDE Setup & Required Libraries

### Step 1: Install ESP32 Board Core in Arduino IDE
1. Open **Arduino IDE** (version 2.0+ recommended).
2. Go to **File > Preferences** (or `Ctrl + ,`).
3. In **Additional boards manager URLs**, add:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**.
5. Go to **Tools > Board > Boards Manager** (or click the board icon on the left).
6. Search for `esp32` by **Espressif Systems** and click **Install**.

### Step 2: Install Required Libraries
Open **Tools > Manage Libraries** (or `Ctrl + Shift + I`) and install the following:

1. **`ESP32Servo`** (by Kevin Harrington / John K. Bennett)
   * *Critical:* Standard `Servo.h` does not work on ESP32. You must install `ESP32Servo`.
2. **`ArduinoJson`** (by Benoit Blanchon)
   * Version 6.x or 7.x supported.
3. **`MFRC522`** (by GithubCommunity)
   * For the RC522 RFID reader.
4. **`HX711 Arduino Library`** (by Bogdan Necula)
   * For load cell weighing.
5. **`Adafruit SSD1306`** and **`Adafruit GFX Library`** (by Adafruit)
   * For the optional 0.96" OLED display.

---

## 5. Scale Calibration (One-Time HX711 Setup)

Before using the dispenser in production, calibrate your load cell to read exact grams:

1. Open `firmware/esp32_food_dispenser/calibrate_scale/calibrate_scale.ino` in Arduino IDE.
2. Connect your ESP32 with HX711 connected to GPIO 16 (DOUT) and GPIO 4 (SCK).
3. Select **Tools > Board > ESP32 Dev Module** and choose your **COM Port**.
4. Click **Upload**.
5. Open **Serial Monitor** at **115200 baud**.
6. Ensure the scale has no weight on it. Send `t` in the Serial Monitor input to **Tare** (zero the scale).
7. Place an object of known weight on the scale (e.g., a 100g calibration weight, or a 500ml sealed water bottle = 500g).
8. Type `+` or `-` in the Serial Monitor to adjust the calibration factor until the displayed weight matches the exact known weight.
9. Note down the resulting `CALIBRATION_FACTOR` (for example: `-420.0` or `228.0`).
10. Open the main firmware `firmware/esp32_food_dispenser/esp32_food_dispenser.ino` and paste your value on line 74:
    ```cpp
    float CALIBRATION_FACTOR = -420.0; // Replace with your calibrated factor
    ```

---

## 6. How to Find the RFID Card UID for Enrolling Students

When enrolling a new student on the dashboard at `https://food-dispenser-iot.vercel.app/students`, you need their card's unique hex identifier (`Card UID`). Here are the two easiest ways to find it:

### Method 1: Using the ESP32 Serial Monitor (Simplest)
1. Flash `firmware/esp32_food_dispenser/esp32_food_dispenser.ino` to the ESP32.
2. Open the **Serial Monitor** at **115200 baud**.
3. Tap any new/unregistered RFID card on the RC522 reader.
4. The ESP32 Serial Monitor will print:
   ```text
   [RFID] Card Detected! Raw UID: 43:A1:B2:C3 -> Normalized: 43A1B2C3
   [AUTH FAILED] HTTP 404: Card not registered
   ```
5. Simply copy the normalized UID: **`43A1B2C3`**.
6. Paste it into the **Enroll Student** modal on the web dashboard.

### Method 2: Using Any Smartphone with NFC (Android or iPhone)
1. Download the free app **NFC Tools** (available on iOS App Store and Google Play).
2. Open the app and tap **Read**.
3. Hold the RFID card/tag against the back of your smartphone.
4. The app will immediately show **Serial Number / UID** (e.g., `43:A1:B2:C3`).
5. Remove the colons $\to$ `43A1B2C3`.

---

## 7. Flashing the Main Firmware

1. Open `firmware/esp32_food_dispenser/esp32_food_dispenser.ino`.
2. Confirm the WiFi and Server settings in lines 65–67:
   ```cpp
   const char* WIFI_SSID     = "iPhoneXS";
   const char* WIFI_PASSWORD = "00000000";
   const char* SERVER_BASE   = "https://food-dispenser-iot.vercel.app";
   ```
3. Connect your ESP32 to your PC via USB.
4. Select **Tools > Board > ESP32 Dev Module**.
5. Select the correct **COM Port**.
6. Set **Upload Speed** to `921600` (or `115200` if upload fails).
7. Click **Upload** (the right-arrow button in Arduino IDE).
8. Once flashing completes (`Hash of data verified`), open the **Serial Monitor** at **115200 baud**.

---

## 8. Step-by-Step Live Test Run (End-to-End)

Follow this complete walkthrough from student registration to food dispensing and automatic billing:

### Phase 1: Enroll a Test Student in the Live Web App
1. On your phone or laptop, open: **[https://food-dispenser-iot.vercel.app/login](https://food-dispenser-iot.vercel.app/login)**
2. Sign in with username `admin` and your configured `ADMIN_PASSWORD`.
3. Click on **Students** in the sidebar (or navigate to `/students`).
4. Click the **+ Enroll New Student** button.
5. Enter:
   * **Full Name:** `Shahriar Mehedi`
   * **Student ID:** `2003001`
   * **Department:** `Computer Science`
   * **RFID Card UID:** Enter the UID you found in Section 6 (e.g. `43A1B2C3`).
   * **Initial Balance:** `250.00`
6. Click **Enroll Student**. The student immediately appears with a green `ACTIVE` badge and balance `৳250.00`.

### Phase 2: Start Mobile Hotspot & Boot ESP32
1. On your iPhone, enable **Personal Hotspot**:
   * Name (SSID): **`iPhoneXS`**
   * Password: **`00000000`**
   * *(Tip: On iPhone, enable "Maximize Compatibility" if available).*
2. Power up the ESP32.
3. In the Serial Monitor, observe the boot sequence:
   ```text
   =========================================
   SMART FOOD DISPENSER - SYSTEM STARTUP
   =========================================
   [WIFI] Connecting to SSID: iPhoneXS
   ....
   [WIFI] Connected! IP Address: 172.20.10.2
   [SERVO] Initializing servo on GPIO 2...
   [SERVO] Latch LOCKED (0 degrees).
   [RFID] RC522 Reader Initialized.
   [SCALE] Scale tared and zeroed.
   [STATE] System IDLE. Ready for card tap.
   ```

### Phase 3: Tap RFID Card to Authorize & Unlock
1. Hold your RFID card near the RC522 reader.
2. The buzzer sounds two short confirmation beeps.
3. The ESP32 calls `POST https://food-dispenser-iot.vercel.app/api/dispenser/auth`:
   ```json
   { "cardUid": "43A1B2C3" }
   ```
4. The server responds in **~40ms**:
   ```json
   {
     "authorized": true,
     "studentName": "Shahriar Mehedi",
     "balance": 250.00,
     "message": "Access granted"
   }
   ```
5. **Servo Action:** The Servo Motor rotates to **90° (unlocked)** with a mechanical click!
6. OLED/Serial displays:
   ```text
   [AUTH SUCCESS] Student: Shahriar Mehedi | Balance: 250.00 BDT
   [SERVO] Latch UNLOCKED (90 degrees).
   [STATE] State changed to: DISPENSING. Please open lid and take food.
   ```

### Phase 4: Dispense Food & Close Lid
1. Open the dispenser lid.
2. Scoop food out of the container (or lift a 100g test weight from the load cell platform).
3. Close the lid completely.
4. The limit switch on GPIO 17 detects closure (`pin == LOW`).
5. **Servo Action:** The Servo Motor immediately rotates back to **0° (locked)**.
6. The scale waits 800ms for mechanical settling and reads the differential weight:
   ```text
   [SCALE] Initial Weight: 500.00 g | Final Weight: 400.00 g
   [SCALE] Net Food Taken: 100.00 g
   ```

### Phase 5: Automatic Cloud Checkout & Atomic Billing
1. The ESP32 automatically sends `POST /api/dispenser/checkout`:
   ```json
   {
     "cardUid": "43A1B2C3",
     "weightTakenGrams": 100.00
   }
   ```
2. The cloud backend executes an atomic Prisma transaction:
   * Calculation: $100\text{g} \times ৳0.50/\text{g} = ৳50.00$
   * New Balance: $৳250.00 - ৳50.00 = ৳200.00$
   * Creates an immutable financial ledger record.
3. The server returns:
   ```json
   {
     "success": true,
     "weightProcessed": 100.0,
     "ratePerGram": 0.50,
     "chargedAmount": 50.0,
     "previousBalance": 250.0,
     "remainingBalance": 200.0,
     "transactionId": "cm...cuid"
   }
   ```
4. The buzzer plays a cheerful double-beep.
5. OLED/Serial prints:
   ```text
   [CHECKOUT SUCCESS] Charged: 50.00 BDT | Remaining Balance: 200.00 BDT
   [STATE] Returning to IDLE. Ready for next student.
   ```

### Phase 6: Observe Real-Time Dashboard Updates
1. Leave the dashboard open on your computer at:
   **[https://food-dispenser-iot.vercel.app/dashboard](https://food-dispenser-iot.vercel.app/dashboard)**
2. Notice that **without clicking refresh**:
   * **Today's Revenue:** Increases by +৳50.00.
   * **Food Dispensed:** Increases by +100g (0.10kg).
   * **Successful Checkouts:** Increments by +1.
   * **Live Stream Feed:** A new row pops into the top of the table with student `Shahriar Mehedi`, `100.00g`, `৳50.00`, and time `Just now`.
   * **7-Day Telemetry Chart:** Dynamically rises to plot the new weight and revenue point.

---

## 9. Troubleshooting & FAQ

### Q1: The ESP32 is not connecting to my iPhone hotspot.
* **Solution:**
  1. On your iPhone, open **Settings > Personal Hotspot**.
  2. Make sure the toggle **"Allow Others to Join"** is ON.
  3. Turn ON the **"Maximize Compatibility"** option (this switches hotspot to 2.4 GHz, which ESP32 requires).
  4. Keep the Hotspot screen open until the ESP32 establishes its first connection.

### Q2: The Servo Motor jitters or does not rotate smoothly.
* **Solution:**
  1. Servo motors can draw high burst currents (up to 500mA–1A under mechanical load).
  2. Power the servo from the ESP32 **VIN** pin (when connected to a 5V 2A USB power supply or USB power bank), rather than the 3.3V pin.
  3. Ensure the ESP32 and Servo share a **Common Ground (GND)**.
  4. If your physical latch needs different angles, adjust lines 53–54 in `esp32_food_dispenser.ino`:
     ```cpp
     const int SERVO_LOCKED_ANGLE   = 0;   // e.g. 10 or 0
     const int SERVO_UNLOCKED_ANGLE = 90;  // e.g. 90 or 120
     ```

### Q3: What happens if a student taps their card but never opens the lid?
* The firmware includes a safety timeout (`MAX_DISPENSE_TIMEOUT_MS = 60000`, 60 seconds).
* If no lid activity occurs within 60 seconds, the servo locks automatically, the scale detects 0g food taken ($\le 5\text{g}$ noise filter), and the cloud charges **৳0.00**, protecting the student's balance.

### Q4: Is our other database project in Neon safe?
* **100% Yes.** All tables for this food dispenser project live in the isolated PostgreSQL schema `food_dispenser`.
* The server gateway dynamically appends `&schema=food_dispenser` to every database query. The `public` schema and all existing tables from your other projects are completely untouched and isolated.
