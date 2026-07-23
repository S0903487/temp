import type { AuthedRequest, Env } from '../types';
import { badRequest, conflict, generateId, json, notFound, nowIso, readJson, slugifyInfluencerId } from '../utils';

interface InfluencerBody {
  fullName?: string;
  username?: string;
  platform?: string;
  category?: string;
  country?: string;
  language?: string;
  followers?: number;
  following?: number;
  totalPosts?: number;
  firstJoinedDate?: string;
  engagementRate?: number;
  averageViews?: number;
  averageLikes?: number;
  averageComments?: number;
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
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
  profileLink?: string;
  roi?: number;
  cpa?: number;
  cpi?: number;
  ltv?: number;
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

let influencerColumns: string[] | null = null;
let snapshotColumns: string[] | null = null;

async function getInfluencerColumns(db: D1Database): Promise<string[]> {
  if (influencerColumns) return influencerColumns;
  try {
    const { results } = await db.prepare('PRAGMA table_info(influencers)').all();
    influencerColumns = results.map((r: any) => r.name);
    return influencerColumns;
  } catch (e) {
    return [
      'id', 'organization_id', 'full_name', 'username', 'platform', 'category', 'country', 'language',
      'followers', 'following', 'total_posts', 'first_joined_date', 'engagement_rate', 'average_views', 'average_likes', 'average_comments',
      'email', 'phone', 'price_post', 'price_story', 'verified', 'brand_safe', 'status', 'pipeline_status',
      'notes', 'tags', 'bio', 'profile_image', 'profile_link', 'roi', 'cpa', 'cpi', 'ltv', 'created_at', 'updated_at'
    ];
  }
}

async function getSnapshotColumns(db: D1Database): Promise<string[]> {
  if (snapshotColumns) return snapshotColumns;
  try {
    const { results } = await db.prepare('PRAGMA table_info(influencer_snapshots)').all();
    snapshotColumns = results.map((r: any) => r.name);
    return snapshotColumns;
  } catch (e) {
    return ['id', 'influencer_id', 'date', 'followers', 'average_views', 'average_likes', 'average_comments', 'engagement_rate', 'created_at'];
  }
}

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
    following: row.following !== undefined && row.following !== null ? row.following : 0,
    totalPosts: row.total_posts !== undefined && row.total_posts !== null ? row.total_posts : 0,
    firstJoinedDate: row.first_joined_date !== undefined && row.first_joined_date !== null ? (row.first_joined_date as string) : '',
    engagementRate: row.engagement_rate,
    averageViews: row.average_views !== undefined && row.average_views !== null ? row.average_views : 0,
    averageLikes: row.average_likes !== undefined && row.average_likes !== null ? row.average_likes : 0,
    averageComments: row.average_comments !== undefined && row.average_comments !== null ? row.average_comments : 0,
    totalViews: row.total_views !== undefined && row.total_views !== null ? row.total_views : 0,
    totalLikes: row.total_likes !== undefined && row.total_likes !== null ? row.total_likes : 0,
    totalComments: row.total_comments !== undefined && row.total_comments !== null ? row.total_comments : 0,
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
    profileLink: row.profile_link,
    roi: row.roi,
    cpa: row.cpa,
    cpi: row.cpi,
    ltv: row.ltv,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getInfluencerById(env: Env, auth: AuthedRequest, id: string) {
  const query = auth.role === 'admin'
    ? 'SELECT * FROM influencers WHERE id = ?'
    : 'SELECT * FROM influencers WHERE id = ? AND organization_id = ?';
  const stmt = auth.role === 'admin'
    ? env.DB.prepare(query).bind(id)
    : env.DB.prepare(query).bind(id, auth.organizationId);
  return stmt.first();
}

const LIST_MAX_LIMIT = 500;

export async function list(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  // profile_image is a small (~10-40KB) base64 data URL — a resized
  // 256x256 WebP, never the original picked/fetched image (see
  // frontend/src/lib/image.ts) — so returning it for every row here is
  // cheap. This used to be the slowest request in the app back when
  // profile_image held an unresized, multi-MB base64 original.
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  // Pagination is opt-in for now: pass ?limit= to get { items, total, limit,
  // offset } back. No ?limit= keeps today's "return every row" behavior so
  // existing callers (the data grid, pipeline board) don't break — but at
  // 50k+ rows that response is genuinely too large to ship to the browser
  // in one go. Wiring the frontend list/grid/pipeline views to page through
  // results with ?limit= is the necessary next step before real bulk data
  // lands; this endpoint is ready for that, the UI isn't wired to it yet.
  const orgFilter = auth.role === 'admin' ? '' : ' WHERE organization_id = ?';
  const bindArgs = auth.role === 'admin' ? [] : [auth.organizationId];

  if (limitParam !== null) {
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), LIST_MAX_LIMIT);
    const offset = Math.max(parseInt(offsetParam ?? '0', 10) || 0, 0);

