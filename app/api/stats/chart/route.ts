import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const days = 7;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1), 0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startDate },
        type: 'DISPENSER_PURCHASE',
      },
      select: {
        createdAt: true,
        amount: true,
        weightTakenGrams: true,
      },
    });

    // Generate buckets for each of the 7 days
    const dailyMap = new Map<
      string,
      { label: string; dateStr: string; weightGrams: number; revenueBDT: number; count: number }
    >();

    for (let i = 0; i < days; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i));
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
      dailyMap.set(dateKey, {
        label,
        dateStr: dateKey,
        weightGrams: 0,
        revenueBDT: 0,
        count: 0,
      });
    }

    for (const tx of transactions) {
      const txKey = new Date(tx.createdAt).toISOString().split('T')[0];
      const bucket = dailyMap.get(txKey);
      if (bucket) {
        const wt = Number(tx.weightTakenGrams ?? 0);
        const rev = Math.abs(Number(tx.amount));
        bucket.weightGrams += wt;
        bucket.revenueBDT += rev;
        if (wt > 0 || rev > 0) bucket.count += 1;
      }
    }

    const chartData = Array.from(dailyMap.values()).map((b) => ({
      name: b.label,
      date: b.dateStr,
      weight: Math.round(b.weightGrams * 10) / 10,
      revenue: Math.round(b.revenueBDT * 100) / 100,
      dispenses: b.count,
    }));

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error('Chart stats API error:', error);
    return NextResponse.json({ error: 'Failed to generate chart stats' }, { status: 500 });
  }
}
