import type { Env } from '../../_lib/types';
import { requireAdmin } from '../../_lib/admin-auth';
import { statsSummary } from '../../_lib/db';

// GET /api/admin/stats
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  return Response.json(await statsSummary(env));
};
