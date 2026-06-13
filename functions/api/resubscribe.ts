import type { Env } from "../_lib/types";
import { verifyActionToken } from "../_lib/tokens";
import {
  resubscribe,
  getSubscriberById,
  getActiveBook,
  insertExcerptRequest,
} from "../_lib/db";
import { deliverExcerpt } from "../_lib/deliver";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get("token");
  const fail = () => Response.redirect(`${env.SITE_URL}/confirm-error`, 302);

  if (!token) return fail();

  const payload = await verifyActionToken(token, env.HMAC_SECRET);
  if (!payload || payload.action !== "resubscribe") return fail();

  // Clear unsubscribed state and (re)confirm.
  await resubscribe(env, payload.sid);

  if (payload.book) {
    const [sub, book] = await Promise.all([
      getSubscriberById(env, payload.sid),
      getActiveBook(env, payload.book),
    ]);
    if (sub && book) {
      await insertExcerptRequest(env, sub.id, book.slug, "confirmed");
      await deliverExcerpt(env, sub, book);
    }
  }

  const dest = payload.book
    ? `${env.SITE_URL}/welcome-back?book=${encodeURIComponent(payload.book)}`
    : `${env.SITE_URL}/welcome-back`;
  return Response.redirect(dest, 302);
};
