import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCardUid } from '@/lib/utils';
import { AccountStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status') as AccountStatus | null;

    const where: Prisma.StudentWhereInput = {};

    if (status && (status === AccountStatus.ACTIVE || status === AccountStatus.SUSPENDED)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { cardUid: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json({
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        studentId: s.studentId,
        cardUid: s.cardUid,
        department: s.department,
        balance: Number(s.balance),
        status: s.status,
        transactionsCount: s._count.transactions,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Students list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students list' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.name || !body.studentId || !body.cardUid) {
      return NextResponse.json(
        { error: 'Name, Student ID, and Card UID are required' },
        { status: 400 }
      );
    }

    const cardUid = normalizeCardUid(body.cardUid);
    const studentId = body.studentId.trim();
    const name = body.name.trim();
    const department = body.department ? body.department.trim() : null;
    const initialBalance = Math.max(0, parseFloat(body.initialBalance) || 0);

    // Check for duplicates
    const existing = await prisma.student.findFirst({
      where: {
        OR: [{ cardUid }, { studentId }],
      },
    });

    if (existing) {
      if (existing.cardUid === cardUid) {
        return NextResponse.json({ error: 'Card UID is already registered' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Student ID is already registered' }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          name,
          studentId,
          cardUid,
          department,
          balance: new Prisma.Decimal(initialBalance.toFixed(2)),
          status: AccountStatus.ACTIVE,
        },
      });

      if (initialBalance > 0) {
        await tx.transaction.create({
          data: {
            studentId: student.id,
            type: 'ADMIN_RECHARGE',
            amount: new Prisma.Decimal(initialBalance.toFixed(2)),
            postBalance: student.balance,
          },
        });
      }

      return student;
    });

    return NextResponse.json(
      {
        success: true,
        student: {
          id: result.id,
          name: result.name,
          studentId: result.studentId,
          cardUid: result.cardUid,
          department: result.department,
          balance: Number(result.balance),
          status: result.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Student create API error:', error);
    return NextResponse.json(
      { error: 'Failed to create student account' },
      { status: 500 }
    );
  }
}