    const [countRes, rowsRes] = await env.DB.batch([
      env.DB.prepare(`SELECT COUNT(*) as count FROM influencers${orgFilter}`).bind(...bindArgs),
      env.DB.prepare(
        `SELECT * FROM influencers${orgFilter} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(...bindArgs, limit, offset),
    ]);

    return json({
      items: rowsRes.results.map(toApi),
      total: (countRes.results[0]?.count as number) ?? 0,
      limit,
      offset,
    });
  }

  const query = auth.role === 'admin'
    ? 'SELECT * FROM influencers ORDER BY created_at DESC'
    : 'SELECT * FROM influencers WHERE organization_id = ? ORDER BY created_at DESC';
  const stmt = auth.role === 'admin'
    ? env.DB.prepare(query)
    : env.DB.prepare(query).bind(auth.organizationId);
  const { results } = await stmt.all();
  return json(results.map(toApi));
}

export async function getById(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const row = await getInfluencerById(env, auth, id);
  if (!row) return notFound();
  return json(toApi(row));
}

function cleanNum(val: unknown, defaultVal = 0): number {
  if (val === undefined || val === null) return defaultVal;
  const parsed = Number(val);
  return Number.isNaN(parsed) ? defaultVal : parsed;
}

function cleanNumOrNull(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const parsed = Number(val);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function create(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await readJson<InfluencerBody>(request);
  if (!body.fullName) return badRequest('fullName is required');
  if (!body.username) return badRequest('username is required — the profile ID is derived from username + platform');
  // The client resizes photos to a 256x256 WebP data URL (a few tens of
  // KB) before sending them — see frontend/src/lib/image.ts. This cap is
  // just a backstop against a buggy/malicious client sending something
  // huge, which is what made list endpoints slow in the first place.
  if (body.profileImage && body.profileImage.length > 200_000) {
    return badRequest('profileImage is too large — it should be a resized (256x256) image');
  }

  const platform = body.platform ?? 'Instagram';
  const id = slugifyInfluencerId(body.username, platform);
  if (id === '.' || id.startsWith('.')) {
    return badRequest('username must contain at least one letter or number');
  }
  const now = nowIso();

  const columns = await getInfluencerColumns(env.DB);
  
  const allPossibleColumns: { col: string; val: unknown }[] = [
    { col: 'id', val: id },
    { col: 'organization_id', val: auth.organizationId },
    { col: 'full_name', val: body.fullName },
    { col: 'username', val: body.username ?? null },
    { col: 'platform', val: platform },
    { col: 'category', val: body.category ?? null },
    { col: 'country', val: body.country ?? null },
    { col: 'language', val: body.language ?? null },
    { col: 'followers', val: cleanNum(body.followers, 0) },
    { col: 'following', val: cleanNum(body.following, 0) },
    { col: 'total_posts', val: cleanNum(body.totalPosts, 0) },
    { col: 'first_joined_date', val: body.firstJoinedDate ?? null },
    { col: 'engagement_rate', val: cleanNum(body.engagementRate, 0) },
    { col: 'average_views', val: cleanNum(body.averageViews, 0) },
    { col: 'average_likes', val: cleanNum(body.averageLikes, 0) },
    { col: 'average_comments', val: cleanNum(body.averageComments, 0) },
    { col: 'total_views', val: cleanNum(body.totalViews, 0) },
    { col: 'total_likes', val: cleanNum(body.totalLikes, 0) },
    { col: 'total_comments', val: cleanNum(body.totalComments, 0) },
    { col: 'email', val: body.email ?? null },
    { col: 'phone', val: body.phone ?? null },
    { col: 'price_post', val: cleanNumOrNull(body.pricePost) },
    { col: 'price_story', val: cleanNumOrNull(body.priceStory) },
    { col: 'verified', val: body.verified ? 1 : 0 },
    { col: 'brand_safe', val: body.brandSafe === false ? 0 : 1 },
    { col: 'status', val: body.status ?? 'Active' },
    { col: 'pipeline_status', val: body.pipelineStatus ?? 'New' },
    { col: 'notes', val: body.notes ?? null },
    { col: 'tags', val: body.tags ? JSON.stringify(body.tags) : null },
    { col: 'bio', val: body.bio ?? null },
    { col: 'profile_image', val: body.profileImage ?? null },
    { col: 'profile_link', val: body.profileLink ?? null },
    { col: 'roi', val: cleanNumOrNull(body.roi) },
    { col: 'cpa', val: cleanNumOrNull(body.cpa) },
    { col: 'cpi', val: cleanNumOrNull(body.cpi) },
    { col: 'ltv', val: cleanNumOrNull(body.ltv) },
    { col: 'created_at', val: now }
  ];

  const insertCols: string[] = [];
  const insertPlaceholders: string[] = [];
  const insertVals: unknown[] = [];

  for (const item of allPossibleColumns) {
    if (columns.includes(item.col)) {
      insertCols.push(item.col);
      insertPlaceholders.push('?');
      insertVals.push(item.val);
    }
  }

  try {
    await env.DB.prepare(
      `INSERT INTO influencers (${insertCols.join(', ')}) VALUES (${insertPlaceholders.join(', ')})`
    )
      .bind(...insertVals)
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE constraint failed')) {
      return conflict(`An influencer with username "${body.username}" on ${platform} already exists (id: ${id}).`);
    }
    throw err;
  }

  // Seed the first growth snapshot so the profile's history chart has a
  // starting point immediately, same as the schema-level backfill.
  const snapColumns = await getSnapshotColumns(env.DB);
  const snapCols: string[] = ['id', 'influencer_id', 'date', 'followers', 'engagement_rate', 'created_at'];
  const snapPlaceholders: string[] = ['?', '?', 'date(?)', '?', '?', '?'];
  const snapVals: unknown[] = [
    generateId('snap'),
    id,
    now,
    cleanNum(body.followers, 0),
    cleanNum(body.engagementRate, 0),
    now
  ];

  const snapViewsCol = snapColumns.includes('average_views') ? 'average_views' : (snapColumns.includes('total_views') ? 'total_views' : null);
  if (snapViewsCol) {
    snapCols.push(snapViewsCol);
    snapPlaceholders.push('?');
    snapVals.push(cleanNum(body.averageViews, 0));
  }
  const snapLikesCol = snapColumns.includes('average_likes') ? 'average_likes' : (snapColumns.includes('total_likes') ? 'total_likes' : null);
  if (snapLikesCol) {
    snapCols.push(snapLikesCol);
    snapPlaceholders.push('?');
    snapVals.push(cleanNum(body.averageLikes, 0));
  }
  const snapCommentsCol = snapColumns.includes('average_comments') ? 'average_comments' : (snapColumns.includes('total_comments') ? 'total_comments' : null);
  if (snapCommentsCol) {
    snapCols.push(snapCommentsCol);
    snapPlaceholders.push('?');
    snapVals.push(cleanNum(body.averageComments, 0));
  }

  await env.DB.prepare(
    `INSERT INTO influencer_snapshots (${snapCols.join(', ')}) VALUES (${snapPlaceholders.join(', ')})`
  )
    .bind(...snapVals)
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
  following: 'following',
  totalPosts: 'total_posts',
  firstJoinedDate: 'first_joined_date',
  engagementRate: 'engagement_rate',
  averageViews: 'average_views', // dynamically mapped below
  averageLikes: 'average_likes', // dynamically mapped below
  averageComments: 'average_comments', // dynamically mapped below
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
  profileLink: 'profile_link',
  roi: 'roi',
  cpa: 'cpa',
  cpi: 'cpi',
  ltv: 'ltv',
};

const INFLUENCER_COLUMN_MAP: Record<keyof InfluencerBody, string> = {
  fullName: 'full_name',
  username: 'username',
  platform: 'platform',
  category: 'category',
  country: 'country',
  language: 'language',
  followers: 'followers',
  following: 'following',
  totalPosts: 'total_posts',
  firstJoinedDate: 'first_joined_date',
  engagementRate: 'engagement_rate',
  averageViews: 'average_views',
  averageLikes: 'average_likes',
  averageComments: 'average_comments',
  totalViews: 'total_views',
  totalLikes: 'total_likes',
  totalComments: 'total_comments',
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
  profileLink: 'profile_link',
  roi: 'roi',
  cpa: 'cpa',
  cpi: 'cpi',
  ltv: 'ltv',
};

// Shared by update() (single row, PATCH) and bulkUpdate() (many rows, one
// D1 batch()) so the two code paths can't silently drift apart on which
// fields are writable or how they're coerced.
function buildInfluencerAssignments(body: InfluencerBody, columns: string[]): { sets: string[]; values: unknown[] } {
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const key of Object.keys(body) as (keyof InfluencerBody)[]) {
    const column = INFLUENCER_COLUMN_MAP[key];
    if (!column || !columns.includes(column)) continue;
    let value: unknown = body[key];
    if (key === 'verified' || key === 'brandSafe') {
      value = value ? 1 : 0;
    } else if (key === 'tags') {
      value = value ? JSON.stringify(value) : null;
    } else if (['followers', 'following', 'totalPosts', 'engagementRate', 'averageViews', 'averageLikes', 'averageComments', 'totalViews', 'totalLikes', 'totalComments'].includes(key)) {
      value = cleanNum(value, 0);
    } else if (['pricePost', 'priceStory', 'roi', 'cpa', 'cpi', 'ltv'].includes(key)) {
      value = cleanNumOrNull(value);
    }
    sets.push(`${column} = ?`);
    values.push(value);
  }

  return { sets, values };
}

export async function update(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const columns = await getInfluencerColumns(env.DB);
  
  const existing = await getInfluencerById(env, auth, id);
  if (!existing) return notFound();

  const body = await readJson<InfluencerBody>(request);
  if (body.profileImage && body.profileImage.length > 200_000) {
    return badRequest('profileImage is too large — it should be a resized (256x256) image');
  }
  const { sets, values } = buildInfluencerAssignments(body, columns);

  if (sets.length === 0) return badRequest('No fields to update');

  // id is now `username.platform`. If either changes, the id must be
  // renamed to match — otherwise the whole point of a deterministic,
  // human-readable id (and the id-derivation bulkUpdate() relies on)
  // silently breaks the moment someone edits a username typo.
  const existingRow = existing as Record<string, unknown>;
  const nextUsername = (body.username ?? (existingRow.username as string)) as string;
  const nextPlatform = (body.platform ?? (existingRow.platform as string)) as string;
  const newId = ('username' in body || 'platform' in body) ? slugifyInfluencerId(nextUsername, nextPlatform) : id;

  let effectiveId = id;
  if (newId !== id) {
    try {
      await env.DB.batch([
        env.DB.prepare('UPDATE campaign_influencers SET influencer_id = ? WHERE influencer_id = ?').bind(newId, id),
        env.DB.prepare('UPDATE influencer_notes SET influencer_id = ? WHERE influencer_id = ?').bind(newId, id),
        env.DB.prepare('UPDATE influencer_snapshots SET influencer_id = ? WHERE influencer_id = ?').bind(newId, id),
        env.DB.prepare('UPDATE influencer_tags SET influencer_id = ? WHERE influencer_id = ?').bind(newId, id),
        env.DB.prepare('UPDATE influencers SET id = ? WHERE id = ?').bind(newId, id),
      ]);
      effectiveId = newId;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('UNIQUE constraint failed')) {
        return conflict(`Renaming to "${newId}" conflicts with an existing influencer on that platform.`);
      }
      throw err;
    }
  }
  id = effectiveId; // reassign so every later reference in this function (snapshot insert, response) uses the renamed id

  sets.push('updated_at = ?');
  values.push(nowIso());
  values.push(id);

  await env.DB.prepare(`UPDATE influencers SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  const row = await env.DB.prepare('SELECT * FROM influencers WHERE id = ?').bind(id).first();

  const snapColumns = await getSnapshotColumns(env.DB);
  const growthFields: (keyof InfluencerBody)[] = ['followers', 'averageViews', 'averageLikes', 'averageComments', 'engagementRate'];
  if (growthFields.some((field) => field in body)) {
    const r = row as Record<string, unknown>;
    const snapCols: string[] = ['id', 'influencer_id', 'date', 'followers', 'engagement_rate', 'created_at'];
    const snapPlaceholders: string[] = ['?', '?', 'date(?)', '?', '?', '?'];
    const snapVals: unknown[] = [
      generateId('snap'),
      id,
      nowIso(),
      r.followers,
      r.engagement_rate,
      nowIso()
    ];

    const snapViewsCol = snapColumns.includes('average_views') ? 'average_views' : (snapColumns.includes('total_views') ? 'total_views' : null);
    if (snapViewsCol) {
      snapCols.push(snapViewsCol);
      snapPlaceholders.push('?');
      snapVals.push(r.average_views !== undefined && r.average_views !== null ? r.average_views : (r.total_views !== undefined && r.total_views !== null ? r.total_views : 0));
    }
    const snapLikesCol = snapColumns.includes('average_likes') ? 'average_likes' : (snapColumns.includes('total_likes') ? 'total_likes' : null);
    if (snapLikesCol) {
      snapCols.push(snapLikesCol);
      snapPlaceholders.push('?');
      snapVals.push(r.average_likes !== undefined && r.average_likes !== null ? r.average_likes : (r.total_likes !== undefined && r.total_likes !== null ? r.total_likes : 0));
    }
    const snapCommentsCol = snapColumns.includes('average_comments') ? 'average_comments' : (snapColumns.includes('total_comments') ? 'total_comments' : null);
    if (snapCommentsCol) {
      snapCols.push(snapCommentsCol);
      snapPlaceholders.push('?');
      snapVals.push(r.average_comments !== undefined && r.average_comments !== null ? r.average_comments : (r.total_comments !== undefined && r.total_comments !== null ? r.total_comments : 0));
    }

    await env.DB.prepare(
      `INSERT INTO influencer_snapshots (${snapCols.join(', ')}) VALUES (${snapPlaceholders.join(', ')})`
    )
      .bind(...snapVals)
      .run();
  }

  return json(toApi(row as Record<string, unknown>));
}

// POST /api/influencers/bulk
//
// Bulk-update up to BULK_MAX_ITEMS influencers in one request. Each item
// identifies its row either by `id` directly, or by `username` + `platform`
// — the latter works with NO lookup query, because id is deterministically
// `username.platform`. That's the whole reason this scheme is worth having
// once you're importing spreadsheets: the client (or a future Excel/CSV
// importer) never needs to fetch existing IDs first, it can compute them.
//
// All updates in the request run as a single env.DB.batch() — one D1
// round trip no matter how many rows are in the chunk, same pattern as the
// dashboard summary and the influencer /full endpoint.
//
// This does NOT write growth snapshots per row (unlike the single-row PATCH)
// — for a 50k-row import that would be 50k extra INSERTs for a feature
// (the per-row growth chart) nobody's looking at mid-import. If you want
// snapshot history from bulk imports later, that's a deliberate follow-up,
// not an oversight.
const BULK_MAX_ITEMS = 500;

interface BulkUpdateItem extends InfluencerBody {
  id?: string;
}

export async function bulkUpdate(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await readJson<{ items?: BulkUpdateItem[] }>(request);
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return badRequest('items must be a non-empty array');
  }
  if (items.length > BULK_MAX_ITEMS) {
    return badRequest(`items exceeds the ${BULK_MAX_ITEMS}-per-request limit — split into multiple requests of ${BULK_MAX_ITEMS} or fewer`);
  }

  const columns = await getInfluencerColumns(env.DB);
  const now = nowIso();

  type Resolved = { index: number; id: string; sets: string[]; values: unknown[] } | { index: number; error: string };
  const resolved: Resolved[] = items.map((item, index) => {
    let id = item.id;
    if (!id) {
      if (!item.username) return { index, error: 'each item needs either "id" or "username" (+ optional "platform")' };
      id = slugifyInfluencerId(item.username, item.platform ?? 'Instagram');
    }
    const { username: _u, platform: _p, id: _id, ...fields } = item;
    const { sets, values } = buildInfluencerAssignments(fields as InfluencerBody, columns);
    if (sets.length === 0) return { index, error: 'no updatable fields provided' };
    sets.push('updated_at = ?');
    values.push(now);
    values.push(id);
    return { index, id, sets, values };
  });

  const runnable = resolved.filter((r): r is Extract<Resolved, { id: string }> => 'id' in r);

  const orgClause = auth.role === 'admin' ? '' : ' AND organization_id = ?';
  const statements = runnable.map((r) =>
    auth.role === 'admin'
      ? env.DB.prepare(`UPDATE influencers SET ${r.sets.join(', ')} WHERE id = ?`).bind(...r.values)
      : env.DB.prepare(`UPDATE influencers SET ${r.sets.join(', ')} WHERE id = ?${orgClause}`).bind(...r.values, auth.organizationId)
  );

  const batchResults = statements.length > 0 ? await env.DB.batch(statements) : [];

  const results: Array<{ index: number; id?: string; success: boolean; error?: string }> = [];
  let runnableIdx = 0;
  for (const r of resolved) {
    if ('error' in r) {
      results.push({ index: r.index, success: false, error: r.error });
      continue;
    }
    const dbResult = batchResults[runnableIdx++];
    const changed = (dbResult?.meta?.changes ?? 0) > 0;
    results.push({
      index: r.index,
      id: r.id,
      success: changed,
      error: changed ? undefined : 'not found (wrong id/username+platform, or belongs to a different organization)',
    });
  }

  const updated = results.filter((r) => r.success).length;
  return json({
    total: items.length,
    updated,
    failed: items.length - updated,
    results,
  });
}

export async function remove(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const checkQuery = auth.role === 'admin'
    ? 'SELECT id FROM influencers WHERE id = ?'
    : 'SELECT id FROM influencers WHERE id = ? AND organization_id = ?';
  const checkStmt = auth.role === 'admin'
    ? env.DB.prepare(checkQuery).bind(id)
    : env.DB.prepare(checkQuery).bind(id, auth.organizationId);
  const existing = await checkStmt.first();
  if (!existing) return notFound();

  // Explicitly clear out all child tables for this influencer
  await env.DB.prepare('DELETE FROM influencer_snapshots WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM influencer_notes WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM influencer_tags WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM campaign_influencers WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM analytics_records WHERE influencer_id = ?').bind(id).run();

  const query = auth.role === 'admin'
    ? 'DELETE FROM influencers WHERE id = ?'
    : 'DELETE FROM influencers WHERE id = ? AND organization_id = ?';
  const stmt = auth.role === 'admin'
    ? env.DB.prepare(query).bind(id)
    : env.DB.prepare(query).bind(id, auth.organizationId);
  await stmt.run();

  return json({ success: true });
}

// GET /api/influencers/:id/full — everything the creator profile page needs
// (influencer, tags, notes, snapshots, campaign history) in a single D1
// batch() round trip instead of 5 separate requests each paying their own
// ~300ms D1 connection overhead.
export async function getFull(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const isAdmin = auth.role === 'admin';

  const influencerStmt = isAdmin
    ? env.DB.prepare('SELECT * FROM influencers WHERE id = ?').bind(id)
    : env.DB.prepare('SELECT * FROM influencers WHERE id = ? AND organization_id = ?').bind(id, auth.organizationId);

  const tagsStmt = env.DB.prepare(
    `SELECT t.id, t.name FROM influencer_tags it JOIN tags t ON t.id = it.tag_id WHERE it.influencer_id = ? ORDER BY t.name`
  ).bind(id);

  const notesStmt = env.DB.prepare(
    'SELECT * FROM influencer_notes WHERE influencer_id = ? ORDER BY created_at DESC'
  ).bind(id);

  const snapshotsStmt = env.DB.prepare(
    'SELECT * FROM influencer_snapshots WHERE influencer_id = ? ORDER BY date ASC'
  ).bind(id);

  const campaignsSql = isAdmin
    ? `SELECT c.id, c.name, c.status, c.start_date, c.end_date, c.budget, cl.name AS client_name, ci.added_at
       FROM campaign_influencers ci
       JOIN campaigns c ON c.id = ci.campaign_id
       JOIN clients cl ON cl.id = c.client_id
       WHERE ci.influencer_id = ?
       ORDER BY c.start_date DESC`
    : `SELECT c.id, c.name, c.status, c.start_date, c.end_date, c.budget, cl.name AS client_name, ci.added_at
       FROM campaign_influencers ci
       JOIN campaigns c ON c.id = ci.campaign_id
       JOIN clients cl ON cl.id = c.client_id
       WHERE ci.influencer_id = ? AND cl.organization_id = ?
       ORDER BY c.start_date DESC`;
  const campaignsStmt = isAdmin
    ? env.DB.prepare(campaignsSql).bind(id)
    : env.DB.prepare(campaignsSql).bind(id, auth.organizationId);

  const [influencerRes, tagsRes, notesRes, snapshotsRes, campaignsRes] = await env.DB.batch([
    influencerStmt,
    tagsStmt,
    notesStmt,
    snapshotsStmt,
    campaignsStmt,
  ]);

  const influencerRow = influencerRes.results[0];
  if (!influencerRow) return notFound();

  return json({
    influencer: toApi(influencerRow as Record<string, unknown>),
    tags: tagsRes.results,
    notes: notesRes.results.map((r: any) => ({ id: r.id, body: r.body, authorId: r.author_id, createdAt: r.created_at })),
    snapshots: snapshotsRes.results.map((r: any) => ({
      id: r.id,
      date: r.date,
      followers: r.followers,
      averageViews: r.average_views,
      averageLikes: r.average_likes,
      averageComments: r.average_comments,
      engagementRate: r.engagement_rate,
    })),
    campaignHistory: campaignsRes.results.map((r: any) => ({
      campaignId: r.id,
      name: r.name,
      clientName: r.client_name,
      status: r.status,
      startDate: r.start_date,
      endDate: r.end_date,
      budget: r.budget,
      addedAt: r.added_at,
    })),
  });
}

// GET /api/influencers/:id/campaigns — campaign history for a creator's profile page
export async function getCampaigns(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const influencer = await getInfluencerById(env, auth, id);
  if (!influencer) return notFound();

  const sql = auth.role === 'admin'
    ? `SELECT c.id, c.name, c.status, c.start_date, c.end_date, c.budget, cl.name AS client_name, ci.added_at
       FROM campaign_influencers ci
       JOIN campaigns c ON c.id = ci.campaign_id
       JOIN clients cl ON cl.id = c.client_id
       WHERE ci.influencer_id = ?
       ORDER BY c.start_date DESC`
    : `SELECT c.id, c.name, c.status, c.start_date, c.end_date, c.budget, cl.name AS client_name, ci.added_at
       FROM campaign_influencers ci
       JOIN campaigns c ON c.id = ci.campaign_id
       JOIN clients cl ON cl.id = c.client_id
       WHERE ci.influencer_id = ? AND cl.organization_id = ?
       ORDER BY c.start_date DESC`;
  const campaignStmt = auth.role === 'admin'
    ? env.DB.prepare(sql).bind(id)
    : env.DB.prepare(sql).bind(id, auth.organizationId);
  const { results } = await campaignStmt.all();

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
  const influencer = await getInfluencerById(env, auth, id);
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
  const influencer = await getInfluencerById(env, auth, id);
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
  const influencer = await getInfluencerById(env, auth, id);
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
  const influencer = await getInfluencerById(env, auth, id);
  if (!influencer) return notFound();

  const result = await env.DB.prepare('DELETE FROM influencer_notes WHERE id = ? AND influencer_id = ?')
    .bind(noteId, id)
    .run();
  if (!result.meta.changes) return notFound();
  return json({ success: true });
}

// GET /api/influencers/:id/tags
export async function listInfluencerTags(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  const influencer = await getInfluencerById(env, auth, id);
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
  const influencer = await getInfluencerById(env, auth, id);
  if (!influencer) return notFound();

  const body = await readJson<{ name?: string }>(request);
  const name = body.name?.trim();
  if (!name) return badRequest('name is required');

  const orgId = influencer.organization_id;

  let tag = await env.DB.prepare('SELECT id, name FROM tags WHERE organization_id = ? AND name = ?')
    .bind(orgId, name)
    .first<{ id: string; name: string }>();

  if (!tag) {
    const tagId = generateId('tag');
    await env.DB.prepare('INSERT INTO tags (id, organization_id, name, created_at) VALUES (?, ?, ?, ?)')
      .bind(tagId, orgId, name, nowIso())
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
  const influencer = await getInfluencerById(env, auth, id);
  if (!influencer) return notFound();

  await env.DB.prepare('DELETE FROM influencer_tags WHERE influencer_id = ? AND tag_id = ?').bind(id, tagId).run();
  return json({ success: true });
}
