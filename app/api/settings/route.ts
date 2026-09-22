import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CONFIG_DEFAULTS } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    // Provide default mappings if database has not been seeded yet
    const configMap: Record<string, string> = {
      PRICE_PER_GRAM: CONFIG_DEFAULTS.PRICE_PER_GRAM.toFixed(2),
      MIN_BALANCE_THRESHOLD: CONFIG_DEFAULTS.MIN_BALANCE_THRESHOLD.toFixed(2),
      WEIGHT_NOISE_THRESHOLD: CONFIG_DEFAULTS.WEIGHT_NOISE_THRESHOLD.toFixed(2),
    };

    for (const c of configs) {
      configMap[c.key] = c.value;
    }

    return NextResponse.json({ configs: configMap });
  } catch (error) {
    console.error('Settings GET API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
    }

    const allowedKeys = ['PRICE_PER_GRAM', 'MIN_BALANCE_THRESHOLD', 'WEIGHT_NOISE_THRESHOLD'];
    const updates: { key: string; value: string }[] = [];

    for (const key of allowedKeys) {
      if (body[key] !== undefined && body[key] !== null) {
        const val = parseFloat(body[key]);
        if (isNaN(val) || val < 0) {
          return NextResponse.json({ error: `Invalid numeric value for ${key}` }, { status: 400 });
        }
        updates.push({ key, value: val.toFixed(2) });
      }
    }

    await prisma.$transaction(
      updates.map((item) =>
        prisma.systemConfig.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: {
            key: item.key,
            value: item.value,
            description: `Configured via Admin Dashboard on ${new Date().toISOString()}`,
          },
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Settings POST API error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
