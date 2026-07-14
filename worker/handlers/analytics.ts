import type { AuthedRequest, Env } from '../types';
import { badRequest, generateId, json, notFound, nowIso, readJson } from '../utils';

interface AnalyticsBody {
  influencerId?: string;
  campaignId?: string;
  date?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  metadata?: Record<string, unknown>;
}

function toApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    influencerId: row.influencer_id,
    campaignId: row.campaign_id ?? undefined,
    date: row.date,
    impressions: row.impressions,
    clicks: row.clicks,
    conversions: row.conversions,
    revenue: row.revenue,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    createdAt: row.created_at,
  };
}

// Analytics are scoped indirectly through the influencer's organization.
async function assertOwnedByOrg(env: Env, recordId: string, organizationId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    `SELECT a.id FROM analytics_records a JOIN influencers i ON i.id = a.influencer_id
     WHERE a.id = ? AND i.organization_id = ?`
  )
    .bind(recordId, organizationId)
    .first();
  return !!row;
}

export async function list(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const url = new URL(request.url);
  const influencerId = url.searchParams.get('influencerId');
  const campaignId = url.searchParams.get('campaignId');

  let query = `SELECT a.* FROM analytics_records a JOIN influencers i ON i.id = a.influencer_id
               WHERE i.organization_id = ?`;
  const params: unknown[] = [auth.organizationId];

  if (influencerId) {
    query += ' AND a.influencer_id = ?';
    params.push(influencerId);
  }
  if (campaignId) {
    query += ' AND a.campaign_id = ?';
    params.push(campaignId);
  }
  query += ' ORDER BY a.date DESC';

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all();
  return json(results.map(toApi));
}

export async function getById(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (!(await assertOwnedByOrg(env, id, auth.organizationId))) return notFound();
  const row = await env.DB.prepare('SELECT * FROM analytics_records WHERE id = ?').bind(id).first();
  if (!row) return notFound();
  return json(toApi(row));
}

export async function create(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await readJson<AnalyticsBody>(request);
  if (!body.influencerId || !body.date) return badRequest('influencerId and date are required');

  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(body.influencerId, auth.organizationId)
    .first();
  if (!influencer) return badRequest('Unknown influencerId');

  const id = generateId('anl');
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO analytics_records (id, influencer_id, campaign_id, date, impressions, clicks, conversions, revenue, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.influencerId,
      body.campaignId ?? null,
      body.date,
      body.impressions ?? null,
      body.clicks ?? null,
      body.conversions ?? null,
      body.revenue ?? null,
      body.metadata ? JSON.stringify(body.metadata) : null,
      now
    )
    .run();

  const row = await env.DB.prepare('SELECT * FROM analytics_records WHERE id = ?').bind(id).first();
  return json(toApi(row as Record<string, unknown>), 201);
}

export async function update(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (!(await assertOwnedByOrg(env, id, auth.organizationId))) return notFound();

  const body = await readJson<AnalyticsBody>(request);
  const columnMap: Record<string, string> = {
    date: 'date',
    impressions: 'impressions',
    clicks: 'clicks',
    conversions: 'conversions',
    revenue: 'revenue',
  };

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (key in body) {
      sets.push(`${column} = ?`);
      values.push((body as Record<string, unknown>)[key]);
    }
  }
  if ('metadata' in body) {
    sets.push('metadata = ?');
    values.push(body.metadata ? JSON.stringify(body.metadata) : null);
  }
  if (sets.length === 0) return badRequest('No fields to update');
  values.push(id);

  await env.DB.prepare(`UPDATE analytics_records SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const row = await env.DB.prepare('SELECT * FROM analytics_records WHERE id = ?').bind(id).first();
  return json(toApi(row as Record<string, unknown>));
}

export async function remove(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (!(await assertOwnedByOrg(env, id, auth.organizationId))) return notFound();
  await env.DB.prepare('DELETE FROM analytics_records WHERE id = ?').bind(id).run();
  return json({ success: true });
}
