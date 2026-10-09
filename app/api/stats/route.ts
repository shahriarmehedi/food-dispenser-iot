import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [activeStudentsCount, totalStudentsCount, todayTransactions, heartbeatConfig] = await Promise.all([
      prisma.student.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.student.count(),
      prisma.transaction.findMany({
        where: {
          createdAt: { gte: startOfToday },
          type: 'DISPENSER_PURCHASE',
        },
        select: {
          amount: true,
          weightTakenGrams: true,
        },
      }),
      prisma.systemConfig.findUnique({
        where: { key: 'ESP32_HEARTBEAT' },
      }),
    ]);

    let revenueToday = 0;
    let weightDispensedGramsToday = 0;
    let successfulDispensesToday = 0;

    for (const tx of todayTransactions) {
      const amt = Math.abs(Number(tx.amount));
      const wt = Number(tx.weightTakenGrams ?? 0);

      if (amt > 0) {
        revenueToday += amt;
        successfulDispensesToday++;
      }
      if (wt > 0) {
        weightDispensedGramsToday += wt;
      }
    }

    let deviceStatus = {
      isOnline: false,
      lastSeenSecondsAgo: null as number | null,
      ip: null as string | null,
      rssi: null as number | null,
      scaleOk: false,
      rfidOk: true,
    };

    if (heartbeatConfig?.value) {
      try {
        const telemetry = JSON.parse(heartbeatConfig.value);
        const elapsedMs = Date.now() - (telemetry.timestamp || 0);
        deviceStatus = {
          isOnline: elapsedMs < 45000,
          lastSeenSecondsAgo: Math.max(0, Math.round(elapsedMs / 1000)),
          ip: telemetry.ip || null,
          rssi: telemetry.rssi ?? null,
          scaleOk: !!telemetry.scaleOk,
          rfidOk: telemetry.rfidOk ?? true,
        };
      } catch (e) {
        console.error('Failed to parse heartbeat telemetry:', e);
      }
    }

    return NextResponse.json({
      revenueToday: Math.round(revenueToday * 100) / 100,
      weightDispensedGramsToday: Math.round(weightDispensedGramsToday * 100) / 100,
      successfulDispensesToday,
      activeStudentsCount,
      totalStudentsCount,
      deviceStatus,
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
