import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || (body.action !== 'LOCK' && body.action !== 'UNLOCK')) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "LOCK" or "UNLOCK"' },
        { status: 400 }
      );
    }

    const command = {
      action: body.action as 'LOCK' | 'UNLOCK',
      requestedAt: Date.now(),
      id: Math.random().toString(36).substring(2, 9),
    };

    await prisma.systemConfig.upsert({
      where: { key: 'ESP32_PENDING_COMMAND' },
      update: {
        value: JSON.stringify(command),
        updatedAt: new Date(),
      },
      create: {
        key: 'ESP32_PENDING_COMMAND',
        value: JSON.stringify(command),
        description: 'Pending remote actuator command for ESP32',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Remote command "${body.action}" queued for ESP32`,
      command,
    });
  } catch (error) {
    console.error('Remote command error:', error);
    return NextResponse.json({ error: 'Failed to issue remote command' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'ESP32_PENDING_COMMAND' },
    });

    if (!config || !config.value) {
      return NextResponse.json({ pendingCommand: null });
    }

    const command = JSON.parse(config.value);
    // Ignore commands older than 60 seconds to prevent stale execution
    const isStale = Date.now() - (command.requestedAt || 0) > 60000;

    return NextResponse.json({
      pendingCommand: isStale ? null : command,
    });
  } catch (error) {
    console.error('Remote command GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch command status' }, { status: 500 });
  }
}
