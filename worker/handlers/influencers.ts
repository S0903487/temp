import type { AuthedRequest, Env } from '../types';
import { badRequest, generateId, json, notFound, nowIso, readJson } from '../utils';

interface InfluencerBody {
  fullName?: string;
  username?: string;
  platform?: string;
  category?: string;
  country?: string;
  language?: string;
  followers?: number;
  engagementRate?: number;
  averageViews?: number;
  averageLikes?: number;
  averageComments?: number;
  email?: string;
  phone?: string;
  pricePost?: number;
  priceStory?: number;
  verified?: boolean;
  brandSafe?: boolean;
  status?: string;
  pipelineStatus?: string;
  notes?: string;
  tags?: string[];
  bio?: string;
  profileImage?: string;
}

export const PIPELINE_STATUSES = [
  'New',
  'Reviewed',
  'Contacted',
  'Replied',
  'Negotiating',
  'Booked',
  'Completed',
  'Inactive',
] as const;

function toApi(row: Record<string, unknown>) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    fullName: row.full_name,
    username: row.username,
    platform: row.platform,
    category: row.category,
    country: row.country,
    language: row.language,
    followers: row.followers,
    engagementRate: row.engagement_rate,
    averageViews: row.average_views,
    averageLikes: row.average_likes,
    averageComments: row.average_comments,
    email: row.email,
    phone: row.phone,
    pricePost: row.price_post,
    priceStory: row.price_story,
    verified: !!row.verified,
    brandSafe: !!row.brand_safe,
    status: row.status,
    pipelineStatus: row.pipeline_status,
    notes: row.notes,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    bio: row.bio,
    profileImage: row.profile_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function list(_request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  // profile_image is a small (~10-40KB) base64 data URL — a resized
  // 256x256 WebP, never the original picked/fetched image (see
  // frontend/src/lib/image.ts) — so returning it for every row here is
  // cheap. This used to be the slowest request in the app back when
  // profile_image held an unresized, multi-MB base64 original.
  const { results } = await env.DB.prepare('SELECT * FROM influencers WHERE organization_id = ? ORDER BY created_at DESC')
    .bind(auth.organizationId)
    .all();
  return json(results.map(toApi));
}

export async function getById(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!row) return notFound();
  return json(toApi(row));
}

