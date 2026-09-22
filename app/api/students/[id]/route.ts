import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccountStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json().catch(() => null);

    if (!body || !body.action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (body.action === 'recharge') {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json({ error: 'Recharge amount must be a positive number' }, { status: 400 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const student = await tx.student.findUnique({
          where: { id: studentId },
        });

        if (!student) {
          throw new Error('STUDENT_NOT_FOUND');
        }

        const currentBalance = Number(student.balance);
        const newBalance = Math.round((currentBalance + amount) * 100) / 100;

        const updatedStudent = await tx.student.update({
          where: { id: student.id },
          data: {
            balance: new Prisma.Decimal(newBalance.toFixed(2)),
          },
        });

        const txRecord = await tx.transaction.create({
          data: {
            studentId: student.id,
            type: 'ADMIN_RECHARGE',
            amount: new Prisma.Decimal(amount.toFixed(2)),
            postBalance: updatedStudent.balance,
          },
        });

        return { student: updatedStudent, transaction: txRecord };
      });

      return NextResponse.json({
        success: true,
        balance: Number(updated.student.balance),
        transactionId: updated.transaction.id,
      });
    }

    if (body.action === 'toggleStatus') {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const nextStatus = student.status === AccountStatus.ACTIVE ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE;

      const updatedStudent = await prisma.student.update({
        where: { id: student.id },
        data: { status: nextStatus },
      });

      return NextResponse.json({
        success: true,
        status: updatedStudent.status,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'STUDENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.error('Student update error:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}
