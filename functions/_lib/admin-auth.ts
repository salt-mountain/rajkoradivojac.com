import type { Env } from "./types";

export interface AdminContext {
  email: string;
}

interface AccessJwtPayload {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iss?: string;
}

const decoder = new TextDecoder();

function base64UrlToBytes(input: string): Uint8Array {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function decodeSegment<T>(seg: string): T {
  return JSON.parse(decoder.decode(base64UrlToBytes(seg))) as T;
}

// Cache the team's signing keys per isolate (they rotate slowly).
let keyCache: { keys: JsonWebKey[]; expiresAt: number } | null = null;

async function fetchAccessKeys(teamDomain: string): Promise<JsonWebKey[]> {
  const now = Date.now();
  if (keyCache && keyCache.expiresAt > now) return keyCache.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs fetch failed: ${res.status}`);
  const data = (await res.json()) as { keys?: JsonWebKey[] };
  keyCache = { keys: data.keys ?? [], expiresAt: now + 60 * 60 * 1000 };
  return keyCache.keys;
}

/**
 * Verify a Cloudflare Access JWT (Cf-Access-Jwt-Assertion) — the primary gate in
 * production. The token is signed by the team's Access keys (so it can't be forged),
 * with `iss` = the team domain and `aud` = the application's audience tag. Returns the
 * authenticated email, or null. Requires ACCESS_TEAM_DOMAIN + ACCESS_AUD to be set.
 */
async function verifyAccessJwt(
  token: string,
  env: Env,
): Promise<AdminContext | null> {
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  if (!teamDomain || !aud) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerSeg, payloadSeg, sigSeg] = parts;

  let header: { kid?: string; alg?: string };
  let payload: AccessJwtPayload;
  try {
    header = decodeSegment(headerSeg);
    payload = decodeSegment(payloadSeg);
  } catch {
    return null;
  }

  if (header.alg !== "RS256" || !header.kid) return null;
  if (payload.iss !== `https://${teamDomain}`) return null;
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) return null;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;

  let keys: JsonWebKey[];
  try {
    keys = await fetchAccessKeys(teamDomain);
  } catch {
    return null;
  }
  const jwk = keys.find((k) => (k as { kid?: string }).kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToBytes(sigSeg),
    new TextEncoder().encode(`${headerSeg}.${payloadSeg}`),
  );
  if (!ok || !payload.email) return null;
  return { email: payload.email };
}

function allowlisted(email: string, env: Env): boolean {
  const allow = env.ADMIN_EMAILS?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allow || allow.length === 0) return true;
  return allow.includes(email.toLowerCase());
}

/**
 * Gate admin endpoints. Prefers the signed Access JWT; falls back to the
 * Cf-Access-Authenticated-User-Email header (used for local dev, where the JWT is
 * absent). Returns the AdminContext or a 403 Response.
 */
export async function requireAdmin(
  request: Request,
  env: Env,
): Promise<AdminContext | Response> {
  const forbidden = () =>
    new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });

  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (jwt) {
    const ctx = await verifyAccessJwt(jwt, env);
    if (!ctx || !allowlisted(ctx.email, env)) return forbidden();
    return ctx;
  }

  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (!email || !allowlisted(email, env)) return forbidden();
  return { email };
}