export async function create(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await readJson<InfluencerBody>(request);
  if (!body.fullName) return badRequest('fullName is required');
  // The client resizes photos to a 256x256 WebP data URL (a few tens of
  // KB) before sending them — see frontend/src/lib/image.ts. This cap is
  // just a backstop against a buggy/malicious client sending something
  // huge, which is what made list endpoints slow in the first place.
  if (body.profileImage && body.profileImage.length > 200_000) {
    return badRequest('profileImage is too large — it should be a resized (256x256) image');
  }

  const id = generateId('inf');
  const now = nowIso();

  await env.DB.prepare(
    `INSERT INTO influencers (
      id, organization_id, full_name, username, platform, category, country, language,
      followers, engagement_rate, average_views, average_likes, average_comments,
      email, phone, price_post, price_story, verified, brand_safe, status, pipeline_status, notes, tags, bio, profile_image,
      created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      id,
      auth.organizationId,
      body.fullName,
      body.username ?? null,
      body.platform ?? 'Instagram',
      body.category ?? null,
      body.country ?? null,
      body.language ?? null,
      body.followers ?? 0,
      body.engagementRate ?? 0,
      body.averageViews ?? 0,
      body.averageLikes ?? 0,
      body.averageComments ?? 0,
      body.email ?? null,
      body.phone ?? null,
      body.pricePost ?? null,
      body.priceStory ?? null,
      body.verified ? 1 : 0,
      body.brandSafe === false ? 0 : 1,
      body.status ?? 'Active',
      body.pipelineStatus ?? 'New',
      body.notes ?? null,
      body.tags ? JSON.stringify(body.tags) : null,
      body.bio ?? null,
      body.profileImage ?? null,
      now
    )
    .run();

  // Seed the first growth snapshot so the profile's history chart has a
  // starting point immediately, same as the schema-level backfill.
  await env.DB.prepare(
    `INSERT INTO influencer_snapshots (id, influencer_id, date, followers, average_views, average_likes, average_comments, engagement_rate, created_at)
     VALUES (?, ?, date(?), ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      generateId('snap'),
      id,
      now,
      body.followers ?? 0,
      body.averageViews ?? 0,
      body.averageLikes ?? 0,
      body.averageComments ?? 0,
      body.engagementRate ?? 0,
      now
    )
    .run();

  const row = await env.DB.prepare('SELECT * FROM influencers WHERE id = ?').bind(id).first();
  return json(toApi(row as Record<string, unknown>), 201);
}

const COLUMN_MAP: Record<keyof InfluencerBody, string> = {
  fullName: 'full_name',
  username: 'username',
  platform: 'platform',
  category: 'category',
  country: 'country',
  language: 'language',
  followers: 'followers',
  engagementRate: 'engagement_rate',
  averageViews: 'average_views',
  averageLikes: 'average_likes',
  averageComments: 'average_comments',
  email: 'email',
  phone: 'phone',
  pricePost: 'price_post',
  priceStory: 'price_story',
  verified: 'verified',
  brandSafe: 'brand_safe',
  status: 'status',
  pipelineStatus: 'pipeline_status',
  notes: 'notes',
  tags: 'tags',
  bio: 'bio',
  profileImage: 'profile_image',
};

export async function update(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const existing = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!existing) return notFound();

  const body = await readJson<InfluencerBody>(request);
  if (body.profileImage && body.profileImage.length > 200_000) {
    return badRequest('profileImage is too large — it should be a resized (256x256) image');
  }
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const key of Object.keys(body) as (keyof InfluencerBody)[]) {
    const column = COLUMN_MAP[key];
    if (!column) continue;
    let value: unknown = body[key];
    if (key === 'verified' || key === 'brandSafe') value = value ? 1 : 0;
    if (key === 'tags') value = value ? JSON.stringify(value) : null;
    sets.push(`${column} = ?`);
    values.push(value);
  }

  if (sets.length === 0) return badRequest('No fields to update');

  sets.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);

  await env.DB.prepare(`UPDATE influencers SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const row = await env.DB.prepare('SELECT * FROM influencers WHERE id = ?').bind(id).first();

  const growthFields: (keyof InfluencerBody)[] = ['followers', 'averageViews', 'averageLikes', 'averageComments', 'engagementRate'];
  if (growthFields.some((field) => field in body)) {
    const r = row as Record<string, unknown>;
    await env.DB.prepare(
      `INSERT INTO influencer_snapshots (id, influencer_id, date, followers, average_views, average_likes, average_comments, engagement_rate, created_at)
       VALUES (?, ?, date(?), ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        generateId('snap'),
        id,
        nowIso(),
        r.followers,
        r.average_views,
        r.average_likes,
        r.average_comments,
        r.engagement_rate,
        nowIso()
      )
      .run();
  }

  return json(toApi(row as Record<string, unknown>));
}

export async function remove(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const result = await env.DB.prepare('DELETE FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .run();
  if (!result.meta.changes) return notFound();
  return json({ success: true });
}

// GET /api/influencers/:id/campaigns — campaign history for a creator's profile page
export async function getCampaigns(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!influencer) return notFound();

  const { results } = await env.DB.prepare(
    `SELECT c.id, c.name, c.status, c.start_date, c.end_date, c.budget, cl.name AS client_name, ci.added_at
     FROM campaign_influencers ci
     JOIN campaigns c ON c.id = ci.campaign_id
     JOIN clients cl ON cl.id = c.client_id
     WHERE ci.influencer_id = ? AND cl.organization_id = ?
     ORDER BY c.start_date DESC`
  )
    .bind(id, auth.organizationId)
    .all();

  return json(
    results.map((r) => ({
      campaignId: r.id,
      name: r.name,
      clientName: r.client_name,
      status: r.status,
      startDate: r.start_date,
      endDate: r.end_date,
      budget: r.budget,
      addedAt: r.added_at,
    }))
  );
}

