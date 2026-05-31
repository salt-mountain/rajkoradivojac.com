import type {
  Env,
  SubscriberRow,
  BookRow,
  SubscriberListRow,
  ExcerptRequestRow,
} from './types';

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export type SubscriberStatus = 'confirmed' | 'pending' | 'unsubscribed' | 'all';

export async function listSubscribers(
  env: Env,
  opts: { status: SubscriberStatus; search: string | null; limit: number; offset: number },
): Promise<{ rows: SubscriberListRow[]; total: number }> {
  const where: string[] = [];
  const binds: unknown[] = [];

  if (opts.status === 'confirmed') where.push('confirmed_at IS NOT NULL AND unsubscribed_at IS NULL');
  else if (opts.status === 'pending') where.push('confirmed_at IS NULL AND unsubscribed_at IS NULL');
  else if (opts.status === 'unsubscribed') where.push('unsubscribed_at IS NOT NULL');

  if (opts.search) {
    where.push('(email LIKE ? OR name LIKE ?)');
    binds.push(`%${opts.search}%`, `%${opts.search}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = await env.DB.prepare(`SELECT count(*) AS n FROM subscribers ${whereSql}`)
    .bind(...binds)
    .first<{ n: number }>();

  const list = await env.DB.prepare(
    `SELECT s.*, (SELECT count(*) FROM excerpt_requests er WHERE er.subscriber_id = s.id) AS request_count
     FROM subscribers s ${whereSql}
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
  )
    .bind(...binds, opts.limit, opts.offset)
    .all<SubscriberListRow>();

  return { rows: list.results ?? [], total: totalRow?.n ?? 0 };
}

export async function getSubscriberWithRequests(
  env: Env,
  id: number,
): Promise<{ subscriber: SubscriberRow; requests: ExcerptRequestRow[] } | null> {
  const subscriber = await getSubscriberById(env, id);
  if (!subscriber) return null;
  const requests = await env.DB.prepare(
    'SELECT * FROM excerpt_requests WHERE subscriber_id = ? ORDER BY id DESC',
  )
    .bind(id)
    .all<ExcerptRequestRow>();
  return { subscriber, requests: requests.results ?? [] };
}

export async function statsSummary(env: Env): Promise<{
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
  signups_30d: number;
  requests_by_book: Array<{ book_slug: string; count: number }>;
}> {
  const counts = await env.DB.prepare(
    `SELECT
       count(*) AS total,
       sum(CASE WHEN confirmed_at IS NOT NULL AND unsubscribed_at IS NULL THEN 1 ELSE 0 END) AS confirmed,
       sum(CASE WHEN confirmed_at IS NULL AND unsubscribed_at IS NULL THEN 1 ELSE 0 END) AS pending,
       sum(CASE WHEN unsubscribed_at IS NOT NULL THEN 1 ELSE 0 END) AS unsubscribed,
       sum(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 ELSE 0 END) AS signups_30d
     FROM subscribers`,
  ).first<{
    total: number;
    confirmed: number;
    pending: number;
    unsubscribed: number;
    signups_30d: number;
  }>();

  const byBook = await env.DB.prepare(
    `SELECT book_slug, count(*) AS count FROM excerpt_requests GROUP BY book_slug ORDER BY count DESC`,
  ).all<{ book_slug: string; count: number }>();

  return {
    total: counts?.total ?? 0,
    confirmed: counts?.confirmed ?? 0,
    pending: counts?.pending ?? 0,
    unsubscribed: counts?.unsubscribed ?? 0,
    signups_30d: counts?.signups_30d ?? 0,
    requests_by_book: byBook.results ?? [],
  };
}

/** Admin manual add: upsert a CONFIRMED subscriber (skips double opt-in). */
export async function adminAddSubscriber(
  env: Env,
  opts: { email: string; name: string | null; unsubscribeToken: string },
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO subscribers (email, name, unsubscribe_token, confirmed_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(email) DO UPDATE SET
       name = COALESCE(excluded.name, subscribers.name),
       confirmed_at = COALESCE(subscribers.confirmed_at, datetime('now')),
       unsubscribed_at = NULL`,
  )
    .bind(opts.email, opts.name, opts.unsubscribeToken)
    .run();
}

export async function deleteSubscriber(env: Env, id: number): Promise<void> {
  // D1 doesn't enforce FK ON DELETE CASCADE by default, so remove children explicitly.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM excerpt_requests WHERE subscriber_id = ?').bind(id),
    env.DB.prepare('DELETE FROM broadcast_sends WHERE subscriber_id = ?').bind(id),
    env.DB.prepare('DELETE FROM subscribers WHERE id = ?').bind(id),
  ]);
}

export async function unsubscribeById(env: Env, id: number): Promise<void> {
  await env.DB.prepare(
    `UPDATE subscribers SET unsubscribed_at = datetime('now') WHERE id = ?`,
  )
    .bind(id)
    .run();
}

// ---------------------------------------------------------------------------
// SES event ingestion (Phase 6)
// ---------------------------------------------------------------------------

export async function insertSesEvent(
  env: Env,
  e: {
    eventType: string;
    email: string;
    messageId: string | null;
    reason: string | null;
    raw: string | null;
  },
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO ses_events (event_type, email, message_id, reason, raw_json)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(e.eventType, e.email, e.messageId, e.reason, e.raw)
    .run();
}

/** Auto-suppress an address (hard bounce / complaint). Idempotent. */
export async function suppressEmail(env: Env, email: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE subscribers SET unsubscribed_at = datetime('now')
     WHERE email = ? AND unsubscribed_at IS NULL`,
  )
    .bind(email)
    .run();
}

export async function getActiveBook(env: Env, slug: string): Promise<BookRow | null> {
  return env.DB.prepare(
    'SELECT slug, title, excerpt_pdf_key, active FROM books WHERE slug = ? AND active = 1',
  )
    .bind(slug)
    .first<BookRow>();
}

export async function getSubscriberByEmail(
  env: Env,
  email: string,
): Promise<SubscriberRow | null> {
  return env.DB.prepare('SELECT * FROM subscribers WHERE email = ?')
    .bind(email)
    .first<SubscriberRow>();
}

export async function getSubscriberByUnsubscribeToken(
  env: Env,
  token: string,
): Promise<SubscriberRow | null> {
  return env.DB.prepare('SELECT * FROM subscribers WHERE unsubscribe_token = ?')
    .bind(token)
    .first<SubscriberRow>();
}

export async function getSubscriberById(env: Env, id: number): Promise<SubscriberRow | null> {
  return env.DB.prepare('SELECT * FROM subscribers WHERE id = ?')
    .bind(id)
    .first<SubscriberRow>();
}

export async function insertSubscriber(
  env: Env,
  s: {
    email: string;
    name: string | null;
    unsubscribeToken: string;
    sourceBook: string | null;
    ip: string | null;
    userAgent: string | null;
  },
): Promise<SubscriberRow> {
  const row = await env.DB.prepare(
    `INSERT INTO subscribers (email, name, unsubscribe_token, source_book, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING *`,
  )
    .bind(s.email, s.name, s.unsubscribeToken, s.sourceBook, s.ip, s.userAgent)
    .first<SubscriberRow>();
  // RETURNING on an INSERT always yields a row.
  return row as SubscriberRow;
}

export async function setSubscriberName(env: Env, id: number, name: string): Promise<void> {
  await env.DB.prepare('UPDATE subscribers SET name = ? WHERE id = ? AND name IS NULL')
    .bind(name, id)
    .run();
}

/** True if this (subscriber, book) had an excerpt sent within the last `withinDays`. */
export async function hasRecentSend(
  env: Env,
  subscriberId: number,
  bookSlug: string,
  withinDays = 7,
): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT id FROM excerpt_requests
     WHERE subscriber_id = ? AND book_slug = ? AND sent_at IS NOT NULL
       AND sent_at > datetime('now', ?)
     LIMIT 1`,
  )
    .bind(subscriberId, bookSlug, `-${withinDays} days`)
    .first();
  return row !== null;
}

export async function insertExcerptRequest(
  env: Env,
  subscriberId: number,
  bookSlug: string,
  status: 'pending' | 'confirmed' | 'sent' | 'failed',
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO excerpt_requests (subscriber_id, book_slug, status) VALUES (?, ?, ?)',
  )
    .bind(subscriberId, bookSlug, status)
    .run();
}

export async function unsubscribeByToken(env: Env, token: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE subscribers SET unsubscribed_at = datetime('now') WHERE unsubscribe_token = ?`,
  )
    .bind(token)
    .run();
}

