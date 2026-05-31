// Stateless, HMAC-signed action tokens (opt-in confirm + resubscribe) and the
// random per-subscriber unsubscribe token. All crypto uses Web Crypto (SubtleCrypto),
// which is available both in the Workers runtime and in Node for tests.

export type ActionType = 'confirm' | 'resubscribe';

export interface ActionTokenPayload {
  action: ActionType;
  sid: number; // subscriber id
  book: string | null; // book slug, or null for a general newsletter signup
  exp: number; // expiry, unix seconds
}

export const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(input: string): Uint8Array {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signActionToken(
  payload: ActionTokenPayload,
  secret: string,
): Promise<string> {
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

/**
 * Verify signature + expiry + action shape. Returns the payload or null.
 * Never throws on malformed input.
 */
export async function verifyActionToken(
  token: string,
  secret: string,
): Promise<ActionTokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  let valid: boolean;
  try {
    const key = await hmacKey(secret);
    valid = await crypto.subtle.verify('HMAC', key, base64UrlToBytes(sig), encoder.encode(body));
  } catch {
    return null;
  }
  if (!valid) return null;

  let payload: ActionTokenPayload;
  try {
    payload = JSON.parse(decoder.decode(base64UrlToBytes(body)));
  } catch {
    return null;
  }

  if (payload.action !== 'confirm' && payload.action !== 'resubscribe') return null;
  if (typeof payload.sid !== 'number') return null;
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

/** Random 32-byte URL-safe token, stable for a subscriber's lifetime. */
export function generateUnsubscribeToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}
