// Simple per-IP fixed-window rate limiter backed by the rate_limits D1 table.
// Default: 5 requests / 10 minutes. Returns true if the request is allowed.

export async function checkRateLimit(
  db: D1Database,
  ip: string,
  bucket: string,
  limit = 5,
  windowMs = 10 * 60 * 1000,
): Promise<boolean> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const row = await db
    .prepare('SELECT count, window_start FROM rate_limits WHERE ip = ? AND bucket = ?')
    .bind(ip, bucket)
    .first<{ count: number; window_start: string }>();

  if (!row) {
    await db
      .prepare(
        'INSERT INTO rate_limits (ip, bucket, count, window_start) VALUES (?, ?, 1, ?)',
      )
      .bind(ip, bucket, nowIso)
      .run();
    return true;
  }

  const elapsed = now - Date.parse(row.window_start);
  if (elapsed > windowMs) {
    // Window expired: reset.
    await db
      .prepare('UPDATE rate_limits SET count = 1, window_start = ? WHERE ip = ? AND bucket = ?')
      .bind(nowIso, ip, bucket)
      .run();
    return true;
  }

  if (row.count >= limit) return false;

  await db
    .prepare('UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND bucket = ?')
    .bind(ip, bucket)
    .run();
  return true;
}