/** Clear the unsubscribed flag and confirm the subscriber (used by resubscribe). */
export async function resubscribe(env: Env, id: number): Promise<void> {
  await env.DB.prepare(
    `UPDATE subscribers
     SET unsubscribed_at = NULL, confirmed_at = COALESCE(confirmed_at, datetime('now'))
     WHERE id = ?`,
  )
    .bind(id)
    .run();
}

export async function markSubscriberConfirmed(env: Env, id: number): Promise<void> {
  await env.DB.prepare(
    `UPDATE subscribers SET confirmed_at = datetime('now') WHERE id = ? AND confirmed_at IS NULL`,
  )
    .bind(id)
    .run();
}

/** Move a pending excerpt request to confirmed (delivery then marks it sent). */
export async function confirmExcerptRequest(
  env: Env,
  subscriberId: number,
  bookSlug: string,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE excerpt_requests
     SET confirmed_at = datetime('now'), status = 'confirmed'
     WHERE subscriber_id = ? AND book_slug = ? AND status = 'pending'`,
  )
    .bind(subscriberId, bookSlug)
    .run();
}

// Update the most recent not-yet-sent request for this (subscriber, book).
const LATEST_OPEN_REQUEST =
  `(SELECT id FROM excerpt_requests
    WHERE subscriber_id = ? AND book_slug = ? AND status IN ('pending', 'confirmed')
    ORDER BY id DESC LIMIT 1)`;

export async function markExcerptSent(
  env: Env,
  subscriberId: number,
  bookSlug: string,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE excerpt_requests SET status = 'sent', sent_at = datetime('now'), error = NULL
     WHERE id = ${LATEST_OPEN_REQUEST}`,
  )
    .bind(subscriberId, bookSlug)
    .run();
}

export async function markExcerptFailed(
  env: Env,
  subscriberId: number,
  bookSlug: string,
  error: string,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE excerpt_requests SET status = 'failed', error = ?
     WHERE id = ${LATEST_OPEN_REQUEST}`,
  )
    .bind(error, subscriberId, bookSlug)
    .run();
}
