import type { Env, BookRow } from '../_lib/types';
import { validateEmail, normalizeEmail } from '../_lib/validation';
import { checkRateLimit } from '../_lib/rate-limit';
import {
  getActiveBook,
  getSubscriberByEmail,
  insertSubscriber,
  setSubscriberName,
  hasRecentSend,
  insertExcerptRequest,
} from '../_lib/db';
import { signActionToken, generateUnsubscribeToken, SEVEN_DAYS_SECONDS } from '../_lib/tokens';
import { sendEmail } from '../_lib/email';
import { confirmationEmail, resubscribeEmail } from '../_lib/templates';
import { deliverExcerpt } from '../_lib/deliver';

interface SubscribeBody {
  email?: string;
  book_slug?: string;
  name?: string;
  // Honeypot — the form field is named "website"; accept either key.
  website?: string;
  honeypot?: string;
}

// Public response is ALWAYS this, so subscriber state can't be enumerated.
const ok = () => Response.json({ status: 'ok' });
const clientError = (error: string, status = 400) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: SubscribeBody;
  try {
    body = await request.json<SubscribeBody>();
  } catch {
    return clientError('bad_request');
  }

  // Honeypot: a bot filled the hidden field. Pretend success.
  if (body.website?.trim() || body.honeypot?.trim()) return ok();

  const email = normalizeEmail(body.email ?? '');
  if (!validateEmail(email)) return clientError('invalid_email');

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const userAgent = request.headers.get('User-Agent');

  if (!(await checkRateLimit(env.DB, ip, 'subscribe'))) {
    return clientError('rate_limited', 429);
  }

  // Optional book. If a slug is given it must be a known active book.
  const bookSlug = body.book_slug?.trim() || null;
  let book: BookRow | null = null;
  if (bookSlug) {
    book = await getActiveBook(env, bookSlug);
    if (!book) return clientError('unknown_book');
  }
  const bookTitle = book?.title ?? null;

  const name = body.name?.trim() || null;

  // Upsert the subscriber (one row per email).
  let sub = await getSubscriberByEmail(env, email);
  if (!sub) {
    sub = await insertSubscriber(env, {
      email,
      name,
      unsubscribeToken: generateUnsubscribeToken(),
      sourceBook: bookSlug,
      ip,
      userAgent,
    });
  } else if (name && !sub.name) {
    await setSubscriberName(env, sub.id, name);
  }

  // Idempotency: same book sent within 7 days -> no duplicate.
  if (bookSlug && (await hasRecentSend(env, sub.id, bookSlug))) return ok();

  // --- Branch on subscriber state ---

  if (sub.unsubscribed_at) {
    // Previously unsubscribed: never silently re-add. Send a "welcome back — confirm
    // resubscribe" email; only /api/resubscribe flips their state and delivers.
    const exp = Math.floor(Date.now() / 1000) + SEVEN_DAYS_SECONDS;
    const token = await signActionToken(
      { action: 'resubscribe', sid: sub.id, book: bookSlug, exp },
      env.HMAC_SECRET,
    );
    const resubscribeUrl = `${env.SITE_URL}/api/resubscribe?token=${encodeURIComponent(token)}`;
    const unsubscribeUrl = `${env.SITE_URL}/api/unsubscribe?token=${sub.unsubscribe_token}`;
    const tmpl = resubscribeEmail({
      fromName: env.FROM_NAME,
      bookTitle,
      resubscribeUrl,
      unsubscribeUrl,
      mailingAddress: env.MAILING_ADDRESS,
    });
    await sendEmail(env, {
      to: sub.email,
      subject: tmpl.subject,
      html: tmpl.html,
      text: tmpl.text,
      unsubscribeUrl,
    });
    return ok();
  }

  if (sub.confirmed_at) {
    // Already confirmed -> deliver the excerpt immediately (no second opt-in).
    if (bookSlug && book) {
      await insertExcerptRequest(env, sub.id, bookSlug, 'confirmed');
      await deliverExcerpt(env, sub, book);
    }
    return ok();
  }

  // Not yet confirmed -> double opt-in. Record a pending request (if a book) and
  // send the confirmation email.
  if (bookSlug) await insertExcerptRequest(env, sub.id, bookSlug, 'pending');

  const exp = Math.floor(Date.now() / 1000) + SEVEN_DAYS_SECONDS;
  const token = await signActionToken(
    { action: 'confirm', sid: sub.id, book: bookSlug, exp },
    env.HMAC_SECRET,
  );
  const confirmUrl = `${env.SITE_URL}/api/confirm?token=${encodeURIComponent(token)}`;
  const unsubscribeUrl = `${env.SITE_URL}/api/unsubscribe?token=${sub.unsubscribe_token}`;

  const tmpl = confirmationEmail({
    fromName: env.FROM_NAME,
    bookTitle,
    confirmUrl,
    unsubscribeUrl,
    mailingAddress: env.MAILING_ADDRESS,
  });

  await sendEmail(env, {
    to: email,
    subject: tmpl.subject,
    html: tmpl.html,
    text: tmpl.text,
    unsubscribeUrl,
  });

  return ok();
};
