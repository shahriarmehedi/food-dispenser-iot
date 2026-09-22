import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCardUid } from '@/lib/utils';
import { CONFIG_DEFAULTS } from '@/lib/config';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.cardUid !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid payload: cardUid is required' },
        { status: 400 }
      );
    }

    const weightTakenGrams = Number(body.weightTakenGrams);
    if (isNaN(weightTakenGrams) || weightTakenGrams < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload: weightTakenGrams must be a non-negative number' },
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

    // Execute checkout inside an atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch system configurations
      const configs = await tx.systemConfig.findMany({
        where: {
          key: { in: ['PRICE_PER_GRAM', 'WEIGHT_NOISE_THRESHOLD'] },
        },
      });

      let pricePerGram: number = CONFIG_DEFAULTS.PRICE_PER_GRAM;
      let noiseThreshold: number = CONFIG_DEFAULTS.WEIGHT_NOISE_THRESHOLD;

      for (const cfg of configs) {
        if (cfg.key === 'PRICE_PER_GRAM') {
          const val = parseFloat(cfg.value);
          if (!isNaN(val)) pricePerGram = val;
        } else if (cfg.key === 'WEIGHT_NOISE_THRESHOLD') {
          const val = parseFloat(cfg.value);
          if (!isNaN(val)) noiseThreshold = val;
        }
      }

      // 2. Fetch student with fresh state
      const student = await tx.student.findUnique({
        where: { cardUid },
      });

      if (!student) {
        return { errorStatus: 404, message: 'Card not registered' };
      }

      if (student.status !== 'ACTIVE') {
        return { errorStatus: 403, message: 'Card suspended' };
      }

      const currentBalance = Number(student.balance);

      // 3. Check for noise threshold (weight <= noiseThreshold)
      if (weightTakenGrams <= noiseThreshold) {
        // Record zero-amount audit entry for hardware telemetry logging
        await tx.transaction.create({
          data: {
            studentId: student.id,
            type: 'DISPENSER_PURCHASE',
            weightTakenGrams: new Prisma.Decimal(weightTakenGrams.toFixed(2)),
            costPerGram: new Prisma.Decimal(pricePerGram.toFixed(2)),
            amount: new Prisma.Decimal('0.00'),
            postBalance: student.balance,
          },
        });

        return {
          statusCode: 200,
          data: {
            success: true,
            chargedAmount: 0.00,
            remainingBalance: currentBalance,
            message: 'No food taken or noise threshold',
          },
        };
      }

      // 4. Calculate charge and balance deduction
      const rawCharge = weightTakenGrams * pricePerGram;
      const charge = Math.round(rawCharge * 100) / 100;
      const newBalance = Math.round((currentBalance - charge) * 100) / 100;

      // Update student balance
      const updatedStudent = await tx.student.update({
        where: { id: student.id },
        data: {
          balance: new Prisma.Decimal(newBalance.toFixed(2)),
        },
      });

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          studentId: student.id,
          type: 'DISPENSER_PURCHASE',
          weightTakenGrams: new Prisma.Decimal(weightTakenGrams.toFixed(2)),
          costPerGram: new Prisma.Decimal(pricePerGram.toFixed(2)),
          amount: new Prisma.Decimal((-charge).toFixed(2)),
          postBalance: updatedStudent.balance,
        },
      });

      return {
        statusCode: 200,
        data: {
          success: true,
          weightProcessed: weightTakenGrams,
          ratePerGram: pricePerGram,
          chargedAmount: charge,
          previousBalance: currentBalance,
          remainingBalance: newBalance,
          transactionId: transaction.id,
        },
      };
    });

    if ('errorStatus' in result && result.errorStatus) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.errorStatus }
      );
    }

    return NextResponse.json(result.data, { status: result.statusCode });
  } catch (error) {
    console.error('Dispenser Checkout Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during checkout transaction' },
      { status: 500 }
    );
  }
}
