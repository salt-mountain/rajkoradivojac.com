import type { Env } from './types';

export interface AdminContext {
  email: string;
}

/**
 * Gate admin endpoints. The real security boundary is the Cloudflare Access policy
 * configured on /admin* and /api/admin/* — Access authenticates at the edge and sets
 * Cf-Access-Authenticated-User-Email (and strips any client-supplied copy). Here we
 * require that header (so a misconfigured/absent Access policy fails closed) and,
 * optionally, check it against the ADMIN_EMAILS allowlist.
 *
 * Returns the AdminContext, or a Response to short-circuit with.
 */
export function requireAdmin(request: Request, env: Env): AdminContext | Response {
  const forbidden = () =>
    new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });

  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (!email) return forbidden();

  const allow = env.ADMIN_EMAILS?.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allow && allow.length > 0 && !allow.includes(email.toLowerCase())) {
    return forbidden();
  }

  return { email };
}
