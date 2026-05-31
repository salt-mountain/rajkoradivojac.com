import type { Env } from '../../../../_lib/types';
import { requireAdmin } from '../../../../_lib/admin-auth';
import { unsubscribeById } from '../../../../_lib/db';

// POST /api/admin/subscribers/:id/unsubscribe — soft unsubscribe (keeps the record)
export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const id = Number(params.id);
  if (!Number.isInteger(id)) return Response.json({ error: 'bad_id' }, { status: 400 });

  await unsubscribeById(env, id);
  return Response.json({ status: 'ok' });
};
