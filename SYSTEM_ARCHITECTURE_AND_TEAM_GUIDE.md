# Smart Weight-Based Food Dispenser IoT & Admin Gateway
## Complete System Architecture & Team Onboarding Guide

> **Audience:** This document is written for all hardware, firmware, software, and canteen operations team members. It explains the entire architecture, how the hardware and cloud communicate, and how to operate and maintain the system.

---

## 1. Executive Summary & Objective

The **Smart Weight-Based Food Dispenser System** is an automated, cashless canteen solution designed for institutional dining halls. 

Instead of manual cashiers or flat-rate buffet pricing:
1. Students tap their RFID card on the dispenser.
2. The dispenser verifies identity and balance within **~40 milliseconds**, then unlocks the dispenser lid.
3. The student dispenses their desired portion of food.
4. When the lid closes, an internal load cell scale measures the exact gram difference.
5. The cloud backend automatically calculates the charge (`weight * rate_per_gram`), deducts it from the student's digital balance in an **atomic database transaction**, and logs a tamper-proof audit receipt.
6. Canteen staff monitor transactions in real time on a sleek, dark-mode administrative dashboard.

---

## 2. High-Level Architecture & Communication Flow

```
 ┌────────────────────────────────────────────────────────┐
 │                 ESP32 Microcontroller                  │
 │   - RC522 RFID Scanner (13.56 MHz SPI)                 │
 │   - HX711 24-bit ADC + Load Cell Scale                 │
 │   - Servo Motor (SG90/MG995/MG996R on GPIO 2)          │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            │ HTTP POST (JSON / WiFi)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │           Next.js 14 Gateway (Vercel / Local)          │
 │  ┌──────────────────────────────────────────────────┐  │
 │  │ M2M IoT Endpoints (No Session Required)          │  │
 │  │  • POST /api/dispenser/auth      (~40ms latency) │  │
 │  │  • POST /api/dispenser/checkout  (Atomic $tx)    │  │
 │  └──────────────────────────────────────────────────┘  │
 │  ┌──────────────────────────────────────────────────┐  │
 │  │ Protected Admin Portal (HMAC Session Cookie)     │  │
 │  │  • /dashboard     (Live 3s SWR stream + charts)  │  │
 │  │  • /students      (RFID directory & top-ups)     │  │
 │  │  • /transactions  (Ledger & CSV export)          │  │
 │  │  • /settings      (Runtime pricing & thresholds) │  │
 │  └──────────────────────────────────────────────────┘  │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            │ Prisma ORM (Connection Pool)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │              Neon Cloud PostgreSQL Database            │
 │   Schema: "food_dispenser" (Isolated from others)      │
 │    ├── students                                        │
 │    ├── transactions                                    │
 │    └── system_configs                                  │
 └────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Hardware & Software Lifecycle

### Step 1: RFID Tap & Door Unlock Authorization
1. A student taps their RFID card against the RC522 reader.
2. The ESP32 captures the raw hexadecimal card UID (e.g. `43A1B2C3`).
3. The ESP32 sends an HTTP POST request to:
   ```http
   POST /api/dispenser/auth
   Content-Type: application/json

   { "cardUid": "43A1B2C3" }
   ```
4. **Backend logic in `app/api/dispenser/auth/route.ts`:**
   - Normalizes the UID (strips colons, spaces, converts to uppercase).
   - In parallel (`Promise.all`), fetches the student's record and the minimum balance threshold (default ৳10.00).
   - **Evaluates:**
     - Does card exist? If no $\to$ `404 Not Found` (`Card not registered`).
     - Is account suspended? If yes $\to$ `403 Forbidden` (`Card suspended`).
     - Is balance $\ge$ threshold? If no $\to$ `403 Forbidden` (`Low balance`).
     - Valid $\to$ `200 OK`:
       ```json
       {
         "authorized": true,
         "studentName": "Shahriar Mehedi",
         "balance": 350.00,
         "message": "Access granted"
       }
       ```
5. **Hardware Action:** The ESP32 rotates the **Servo Motor** on GPIO 2 to 90° (unlocked) to release the dispenser lid and displays `"Welcome, Shahriar! Ready."` on the LCD.

---

### Step 2: Food Dispensing & Scale Measurement
1. Before the lid opens, the ESP32 records the initial weight reading: `initialWeight = readScale()`.
2. The student opens the lid and scoops food into their container.
3. The student closes the lid. A limit switch triggers, and the ESP32 rotates the **Servo Motor** back to 0° (locked).
4. After settling (~500ms), the ESP32 takes the final weight reading: `finalWeight = readScale()`.
5. The differential weight taken is:
   $$\text{weightTakenGrams} = \text{initialWeight} - \text{finalWeight}$$

---

### Step 3: Checkout & Atomic Balance Deduction
1. The ESP32 sends the checkout payload:
   ```http
   POST /api/dispenser/checkout
   Content-Type: application/json

   {
     "cardUid": "43A1B2C3",
     "weightTakenGrams": 145.50
   }
   ```
2. **Backend logic in `app/api/dispenser/checkout/route.ts`:**
   * **Atomic Transaction (`prisma.$transaction`):** All database operations run inside a single database transaction so that a network drop or crash can never cause money to be deducted without recording a receipt.
   * **Sensor Noise Filter ($\le 5.00\text{g}$):**
     - If the weight difference is $\le 5\text{g}$ (e.g. someone opened the lid and closed it without taking food), the student is charged **৳0.00**.
     - A zero-charge transaction is logged for hardware telemetry.
   * **Normal Charge Calculation:**
     $$\text{charge} = \text{round}(\text{weightTakenGrams} \times \text{pricePerGram}, 2)$$
     $$\text{newBalance} = \text{student.balance} - \text{charge}$$
   * The student's balance is updated, and a `Transaction` record (`type: DISPENSER_PURCHASE`) is inserted.
   * Returns `200 OK`:
     ```json
     {
       "success": true,
       "weightProcessed": 145.50,
       "ratePerGram": 0.50,
       "chargedAmount": 72.75,
       "previousBalance": 350.00,
       "remainingBalance": 277.25,
       "transactionId": "cm...cuid"
     }
     ```
3. **Hardware Action:** The ESP32 displays `"Charged: ৳72.75 | Rem: ৳277.25"` on the LCD and beeps a confirmation tone.

---

## 4. Database Schema & Multi-Tenant Isolation

Our database is hosted on **Neon Serverless PostgreSQL**. 

To ensure this project **never interferes with other projects or existing tables** in the same Neon database, all tables live inside a dedicated PostgreSQL schema:
```text
neondb -> schema: "food_dispenser"
```

### Table Definitions

| Table | Purpose | Key Columns |
|---|---|---|
| `students` | User RFID accounts and balances | `id`, `card_uid` (unique), `student_id` (unique), `name`, `department`, `balance` (Decimal), `status` (ACTIVE/SUSPENDED) |
| `transactions` | Complete financial audit ledger | `id`, `student_id`, `type` (PURCHASE/RECHARGE), `weight_taken_grams`, `cost_per_gram`, `amount`, `post_balance`, `created_at` |
| `system_configs` | Dynamic runtime variables | `key` (PK), `value`, `description`, `updated_at` |

### Runtime Configuration Keys in `system_configs`
* `PRICE_PER_GRAM`: Price charged in BDT per gram (e.g. `0.50` = ৳50 per 100g).
* `MIN_BALANCE_THRESHOLD`: Minimum balance required to unlock the door (default: `10.00`).
* `WEIGHT_NOISE_THRESHOLD`: Any weight taken at or below this value in grams is charged ৳0.00 (default: `5.00`).

---

## 5. Admin Dashboard (Canteen Staff User Guide)

### Access & Security
* URL: `https://<your-domain>/login` (or `http://localhost:3000/login`)
* Default credentials:
  * **Username:** `admin`
  * **Password:** `admin123` (configurable via `ADMIN_PASSWORD` in `.env` / Vercel).
