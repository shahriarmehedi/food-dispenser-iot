'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Terminal,
  Cpu,
  Shield,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  BookOpen,
  Radio,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ApiEndpoint {
  id: string;
  category: 'm2m' | 'students' | 'ledger' | 'system';
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  description: string;
  access: 'Public M2M (ESP32 Direct)' | 'Admin Session';
  headers?: Record<string, string>;
  queryParams?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: string;
  responseBody: {
    status: number;
    label: string;
    body: string;
  }[];
  curlExample: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // 1. DISPENSER AUTH
  {
    id: 'dispenser-auth',
    category: 'm2m',
    method: 'POST',
    path: '/api/dispenser/auth',
    title: 'RFID Card Verification & Latch Authorization',
    description: 'Called directly by the ESP32 when an RFID card is tapped in normal dispensing mode. Verifies card existence, active account status, and minimum balance before returning door release permission.',
    access: 'Public M2M (ESP32 Direct)',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify(
      {
        cardUid: '43A1B2C3',
      },
      null,
      2
    ),
    responseBody: [
      {
        status: 200,
        label: 'Authorized - Door Unlock Allowed',
        body: JSON.stringify(
          {
            authorized: true,
            studentName: 'Shahriar Hossain',
            balance: 250.0,
            latchTimeoutSeconds: 30,
            message: 'Access granted',
          },
          null,
          2
        ),
      },
      {
        status: 404,
        label: 'Card Not Registered',
        body: JSON.stringify(
          {
            authorized: false,
            message: 'Card not registered',
          },
          null,
          2
        ),
      },
      {
        status: 403,
        label: 'Low Balance / Suspended',
        body: JSON.stringify(
          {
            authorized: false,
            balance: 4.5,
            message: 'Low balance',
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X POST https://food-dispenser-iot.vercel.app/api/dispenser/auth \\
  -H "Content-Type: application/json" \\
  -d '{"cardUid": "43A1B2C3"}'`,
  },

  // 2. DISPENSER CHECKOUT
  {
    id: 'dispenser-checkout',
    category: 'm2m',
    method: 'POST',
    path: '/api/dispenser/checkout',
    title: 'Atomic Food Checkout & Gram Billing',
    description: 'Triggered when the dispenser lid closes. Calculates cost based on differential weight taken, checks against minimum noise threshold (5g), and atomically charges the student balance in Neon PostgreSQL.',
    access: 'Public M2M (ESP32 Direct)',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify(
      {
        cardUid: '43A1B2C3',
        weightTakenGrams: 85.5,
      },
      null,
      2
    ),
    responseBody: [
      {
        status: 200,
        label: 'Billed Successfully',
        body: JSON.stringify(
          {
            success: true,
            weightProcessed: 85.5,
            ratePerGram: 0.5,
            chargedAmount: 42.75,
            previousBalance: 250.0,
            remainingBalance: 207.25,
            transactionId: 'cm7a1bc90001...',
            message: 'Billed 85.50g @ ৳0.50/g (Charged ৳42.75)',
          },
          null,
          2
        ),
      },
      {
        status: 200,
        label: 'Zero-Charge Noise Filter (<=5g)',
        body: JSON.stringify(
          {
            success: true,
            weightProcessed: 0,
            ratePerGram: 0.5,
            chargedAmount: 0,
            previousBalance: 250.0,
            remainingBalance: 250.0,
            message: 'Negligible weight (<= 5g). No charge applied.',
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X POST https://food-dispenser-iot.vercel.app/api/dispenser/checkout \\
  -H "Content-Type: application/json" \\
  -d '{"cardUid": "43A1B2C3", "weightTakenGrams": 85.5}'`,
  },

  // 3. DISPENSER HEARTBEAT PING (POST)
  {
    id: 'dispenser-ping-post',
    category: 'm2m',
    method: 'POST',
    path: '/api/dispenser/ping',
    title: 'ESP32 Hardware Telemetry & Command Sync',
    description: 'Called every 5 seconds by the ESP32. Updates hardware health (IP, RSSI, scale ready, lock state, uptime), synchronizes Registration Mode, and receives pending remote actuator commands.',
    access: 'Public M2M (ESP32 Direct)',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify(
      {
        deviceId: 'ESP32-DISPENSER-01',
        ip: '192.168.1.105',
        rssi: -58,
        rfidOk: true,
        scaleOk: true,
        servoLocked: true,
        uptimeSec: 3600,
        ackCommand: 'START_REGISTRATION',
      },
      null,
      2
    ),
    responseBody: [
      {
        status: 200,
        label: 'Heartbeat Acknowledged',
        body: JSON.stringify(
          {
            success: true,
            serverTime: 1730789123456,
            latchTimeoutSeconds: 30,
            pendingCommand: 'START_REGISTRATION',
            registrationMode: true,
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X POST https://food-dispenser-iot.vercel.app/api/dispenser/ping \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId": "ESP32-DISPENSER-01", "ip": "192.168.1.105", "rssi": -58, "rfidOk": true, "scaleOk": true}'`,
  },

  // 4. DISPENSER HEARTBEAT STATUS (GET)
  {
    id: 'dispenser-ping-get',
    category: 'm2m',
    method: 'GET',
    path: '/api/dispenser/ping',
    title: 'Query Live Hardware Client Status',
    description: 'Returns real-time hardware status, whether the ESP32 has pinged within the last 45 seconds, network signal dBm, and active registration mode flag.',
    access: 'Public M2M (ESP32 Direct)',
    responseBody: [
      {
        status: 200,
        label: 'Device Online Status',
        body: JSON.stringify(
          {
            isOnline: true,
            lastSeenSecondsAgo: 3,
            telemetry: {
              deviceId: 'ESP32-DISPENSER-01',
              ip: '172.20.10.2',
              rssi: -54,
              rfidOk: true,
              scaleOk: true,
              servoLocked: true,
              uptimeSec: 1420,
            },
            pendingCommand: null,
            isRegistrationMode: false,
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X GET https://food-dispenser-iot.vercel.app/api/dispenser/ping`,
  },

  // 5. REGISTER CARD (M2M CAPTURE)
  {
    id: 'dispenser-register-card',
    category: 'm2m',
    method: 'POST',
    path: '/api/dispenser/register-card',
    title: 'Capture Scanned RFID Card (Registration Mode)',
    description: 'Invoked by the ESP32 when an RFID card is tapped while Registration Mode is enabled. Checks if the card already belongs to someone; if new, saves it into pending registration for instant web auto-prompting.',
    access: 'Public M2M (ESP32 Direct)',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify(
      {
        cardUid: 'A1B2C3D4',
      },
      null,
      2
    ),
    responseBody: [
      {
        status: 200,
        label: 'New Card Captured',
        body: JSON.stringify(
          {
            success: true,
            alreadyRegistered: false,
            cardUid: 'A1B2C3D4',
            message: 'Card scanned successfully. Waiting for registration prompt on Web.',
          },
          null,
          2
        ),
      },
      {
        status: 200,
        label: 'Card Already Assigned',
        body: JSON.stringify(
          {
            success: false,
            alreadyRegistered: true,
            cardUid: 'A1B2C3D4',
            studentName: 'Tanvir Ahmed',
            studentId: '202100123',
            message: 'Card is already assigned to Tanvir Ahmed (202100123)',
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X POST https://food-dispenser-iot.vercel.app/api/dispenser/register-card \\
  -H "Content-Type: application/json" \\
  -d '{"cardUid": "A1B2C3D4"}'`,
  },

  // 6. REGISTRATION MODE TOGGLE
  {
    id: 'dispenser-registration-ctrl',
    category: 'system',
    method: 'POST',
    path: '/api/dispenser/registration',
    title: 'Toggle Registration Mode (Web Controls)',
    description: 'Enables or disables the hardware Registration Mode. When ENABLED, notifies ESP32 to sound 3 beeps and listen for new card taps. When DISABLED, resets ESP32 to normal dispensing.',
    access: 'Admin Session',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify(
      {
        action: 'ENABLE', // Options: 'ENABLE' | 'DISABLE' | 'CLEAR_PENDING'
      },
      null,
      2
    ),
    responseBody: [
      {
        status: 200,
        label: 'Mode Enabled (3 Beeps)',
        body: JSON.stringify(
          {
            success: true,
            isRegistrationMode: true,
            message: 'Registration mode ENABLED. ESP32 will beep 3 times.',
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X POST https://food-dispenser-iot.vercel.app/api/dispenser/registration \\
  -H "Content-Type: application/json" \\
  -d '{"action": "ENABLE"}'`,
  },

  // 7. REGISTRATION MODE STATUS
  {
    id: 'dispenser-registration-get',
    category: 'system',
    method: 'GET',
    path: '/api/dispenser/registration',
    title: 'Poll Registration Status & Pending Scanned Card',
    description: 'Used by the dashboard and students directory to poll every 1.5 seconds. Returns whether registration mode is active and any newly scanned card UID waiting for student enrollment.',
    access: 'Admin Session',
    responseBody: [
      {
        status: 200,
        label: 'Active with Pending Card',
        body: JSON.stringify(
          {
            isRegistrationMode: true,
            pendingCard: {
              cardUid: 'A1B2C3D4',
              scannedAt: 1730789123456,
            },
          },
          null,
          2
        ),
      },
      {
        status: 200,
        label: 'Idle / No Card Tapped',
        body: JSON.stringify(
          {
            isRegistrationMode: false,
            pendingCard: null,
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X GET https://food-dispenser-iot.vercel.app/api/dispenser/registration`,
  },

  // 8. REMOTE ACTUATOR COMMANDS
  {
    id: 'dispenser-command',
    category: 'm2m',
    method: 'POST',
    path: '/api/dispenser/command',
    title: 'Remote Actuator Controls (Web Unlock / Lock / Beep)',
    description: 'Queues a remote command for the ESP32 to execute on its next cycle. Supports unlocking the solenoid lid remotely, locking it, or playing a 3-chirp buzzer audio test.',
    access: 'Admin Session',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify(
      {
        action: 'UNLOCK', // Options: 'UNLOCK' | 'LOCK' | 'BEEP'
      },
      null,
      2
    ),
    responseBody: [
      {
        status: 200,
        label: 'Command Queued',
        body: JSON.stringify(
          {
            success: true,
            message: 'Remote command "UNLOCK" queued for ESP32',
            command: {
              action: 'UNLOCK',
              requestedAt: 1730789123456,
              id: 'k8d2m9p',
            },
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X POST https://food-dispenser-iot.vercel.app/api/dispenser/command \\
  -H "Content-Type: application/json" \\
  -d '{"action": "BEEP"}'`,
  },

  // 9. STUDENTS DIRECTORY (GET & POST)
  {
    id: 'students-api',
    category: 'students',
    method: 'GET',
    path: '/api/students',
    title: 'List Students & Search Directory',
    description: 'Returns all enrolled students with their RFID card UIDs, department, balance, account status, and transaction counts. Supports search queries and status filters.',
    access: 'Admin Session',
    queryParams: [
      { name: 'search', type: 'string', required: false, description: 'Filter by student name, ID, card UID, or department' },
      { name: 'status', type: 'string', required: false, description: 'Filter by ACTIVE or SUSPENDED' },
    ],
    responseBody: [
      {
        status: 200,
        label: 'Students List Response',
        body: JSON.stringify(
          {
            students: [
              {
                id: 'cm7a001...',
                name: 'Tanvir Ahmed',
                studentId: '202100123',
                cardUid: 'A1B2C3D4',
                department: 'CSE',
                balance: 150.0,
                status: 'ACTIVE',
                transactionsCount: 8,
                createdAt: '2026-10-15T08:30:00.000Z',
              },
            ],
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X GET "https://food-dispenser-iot.vercel.app/api/students?status=ACTIVE"`,
  },

  // 10. ENROLL STUDENT (POST)
  {
    id: 'students-create',
    category: 'students',
    method: 'POST',
    path: '/api/students',
    title: 'Enroll New RFID Student Account',
    description: 'Registers a new student profile, assigns the hardware card UID, and seeds the initial account balance. Also automatically clears pending registration and chirps the ESP32 buzzer.',
    access: 'Admin Session',
    headers: { 'Content-Type': 'application/json' },
    requestBody: JSON.stringify(
      {
        name: 'Tanvir Ahmed',
        studentId: '202100123',
        cardUid: 'A1B2C3D4',
        department: 'CSE',
        initialBalance: 100.0,
      },
      null,
      2
    ),
    responseBody: [
      {
        status: 201,
        label: 'Student Enrolled',
        body: JSON.stringify(
          {
            success: true,
            student: {
              id: 'cm7b112...',
              name: 'Tanvir Ahmed',
              studentId: '202100123',
              cardUid: 'A1B2C3D4',
              department: 'CSE',
              balance: 100.0,
              status: 'ACTIVE',
            },
          },
          null,
          2
        ),
      },
      {
        status: 409,
        label: 'Duplicate Card UID or Student ID',
        body: JSON.stringify(
          {
            error: 'Card UID is already registered',
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X POST https://food-dispenser-iot.vercel.app/api/students \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Tanvir Ahmed", "studentId": "202100123", "cardUid": "A1B2C3D4", "initialBalance": 100}'`,
  },

  // 11. AUDIT TRANSACTIONS LEDGER
  {
    id: 'transactions-api',
    category: 'ledger',
    method: 'GET',
    path: '/api/transactions',
    title: 'Paginated Audit & Transactions Ledger',
    description: 'Streams the complete cryptographic record of food dispensing checkouts, weight readings, billed amounts, and administrative top-up recharges with multi-criteria filtering and CSV export.',
    access: 'Admin Session',
    queryParams: [
      { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'number', required: false, description: 'Records per page (10, 25, 50, 100)' },
      { name: 'type', type: 'string', required: false, description: 'DISPENSER_PURCHASE or ADMIN_RECHARGE' },
      { name: 'search', type: 'string', required: false, description: 'Search student name, ID, or card UID' },
      { name: 'export', type: 'string', required: false, description: 'Pass "csv" to download spreadsheet' },
    ],
    responseBody: [
      {
        status: 200,
        label: 'Transactions Page Result',
        body: JSON.stringify(
          {
            transactions: [
              {
                id: 'cm7tx01...',
                createdAt: '2026-10-16T09:12:00.000Z',
                type: 'DISPENSER_PURCHASE',
                weightTakenGrams: 92.4,
                costPerGram: 0.5,
                amount: -46.2,
                postBalance: 153.8,
                student: {
                  id: 'cm7a001...',
                  name: 'Shahriar Hossain',
                  studentId: '2003001',
                  cardUid: '43A1B2C3',
                },
              },
            ],
            page: 1,
            limit: 10,
            total: 142,
            totalPages: 15,
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X GET "https://food-dispenser-iot.vercel.app/api/transactions?page=1&limit=10"`,
  },

  // 12. SYSTEM CONFIGURATION
  {
    id: 'settings-api',
    category: 'system',
    method: 'GET',
    path: '/api/settings',
    title: 'Dynamic Operational Parameters',
    description: 'Fetches or updates real-time operational thresholds (price per gram in BDT, minimum balance required for door unlock, weight noise cutoff threshold in grams, and latch timeout seconds).',
    access: 'Admin Session',
    responseBody: [
      {
        status: 200,
        label: 'Current System Settings',
        body: JSON.stringify(
          {
            PRICE_PER_GRAM: 0.5,
            MIN_BALANCE_THRESHOLD: 10.0,
            WEIGHT_NOISE_THRESHOLD: 5.0,
            LATCH_TIMEOUT_SECONDS: 30.0,
          },
          null,
          2
        ),
      },
    ],
    curlExample: `curl -X GET https://food-dispenser-iot.vercel.app/api/settings`,
  },
];

export default function ApiDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(API_ENDPOINTS[0].id);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredEndpoints = API_ENDPOINTS.filter((ep) => {
    const matchesCat = selectedCategory === 'ALL' || ep.category === selectedCategory;
    const matchesMethod = selectedMethod === 'ALL' || ep.method === selectedMethod;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ep.path.toLowerCase().includes(q) ||
      ep.title.toLowerCase().includes(q) ||
      ep.description.toLowerCase().includes(q);
    return matchesCat && matchesMethod && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#1b2235] bg-gradient-to-br from-[#0f1420] via-[#090c13] to-[#0f1420] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] sm:text-xs font-medium mb-2.5">
              <Code2 className="w-3.5 h-3.5" />
              <span>Developer Reference &amp; M2M Interface</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-medium text-slate-100 tracking-tight">
              IoT Gateway &amp; REST API Reference
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-2xl font-light leading-relaxed">
              Machine-to-machine (M2M) hardware endpoints, RFID authentication protocol, atomic gram billing engine, and administrative ledger APIs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0 pt-1 md:pt-0">
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#151b2a] border border-[#222a42] text-[10px] sm:text-[11px] text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Base: https://food-dispenser-iot.vercel.app</span>
            </span>
            <Link
              href="/manual"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#151b2a] hover:bg-[#1a2235] border border-[#222a42] text-[10px] sm:text-[11px] text-sky-400 transition-smooth"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Hardware Manual</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#0f1420]/80 p-3 sm:p-4 rounded-3xl border border-[#1b2235] backdrop-blur-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by endpoint path, parameter, or keyword..."
              className="w-full bg-[#090c13] border border-[#1b2235] rounded-2xl pl-10 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* HTTP Method Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'GET', 'POST'].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-medium transition-smooth ${
                  selectedMethod === m
                    ? 'bg-[#0084ff] text-white shadow-sky-pill'
                    : 'bg-[#090c13] text-slate-400 hover:text-slate-200 border border-[#1b2235]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1 scrollbar-thin">
          {[
            { id: 'ALL', label: 'All Endpoints' },
            { id: 'm2m', label: 'Hardware M2M' },
            { id: 'students', label: 'Students & RFID' },
            { id: 'ledger', label: 'Transactions & Ledger' },
            { id: 'system', label: 'System & Remote' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-smooth ${
                selectedCategory === cat.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-[#090c13] text-slate-400 hover:text-slate-300 border border-[#1b2235]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoint Cards List */}
      <div className="space-y-4">
        {filteredEndpoints.length === 0 ? (
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-8 text-center text-slate-500 font-light text-xs">
            No endpoints matched the selected filters.
          </div>
        ) : (
          filteredEndpoints.map((ep) => {
            const isExpanded = expandedId === ep.id;
            const isMethodPost = ep.method === 'POST';
            const isMethodGet = ep.method === 'GET';

            return (
              <div
                key={ep.id}
                className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 shadow-card-subtle backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-[#222a42]"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center space-x-3 min-w-0">
                    <span
                      className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-medium shrink-0 ${
                        isMethodPost
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm text-slate-100 font-medium tracking-tight">
                          {ep.path}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#151b2a] border border-[#222a42] text-slate-400 font-mono">
                          {ep.access}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-light mt-0.5 truncate">
                        {ep.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(`https://food-dispenser-iot.vercel.app${ep.path}`, `path-${ep.id}`);
                      }}
                      className="p-1.5 rounded-xl bg-[#151b2a] hover:bg-[#1b2235] text-slate-400 hover:text-slate-200 border border-[#222a42] text-[11px] transition-smooth flex items-center space-x-1"
                      title="Copy full endpoint URL"
                    >
                      {copiedId === `path-${ep.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px] hidden sm:inline">Copy URL</span>
                    </button>

                    <div className="p-1.5 rounded-xl bg-[#151b2a] border border-[#222a42] text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-[#1b2235]/60 space-y-4 text-xs">
                    <p className="text-slate-300 font-light leading-relaxed mt-4">
                      {ep.description}
                    </p>

                    {/* Query Parameters (if any) */}
                    {ep.queryParams && ep.queryParams.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block">
                          Query Parameters
                        </span>
                        <div className="rounded-2xl border border-[#1b2235] bg-[#090c13] overflow-x-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead className="border-b border-[#1b2235] text-slate-400 font-mono">
                              <tr>
                                <th className="p-2.5">Param</th>
                                <th className="p-2.5">Type</th>
                                <th className="p-2.5">Required</th>
                                <th className="p-2.5">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1b2235]/60 text-slate-300">
                              {ep.queryParams.map((param) => (
                                <tr key={param.name}>
                                  <td className="p-2.5 font-mono text-sky-300">{param.name}</td>
                                  <td className="p-2.5 font-mono text-slate-400">{param.type}</td>
                                  <td className="p-2.5 font-sans">
                                    {param.required ? (
                                      <span className="text-amber-400">Yes</span>
                                    ) : (
                                      <span className="text-slate-500">No</span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-slate-400 font-light">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Request Body (if any) */}
                    {ep.requestBody && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                            Request JSON Body
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(ep.requestBody!, `req-${ep.id}`)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                          >
                            {copiedId === `req-${ep.id}` ? (
                              <span className="text-emerald-400">Copied!</span>
                            ) : (
                              <span>Copy JSON</span>
                            )}
                          </button>
                        </div>
                        <pre className="p-3.5 rounded-2xl bg-[#090c13] border border-[#1b2235] font-mono text-[11px] text-sky-200 overflow-x-auto leading-relaxed">
                          {ep.requestBody}
                        </pre>
                      </div>
                    )}

                    {/* Response Bodies */}
                    <div className="space-y-2">
                      <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block">
                        Response Payloads
                      </span>
                      <div className="space-y-2">
                        {ep.responseBody.map((res, idx) => (
                          <div key={idx} className="rounded-2xl border border-[#1b2235] bg-[#090c13] overflow-hidden">
                            <div className="px-3 py-2 bg-[#151b2a]/60 border-b border-[#1b2235] flex items-center justify-between text-[11px]">
                              <span className="flex items-center space-x-2">
                                <span
                                  className={`px-1.5 py-0.2 rounded font-mono font-medium ${
                                    res.status === 200 || res.status === 201
                                      ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/40'
                                      : 'text-amber-400 bg-amber-950/80 border border-amber-800/40'
                                  }`}
                                >
                                  {res.status}
                                </span>
                                <span className="text-slate-300 font-medium">{res.label}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(res.body, `res-${ep.id}-${idx}`)}
                                className="text-[10px] text-slate-400 hover:text-slate-200"
                              >
                                {copiedId === `res-${ep.id}-${idx}` ? (
                                  <span className="text-emerald-400">Copied!</span>
                                ) : (
                                  <span>Copy</span>
                                )}
                              </button>
                            </div>
                            <pre className="p-3 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                              {res.body}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* cURL Command Example */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-sky-400" />
                          <span>cURL Command</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ep.curlExample, `curl-${ep.id}`)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                        >
                          {copiedId === `curl-${ep.id}` ? (
                            <span className="text-emerald-400">Copied cURL!</span>
                          ) : (
                            <span>Copy Command</span>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 rounded-2xl bg-[#090c13] border border-[#1b2235] font-mono text-[11px] text-emerald-300 overflow-x-auto">
                        {ep.curlExample}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
