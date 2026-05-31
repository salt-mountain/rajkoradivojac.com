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
