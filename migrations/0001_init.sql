-- Phase 1 schema for the mailing-list / excerpt-delivery system.
-- One subscriber row per email; many excerpt requests per subscriber.

CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT,                       -- optional; collected by the excerpt modal, null for newsletter signups
  confirmed_at TEXT,
  unsubscribed_at TEXT,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  source_book TEXT,                -- slug of the book that first brought them in, or null (general signup)
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_subscribers_status ON subscribers(confirmed_at, unsubscribed_at);

CREATE TABLE excerpt_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  book_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | sent | failed
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  sent_at TEXT,
  error TEXT
);
CREATE INDEX idx_excerpt_requests_subscriber ON excerpt_requests(subscriber_id);
CREATE INDEX idx_excerpt_requests_status_book ON excerpt_requests(status, book_slug);

CREATE TABLE books (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt_pdf_key TEXT NOT NULL,   -- R2 object key, excerpts/{slug}.pdf
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  scheduled_at TEXT,
  completed_at TEXT,
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0
);

CREATE TABLE broadcast_sends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  broadcast_id INTEGER NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TEXT,
  error TEXT,
  UNIQUE(broadcast_id, subscriber_id)
);

CREATE TABLE rate_limits (
  ip TEXT NOT NULL,
  bucket TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL,
  PRIMARY KEY (ip, bucket)
);

-- SES bounce/complaint events ingested via SNS -> HTTPS webhook (Phase 6).
CREATE TABLE ses_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,        -- Bounce | Complaint | Delivery | Reject
  email TEXT NOT NULL COLLATE NOCASE,
  message_id TEXT,
  reason TEXT,
  raw_json TEXT,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ses_events_email ON ses_events(email);
