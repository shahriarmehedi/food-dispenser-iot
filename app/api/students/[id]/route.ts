import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccountStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// PATCH: Handles quick status toggling and account recharges
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

// PUT: Full update for student profile (Name, Student ID, Department, Card UID, Balance, Status)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const { name, studentId: institutionalId, department, cardUid, balance, status } = body;

    if (!name || !institutionalId || !cardUid) {
      return NextResponse.json(
        { error: 'Name, Student ID, and RFID Card UID are required' },
        { status: 400 }
      );
    }

    const normalizedUid = String(cardUid).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const cleanStudentId = String(institutionalId).trim();
    const cleanName = String(name).trim();

    // Check if cardUid is taken by another student
    const existingCard = await prisma.student.findUnique({
      where: { cardUid: normalizedUid },
    });
    if (existingCard && existingCard.id !== studentId) {
      return NextResponse.json(
        { error: `RFID Card UID '${normalizedUid}' is already assigned to student ${existingCard.name}` },
        { status: 409 }
      );
    }

    // Check if studentId is taken by another student
    const existingStudentId = await prisma.student.findUnique({
      where: { studentId: cleanStudentId },
    });
    if (existingStudentId && existingStudentId.id !== studentId) {
      return NextResponse.json(
        { error: `Institutional Student ID '${cleanStudentId}' is already registered` },
        { status: 409 }
      );
    }

    // Check if target student exists
    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!currentStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const numericBalance = balance !== undefined ? parseFloat(balance) : Number(currentStudent.balance);
    if (isNaN(numericBalance) || numericBalance < 0) {
      return NextResponse.json({ error: 'Balance must be a valid non-negative number' }, { status: 400 });
    }

    const validStatus = status === 'SUSPENDED' ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE;

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        name: cleanName,
        studentId: cleanStudentId,
        department: department ? String(department).trim() : null,
        cardUid: normalizedUid,
        balance: new Prisma.Decimal(numericBalance.toFixed(2)),
        status: validStatus,
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: updated.id,
        name: updated.name,
        studentId: updated.studentId,
        department: updated.department,
        cardUid: updated.cardUid,
        balance: Number(updated.balance),
        status: updated.status,
      },
    });
  } catch (error: unknown) {
    console.error('Error editing student:', error);
    return NextResponse.json({ error: 'Failed to update student profile' }, { status: 500 });
  }
}

// DELETE: Delete student and their transaction history
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Clean up transactions first
      await tx.transaction.deleteMany({
        where: { studentId },
      });

      // Delete the student record
      await tx.student.delete({
        where: { id: studentId },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Student '${student.name}' and all associated transactions were deleted successfully.`,
    });
  } catch (error: unknown) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
