import { AwsClient } from "aws4fetch";
import type { Env } from "./types";

// Excerpt PDFs live in this R2 bucket under excerpts/{slug}.pdf. We deliver them as
// short-lived S3-presigned GET URLs (never as attachments, never through the Worker),
// signed with the R2 S3-compatible credentials.

const R2_BUCKET = "rajko-excerpts";
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export async function signExcerptUrl(
  env: Env,
  key: string,
  expiresInSeconds = SEVEN_DAYS_SECONDS,
): Promise<string> {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY
  ) {
    throw new Error("R2 presigning credentials are not configured");
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });

  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`,
  );
  url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));

  const signed = await client.sign(url.toString(), {
    method: "GET",
    aws: { signQuery: true },
  });
  return signed.url;
}
