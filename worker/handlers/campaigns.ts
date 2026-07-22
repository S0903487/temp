import type { AuthedRequest, Env } from '../types';
import { badRequest, generateId, json, notFound, nowIso, readJson } from '../utils';

interface CampaignBody {
  clientId?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: string;
}

async function withInfluencerIds(env: Env, row: Record<string, unknown>) {
  const { results } = await env.DB.prepare('SELECT influencer_id FROM campaign_influencers WHERE campaign_id = ?')
    .bind(row.id)
    .all();
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    influencerIds: results.map((r) => r.influencer_id),
    startDate: row.start_date,
    endDate: row.end_date,
    budget: row.budget,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Campaigns belong to clients, which belong to organizations — join to scope by org.
async function assertOwnedByOrg(env: Env, campaignId: string, organizationId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT c.id FROM campaigns c JOIN clients cl ON cl.id = c.client_id
     WHERE c.id = ? AND cl.organization_id = ?`
  )
    .bind(campaignId, organizationId)
    .first();
  return !!row;
}

export async function list(_request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT c.* FROM campaigns c JOIN clients cl ON cl.id = c.client_id
     WHERE cl.organization_id = ? ORDER BY c.created_at DESC`
  )
    .bind(auth.organizationId)
    .all();

  if (results.length === 0) return json([]);

  // Previously this fired one `SELECT influencer_id FROM campaign_influencers
  // WHERE campaign_id = ?` per campaign via Promise.all — an N+1 that grows
  // with your campaign count and eats into the 50-subrequest-per-request
  // cap on Workers Free. One IN(...) query covers every campaign at once.
  const campaignIds = results.map((r) => r.id as string);
  const placeholders = campaignIds.map(() => '?').join(', ');
  const { results: links } = await env.DB.prepare(
    `SELECT campaign_id, influencer_id FROM campaign_influencers WHERE campaign_id IN (${placeholders})`
  )
    .bind(...campaignIds)
    .all();

  const influencerIdsByCampaign = new Map<string, string[]>();
  for (const link of links) {
    const campaignId = link.campaign_id as string;
    const list = influencerIdsByCampaign.get(campaignId) ?? [];
    list.push(link.influencer_id as string);
    influencerIdsByCampaign.set(campaignId, list);
  }

  return json(
    results.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      description: row.description,
      influencerIds: influencerIdsByCampaign.get(row.id as string) ?? [],
      startDate: row.start_date,
      endDate: row.end_date,
      budget: row.budget,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  );
}

export async function getById(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (!(await assertOwnedByOrg(env, id, auth.organizationId))) return notFound();
  const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  if (!row) return notFound();
  return json(await withInfluencerIds(env, row));
}

export async function create(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await readJson<CampaignBody>(request);
  if (!body.name || !body.clientId) return badRequest('name and clientId are required');

  const client = await env.DB.prepare('SELECT id FROM clients WHERE id = ? AND organization_id = ?')
    .bind(body.clientId, auth.organizationId)
    .first();
  if (!client) return badRequest('Unknown clientId');

  const id = generateId('cmp');
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO campaigns (id, client_id, name, description, start_date, end_date, budget, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.clientId,
      body.name,
      body.description ?? null,
      body.startDate ?? null,
      body.endDate ?? null,
      body.budget ?? null,
      body.status ?? 'draft',
      now
    )
    .run();

  const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  return json(await withInfluencerIds(env, row as Record<string, unknown>), 201);
}

export async function update(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (!(await assertOwnedByOrg(env, id, auth.organizationId))) return notFound();

  const body = await readJson<CampaignBody>(request);
  const columnMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    startDate: 'start_date',
    endDate: 'end_date',
    budget: 'budget',
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

  await env.DB.prepare(`UPDATE campaigns SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  return json(await withInfluencerIds(env, row as Record<string, unknown>));
}

export async function remove(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (!(await assertOwnedByOrg(env, id, auth.organizationId))) return notFound();
  await env.DB.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run();
  return json({ success: true });
}

// POST /api/campaigns/:id/influencers  { influencerId }
export async function linkInfluencer(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (!(await assertOwnedByOrg(env, id, auth.organizationId))) return notFound();
  const body = await readJson<{ influencerId?: string }>(request);
  if (!body.influencerId) return badRequest('influencerId is required');

  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(body.influencerId, auth.organizationId)
    .first();
  if (!influencer) return badRequest('Unknown influencerId');

  await env.DB.prepare(
    'INSERT OR IGNORE INTO campaign_influencers (campaign_id, influencer_id, added_at) VALUES (?, ?, ?)'
  )
    .bind(id, body.influencerId, nowIso())
    .run();

  const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  return json(await withInfluencerIds(env, row as Record<string, unknown>));
}

// DELETE /api/campaigns/:id/influencers/:influencerId
export async function unlinkInfluencer(
  _request: Request,
  env: Env,
  auth: AuthedRequest,
  id: string,
  influencerId: string
): Promise<Response> {
  if (!(await assertOwnedByOrg(env, id, auth.organizationId))) return notFound();
  await env.DB.prepare('DELETE FROM campaign_influencers WHERE campaign_id = ? AND influencer_id = ?')
    .bind(id, influencerId)
    .run();
  const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  return json(await withInfluencerIds(env, row as Record<string, unknown>));
}
