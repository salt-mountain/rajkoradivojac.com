// Email validation + normalization. Strict-ish regex plus the RFC max length of 254.

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  if (email.length === 0 || email.length > 254) return false;
  return EMAIL_RE.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
