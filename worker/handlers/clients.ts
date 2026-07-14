import type { AuthedRequest, Env } from '../types';
import { badRequest, generateId, json, notFound, nowIso, readJson } from '../utils';

interface ClientBody {
  name?: string;
  contactEmail?: string;
  industry?: string;
  status?: string;
}

function toApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    contactEmail: row.contact_email,
    industry: row.industry,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function list(_request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT * FROM clients WHERE organization_id = ? ORDER BY created_at DESC')
    .bind(auth.organizationId)
    .all();
  return json(results.map(toApi));
}

export async function getById(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM clients WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!row) return notFound();
  return json(toApi(row));
}

export async function create(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await readJson<ClientBody>(request);
  if (!body.name) return badRequest('name is required');

  const id = generateId('clt');
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO clients (id, organization_id, name, contact_email, industry, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, auth.organizationId, body.name, body.contactEmail ?? null, body.industry ?? null, body.status ?? 'prospect', now)
    .run();

  const row = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  return json(toApi(row as Record<string, unknown>), 201);
}

export async function update(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const existing = await env.DB.prepare('SELECT id FROM clients WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!existing) return notFound();

  const body = await readJson<ClientBody>(request);
  const columnMap: Record<string, string> = {
    name: 'name',
    contactEmail: 'contact_email',
    industry: 'industry',
    status: 'status',
  };

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (key in body) {
      sets.push(`${column} = ?`);
      values.push((body as Record<string, unknown>)[key]);
    }
  }
  if (sets.length === 0) return badRequest('No fields to update');

  sets.push('updated_at = ?');
  values.push(nowIso(), id);

  await env.DB.prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const row = await env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  return json(toApi(row as Record<string, unknown>));
}

export async function remove(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const result = await env.DB.prepare('DELETE FROM clients WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .run();
  if (!result.meta.changes) return notFound();
  return json({ success: true });
}