// GET /api/influencers/:id/snapshots — follower/engagement growth history
export async function listSnapshots(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!influencer) return notFound();

  const { results } = await env.DB.prepare(
    'SELECT * FROM influencer_snapshots WHERE influencer_id = ? ORDER BY date ASC'
  )
    .bind(id)
    .all();

  return json(
    results.map((r) => ({
      id: r.id,
      date: r.date,
      followers: r.followers,
      averageViews: r.average_views,
      averageLikes: r.average_likes,
      averageComments: r.average_comments,
      engagementRate: r.engagement_rate,
    }))
  );
}

// GET /api/influencers/:id/notes
export async function listNotes(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!influencer) return notFound();

  const { results } = await env.DB.prepare(
    'SELECT * FROM influencer_notes WHERE influencer_id = ? ORDER BY created_at DESC'
  )
    .bind(id)
    .all();

  return json(results.map((r) => ({ id: r.id, body: r.body, authorId: r.author_id, createdAt: r.created_at })));
}

// POST /api/influencers/:id/notes  { body }
export async function addNote(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!influencer) return notFound();

  const body = await readJson<{ body?: string }>(request);
  if (!body.body || !body.body.trim()) return badRequest('body is required');

  const noteId = generateId('note');
  const now = nowIso();
  await env.DB.prepare(
    'INSERT INTO influencer_notes (id, influencer_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(noteId, id, auth.userId, body.body.trim(), now)
    .run();

  return json({ id: noteId, body: body.body.trim(), authorId: auth.userId, createdAt: now }, 201);
}

// DELETE /api/influencers/:id/notes/:noteId
export async function removeNote(
  _request: Request,
  env: Env,
  auth: AuthedRequest,
  id: string,
  noteId: string
): Promise<Response> {
  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!influencer) return notFound();

  const result = await env.DB.prepare('DELETE FROM influencer_notes WHERE id = ? AND influencer_id = ?')
    .bind(noteId, id)
    .run();
  if (!result.meta.changes) return notFound();
  return json({ success: true });
}

// GET /api/influencers/:id/tags
export async function listInfluencerTags(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!influencer) return notFound();

  const { results } = await env.DB.prepare(
    `SELECT t.id, t.name FROM influencer_tags it JOIN tags t ON t.id = it.tag_id WHERE it.influencer_id = ? ORDER BY t.name`
  )
    .bind(id)
    .all();
  return json(results);
}

// POST /api/influencers/:id/tags  { name }  — creates the org tag if needed, then attaches it
export async function addInfluencerTag(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!influencer) return notFound();

  const body = await readJson<{ name?: string }>(request);
  const name = body.name?.trim();
  if (!name) return badRequest('name is required');

  let tag = await env.DB.prepare('SELECT id, name FROM tags WHERE organization_id = ? AND name = ?')
    .bind(auth.organizationId, name)
    .first<{ id: string; name: string }>();

  if (!tag) {
    const tagId = generateId('tag');
    await env.DB.prepare('INSERT INTO tags (id, organization_id, name, created_at) VALUES (?, ?, ?, ?)')
      .bind(tagId, auth.organizationId, name, nowIso())
      .run();
    tag = { id: tagId, name };
  }

  await env.DB.prepare('INSERT OR IGNORE INTO influencer_tags (influencer_id, tag_id, added_at) VALUES (?, ?, ?)')
    .bind(id, tag.id, nowIso())
    .run();

  return json(tag, 201);
}

// DELETE /api/influencers/:id/tags/:tagId
export async function removeInfluencerTag(
  _request: Request,
  env: Env,
  auth: AuthedRequest,
  id: string,
  tagId: string
): Promise<Response> {
  const influencer = await env.DB.prepare('SELECT id FROM influencers WHERE id = ? AND organization_id = ?')
    .bind(id, auth.organizationId)
    .first();
  if (!influencer) return notFound();

  await env.DB.prepare('DELETE FROM influencer_tags WHERE influencer_id = ? AND tag_id = ?').bind(id, tagId).run();
  return json({ success: true });
}
