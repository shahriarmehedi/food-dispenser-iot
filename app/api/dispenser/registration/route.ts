import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCardUid } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [modeConfig, pendingCardConfig] = await Promise.all([
      prisma.systemConfig.findUnique({
        where: { key: 'RFID_REGISTRATION_MODE' },
      }),
      prisma.systemConfig.findUnique({
        where: { key: 'RFID_PENDING_CARD' },
      }),
    ]);

    const isRegistrationMode = modeConfig?.value === 'true';

    let pendingCard: { cardUid: string; scannedAt: number } | null = null;
    if (pendingCardConfig?.value) {
      try {
        const parsed = JSON.parse(pendingCardConfig.value);
        // Retain pending card for 10 minutes before expiring
        if (Date.now() - (parsed.scannedAt || 0) < 600000) {
          pendingCard = {
            cardUid: parsed.cardUid,
            scannedAt: parsed.scannedAt,
          };
        }
      } catch {
        // ignore parse error
      }
    }

    return NextResponse.json({
      isRegistrationMode,
      pendingCard,
    });
  } catch (error) {
    console.error('Registration status GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration mode status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.action) {
      return NextResponse.json(
        { error: 'Action is required ("ENABLE", "DISABLE", or "CLEAR_PENDING")' },
        { status: 400 }
      );
    }

    const { action } = body;

    if (action === 'ENABLE') {
      // 1. Set Registration Mode = true
      // 2. Clear any old pending card
      // 3. Queue START_REGISTRATION command for ESP32 (triggers 3 beeps)
      const command = {
        action: 'START_REGISTRATION',
        requestedAt: Date.now(),
        id: Math.random().toString(36).substring(2, 9),
      };

      await Promise.all([
        prisma.systemConfig.upsert({
          where: { key: 'RFID_REGISTRATION_MODE' },
          update: { value: 'true', updatedAt: new Date() },
          create: {
            key: 'RFID_REGISTRATION_MODE',
            value: 'true',
            description: 'RFID Card Registration Mode active state',
          },
        }),
        prisma.systemConfig.deleteMany({
          where: { key: 'RFID_PENDING_CARD' },
        }),
        prisma.systemConfig.upsert({
          where: { key: 'ESP32_PENDING_COMMAND' },
          update: { value: JSON.stringify(command), updatedAt: new Date() },
          create: {
            key: 'ESP32_PENDING_COMMAND',
            value: JSON.stringify(command),
            description: 'Pending remote actuator command for ESP32',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        isRegistrationMode: true,
        message: 'Registration mode ENABLED. ESP32 will beep 3 times.',
      });
    }

    if (action === 'DISABLE') {
      // 1. Set Registration Mode = false
      // 2. Clear pending card
      // 3. Queue STOP_REGISTRATION command for ESP32
      const command = {
        action: 'STOP_REGISTRATION',
        requestedAt: Date.now(),
        id: Math.random().toString(36).substring(2, 9),
      };

      await Promise.all([
        prisma.systemConfig.upsert({
          where: { key: 'RFID_REGISTRATION_MODE' },
          update: { value: 'false', updatedAt: new Date() },
          create: {
            key: 'RFID_REGISTRATION_MODE',
            value: 'false',
            description: 'RFID Card Registration Mode active state',
          },
        }),
        prisma.systemConfig.deleteMany({
          where: { key: 'RFID_PENDING_CARD' },
        }),
        prisma.systemConfig.upsert({
          where: { key: 'ESP32_PENDING_COMMAND' },
          update: { value: JSON.stringify(command), updatedAt: new Date() },
          create: {
            key: 'ESP32_PENDING_COMMAND',
            value: JSON.stringify(command),
            description: 'Pending remote actuator command for ESP32',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        isRegistrationMode: false,
        message: 'Registration mode DISABLED.',
      });
    }

    if (action === 'CLEAR_PENDING') {
      await prisma.systemConfig.deleteMany({
        where: { key: 'RFID_PENDING_CARD' },
      });

      return NextResponse.json({
        success: true,
        message: 'Pending card cleared',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "ENABLE", "DISABLE", or "CLEAR_PENDING"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Registration mode POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration mode' },
      { status: 500 }
    );
  }
}
