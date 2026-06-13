import type { Env, SubscriberRow, BookRow } from "./types";
import { signExcerptUrl } from "./r2-sign";
import { excerptEmail } from "./templates";
import { sendEmail } from "./email";
import { markExcerptSent, markExcerptFailed } from "./db";

/**
 * Presign the excerpt PDF, email the link, and record the outcome on the request row.
 * Best-effort: never throws. Returns whether the excerpt was sent, so callers can
 * decide what to do (but confirmation/redirect should not be blocked by a send failure).
 */
export async function deliverExcerpt(
  env: Env,
  subscriber: SubscriberRow,
  book: BookRow,
): Promise<boolean> {
  const unsubscribeUrl = `${env.SITE_URL}/api/unsubscribe?token=${subscriber.unsubscribe_token}`;
  try {
    const downloadUrl = await signExcerptUrl(env, book.excerpt_pdf_key);
    const tmpl = excerptEmail({
      fromName: env.FROM_NAME,
      bookTitle: book.title,
      downloadUrl,
      unsubscribeUrl,
      mailingAddress: env.MAILING_ADDRESS,
    });
    await sendEmail(env, {
      to: subscriber.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      unsubscribeUrl,
    });
    await markExcerptSent(env, subscriber.id, book.slug);
    return true;
  } catch (err) {
    await markExcerptFailed(
      env,
      subscriber.id,
      book.slug,
      String((err as Error)?.message ?? err),
    );
    return false;
  }
}
