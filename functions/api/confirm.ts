import type { Env } from '../_lib/types';
import { verifyActionToken } from '../_lib/tokens';
import {
  markSubscriberConfirmed,
  confirmExcerptRequest,
  getSubscriberById,
  getActiveBook,
} from '../_lib/db';
import { deliverExcerpt } from '../_lib/deliver';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  const fail = () => Response.redirect(`${env.SITE_URL}/confirm-error`, 302);

  if (!token) return fail();

  const payload = await verifyActionToken(token, env.HMAC_SECRET);
  if (!payload || payload.action !== 'confirm') return fail();

  await markSubscriberConfirmed(env, payload.sid);

  if (payload.book) {
    await confirmExcerptRequest(env, payload.sid, payload.book);

    // Deliver the excerpt now. Best-effort: a send failure is recorded on the request
    // row but must not block the confirmation redirect.
    const [subscriber, book] = await Promise.all([
      getSubscriberById(env, payload.sid),
      getActiveBook(env, payload.book),
    ]);
    if (subscriber && book) {
      await deliverExcerpt(env, subscriber, book);
    }
  }

  const dest = payload.book
    ? `${env.SITE_URL}/confirmed?book=${encodeURIComponent(payload.book)}`
    : `${env.SITE_URL}/confirmed`;
  return Response.redirect(dest, 302);
};
