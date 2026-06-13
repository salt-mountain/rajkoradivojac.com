// Verify and parse Amazon SNS messages (used to ingest SES bounce/complaint events).
// SNS signs every message; we verify the RSA signature against the AWS-hosted signing
// certificate so a third party can't POST forged events to our public webhook.

export interface SnsMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  SubscribeURL?: string;
  Token?: string;
}

const encoder = new TextEncoder();

export function isAwsSnsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      /^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(u.hostname)
    );
  } catch {
    return false;
  }
}

// Canonical string-to-sign per the SNS spec (key\nvalue\n for a fixed field set/order).
function canonicalString(m: SnsMessage): string | null {
  const fields: Array<[string, string | undefined]> = [];
  if (m.Type === "Notification") {
    fields.push(["Message", m.Message], ["MessageId", m.MessageId]);
    if (m.Subject !== undefined) fields.push(["Subject", m.Subject]);
    fields.push(
      ["Timestamp", m.Timestamp],
      ["TopicArn", m.TopicArn],
      ["Type", m.Type],
    );
  } else if (
    m.Type === "SubscriptionConfirmation" ||
    m.Type === "UnsubscribeConfirmation"
  ) {
    fields.push(
      ["Message", m.Message],
      ["MessageId", m.MessageId],
      ["SubscribeURL", m.SubscribeURL ?? ""],
      ["Timestamp", m.Timestamp],
      ["Token", m.Token ?? ""],
      ["TopicArn", m.TopicArn],
      ["Type", m.Type],
    );
  } else {
    return null;
  }
  return fields.map(([k, v]) => `${k}\n${v ?? ""}\n`).join("");
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pemToDer(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/, "")
    .replace(/-----END CERTIFICATE-----/, "")
    .replace(/\s+/g, "");
  return b64ToBytes(b64);
}

function readLen(buf: Uint8Array, off: number): { len: number; hdr: number } {
  const first = buf[off];
  if (first < 0x80) return { len: first, hdr: 1 };
  const n = first & 0x7f;
  let len = 0;
  for (let i = 0; i < n; i++) len = (len << 8) | buf[off + 1 + i];
  return { len, hdr: 1 + n };
}

// Extract the SubjectPublicKeyInfo (SPKI) DER from a DER X.509 certificate. Web Crypto
// can import an SPKI public key but not a full cert, so we walk the ASN.1 to find it.
function extractSpki(der: Uint8Array): Uint8Array {
  if (der[0] !== 0x30) throw new Error("not a SEQUENCE");
  const cert = readLen(der, 1);
  let p = 1 + cert.hdr; // into Certificate
  if (der[p] !== 0x30) throw new Error("no tbsCertificate");
  const tbs = readLen(der, p + 1);
  p = p + 1 + tbs.hdr; // into tbsCertificate
  if (der[p] === 0xa0) {
    // optional version [0]
    const v = readLen(der, p + 1);
    p += 1 + v.hdr + v.len;
  }
  // skip serialNumber, signature, issuer, validity, subject
  for (let i = 0; i < 5; i++) {
    const l = readLen(der, p + 1);
    p += 1 + l.hdr + l.len;
  }
  if (der[p] !== 0x30) throw new Error("no subjectPublicKeyInfo");
  const spki = readLen(der, p + 1);
  return der.slice(p, p + 1 + spki.hdr + spki.len);
}

const spkiCache = new Map<string, Uint8Array>();

async function getSpki(url: string): Promise<Uint8Array> {
  const cached = spkiCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`cert fetch ${res.status}`);
  const spki = extractSpki(pemToDer(await res.text()));
  spkiCache.set(url, spki);
  return spki;
}

export async function verifySnsMessage(m: SnsMessage): Promise<boolean> {
  if (!isAwsSnsUrl(m.SigningCertURL)) return false;
  const canon = canonicalString(m);
  if (canon === null) return false;

  const hash = m.SignatureVersion === "2" ? "SHA-256" : "SHA-1";
  try {
    const spki = await getSpki(m.SigningCertURL);
    const key = await crypto.subtle.importKey(
      "spki",
      spki,
      { name: "RSASSA-PKCS1-v1_5", hash },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64ToBytes(m.Signature),
      encoder.encode(canon),
    );
  } catch {
    return false;
  }
}
