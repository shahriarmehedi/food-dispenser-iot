import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCardUid } from '@/lib/utils';
import { getMinBalanceThreshold } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.cardUid !== 'string' || !body.cardUid.trim()) {
      return NextResponse.json(
        { authorized: false, message: 'Invalid payload: cardUid is required' },
        { status: 400 }
      );
    }

    const cardUid = normalizeCardUid(body.cardUid);
    if (!cardUid) {
      return NextResponse.json(
        { authorized: false, message: 'Invalid cardUid format' },
        { status: 400 }
      );
    }

    // Parallel execution for lowest possible latency (<250ms target)
    const [student, minBalanceThreshold] = await Promise.all([
      prisma.student.findUnique({
        where: { cardUid },
        select: {
          id: true,
          name: true,
          balance: true,
          status: true,
        },
      }),
      getMinBalanceThreshold(),
    ]);

    // 1. Check if card exists
    if (!student) {
      return NextResponse.json(
        { authorized: false, message: 'Card not registered' },
        { status: 404 }
      );
    }

    // 2. Check account status
    if (student.status !== 'ACTIVE') {
      return NextResponse.json(
        { authorized: false, message: 'Card suspended' },
        { status: 403 }
      );
    }

    const currentBalance = Number(student.balance);

    // 3. Check minimum balance threshold
    if (currentBalance < minBalanceThreshold) {
      return NextResponse.json(
        {
          authorized: false,
          balance: currentBalance,
          message: 'Low balance',
        },
        { status: 403 }
      );
    }

    // 4. Authorized successfully
    const duration = Date.now() - startTime;
    return NextResponse.json(
      {
        authorized: true,
        studentName: student.name,
        balance: currentBalance,
        message: 'Access granted',
      },
      {
        status: 200,
        headers: {
          'Server-Timing': `auth;dur=${duration}`,
        },
      }
    );
  } catch (error) {
    const errDetail = error instanceof Error ? error.message : String(error);
    console.error('Dispenser Auth Error:', errDetail);
    return NextResponse.json(
      { authorized: false, message: 'Internal server error during authorization', error: errDetail },
      { status: 500 }
    );
  }
}
