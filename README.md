# Smart Weight-Based Food Dispenser IoT & Admin Gateway

An end-to-end IoT Food Dispenser and Canteen Management system built with **Next.js 14 (App Router)**, **TypeScript**, **Prisma ORM (PostgreSQL)**, **Tailwind CSS**, and **SWR**.

Features a low-latency M2M REST gateway designed for ESP32 microcontrollers, plus an administrative dashboard with real-time telemetry streaming, interactive charts, and role-based access control.

---

## 🚀 Key Highlights

* **Low-Latency M2M IoT Gateway:** Dedicated endpoints (`/api/dispenser/auth` and `/api/dispenser/checkout`) with an execution latency of **~40ms** (well below the <250ms hardware SLA).
* **Hardware Integration Ready:**
  * **RC522 RFID Card Scanner:** Automatic UID normalization (e.g. `43:a1:b2:c3` $\to$ `43A1B2C3`), balance checks, and suspension enforcement.
  * **HX711 Weight Load Cell:** Differential weight checkout with noise filtering ($\le 5\text{g}$ noise threshold produces ৳0 charge with zero-weight audit logging).
* **Atomic Transactions:** Uses Prisma's `$transaction` for guaranteed data consistency between student balance updates and financial ledger records.
* **Modern Minimalist UI:** Minimal shades of black with electric sky-blue accents, Figtree typography (capped at `500` font weight), pill buttons, and responsive multi-column layout.
* **Interactive Data Visualization:** Real-time curved area charts with `recharts` for 7-day weight and revenue tracking.
* **Admin Authentication:** Secure HMAC-SHA256 session cookies protecting management routes (`/dashboard`, `/students`, `/transactions`, `/settings`), while preserving public access for ESP32 hardware clients.

---

## 🛠 Tech Stack

* **Framework:** Next.js 14 (App Router, Server Actions, Route Handlers)
* **Language:** TypeScript (Strict mode enabled)
* **Database & ORM:** PostgreSQL with Prisma ORM
* **Styling & Icons:** Tailwind CSS, Lucide React
* **Data Fetching:** SWR (3-second live telemetry polling)
* **Charts:** Recharts
* **Font:** Figtree (`next/font/google`)

---

## 📋 Hardware M2M API Reference

### 1. RFID Authorization
* **Method & Route:** `POST /api/dispenser/auth`
* **Payload:**
  ```json
  {
    "cardUid": "43A1B2C3"
  }
  ```
* **Responses:**
  * `200 OK`: `{ "authorized": true, "studentName": "Shahriar Hossain", "balance": 350.00, "message": "Access granted" }`
  * `403 Forbidden`: Low balance (< ৳10.00 threshold) or Card suspended.
  * `404 Not Found`: Card UID not registered in student directory.

### 2. Differential Weight Checkout
* **Method & Route:** `POST /api/dispenser/checkout`
* **Payload:**
  ```json
  {
    "cardUid": "43A1B2C3",
    "weightTakenGrams": 145.50
  }
  ```
* **Responses:**
  * `200 OK`:
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
  * If `weightTakenGrams <= 5.00g` (sensor noise threshold), returns `200 OK` with `chargedAmount: 0.00` and no balance deduction.

---

## 💻 Admin Dashboard Features

1. **Live Operations Dashboard (`/dashboard`):**
   * Real-time KPI summary cards (Revenue Today, Food Dispensed, Completed Checkouts, Active RFID Cards).
   * Interactive Telemetry & Revenue area chart (`AnalyticsChart`).
   * Live streaming checkout feed (`LiveFeedTable`) with 3-second auto-sync.
   * Right companion drawer with live ESP32 status and quick action buttons.
2. **Student Directory & RFID Cards (`/students`):**
   * Search and filter by status (`ACTIVE`, `SUSPENDED`).
   * "Enroll Student" modal with automatic UID formatting.
   * "Quick Top-Up" modal with preset balance amounts (+৳50, +৳100, +৳200, +৳500).
   * Instant toggle for card suspension/activation.
3. **Audit & Transactions Ledger (`/transactions`):**
   * Cryptographic record of all checkouts and recharges.
   * Filters by date range, transaction type, and student ID.
   * Single-click **Export to CSV** for cafeteria reporting.
4. **System Configurations (`/settings`):**
   * Live runtime variables (`PRICE_PER_GRAM`, `MIN_BALANCE_THRESHOLD`, `WEIGHT_NOISE_THRESHOLD`).

---

## 🚦 Getting Started

### 1. Prerequisites
* Node.js 18+ (tested on Node v22)
* PostgreSQL database

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/shahriarmehedi/food-dispenser-iot.git
cd food-dispenser-iot

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file from `.env.example`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/food_dispenser?schema=public"
HOST="0.0.0.0"
PORT=3000

# Optional custom admin credentials (defaults: admin / admin123)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

### 4. Database Setup & Seeding
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed demo students and system configurations
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

Access the dashboard at `http://localhost:3000` (or your machine's LAN IP from ESP32).

---

## 🧪 Automated Verification Tests
```bash
# Test hardware M2M endpoints and telemetry
node test_endpoints.js

# Test admin authentication, session tokens, and route protection
node test_auth_and_ui.js
```
