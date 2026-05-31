import type { Env } from '../../_lib/types';
import { requireAdmin } from '../../_lib/admin-auth';
import { listSubscribers } from '../../_lib/db';

function cell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/admin/export.csv — full subscriber list as CSV
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const { rows } = await listSubscribers(env, {
    status: 'all',
    search: null,
    limit: 100000,
    offset: 0,
  });

  const header = [
    'email',
    'name',
    'confirmed_at',
    'unsubscribed_at',
    'source_book',
    'request_count',
    'created_at',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.email,
        r.name,
        r.confirmed_at,
        r.unsubscribed_at,
        r.source_book,
        r.request_count,
        r.created_at,
      ]
        .map(cell)
        .join(','),
    );
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="subscribers.csv"',
    },
  });
};
