import type { Env } from '../../_lib/types';
import { requireAdmin } from '../../_lib/admin-auth';
import { listSubscribers, adminAddSubscriber, type SubscriberStatus } from '../../_lib/db';
import { validateEmail, normalizeEmail } from '../../_lib/validation';
import { generateUnsubscribeToken } from '../../_lib/tokens';

const PAGE_SIZE = 50;

// GET /api/admin/subscribers?status=&search=&page=
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status') ?? 'all';
  const status: SubscriberStatus = (
    ['confirmed', 'pending', 'unsubscribed'] as const
  ).includes(statusParam as never)
    ? (statusParam as SubscriberStatus)
    : 'all';
  const search = url.searchParams.get('search')?.trim() || null;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);

  const { rows, total } = await listSubscribers(env, {
    status,
    search,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return Response.json({ rows, total, page, pageSize: PAGE_SIZE });
};

// POST /api/admin/subscribers  { email, name } — manual add (confirmed, skips opt-in)
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  let body: { email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? '');
  if (!validateEmail(email)) return Response.json({ error: 'invalid_email' }, { status: 400 });

  await adminAddSubscriber(env, {
    email,
    name: body.name?.trim() || null,
    unsubscribeToken: generateUnsubscribeToken(),
  });
  return Response.json({ status: 'ok' });
};
