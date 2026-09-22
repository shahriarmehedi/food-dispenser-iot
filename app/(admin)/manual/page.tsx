'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  Zap,
  Scale,
  Code2,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Wifi,
  Sparkles,
} from 'lucide-react';

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'flashing' | 'calibration' | 'api'>('overview');

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#1b2235] bg-gradient-to-br from-[#0f1420] via-[#090c13] to-[#0f1420] p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Project Documentation & Technical Manual</span>
            </div>
            <h1 className="text-2xl font-medium text-slate-100 tracking-tight">
              Smart Weight-Based Food Dispenser
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl font-light leading-relaxed">
              Complete engineering manual, hardware wiring schematics, ESP32 firmware flashing routine, and cloud synchronization architecture.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#151b2a] border border-[#222a42] text-[11px] text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gateway: v1.0.0</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#151b2a] border border-[#222a42] text-[11px] text-sky-400 font-mono">
              Servo Edition
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-[#1b2235]">
        {[
          { id: 'overview', label: '1. How It Works', icon: Layers },
          { id: 'hardware', label: '2. Hardware & Wiring', icon: Cpu },
          { id: 'flashing', label: '3. Firmware Flashing', icon: Terminal },
          { id: 'calibration', label: '4. Scale Calibration', icon: Scale },
          { id: 'api', label: '5. M2M API Reference', icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-smooth ${
                isActive
                  ? 'bg-[#0084ff] text-white shadow-sky-pill'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151b2a]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-4">
            <h2 className="text-base font-medium text-slate-100 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>End-to-End System Workflow</span>
            </h2>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              The food dispenser is a fully automated, cashless dining solution built for institutional cafeterias. Instead of manual cashiers or flat buffet fees, students pay only for the exact grams of food they dispense.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs font-mono font-medium">
                  01
                </div>
                <h3 className="text-xs font-medium text-slate-200">Tap RFID Card</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  Student taps 13.56MHz card. ESP32 calls cloud API in ~40ms to verify identity, active status, and balance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs font-mono font-medium">
                  02
                </div>
                <h3 className="text-xs font-medium text-slate-200">Servo Motor Unlocks</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  Servo motor rotates to 90° to open the dispenser lid. The student scoops their food. Closing the lid rotates servo back to 0° (locked).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs font-mono font-medium">
                  03
                </div>
                <h3 className="text-xs font-medium text-slate-200">Atomic Gram Billing</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  HX711 measures gram difference. Cloud deducts exact cost (weight × price) atomically and streams to the live dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-4">
            <h2 className="text-base font-medium text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Multi-Tenant Database Isolation</span>
            </h2>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              All dispenser tables live inside an isolated PostgreSQL schema named <code className="text-sky-300 font-mono bg-[#151b2a] px-2 py-0.5 rounded">food_dispenser</code> in Neon. Every query executed by Prisma ORM automatically targets this schema. Existing tables in the default <code className="text-slate-400 font-mono">public</code> schema remain completely untouched and safe.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: HARDWARE & PINOUT */}
      {activeTab === 'hardware' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-4">
            <h2 className="text-base font-medium text-slate-100 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Complete ESP32 Pinout & Connection Matrix</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#090c13] text-[11px] text-slate-400 border-b border-[#1b2235]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Component</th>
                    <th className="px-4 py-3 font-medium">Component Pin</th>
                    <th className="px-4 py-3 font-medium">ESP32 Pin</th>
                    <th className="px-4 py-3 font-medium">Power Supply</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b2235]/60 font-mono text-[11px]">
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">RC522 RFID</td>
                    <td className="px-4 py-2.5 text-sky-300">SDA (SS)</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 5</td>
                    <td className="px-4 py-2.5 text-amber-400 font-sans">3.3V Only</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">SPI Chip Select</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">RC522 RFID</td>
                    <td className="px-4 py-2.5 text-sky-300">SCK / MOSI / MISO</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 18 / 23 / 19</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">3.3V</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">SPI Hardware Bus</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">RC522 RFID</td>
                    <td className="px-4 py-2.5 text-sky-300">RST</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 22</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">3.3V</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">Hardware Reset</td>
                  </tr>
                  <tr className="bg-sky-500/5">
                    <td className="px-4 py-2.5 font-sans font-medium text-sky-300">Servo Motor</td>
                    <td className="px-4 py-2.5 text-sky-300">PWM Signal</td>
                    <td className="px-4 py-2.5 text-sky-400 font-medium">GPIO 2</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-sans">VIN (5V)</td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">0° locked, 90° unlocked</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">HX711 Scale</td>
                    <td className="px-4 py-2.5 text-sky-300">DOUT / SCK</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 16 / GPIO 4</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">5V / 3.3V</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">24-bit Load Cell ADC</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">Lid Switch</td>
                    <td className="px-4 py-2.5 text-sky-300">Pin 1 & 2</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 17 & GND</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">Pull-up</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">LOW = Closed, HIGH = Open</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">Active Buzzer</td>
                    <td className="px-4 py-2.5 text-sky-300">(+) & (-)</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 15 & GND</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">3.3V</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">Confirmation beeps</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-3">
            <h2 className="text-base font-medium text-slate-100">Why a Servo Motor?</h2>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Unlike 12V solenoid locks that require external 12V power adapters, heavy relays, and flyback diodes, a 5V PWM **Servo Motor** connects straight to the ESP32’s VIN and GND, with signal on **GPIO 2**. It rotates smoothly to unlock the lid latch and holds it securely locked when closed.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: FIRMWARE FLASHING */}
      {activeTab === 'flashing' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-4">
            <h2 className="text-base font-medium text-slate-100 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Arduino IDE 2.x Flashing Steps</span>
            </h2>

            <div className="space-y-3 text-xs text-slate-300 font-light">
              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <span className="font-medium text-sky-400">Step 1: Install ESP32 Board Core</span>
                <p>
                  Go to <strong>File &gt; Preferences</strong> and add the official board index:
                </p>
                <pre className="bg-[#151b2a] p-2.5 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
                </pre>
                <p>Then open Boards Manager, search for <code>esp32</code> by Espressif, and install it.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <span className="font-medium text-sky-400">Step 2: Install Libraries in Library Manager (Ctrl+Shift+I)</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong className="text-slate-100 font-mono">ESP32Servo</strong> (by Kevin Harrington) &mdash; <em>PWM driver for servo</em></li>
                  <li><strong className="text-slate-100 font-mono">ArduinoJson</strong> (by Benoit Blanchon, v6 or v7)</li>
                  <li><strong className="text-slate-100 font-mono">MFRC522</strong> (by GithubCommunity)</li>
                  <li><strong className="text-slate-100 font-mono">HX711 Arduino Library</strong> (by Bogdan Necula)</li>
                  <li><strong className="text-slate-100 font-mono">Adafruit SSD1306</strong> (for optional OLED display)</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <span className="font-medium text-sky-400">Step 3: Open &amp; Upload Sketch</span>
                <p>
                  Open <code>firmware/esp32_food_dispenser/esp32_food_dispenser.ino</code>. Select board <strong>ESP32 Dev Module</strong>, choose your COM port, and click Upload.
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                  💡 <strong>If upload gets stuck at "Connecting...":</strong> Hold down the physical <strong>BOOT</strong> button on the ESP32 until the upload progress percentage appears, then release it.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCALE CALIBRATION */}
      {activeTab === 'calibration' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-4">
            <h2 className="text-base font-medium text-slate-100 flex items-center space-x-2">
              <Scale className="w-4 h-4 text-sky-400" />
              <span>One-Time Load Cell Calibration</span>
            </h2>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Every physical load cell has slight manufacturing tolerances. Calibrating ensures exact gram readings:
            </p>

            <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-300 font-light">
              <li>Upload <code>firmware/esp32_food_dispenser/calibrate_scale/calibrate_scale.ino</code> to your ESP32.</li>
              <li>Open Serial Monitor at <strong>115200 baud</strong>.</li>
              <li>With the scale platform empty, type <code className="bg-[#151b2a] px-2 py-0.5 rounded text-sky-300 font-mono">t</code> to Tare (zero the scale).</li>
              <li>Place an object of known weight (e.g. 100g weight or 500ml water bottle = 500g) on the scale.</li>
              <li>Type <code className="bg-[#151b2a] px-2 py-0.5 rounded text-sky-300 font-mono">+</code> or <code className="bg-[#151b2a] px-2 py-0.5 rounded text-sky-300 font-mono">-</code> to adjust calibration until the reading matches the known weight.</li>
              <li>Copy the resulting <code className="bg-[#151b2a] px-2 py-0.5 rounded text-sky-300 font-mono">CALIBRATION_FACTOR</code> into line 74 of <code>esp32_food_dispenser.ino</code>.</li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 5: M2M API */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-4">
            <h2 className="text-base font-medium text-slate-100 flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>IoT M2M REST Endpoints</span>
            </h2>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              These endpoints are publicly accessible to ESP32 microcontrollers without requiring browser cookies or session tokens.
            </p>

            {/* Endpoint 1 */}
            <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-medium text-[11px]">POST</span>
                <span className="font-mono text-slate-200">/api/dispenser/auth</span>
              </div>
              <p className="text-slate-400 font-light text-[11px]">Authorizes an RFID card tap and unlocks the door if valid balance is available.</p>
              <pre className="bg-[#151b2a] p-3 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
{`// Request
{ "cardUid": "43A1B2C3" }

// Response 200 OK
{
  "authorized": true,
  "studentName": "Shahriar Hossain",
  "balance": 250.00,
  "message": "Access granted"
}`}
              </pre>
            </div>

            {/* Endpoint 2 */}
            <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium text-[11px]">POST</span>
                <span className="font-mono text-slate-200">/api/dispenser/checkout</span>
              </div>
              <p className="text-slate-400 font-light text-[11px]">Executes atomic balance deduction based on differential weight taken.</p>
              <pre className="bg-[#151b2a] p-3 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
{`// Request
{ "cardUid": "43A1B2C3", "weightTakenGrams": 100.0 }

// Response 200 OK
{
  "success": true,
  "weightProcessed": 100.0,
  "ratePerGram": 0.50,
  "chargedAmount": 50.00,
  "previousBalance": 250.00,
  "remainingBalance": 200.00,
  "transactionId": "cm..."
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
