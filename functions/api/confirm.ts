import type { Env } from '../_lib/types';
import { verifyActionToken } from '../_lib/tokens';
import { markSubscriberConfirmed, confirmExcerptRequest } from '../_lib/db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  const fail = () => Response.redirect(`${env.SITE_URL}/confirm-error`, 302);

  if (!token) return fail();

  const payload = await verifyActionToken(token, env.HMAC_SECRET);
  if (!payload || payload.action !== 'confirm') return fail();

  await markSubscriberConfirmed(env, payload.sid);

  if (payload.book) {
    // Phase 2 will, instead of just confirming, send the excerpt email here and
    // mark the request 'sent'.
    await confirmExcerptRequest(env, payload.sid, payload.book);
  }

  const dest = payload.book
    ? `${env.SITE_URL}/confirmed?book=${encodeURIComponent(payload.book)}`
    : `${env.SITE_URL}/confirmed`;
  return Response.redirect(dest, 302);
};
