# SYSTEM CONTEXT & SPECIFICATION FOR AI CODING AGENT
## Project: Smart Weight-Based Food Dispenser Management & IoT API System

You are an expert Full-Stack Engineer specializing in Next.js (App Router), TypeScript, Prisma ORM, and low-latency REST APIs for IoT/embedded systems.

Your objective is to generate and implement a production-ready, robust Next.js application that functions as:
1. **Low-Latency M2M IoT Gateway:** Serves fast HTTP REST endpoints to an ESP32 microcontroller (RFID authentication and weight differential checkout).
2. **Administrative Control Dashboard:** Provides a responsive, clean UI for canteen staff to register RFID tags, top up student balances, track live transactions, and configure dynamic price rates.

---

## 1. TECH STACK & ENVIRONMENT SPECIFICATIONS

* **Framework:** Next.js 14/15 (App Router, Server Actions, Route Handlers)
* **Language:** TypeScript (Strict mode enabled)
* **Database & ORM:** PostgreSQL with Prisma ORM
* **Styling & UI:** Tailwind CSS, Lucide React icons, shadcn/ui component patterns
* **State & Data Fetching:** SWR or React Query (for polling live telemetry / checkouts)
* **Environment Binding:** Must bind to `0.0.0.0` on port `3000` to accept incoming LAN requests from ESP32 clients.

---

## 2. HIGH-LEVEL ARCHITECTURE & HARDWARE CONTEXT

```
┌──────────────────────────────────────┐
│       ESP32 Hardware Client          │
│   (RC522 RFID + HX711 Load Scale)    │
└──────────────────┬───────────────────┘
                   │
                   │ HTTP POST (LAN / JSON)
                   ▼
┌────────────────────────────────────────────────────────┐
│               Next.js App Server                       │
│ ┌────────────────────────┐  ┌────────────────────────┐ │
│ │  M2M Route Handlers    │  │ Admin UI / Dashboard    │ │
│ │  /api/dispenser/auth   │  │ /students, /dashboard   │ │
│ │  /api/dispenser/check..│  │ Server Actions / SWR    │ │
│ └───────────┬────────────┘  └───────────┬────────────┘ │
│             │                           │              │
│             └─────────────┬─────────────┘              │
│                           ▼                            │
│                 Prisma ORM Client                      │
└───────────────────────────┬────────────────────────────┘
                            ▼
                   PostgreSQL Database
```

### Critical IoT Constraints:
1. **Latency:** ESP32 expects authorization within $< 250\text{ ms}$. Keep `/api/dispenser/auth` lean with no unnecessary roundtrips.
2. **Concurrency & Atomicity:** Use Prisma's `$transaction` for all balance modifications to prevent race conditions or double-charging.
3. **Fault Tolerance:** If a student takes $\le 5$ grams (noise threshold), do NOT charge, but log an entry with `amount: 0.00`.
4. **Card UID Normalization:** RFID cards output hexadecimal strings (e.g. `a34f129c` vs `A3:4F:12:9C`). Always normalize UIDs to uppercase, non-delimited strings (`A34F129C`) before database queries.

---

## 3. PRISMA SCHEMA DEFINITION (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AccountStatus {
  ACTIVE
  SUSPENDED
}

enum TransactionType {
  DISPENSER_PURCHASE
  ADMIN_RECHARGE
  MANUAL_ADJUSTMENT
}

model Student {
  id            String         @id @default(cuid())
  cardUid       String         @unique @map("card_uid")
  studentId     String         @unique @map("student_id")
  name          String
  department    String?
  balance       Decimal        @default(0.00) @db.Decimal(10, 2)
  status        AccountStatus  @default(ACTIVE)
  transactions  Transaction[]
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  @@index([cardUid])
  @@index([studentId])
  @@map("students")
}

model Transaction {
  id                String          @id @default(cuid())
  studentId         String          @map("student_id")
  student           Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  type              TransactionType @default(DISPENSER_PURCHASE)
  weightTakenGrams  Decimal?        @map("weight_taken_grams") @db.Decimal(10, 2)
  costPerGram       Decimal?        @map("cost_per_gram") @db.Decimal(10, 2)
  amount            Decimal         @db.Decimal(10, 2) // Charged (-) or Credited (+)
  postBalance       Decimal         @map("post_balance") @db.Decimal(10, 2)
  createdAt         DateTime        @default(now()) @map("created_at")

  @@index([studentId])
  @@index([createdAt(sort: Desc)])
  @@map("transactions")
}

