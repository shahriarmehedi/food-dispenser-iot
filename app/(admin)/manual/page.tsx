'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Lock,
  Unlock,
  Volume2,
  Radio,
  ArrowRight,
} from 'lucide-react';

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'flashing' | 'calibration' | 'registration'>('overview');

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#1b2235] bg-gradient-to-br from-[#0f1420] via-[#090c13] to-[#0f1420] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] sm:text-xs font-medium mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Project Documentation & Technical Manual</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-medium text-slate-100 tracking-tight">
              Smart Weight-Based Food Dispenser
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-2xl font-light leading-relaxed">
              Complete engineering manual, hardware wiring schematics, ESP32 firmware flashing routine, and cloud synchronization architecture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0 pt-1 md:pt-0">
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#151b2a] border border-[#222a42] text-[10px] sm:text-[11px] text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gateway: v2.0.0</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#151b2a] border border-[#222a42] text-[10px] sm:text-[11px] text-sky-400 font-mono">
              Solenoid & RFID Edition
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#1b2235] pb-2">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[#1b2235]">
          {[
            { id: 'overview', label: '1. How It Works', icon: Layers },
            { id: 'hardware', label: '2. Hardware & Wiring', icon: Cpu },
            { id: 'flashing', label: '3. Firmware Flashing', icon: Terminal },
            { id: 'calibration', label: '4. Scale Calibration', icon: Scale },
            { id: 'registration', label: '5. Registration Mode', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-smooth shrink-0 ${
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

        {/* Link to Dedicated API Reference */}
        <Link
          href="/api-docs"
          className="hidden md:inline-flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 bg-[#151b2a] hover:bg-[#1b2235] px-3.5 py-2 rounded-full border border-sky-500/30 transition-smooth shrink-0"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>API Reference Page</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </Link>
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
                <h3 className="text-xs font-medium text-slate-200">Tap RFID Card or Web Unlock</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  Student taps 13.56MHz card. ESP32 calls cloud API in &lt;100ms to verify identity, active status, and balance. Or an admin triggers remote web unlock.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs font-mono font-medium">
                  02
                </div>
                <h3 className="text-xs font-medium text-slate-200">Solenoid Lock Releases</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  ESP32 drives GPIO 2 HIGH to activate the 5V relay / driver. The 12V solenoid pulls back its latch bolt. The onboard blue LED illuminates and a buzzer double-chirps.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs font-mono font-medium">
                  03
                </div>
                <h3 className="text-xs font-medium text-slate-200">Atomic Gram Billing</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  After lid is closed, the HX711 differential load cell measures exact food grams taken. The cloud deducts exact cost (weight × price) atomically and streams to the live ledger.
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
                    <td className="px-4 py-2.5 font-sans text-slate-400">SPI Chip Select (DO NOT connect to 5V)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">RC522 RFID</td>
                    <td className="px-4 py-2.5 text-sky-300">SCK / MOSI / MISO</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 18 / 23 / 19</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">3.3V</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">Hardware VSPI Bus</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">RC522 RFID</td>
                    <td className="px-4 py-2.5 text-sky-300">RST</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 22</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">3.3V</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">Hardware Reset Line</td>
                  </tr>
                  <tr className="bg-sky-500/5">
                    <td className="px-4 py-2.5 font-sans font-medium text-sky-300">Solenoid Latch</td>
                    <td className="px-4 py-2.5 text-sky-300">Relay / Driver IN</td>
                    <td className="px-4 py-2.5 text-sky-400 font-medium">GPIO 2</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-sans">12V External Adapter</td>
                    <td className="px-4 py-2.5 font-sans text-slate-300">HIGH = Unlock, LOW = Lock (Blue LED indicator)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">HX711 1kg Scale</td>
                    <td className="px-4 py-2.5 text-sky-300">DOUT / SCK</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 16 / GPIO 4</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">5V (or 3.3V)</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">24-bit Differential Load Cell ADC</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">Lid Closed Sensor</td>
                    <td className="px-4 py-2.5 text-sky-300">Pin 1 & 2</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 17 & GND</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">Internal Pull-up</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">LOW = Closed, HIGH = Open</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-200">Active Buzzer</td>
                    <td className="px-4 py-2.5 text-sky-300">(+) / I/O Pin</td>
                    <td className="px-4 py-2.5 text-slate-100">GPIO 15 & GND</td>
                    <td className="px-4 py-2.5 text-slate-400 font-sans">3.3V / VIN</td>
                    <td className="px-4 py-2.5 font-sans text-slate-400">2,000 Hz software tone modulation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-3">
            <h2 className="text-base font-medium text-slate-100 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Solenoid Lock Power & Safety Protection</span>
            </h2>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              A 12V solenoid lock pulls 0.5A to 1.5A of current. It must <strong className="text-slate-100">NEVER</strong> be connected directly to the ESP32 GPIO pin. Use a <strong className="text-emerald-400">5V Relay Module</strong> or an <strong className="text-emerald-400">N-Channel MOSFET</strong> (e.g., IRLZ44N) with a 1N4007 flyback diode across the lock coil.
            </p>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              <strong>Testing Tip:</strong> Because GPIO 2 is physically wired to the ESP32 onboard Blue LED, you can test the lock triggering immediately without having the 12V supply wired yet: tapping an authorized card or clicking Web Unlock illuminates the Blue LED!
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
                <span className="font-medium text-sky-400">Step 1: Install ESP32 Board Package</span>
                <p>
                  Go to <strong>File &gt; Preferences</strong> and add the official board index URL:
                </p>
                <pre className="bg-[#151b2a] p-2.5 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
                </pre>
                <p>Then open Boards Manager, search for <code>esp32</code> by Espressif, and install it.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <span className="font-medium text-sky-400">Step 2: Install Required Libraries (Ctrl+Shift+I)</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong className="text-slate-100 font-mono">ArduinoJson</strong> (by Benoit Blanchon, v6 or v7)</li>
                  <li><strong className="text-slate-100 font-mono">MFRC522</strong> (by GithubCommunity)</li>
                  <li><strong className="text-slate-100 font-mono">HX711 Arduino Library</strong> (by Bogdan Necula)</li>
                  <li><strong className="text-slate-100 font-mono">Adafruit SSD1306 &amp; Adafruit GFX</strong> (for optional 0.96&quot; OLED)</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <span className="font-medium text-sky-400">Step 3: Check WiFi Credentials &amp; Upload</span>
                <p>
                  Open <code>firmware/esp32_food_dispenser/esp32_food_dispenser.ino</code>. Set your hotspot credentials on lines 62–63:
                </p>
                <pre className="bg-[#151b2a] p-2.5 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
const char* WIFI_SSID     = &quot;iPhoneXS&quot;;
const char* WIFI_PASSWORD = &quot;00000000&quot;;
const char* SERVER_BASE   = &quot;https://food-dispenser-iot.vercel.app&quot;;
                </pre>
                <p>Select board <strong>ESP32 Dev Module</strong>, choose your COM port, and click Upload (<strong>Ctrl+U</strong>).</p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                  💡 <strong>If upload gets stuck at &quot;Connecting...&quot;:</strong> Hold down the physical <strong>BOOT</strong> button on the ESP32 until the flashing progress percentage appears, then release it.
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
              <span>1kg Load Cell Calibration</span>
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
              <li>Copy the resulting <code className="bg-[#151b2a] px-2 py-0.5 rounded text-sky-300 font-mono">CALIBRATION_FACTOR</code> into line 71 of <code>esp32_food_dispenser.ino</code> (default is <code>-420.0</code>).</li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 5: REGISTRATION MODE */}
      {activeTab === 'registration' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#1b2235] bg-[#0f1420]/80 p-6 space-y-4">
            <h2 className="text-base font-medium text-slate-100 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>RFID Card Registration Mode (&quot;Scan to Enroll&quot;)</span>
            </h2>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              You do not need to read card numbers through the Arduino Serial Monitor or type 8-character hex strings manually. Registration mode allows instant card assignment right from your phone.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-mono font-medium">
                    01
                  </span>
                  <Volume2 className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-xs font-medium text-slate-200">1. Turn ON Registration Mode</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  Click <strong>&quot;Turn ON Registration Mode&quot;</strong> in the dashboard or students page. The ESP32 buzzer will emit <strong className="text-amber-300">3 audible beeps</strong> to alert the lab.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-xs font-mono font-medium">
                    02
                  </span>
                  <Radio className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="text-xs font-medium text-slate-200">2. Tap New Card on Reader</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  Tap any unassigned RFID card on the RC522 scanner. The ESP32 chirps twice, captures the hardware UID, and forwards it to the cloud.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#090c13] border border-[#1b2235] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-mono font-medium">
                    03
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xs font-medium text-slate-200">3. Fill Prompt &amp; Enroll</h3>
                <p className="text-[11px] text-slate-400 font-light leading-normal">
                  The Enrollment Prompt pops up automatically on your phone with the card UID pre-filled. Enter student name, roll number, and initial balance, then submit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated API Reference CTA Banner */}
      <div className="rounded-3xl border border-[#1b2235] bg-gradient-to-r from-sky-500/10 via-[#0f1420] to-[#090c13] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-medium text-sky-400">
            <Code2 className="w-4 h-4" />
            <span>Developer Documentation &amp; M2M REST Endpoints</span>
          </div>
          <p className="text-xs text-slate-300 font-light max-w-xl">
            Looking for the full API list with request payloads, query parameters, JSON responses, and cURL examples?
          </p>
        </div>
        <Link
          href="/api-docs"
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#0084ff] hover:bg-[#0074e0] text-white text-xs font-medium shadow-sky-pill transition-smooth active:scale-[0.98] shrink-0"
        >
          <span>Open API Reference</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
