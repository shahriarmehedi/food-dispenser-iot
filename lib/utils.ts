import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes an RFID card UID string to an uppercase, non-delimited hexadecimal string.
 * Example: 'a3:4f:12:9c' -> 'A34F129C', ' 11-22-33-44 ' -> '11223344'
 */
export function normalizeCardUid(uid: string | null | undefined): string {
  if (!uid) return '';
  return uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Formats a currency amount in BDT (৳)
 */
export function formatBDT(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '৳0.00';
  return `৳${num.toFixed(2)}`;
}

/**
 * Formats weight in grams or kilograms
 */
export function formatWeight(grams: number | string): string {
  const num = typeof amountToNumber(grams);
  const n = typeof grams === 'string' ? parseFloat(grams) : grams;
  if (isNaN(n)) return '0.00 g';
  if (n >= 1000) {
    return `${(n / 1000).toFixed(2)} kg`;
  }
  return `${n.toFixed(1)} g`;
}

function amountToNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
}