model SystemConfig {
  key         String   @id
  value       String
  description String?
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("system_configs")
}
```

---

## 4. API SPECIFICATION (M2M / ESP32 ROUTE HANDLERS)

### Endpoint 1: Verify & Authorize RFID Card
* **Route:** `POST /api/dispenser/auth`
* **Purpose:** Hardware client calls this as soon as an RFID card is tapped.
* **Payload Validation:**
  ```json
  {
    "cardUid": "A34F129C"
  }
  ```
* **Logic:**
  1. Validate payload: `cardUid` must be a non-empty string. Normalize to uppercase without spaces/colons.
  2. Fetch `min_balance_threshold` from `SystemConfig` (default: `10.00`).
  3. Query `Student` by `cardUid`.
  4. If not found: return `404 Not Found` with `{ "authorized": false, "message": "Card not registered" }`.
  5. If `status !== 'ACTIVE'`: return `403 Forbidden` with `{ "authorized": false, "message": "Card suspended" }`.
  6. If `balance < min_balance_threshold`: return `403 Forbidden` with `{ "authorized": false, "balance": number, "message": "Low balance" }`.
  7. If valid: return `200 OK` with:
     ```json
     {
       "authorized": true,
       "studentName": "Shahriar",
       "balance": 250.00,
       "message": "Access granted"
     }
     ```

### Endpoint 2: Differential Weight Checkout
* **Route:** `POST /api/dispenser/checkout`
* **Purpose:** Hardware client calls this after food has been removed and lid locks.
* **Payload Validation:**
  ```json
  {
    "cardUid": "A34F129C",
    "weightTakenGrams": 145.50
  }
  ```
* **Logic (Must be executed inside an atomic `prisma.$transaction`):**
  1. Validate input: `cardUid` string, `weightTakenGrams` numeric $\ge 0$.
  2. Fetch active `price_per_gram` (default `0.50`) and `noise_threshold_grams` (default `5.00`) from `SystemConfig`.
  3. Find student by `cardUid` with row lock if supported, or ensure fresh state.
  4. If `weightTakenGrams <= noise_threshold_grams`:
     - Do not deduct funds.
     - (Optional) Record audit log with `amount: 0.00` and `weightTakenGrams: 0`.
     - Return `200 OK` with:
       ```json
       {
         "success": true,
         "chargedAmount": 0.00,
         "remainingBalance": currentBalance,
         "message": "No food taken or noise threshold"
       }
       ```
  5. If `weightTakenGrams > noise_threshold_grams`:
     - Calculate `charge = weightTakenGrams * price_per_gram`.
     - Deduct charge: `newBalance = student.balance - charge`.
     - Update `Student` balance.
     - Create `Transaction` record (`type: DISPENSER_PURCHASE`, `amount: -charge`, `postBalance: newBalance`).
  6. Return `200 OK`:
     ```json
     {
       "success": true,
       "weightProcessed": 145.50,
       "ratePerGram": 0.50,
       "chargedAmount": 72.75,
       "previousBalance": 250.00,
       "remainingBalance": 177.25,
       "transactionId": "cm...cuid"
     }
     ```

---

## 5. REQUIRED FRONTEND PAGES & UI COMPONENTS

### Page 1: Live Operations Dashboard (`/dashboard`)
* **KPI Metrics Cards:**
  - Total Revenue Today (BDT)
  - Total Food Weight Dispensed Today (grams / kg)
  - Total Successful Dispenses Today
  - Active Registered Students Count
* **Real-Time Transactions Feed:**
  - Auto-refreshing table (polls `/api/transactions/recent` every 3 seconds or uses SWR).
  - Displays: Timestamp, Student Name, Student ID, Weight Taken (g), Billed (BDT), Remaining Balance.
  - Status badge (Success, Low Balance Refusal, Zero-weight).

### Page 2: Student Directory & Management (`/students`)
* Searchable table by Student Name, ID, or Card UID.
* Filter by Status (`ACTIVE`, `SUSPENDED`).
* **"Enroll New Student" Modal:**
  - Inputs: Full Name, Student ID, Card UID, Department, Initial Balance.
* **"Quick Top-Up" Modal:**
  - Direct balance addition (+50, +100, +200, +500 BDT or custom input).
  - Creates an audit transaction (`type: ADMIN_RECHARGE`, `amount: +X`).

### Page 3: Full Audit Ledger (`/transactions`)
* Paginated historical view of all transactions.
* Filter by Date Range, Transaction Type, and Student ID.
* Export to CSV button for reporting.

### Page 4: System Settings (`/settings`)
* Form to edit runtime variables in `SystemConfig`:
  - `PRICE_PER_GRAM` (e.g. `0.50`)
  - `MIN_BALANCE_THRESHOLD` (e.g. `10.00`)
  - `WEIGHT_NOISE_THRESHOLD` (e.g. `5.00`)

---

## 6. PROJECT DIRECTORY STRUCTURE

```
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx             # Sidebar navigation + Top bar
│   │   ├── dashboard/
│   │   │   └── page.tsx           # KPIs + Real-time feed
│   │   ├── students/
│   │   │   └── page.tsx           # Directory + Add/Recharge Modals
│   │   ├── transactions/
│   │   │   └── page.tsx           # Full Audit Ledger
│   │   └── settings/
│   │       └── page.tsx           # Config Management
│   ├── api/
│   │   ├── dispenser/
│   │   │   ├── auth/
│   │   │   │   └── route.ts       # M2M Auth Endpoint
│   │   │   └── checkout/
│   │   │       └── route.ts       # M2M Weight Billing Endpoint
│   │   ├── stats/
│   │   │   └── route.ts           # Dashboard KPI Aggregation
│   │   └── transactions/
│   │       └── recent/
│   │           └── route.ts       # Feed Polling Endpoint
│   ├── layout.tsx
│   └── page.tsx                   # Redirects to /dashboard
├── components/
│   ├── ui/                        # Button, Dialog, Card, Input, Table
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── LiveFeedTable.tsx
│   ├── RechargeModal.tsx
│   └── AddStudentModal.tsx
├── lib/
│   ├── prisma.ts                  # Global Prisma Client singleton
│   ├── utils.ts                   # Formatting & Tailwind helpers
│   └── config.ts                  # SystemConfig helper fetchers
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    # Demo students & default configs
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.example
```

---

## 7. DATABASE SEED FILE (`prisma/seed.ts`)

```typescript
import { PrismaClient, AccountStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Initial System Configurations
  const configs = [
    { key: 'PRICE_PER_GRAM', value: '0.50', description: 'Price in BDT charged per gram of food' },
    { key: 'MIN_BALANCE_THRESHOLD', value: '10.00', description: 'Minimum balance required to unlock dispenser' },
    { key: 'WEIGHT_NOISE_THRESHOLD', value: '5.00', description: 'Differential weight under this gram value is ignored' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  // 2. Demo Students for Testing
  const students = [
    {
      cardUid: '43A1B2C3',
      studentId: '2003001',
      name: 'Shahriar Hossain',
      department: 'CSE',
      balance: 350.00,
      status: AccountStatus.ACTIVE,
    },
    {
      cardUid: '99F8D7E6',
      studentId: '2003002',
      name: 'Rahim Ahmed',
      department: 'EEE',
      balance: 8.50, // Low balance for testing 403 response
      status: AccountStatus.ACTIVE,
    },
    {
      cardUid: '11223344',
      studentId: '2003003',
      name: 'Tanvir Islam',
      department: 'ME',
      balance: 150.00,
      status: AccountStatus.SUSPENDED, // Suspended test
    },
  ];

  for (const student of students) {
    await prisma.student.upsert({
      where: { cardUid: student.cardUid },
      update: {},
      create: student,
    });
  }

  console.log('Seed completed: Configurations and Demo Students created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 8. STEP-BY-STEP IMPLEMENTATION TASKS FOR THE AGENT

### Phase 1: Core Setup & Database
1. Initialize Next.js project with App Router, TypeScript, Tailwind CSS.
2. Install dependencies: `@prisma/client`, `prisma`, `lucide-react`, `swr`, `clsx`, `tailwind-merge`.
3. Set up `prisma/schema.prisma` and execute `npx prisma db push` or `npx prisma migrate dev`.
4. Configure `lib/prisma.ts` with the standard Next.js global singleton pattern to avoid connection exhaustion during hot-reloads.
5. Create and run `prisma/seed.ts` via `npx prisma db seed`.

### Phase 2: High-Performance Hardware APIs
1. Implement `POST /api/dispenser/auth`:
   - Enforce fast execution path, strict error handling, and normalized UID strings.
2. Implement `POST /api/dispenser/checkout`:
   - Implement `prisma.$transaction` covering:
     * Balance decrement calculation
     * Student record update
     * Transaction record creation
   - Handle edge-case: weight $\le 5$g returns 200 with 0 charge.

### Phase 3: Admin Actions & API Endpoints
1. Create server actions or routes for:
   - `createStudent(data)`
   - `rechargeStudent(studentId, amount)`
   - `toggleStudentStatus(studentId)`
   - `updateSystemConfig(key, value)`
2. Build `/api/stats` aggregating daily sales, total dispensed weight, and transaction volume.
3. Build `/api/transactions/recent` returning the 10 most recent transactions.

### Phase 4: UI Development
1. Build Layout with responsive sidebar (`Dashboard`, `Students`, `Transactions`, `Settings`).
2. Build `/dashboard` containing metrics cards and `LiveFeedTable` polling `/api/transactions/recent` every 3000ms.
3. Build `/students` featuring searchable table, `AddStudentModal`, and `RechargeModal`.
4. Build `/settings` allowing inline editing of prices and thresholds.

### Phase 5: Verification & Testing Checklist
- [ ] Test `POST /api/dispenser/auth` with valid UID `43A1B2C3` (Expect 200).
- [ ] Test `POST /api/dispenser/auth` with low-balance UID `99F8D7E6` (Expect 403).
- [ ] Test `POST /api/dispenser/auth` with suspended UID `11223344` (Expect 403).
- [ ] Test `POST /api/dispenser/auth` with unregistered UID `UNKNOWN99` (Expect 404).
- [ ] Test `POST /api/dispenser/checkout` with `weightTakenGrams: 100` (Expect 50 BDT deduction).
- [ ] Test `POST /api/dispenser/checkout` with `weightTakenGrams: 3` (Expect 0 BDT deduction).
- [ ] Run `npm run dev -- -H 0.0.0.0 -p 3000` and verify accessibility via local LAN IP.
