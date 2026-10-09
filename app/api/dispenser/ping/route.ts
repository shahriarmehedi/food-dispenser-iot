import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const telemetry = {
      deviceId: body.deviceId || 'ESP32-DISPENSER-01',
      ip: body.ip || request.headers.get('x-forwarded-for') || '172.20.10.2',
      rssi: body.rssi ?? -60,
      rfidOk: body.rfidOk ?? true,
      scaleOk: body.scaleOk ?? false,
      servoLocked: body.servoLocked ?? true,
      uptimeSec: body.uptimeSec ?? 0,
      timestamp: Date.now(),
    };

    await prisma.systemConfig.upsert({
      where: { key: 'ESP32_HEARTBEAT' },
      update: {
        value: JSON.stringify(telemetry),
        updatedAt: new Date(),
      },
      create: {
        key: 'ESP32_HEARTBEAT',
        value: JSON.stringify(telemetry),
        description: 'Real-time ESP32 hardware client heartbeat and telemetry',
      },
    });

    return NextResponse.json({
      success: true,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Heartbeat ping error:', error);
    return NextResponse.json({ error: 'Failed to record heartbeat' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'ESP32_HEARTBEAT' },
    });

    if (!config || !config.value) {
      return NextResponse.json({
        isOnline: false,
        message: 'No heartbeat recorded yet',
      });
    }

    const telemetry = JSON.parse(config.value);
    const now = Date.now();
    const elapsedMs = now - (telemetry.timestamp || 0);
    // Mark online if pinged within the last 45 seconds
    const isOnline = elapsedMs < 45000;

    return NextResponse.json({
      isOnline,
      lastSeenSecondsAgo: Math.max(0, Math.round(elapsedMs / 1000)),
      telemetry,
    });
  } catch (error) {
    console.error('Heartbeat status error:', error);
    return NextResponse.json({ error: 'Failed to get heartbeat status' }, { status: 500 });
  }
}
