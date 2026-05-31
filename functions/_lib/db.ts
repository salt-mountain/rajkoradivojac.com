import type { Env, SubscriberRow, BookRow } from './types';

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
