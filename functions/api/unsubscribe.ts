import type { Env } from "../_lib/types";
import {
  getSubscriberByUnsubscribeToken,
  unsubscribeByToken,
} from "../_lib/db";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(title: string, inner: string): Response {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Rajko Radivojac</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#0a0f1f;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:1rem;}
  .card{max-width:30rem;width:100%;background:#111a33;border-radius:.75rem;padding:2.5rem;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.4);}
  h1{font-size:1.5rem;margin:0 0 .75rem;color:#fff;}
  p{color:#9ca3af;line-height:1.6;margin:0 0 1.25rem;}
  button{background:#0f766e;color:#fff;border:0;border-radius:.375rem;padding:.75rem 1.5rem;
    font-weight:600;font-size:.95rem;cursor:pointer;}
  a{color:#5eead4;}
</style></head>
<body><div class="card">${inner}</div></body></html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// GET /api/unsubscribe?token=... — show a confirm page.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get("token");
  if (!token)
    return page(
      "Unsubscribe",
      "<h1>Invalid link</h1><p>This unsubscribe link is missing its token.</p>",
    );

  const sub = await getSubscriberByUnsubscribeToken(env, token);
  if (!sub)
    return page(
      "Unsubscribe",
      "<h1>Link not found</h1><p>This unsubscribe link is not valid.</p>",
    );

  if (sub.unsubscribed_at) {
    return page(
      "Unsubscribed",
      `<h1>Already unsubscribed</h1><p><strong>${esc(sub.email)}</strong> is not receiving emails.</p>`,
    );
  }

  return page(
    "Confirm unsubscribe",
    `<h1>Unsubscribe?</h1>
     <p>Stop sending emails to <strong>${esc(sub.email)}</strong> from Rajko Radivojac?</p>
     <form method="POST" action="/api/unsubscribe">
       <input type="hidden" name="token" value="${esc(token)}">
       <button type="submit">Yes, unsubscribe me</button>
     </form>
     <p style="margin-top:1.25rem;font-size:.85rem;"><a href="${esc(env.SITE_URL)}">No, take me back to the site</a></p>`,
  );
};

// POST /api/unsubscribe — token via form body OR ?token=. Body
// `List-Unsubscribe=One-Click` is the RFC 8058 one-click flow mail clients fire.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let token = new URL(request.url).searchParams.get("token");
  let oneClick = false;

  try {
    const form = await request.formData();
    token = token ?? (form.get("token") as string | null);
    if (form.get("List-Unsubscribe") === "One-Click") oneClick = true;
  } catch {
    // no/!form body — rely on query-string token
  }

  if (!token) {
    return oneClick
      ? new Response("OK", { status: 200 })
      : page(
          "Unsubscribe",
          "<h1>Invalid request</h1><p>No unsubscribe token was provided.</p>",
        );
  }

  await unsubscribeByToken(env, token);

  if (oneClick) return new Response("OK", { status: 200 });

  return page(
    "Unsubscribed",
    `<h1>You're unsubscribed</h1>
     <p>You won't receive any more emails. Changed your mind? Just request an excerpt again on the site.</p>
     <p><a href="${esc(env.SITE_URL)}">Back to rajkoradivojac.com</a></p>`,
  );
};
