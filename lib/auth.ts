import { cookies } from 'next/headers';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'smart-vending-jwt-secret-key-2026';
export const COOKIE_NAME = 'admin_session';

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(username: string): Promise<string> {
  const payload = {
    username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const enc = new TextEncoder();
  const dataStr = JSON.stringify(payload);
  const data = enc.encode(dataStr);
  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const b64Data = Buffer.from(dataStr).toString('base64url');
  return `${b64Data}.${sigHex}`;
}

export async function verifySession(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const [b64Data, sigHex] = token.split('.');
    if (!b64Data || !sigHex) return false;

    const dataStr = Buffer.from(b64Data, 'base64url').toString('utf8');
    const payload = JSON.parse(dataStr);

    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }

    const enc = new TextEncoder();
    const data = enc.encode(dataStr);
    const key = await getKey();

    // Convert sigHex back to Uint8Array
    const sigBytes = new Uint8Array(
      sigHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify('HMAC', key, sigBytes, data);
  } catch {
    return false;
  }
}

export function validateAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySession(token);
}
