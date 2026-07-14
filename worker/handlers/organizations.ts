import type { AuthedRequest, Env } from '../types';
import { badRequest, json, notFound, nowIso, readJson } from '../utils';

interface OrganizationBody {
  name?: string;
  description?: string;
  currency?: string;
}

function toApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    currency: row.currency ?? 'USD',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Every user belongs to exactly one organization (their tenant), so "current"
// always resolves via auth.organizationId — there is no cross-org listing.
export async function getCurrent(_request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(auth.organizationId).first();
  if (!row) return notFound();
  return json(toApi(row));
}

export async function updateCurrent(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await readJson<OrganizationBody>(request);
  const sets: string[] = [];
  const values: unknown[] = [];

  if ('name' in body) {
    sets.push('name = ?');
    values.push(body.name);
  }
  if ('description' in body) {
    sets.push('description = ?');
    values.push(body.description);
  }
  if ('currency' in body) {
    sets.push('currency = ?');
    values.push(body.currency);
  }
  if (sets.length === 0) return badRequest('No fields to update');

  sets.push('updated_at = ?');
  values.push(nowIso(), auth.organizationId);

  await env.DB.prepare(`UPDATE organizations SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const row = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(auth.organizationId).first();
  return json(toApi(row as Record<string, unknown>));
}
