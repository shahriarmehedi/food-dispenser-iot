# ESP32 Firmware Flashing & Hardware Wiring Step-by-Step Manual

This guide provides an exhaustive, foolproof manual for assembling, configuring, flashing, and verifying the **ESP32 Microcontroller** for the Smart Weight-Based Food Dispenser project.

---

## 📑 Table of Contents
1. [Prerequisites & USB Driver Installation](#1-prerequisites--usb-driver-installation)
2. [Arduino IDE Installation & ESP32 Board Core](#2-arduino-ide-installation--esp32-board-core)
3. [Installing Required Libraries (Step-by-Step)](#3-installing-required-libraries-step-by-step)
4. [Hardware Wiring Diagram & Wire-by-Wire Instructions](#4-hardware-wiring-diagram--wire-by-wire-instructions)
5. [Opening & Inspecting the Firmware Code](#5-opening--inspecting-the-firmware-code)
6. [Flashing the ESP32 (The Upload Procedure)](#6-flashing-the-esp32-the-upload-procedure)
7. [Serial Monitor Verification & Live Testing](#7-serial-monitor-verification--live-testing)
8. [HX711 Scale Calibration Routine](#8-hx711-scale-calibration-routine)
9. [Troubleshooting & Common Flashing Errors](#9-troubleshooting--common-flashing-errors)

---

## 1. Prerequisites & USB Driver Installation

Before plugging in your ESP32 board to your PC:

### Identify Your USB-to-UART Chip
Look closely at the small rectangular microchip right behind the ESP32's micro-USB connector. Most ESP32 DevKit boards use one of two chips:
* **Silicon Labs CP2102:** Marked "SILABS CP2102". [Download Windows Driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
* **WCH CH340G / CH340C:** Marked "CH340". [Download Windows Driver](http://www.wch-ic.com/downloads/CH341SER_EXE.html)

### Check Device Manager (Windows)
1. Press `Win + X` $\to$ click **Device Manager**.
2. Expand the **Ports (COM & LPT)** section.
3. Plug your ESP32 into a USB port using a **data-capable micro-USB cable** (⚠️ Avoid charge-only cables!).
4. You should see a new entry appear:
   * Example: `Silicon Labs CP210x USB to UART Bridge (COM3)` or `USB-SERIAL CH340 (COM4)`.
   * Note down this COM port number (e.g. `COM3`).

---

## 2. Arduino IDE Installation & ESP32 Board Core

1. Download and install **[Arduino IDE 2.3+ for Windows](https://www.arduino.cc/en/software)**.
2. Launch Arduino IDE.
3. Open **File > Preferences** (or press `Ctrl + ,`).
4. In the field labeled **Additional boards manager URLs**, paste the official Espressif URL:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   *(If you already have other URLs there, separate them with a comma or new line).*
5. Click **OK**.
6. Open the Boards Manager by clicking the board icon on the left sidebar (or **Tools > Board > Boards Manager**).
7. In the search bar, type `esp32`.
8. Find **esp32 by Espressif Systems** and click **Install** (latest 2.x or 3.x release).
9. Wait for the download and installation to complete.

---

## 3. Installing Required Libraries (Step-by-Step)

The firmware relies on 5 modular open-source libraries. Install them via the Arduino IDE Library Manager:

1. Press `Ctrl + Shift + I` (or go to **Tools > Manage Libraries...**).
2. Install each of the following libraries:

| # | Search Term in Library Manager | Exact Library Name to Install | Author | Purpose |
|---|---|---|---|---|
| 1 | `ESP32Servo` | **ESP32Servo** | Kevin Harrington / John K. Bennett | Hardware PWM control for the servo motor |
| 2 | `ArduinoJson` | **ArduinoJson** | Benoit Blanchon | Parsing & generating JSON payloads for HTTP APIs |
| 3 | `MFRC522` | **MFRC522** | GithubCommunity | SPI communication with RC522 RFID reader |
| 4 | `HX711` | **HX711 Arduino Library** | Bogdan Necula | 24-bit differential ADC readout from load cell |
| 5 | `Adafruit SSD1306` | **Adafruit SSD1306** | Adafruit | I2C driver for 0.96" OLED display *(Click "Install All" if prompted for Adafruit BusIO/GFX)* |

> ⚠️ **IMPORTANT FOR SERVO:** Do **not** use the default `#include <Servo.h>` built into Arduino IDE—it does not support ESP32's hardware timer architecture and will cause compiler errors. Always use `ESP32Servo`.

---

## 4. Hardware Wiring Diagram & Wire-by-Wire Instructions

### Complete Pinout Connection Table

| Component | Pin on Component | ESP32 Pin | Power / Voltage | Wire Color Suggestion | Notes |
|---|---|---|---|---|---|
| **RC522 RFID** | **SDA / SS** | **GPIO 5** | - | Green | SPI Slave Select |
| **RC522 RFID** | **SCK** | **GPIO 18** | - | Yellow | SPI Clock |
| **RC522 RFID** | **MOSI** | **GPIO 23** | - | Blue | SPI Master Out |
| **RC522 RFID** | **MISO** | **GPIO 19** | - | Violet | SPI Master In |
| **RC522 RFID** | **RST** | **GPIO 22** | - | White | Reset |
| **RC522 RFID** | **GND** | **GND** | Ground | Black | Common Ground |
| **RC522 RFID** | **3.3V** | **3V3** | **3.3V ONLY** | Red | ⚠️ **DO NOT connect to VIN (5V)** |
| **Servo Motor** | **PWM Signal** | **GPIO 2** | - | Orange / Yellow | Hardware PWM |
| **Servo Motor** | **VCC (+)** | **VIN (5V)** | 5V | Red | Motor power |
| **Servo Motor** | **GND (-)** | **GND** | Ground | Brown / Black | Common Ground |
| **HX711 Scale** | **DOUT / DT** | **GPIO 16** | - | Green | Serial Data |
| **HX711 Scale** | **SCK / CLK** | **GPIO 4** | - | Yellow | Serial Clock |
| **HX711 Scale** | **VCC** | **VIN (5V) or 3V3** | 3.3V / 5V | Red | Amplifier power |
| **HX711 Scale** | **GND** | **GND** | Ground | Black | Common Ground |
| **Lid Limit Switch**| **Pin 1** | **GPIO 17** | - | Gray | Internal `INPUT_PULLUP` |
| **Lid Limit Switch**| **Pin 2** | **GND** | Ground | Black | Closing lid connects GPIO 17 to GND |
| **Active Buzzer** | **Positive (+)** | **GPIO 15** | 3.3V | Red | Signal pin (Active HIGH) |
| **Active Buzzer** | **Negative (-)** | **GND** | Ground | Black | Common Ground |
| **OLED (Optional)**| **SDA / SCL** | **GPIO 21 / 22** | 3.3V | Blue / Yellow | I2C Bus |

### ASCII Wiring Architecture

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

---

## 5. Opening & Inspecting the Firmware Code

1. In Arduino IDE, click **File > Open**.
2. Navigate to your local project folder:
   ```text
   food-dispenser-IoT\firmware\esp32_food_dispenser\esp32_food_dispenser.ino
   ```
3. Verify the network and endpoint parameters (lines 65–67):
   ```cpp
   const char* WIFI_SSID     = "iPhoneXS";
   const char* WIFI_PASSWORD = "00000000";
   const char* SERVER_BASE   = "https://food-dispenser-iot.vercel.app";
   ```
4. Verify the servo angles (lines 53–54):
   ```cpp
   const int SERVO_LOCKED_ANGLE   = 0;   // 0 degrees = Latch Locked
   const int SERVO_UNLOCKED_ANGLE = 90;  // 90 degrees = Latch Open
   ```
5. Click the **Verify** (Checkmark icon) in the top-left corner to confirm compilation passes without any errors.

---

## 6. Flashing the ESP32 (The Upload Procedure)

### Step 1: Select Board and Port
1. In the top toolbar dropdown (or **Tools > Board > esp32 > ESP32 Dev Module**), select **ESP32 Dev Module**.
2. Under **Tools > Port**, select the COM port of your ESP32 (e.g. `COM3`).
3. Set the following settings under the **Tools** menu:
   * **Upload Speed:** `921600` (if upload fails, drop to `115200`)
   * **CPU Frequency:** `240MHz (WiFi/BT)`
   * **Flash Frequency:** `80MHz`
   * **Flash Mode:** `QIO`
   * **Flash Size:** `4MB (32Mb)`
   * **Partition Scheme:** `Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)`

### Step 2: Upload Firmware
1. Click the **Upload** button (Right-Arrow icon).
2. Watch the bottom output terminal in Arduino IDE.
3. The IDE will compile the sketch, display memory usage, and begin flashing:
   ```text
   Connecting........_____....._____.....
   Writing at 0x00010000... (100 %)
   Wrote 945632 bytes in 12.8 seconds...
   Hash of data verified.
   Leaving...
   Hard resetting via RTS pin...
   ```

> 💡 **PRO-TIP (The "Connecting..." Fix):**  
> If the console shows `Connecting........_____....._____` repeatedly and times out, **press and hold down the physical "BOOT" button** on your ESP32 board the moment you see `Connecting...`. Release the button once the upload progress percentage starts moving!

---

## 7. Serial Monitor Verification & Live Testing

1. Once uploaded, open the **Serial Monitor** in Arduino IDE (`Ctrl + Shift + M` or magnifying glass icon).
2. Set the baud rate dropdown at the top right to **`115200 baud`**.
3. Press the **EN / RST** button on your ESP32 to restart it.
4. You should see the startup banner:
   ```text
   =======================================================
     Smart Food Dispenser IoT Client Initializing (Servo)...
   =======================================================
   [SERVO] Rotated to 0 deg (LOCKED)
   [WIFI] Connecting to SSID: iPhoneXS
   ....
   [WIFI] Connected Successfully!
   [WIFI] IP Address: 172.20.10.2
   [RFID] RC522 Reader Initialized.
   [SCALE] Scale tared and zeroed.
   [STATE] System IDLE. Ready for card tap.
   ```

### Live Test with Card Tap:
1. Tap your RFID card on the reader.
2. The Serial Monitor will output:
   ```text
   [RFID] Card Detected! Raw UID: 43:A1:B2:C3 -> Normalized: 43A1B2C3
   [AUTH SUCCESS] Student: Shahriar Hossain | Balance: 250.00 BDT
   [SERVO] Rotated to 90 deg (UNLOCKED)
   [STATE] DISPENSING. Please open lid and take food.
   ```
3. Lift the lid, take your food portion, and close the lid:
   ```text
   [SENSOR] Lid closed by student.
   [SERVO] Rotated to 0 deg (LOCKED)
   [SCALE] Initial: 500.00g | Final: 400.00g | Taken: 100.00g
   [CHECKOUT SUCCESS] Charged: 50.00 BDT | Remaining: 200.00 BDT
   [STATE] Returning to IDLE.
   ```
4. Open the live dashboard at **[https://food-dispenser-iot.vercel.app/dashboard](https://food-dispenser-iot.vercel.app/dashboard)** to see the transaction appear live in real time.

---

## 8. HX711 Scale Calibration Routine

If your scale readings are inaccurate or drifting:

1. Open `firmware/esp32_food_dispenser/calibrate_scale/calibrate_scale.ino`.
2. Upload it to your ESP32.
3. Open the Serial Monitor at **115200 baud**.
4. With the scale platform empty, type `t` and press Enter to zero (tare) the scale.
5. Place an item of exact known weight (e.g. a 100g calibration weight or a sealed 500ml water bottle = 500g) on the scale.
6. Look at the displayed weight.
   * Send `+` to increase the calibration factor.
   * Send `-` to decrease the calibration factor.
   * Repeat until the displayed grams match your item's exact weight.
7. Note down the displayed `CALIBRATION_FACTOR` (e.g. `-420.0`).
8. Open `esp32_food_dispenser.ino`, update line 74:
   ```cpp
   float CALIBRATION_FACTOR = -420.0; // Your new calibration value
   ```
9. Re-upload `esp32_food_dispenser.ino`.

---

## 9. Troubleshooting & Common Flashing Errors

| Symptom / Error Message | Root Cause | Solution |
|---|---|---|
| `Failed to connect to ESP32: Timed out waiting for packet header` | ESP32 failed to enter bootloader mode automatically | Hold the **BOOT** button on the ESP32 while Arduino IDE displays `Connecting...`. Release once flashing starts. |
| `No such file or directory: ESP32Servo.h` | Library not installed or wrong library selected | In Library Manager (`Ctrl+Shift+I`), search for and install **ESP32Servo** by Kevin Harrington. |
| `WiFi failed to connect / dots print endlessly` | Hotspot not broadcasting or 5GHz band issue | On your iPhone, enable **Personal Hotspot**, turn on **"Allow Others to Join"**, and enable **"Maximize Compatibility"** (forces 2.4GHz). |
| `RC522 reader does not detect cards` | 3.3V power dropped or SPI pins mismatched | Double check pin connections: SDA=GPIO 5, SCK=GPIO 18, MOSI=GPIO 23, MISO=GPIO 19, RST=GPIO 22. Ensure VCC is 3.3V. |
| `Servo motor vibrates, hums, or reboots ESP32` | Brownout caused by high motor surge current | Power the servo from the **VIN** pin connected to a 5V 2A USB power adapter or battery pack, not a low-power USB port. |
| `HTTP 404: Card not registered` | Card UID is not enrolled in database | Go to `https://food-dispenser-iot.vercel.app/students` $\to$ click **Enroll New Student** $\to$ enter the UID shown in the Serial Monitor. |
