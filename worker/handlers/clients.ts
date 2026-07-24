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

async function getClientById(env: Env, _auth: AuthedRequest, id: string) {
  const query = 'SELECT * FROM clients WHERE id = ?';
  const stmt = env.DB.prepare(query).bind(id);
  return stmt.first();
}

export async function list(_request: Request, env: Env, _auth: AuthedRequest): Promise<Response> {
  const query = 'SELECT * FROM clients ORDER BY created_at DESC';
  const stmt = env.DB.prepare(query);
  const { results } = await stmt.all();
  return json(results.map(toApi));
}

export async function getById(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const row = await getClientById(env, auth, id);
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
  const existing = await getClientById(env, auth, id);
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
  const checkQuery = 'SELECT id FROM clients WHERE id = ?';
  const checkStmt = env.DB.prepare(checkQuery).bind(id);
  const existing = await checkStmt.first();
  if (!existing) return notFound();

  // Clean up campaigns, campaign influencers, and analytics records belonging to this client's campaigns
  await env.DB.prepare('DELETE FROM campaign_influencers WHERE campaign_id IN (SELECT id FROM campaigns WHERE client_id = ?)').bind(id).run();
  await env.DB.prepare('DELETE FROM analytics_records WHERE campaign_id IN (SELECT id FROM campaigns WHERE client_id = ?)').bind(id).run();
  await env.DB.prepare('DELETE FROM campaigns WHERE client_id = ?').bind(id).run();

  const query = 'DELETE FROM clients WHERE id = ?';
  const stmt = env.DB.prepare(query).bind(id);
  await stmt.run();

  return json({ success: true });
}
