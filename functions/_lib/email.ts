import { AwsClient } from "aws4fetch";
import type { Env } from "./types";

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Stable unsubscribe URL, used for both List-Unsubscribe headers. */
  unsubscribeUrl: string;
}

/**
 * Send a transactional email via the Amazon SES v2 SendEmail API, SigV4-signed with
 * aws4fetch. Every message carries RFC 8058 one-click unsubscribe headers.
 *
 * Throws on 5xx (so a Queue consumer can retry) and on 4xx (caller logs the detail).
 */
export async function sendEmail(env: Env, msg: OutboundEmail): Promise<string> {
  const aws = new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.SES_REGION,
    service: "ses",
  });

  const endpoint = `https://email.${env.SES_REGION}.amazonaws.com/v2/email/outbound-emails`;

  const payload = {
    FromEmailAddress: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
    Destination: { ToAddresses: [msg.to] },
    ConfigurationSetName: env.SES_CONFIGURATION_SET,
    Content: {
      Simple: {
        Subject: { Data: msg.subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: msg.html, Charset: "UTF-8" },
          Text: { Data: msg.text, Charset: "UTF-8" },
        },
        Headers: [
          { Name: "List-Unsubscribe", Value: `<${msg.unsubscribeUrl}>` },
          {
            Name: "List-Unsubscribe-Post",
            Value: "List-Unsubscribe=One-Click",
          },
        ],
      },
    },
  };

  const res = await aws.fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    if (res.status >= 500) {
      // Transient: let the caller / queue retry.
      throw new Error(`SES ${res.status} (retryable): ${detail}`);
    }
    throw new Error(`SES ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as { MessageId?: string };
  return data.MessageId ?? "";
}
