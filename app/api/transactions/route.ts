import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TransactionType, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const type = searchParams.get('type') as TransactionType | null;
    const studentId = searchParams.get('studentId');
    const search = searchParams.get('search');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const isCsvExport = searchParams.get('export') === 'csv';

    const where: Prisma.TransactionWhereInput = {};

    if (type && Object.values(TransactionType).includes(type)) {
      where.type = type;
    }

    if (studentId) {
      where.student = { studentId: { contains: studentId, mode: 'insensitive' } };
    }

    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { studentId: { contains: search, mode: 'insensitive' } } },
        { student: { cardUid: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (isCsvExport) {
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              name: true,
              studentId: true,
              cardUid: true,
            },
          },
        },
      });

      const csvRows = [
        ['Transaction ID', 'Date & Time', 'Student Name', 'Student ID', 'Card UID', 'Type', 'Weight (g)', 'Rate (BDT/g)', 'Amount (BDT)', 'Post Balance (BDT)'].join(','),
        ...transactions.map((tx) => [
          tx.id,
          `"${new Date(tx.createdAt).toISOString()}"`,
          `"${tx.student.name.replace(/"/g, '""')}"`,
          `"${tx.student.studentId}"`,
          `"${tx.student.cardUid}"`,
          tx.type,
          tx.weightTakenGrams ? Number(tx.weightTakenGrams).toFixed(2) : '0.00',
          tx.costPerGram ? Number(tx.costPerGram).toFixed(2) : '0.00',
          Number(tx.amount).toFixed(2),
          Number(tx.postBalance).toFixed(2),
        ].join(',')),
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="transactions_${Date.now()}.csv"`,
        },
      });
    }

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              studentId: true,
              cardUid: true,
              department: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
    console.error('Transactions list API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transactions' },
      { status: 500 }
    );
  }
}
