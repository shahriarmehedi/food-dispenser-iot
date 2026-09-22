import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentId: true,
            cardUid: true,
          },
        },
      },
    });

    return NextResponse.json({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        createdAt: tx.createdAt,
        type: tx.type,
        weightTakenGrams: tx.weightTakenGrams ? Number(tx.weightTakenGrams) : null,
        costPerGram: tx.costPerGram ? Number(tx.costPerGram) : null,
        amount: Number(tx.amount),
        postBalance: Number(tx.postBalance),
        student: tx.student,
      })),
    });
  } catch (error) {
    console.error('Recent transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent transactions' },
      { status: 500 }
    );
  }
}
