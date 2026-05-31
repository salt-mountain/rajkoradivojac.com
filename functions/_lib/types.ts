/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  // Excerpts are delivered via S3-presigned URLs (R2_* creds below), so the R2
  // binding is optional and currently unused by the Functions.
  EXCERPTS?: R2Bucket;

  // [vars] from wrangler.toml
  SITE_URL: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
  SES_REGION: string;
  SES_CONFIGURATION_SET: string;
  MAILING_ADDRESS: string;

  // Cloudflare Access JWT verification for /admin + /api/admin/*.
  // ACCESS_TEAM_DOMAIN e.g. "yourteam.cloudflareaccess.com"; ACCESS_AUD = the Access
  // application's Audience (AUD) tag.
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  // Optional comma-separated allowlist of admin emails (defense-in-depth on top of
  // the Cloudflare Access policy).
  ADMIN_EMAILS?: string;

  // secrets (wrangler pages secret put)
  HMAC_SECRET: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // R2 S3-compatible presigning (Phase 2)
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
}

export interface SubscriberRow {
  id: number;
  email: string;
  name: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
  source_book: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface BookRow {
  slug: string;
  title: string;
  excerpt_pdf_key: string;
  active: number;
}

export interface ExcerptRequestRow {
  id: number;
  subscriber_id: number;
  book_slug: string;
  status: string;
  requested_at: string;
  confirmed_at: string | null;
  sent_at: string | null;
  error: string | null;
}

export interface SubscriberListRow extends SubscriberRow {
  request_count: number;
}
