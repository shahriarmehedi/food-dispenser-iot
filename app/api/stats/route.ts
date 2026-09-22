import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [activeStudentsCount, totalStudentsCount, todayTransactions] = await Promise.all([
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

    return NextResponse.json({
      revenueToday: Math.round(revenueToday * 100) / 100,
      weightDispensedGramsToday: Math.round(weightDispensedGramsToday * 100) / 100,
      successfulDispensesToday,
      activeStudentsCount,
      totalStudentsCount,
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