* Protected by HMAC-SHA256 encrypted cookies. The ESP32 M2M endpoints remain public and will never be blocked by authentication.

### Dashboard Pages
1. **Live Dashboard (`/dashboard`):**
   * **4 Real-time KPIs:** Today's Revenue (BDT), Food Dispensed (g/kg), Successful Checkouts, and Active Students.
   * **Interactive Telemetry Curve:** Visualizes 7-day food dispensed volume and revenue using Recharts.
   * **Live Stream Feed:** Auto-polls every 3 seconds via SWR. Instantly displays checkouts as students eat.
   * **Companion Panel:** Live ESP32 hardware status and quick top-up shortcut.
2. **Student Directory (`/students`):**
   * Search students by Name, Student ID, or RFID Card UID.
   * Filter by status (`ACTIVE`, `SUSPENDED`).
   * **Enroll Student Modal:** Register a new card UID, student ID, department, and starting balance.
   * **Quick Top-Up Modal:** Add +৳50, +৳100, +৳200, +৳500 (or custom amount) with audit tracking.
   * **Card Toggle:** Instantly suspend or reactivate lost cards with one click.
3. **Audit Ledger (`/transactions`):**
   * Historical view of every food purchase and recharge event.
   * Filter by date range, transaction type, or student.
   * **Export to CSV:** Single-click export for canteen accounting reports.
4. **Settings (`/settings`):**
   * Modify `PRICE_PER_GRAM`, `MIN_BALANCE_THRESHOLD`, and `WEIGHT_NOISE_THRESHOLD` on the fly without restarting any servers.

---

## 6. How the ESP32 Connects to the System

### Firmware Configuration Example (C++ / Arduino)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL (Local LAN IP for dev, or Vercel URL for production)
const char* serverUrl = "https://your-food-dispenser.vercel.app";

// 1. Authorize Card
bool authorizeCard(String cardUid) {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/dispenser/auth");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> doc;
  doc["cardUid"] = cardUid;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == 200) {
    String response = http.getString();
    // Parse studentName and balance...
    http.end();
    return true; // Unlock lid
  } else {
    // 403: Low balance or suspended; 404: Not registered
    http.end();
    return false; // Keep locked
  }
}

// 2. Checkout Food
bool checkoutFood(String cardUid, float weightTakenGrams) {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/dispenser/checkout");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> doc;
  doc["cardUid"] = cardUid;
  doc["weightTakenGrams"] = weightTakenGrams;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == 200) {
    String response = http.getString();
    // Display chargedAmount and remainingBalance on LCD
    http.end();
    return true;
  }
  http.end();
  return false;
}
```

---

## 7. Developer Quick Reference

### Running Locally
```bash
# Start local dev server bound to 0.0.0.0 (accepts LAN requests from ESP32)
npm run dev -- -H 0.0.0.0 -p 3000
```

### Database Management
```bash
# Push schema updates to database
npx prisma db push

# Open visual web database viewer
npx prisma studio
```

### Running Automated Test Suite
```bash
# Test M2M endpoints and latency
node test_endpoints.js

# Test admin authentication and route guards
node test_auth_and_ui.js
```
