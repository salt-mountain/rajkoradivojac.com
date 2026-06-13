import type { Env } from "../../../_lib/types";
import { requireAdmin } from "../../../_lib/admin-auth";
import { getSubscriberWithRequests, deleteSubscriber } from "../../../_lib/db";

// GET /api/admin/subscribers/:id — full detail + excerpt requests
export const onRequestGet: PagesFunction<Env, "id"> = async ({
  request,
  env,
  params,
}) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const id = Number(params.id);
  if (!Number.isInteger(id))
    return Response.json({ error: "bad_id" }, { status: 400 });

  const detail = await getSubscriberWithRequests(env, id);
  if (!detail) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(detail);
};

// DELETE /api/admin/subscribers/:id — hard delete (GDPR erase)
export const onRequestDelete: PagesFunction<Env, "id"> = async ({
  request,
  env,
  params,
}) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const id = Number(params.id);
  if (!Number.isInteger(id))
    return Response.json({ error: "bad_id" }, { status: 400 });

  await deleteSubscriber(env, id);
  return Response.json({ status: "ok" });
};
