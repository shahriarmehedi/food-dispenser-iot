import { prisma } from './prisma';

export const CONFIG_DEFAULTS = {
  PRICE_PER_GRAM: 0.50,
  MIN_BALANCE_THRESHOLD: 10.00,
  WEIGHT_NOISE_THRESHOLD: 5.00,
} as const;

export async function getSystemConfigNumber(key: string, defaultValue: number): Promise<number> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });
    if (!config || !config.value) return defaultValue;
    const parsed = parseFloat(config.value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (err) {
    console.error(`Error fetching config for key "${key}":`, err);
    return defaultValue;
  }
}

export async function getPricePerGram(): Promise<number> {
  return getSystemConfigNumber('PRICE_PER_GRAM', CONFIG_DEFAULTS.PRICE_PER_GRAM);
}

export async function getMinBalanceThreshold(): Promise<number> {
  return getSystemConfigNumber('MIN_BALANCE_THRESHOLD', CONFIG_DEFAULTS.MIN_BALANCE_THRESHOLD);
}

export async function getWeightNoiseThreshold(): Promise<number> {
  return getSystemConfigNumber('WEIGHT_NOISE_THRESHOLD', CONFIG_DEFAULTS.WEIGHT_NOISE_THRESHOLD);
}
