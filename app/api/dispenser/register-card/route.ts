import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCardUid } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.cardUid !== 'string' || !body.cardUid.trim()) {
      return NextResponse.json(
        { success: false, message: 'cardUid is required' },
        { status: 400 }
      );
    }

    const cardUid = normalizeCardUid(body.cardUid);
    if (!cardUid) {
      return NextResponse.json(
        { success: false, message: 'Invalid cardUid format' },
        { status: 400 }
      );
    }

    // 1. Check if card is already registered
    const existingStudent = await prisma.student.findUnique({
      where: { cardUid },
      select: {
        id: true,
        name: true,
        studentId: true,
      },
    });

    if (existingStudent) {
      return NextResponse.json({
        success: false,
        alreadyRegistered: true,
        cardUid,
        studentName: existingStudent.name,
        studentId: existingStudent.studentId,
        message: `Card is already assigned to ${existingStudent.name} (${existingStudent.studentId})`,
      });
    }

    // 2. Card is new and unassigned - save to pending registration
    const pendingData = {
      cardUid,
      scannedAt: Date.now(),
    };

    await prisma.systemConfig.upsert({
      where: { key: 'RFID_PENDING_CARD' },
      update: {
        value: JSON.stringify(pendingData),
        updatedAt: new Date(),
      },
      create: {
        key: 'RFID_PENDING_CARD',
        value: JSON.stringify(pendingData),
        description: 'Latest scanned RFID card waiting for web registration',
      },
    });

    console.log(`[REGISTRATION] Captured new card UID: ${cardUid}`);

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      cardUid,
      message: 'Card scanned successfully. Waiting for registration prompt on Web.',
    });
  } catch (error) {
    console.error('Register card endpoint error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process scanned card' },
      { status: 500 }
    );
  }
}
