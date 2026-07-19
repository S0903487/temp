import type { Env } from './types';
import { errorResponse, HttpError, notFound, unauthorized } from './utils';
import * as authHandlers from './handlers/auth';
import * as organizationHandlers from './handlers/organizations';
import * as clientHandlers from './handlers/clients';
import * as campaignHandlers from './handlers/campaigns';
import * as influencerHandlers from './handlers/influencers';
import * as analyticsHandlers from './handlers/analytics';
import * as tagHandlers from './handlers/tags';
import * as uploadHandlers from './handlers/uploads';
import * as userHandlers from './handlers/users';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      // Not an API route — let the static assets binding serve the SPA
      // (falls back to index.html for client-side routes).
      return env.ASSETS.fetch(request);
    }

    try {
      return await routeApi(request, env, url);
    } catch (err) {
      if (err instanceof HttpError) {
        return errorResponse(err.message, err.status);
      }
      console.error(err);
      return errorResponse('Internal server error', 500);
    }
  },
};

let schemaChecked = false;

async function ensureSchemaUpToDate(db: any) {
  if (schemaChecked) return;

  try {
    // 1. Create tables if they do not exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS organizations (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        description   TEXT,
        currency      TEXT NOT NULL DEFAULT 'USD',
        profile_image TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id              TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name            TEXT NOT NULL,
        email           TEXT NOT NULL UNIQUE,
        password_hash   TEXT NOT NULL,
        password_salt   TEXT NOT NULL,
        role            TEXT NOT NULL DEFAULT 'admin',
        is_frozen       INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT NOT NULL,
        updated_at      TEXT
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS sessions (
        token      TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS clients (
        id              TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name            TEXT NOT NULL,
        contact_email   TEXT,
        industry        TEXT,
        status          TEXT NOT NULL DEFAULT 'prospect',
        created_at      TEXT NOT NULL,
        updated_at      TEXT
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id          TEXT PRIMARY KEY,
        client_id   TEXT NOT NULL,
        name        TEXT NOT NULL,
        description TEXT,
        start_date  TEXT,
        end_date    TEXT,
        budget      REAL,
        status      TEXT NOT NULL DEFAULT 'draft',
        created_at  TEXT NOT NULL,
        updated_at  TEXT
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS influencers (
        id               TEXT PRIMARY KEY,
        organization_id  TEXT NOT NULL,
        full_name        TEXT NOT NULL,
        username         TEXT,
        platform         TEXT NOT NULL DEFAULT 'Instagram',
        category         TEXT,
        country          TEXT,
        language         TEXT,
        followers        INTEGER NOT NULL DEFAULT 0,
        following        INTEGER NOT NULL DEFAULT 0,
        total_posts      INTEGER NOT NULL DEFAULT 0,
        first_joined_date TEXT,
        engagement_rate  REAL NOT NULL DEFAULT 0,
        average_views    INTEGER NOT NULL DEFAULT 0,
        average_likes    INTEGER NOT NULL DEFAULT 0,
        average_comments INTEGER NOT NULL DEFAULT 0,
        email            TEXT,
        phone            TEXT,
        price_post       REAL,
        price_story      REAL,
        verified         INTEGER NOT NULL DEFAULT 0,
        brand_safe       INTEGER NOT NULL DEFAULT 1,
        status           TEXT NOT NULL DEFAULT 'Active',
        pipeline_status  TEXT NOT NULL DEFAULT 'New',
        notes            TEXT,
        tags             TEXT,
        bio              TEXT,
        profile_image    TEXT,
        profile_link     TEXT,
        roi              REAL,
        cpa              REAL,
        cpi              REAL,
        ltv              REAL,
        created_at       TEXT NOT NULL,
        updated_at       TEXT
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS tags (
        id              TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name            TEXT NOT NULL,
        created_at      TEXT NOT NULL,
        UNIQUE (organization_id, name)
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS influencer_tags (
        influencer_id TEXT NOT NULL,
        tag_id        TEXT NOT NULL,
        added_at      TEXT NOT NULL,
        PRIMARY KEY (influencer_id, tag_id)
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS influencer_notes (
        id            TEXT PRIMARY KEY,
        influencer_id TEXT NOT NULL,
        author_id     TEXT,
        body          TEXT NOT NULL,
        created_at    TEXT NOT NULL
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS influencer_snapshots (
        id                TEXT PRIMARY KEY,
        influencer_id     TEXT NOT NULL,
        date              TEXT NOT NULL,
        followers         INTEGER NOT NULL DEFAULT 0,
        average_views     INTEGER NOT NULL DEFAULT 0,
        average_likes     INTEGER NOT NULL DEFAULT 0,
        average_comments  INTEGER NOT NULL DEFAULT 0,
        engagement_rate   REAL NOT NULL DEFAULT 0,
        created_at        TEXT NOT NULL
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS campaign_influencers (
        campaign_id   TEXT NOT NULL,
        influencer_id TEXT NOT NULL,
        added_at      TEXT NOT NULL,
        PRIMARY KEY (campaign_id, influencer_id)
      )
    `).run().catch(() => undefined);

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS analytics_records (
        id            TEXT PRIMARY KEY,
        influencer_id TEXT NOT NULL,
        campaign_id   TEXT,
        date          TEXT NOT NULL,
        impressions   INTEGER,
        clicks        INTEGER,
        conversions   INTEGER,
        revenue       REAL,
        metadata      TEXT,
        created_at    TEXT NOT NULL
      )
    `).run().catch(() => undefined);

    // 2. Query table_info for tables to dynamically add columns if missing
    // 2.1 Organizations table
    const orgInfo = await db.prepare("PRAGMA table_info(organizations)").all();
    const orgCols = (orgInfo?.results || []).map((c: any) => c.name);
    if (orgCols.length > 0) {
      if (!orgCols.includes('currency')) {
        await db.prepare("ALTER TABLE organizations ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'").run().catch(() => undefined);
      }
      if (!orgCols.includes('profile_image')) {
        await db.prepare("ALTER TABLE organizations ADD COLUMN profile_image TEXT").run().catch(() => undefined);
      }
    }

    // 2.2 Users table
    const userInfo = await db.prepare("PRAGMA table_info(users)").all();
    const userCols = (userInfo?.results || []).map((c: any) => c.name);
    if (userCols.length > 0) {
      if (!userCols.includes('is_frozen')) {
        await db.prepare("ALTER TABLE users ADD COLUMN is_frozen INTEGER NOT NULL DEFAULT 0").run().catch(() => undefined);
      }
    }

    // 2.3 Influencers table
    const infInfo = await db.prepare("PRAGMA table_info(influencers)").all();
    const infCols = (infInfo?.results || []).map((c: any) => c.name);
    if (infCols.length > 0) {
      if (!infCols.includes('language')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN language TEXT").run().catch(() => undefined);
      }
      if (!infCols.includes('average_views')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN average_views INTEGER NOT NULL DEFAULT 0").run().catch(() => undefined);
      }
      if (!infCols.includes('average_likes')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN average_likes INTEGER NOT NULL DEFAULT 0").run().catch(() => undefined);
      }
      if (!infCols.includes('average_comments')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN average_comments INTEGER NOT NULL DEFAULT 0").run().catch(() => undefined);
      }
      if (!infCols.includes('pipeline_status')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN pipeline_status TEXT NOT NULL DEFAULT 'New'").run().catch(() => undefined);
      }
      if (!infCols.includes('profile_link')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN profile_link TEXT").run().catch(() => undefined);
      }
      if (!infCols.includes('roi')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN roi REAL").run().catch(() => undefined);
      }
      if (!infCols.includes('cpa')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN cpa REAL").run().catch(() => undefined);
      }
      if (!infCols.includes('cpi')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN cpi REAL").run().catch(() => undefined);
      }
      if (!infCols.includes('ltv')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN ltv REAL").run().catch(() => undefined);
      }
      if (!infCols.includes('following')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN following INTEGER NOT NULL DEFAULT 0").run().catch(() => undefined);
      }
      if (!infCols.includes('total_posts')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN total_posts INTEGER NOT NULL DEFAULT 0").run().catch(() => undefined);
      }
      if (!infCols.includes('first_joined_date')) {
        await db.prepare("ALTER TABLE influencers ADD COLUMN first_joined_date TEXT").run().catch(() => undefined);
      }
    }

    schemaChecked = true;
    console.log('Runtime schema healing checked and applied successfully.');
  } catch (e) {
    console.error('Failed to run dynamic schema healing:', e);
  }
}

async function routeApi(request: Request, env: Env, url: URL): Promise<Response> {
  await ensureSchemaUpToDate(env.DB);
  const parts = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
  const [resource, id, sub, subId] = parts;
  const method = request.method;

  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ---- Public auth routes ----
  if (resource === 'auth') {
    if (id === 'register' && method === 'POST') return authHandlers.register(request, env);
    if (id === 'login' && method === 'POST') return authHandlers.login(request, env);
    if (id === 'logout' && method === 'POST') return authHandlers.logout(request, env);
    if (id === 'me' && method === 'GET') return authHandlers.me(request, env);
    if (id === 'forgot-password' && method === 'POST') return authHandlers.forgotPassword(request);
    return notFound();
  }

  // ---- Everything below requires a valid session ----
  const auth = await authHandlers.authenticate(request, env);
  if (!auth) return unauthorized();

  // Block updates if account is frozen
  if (auth.isFrozen && method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Account is frozen. You cannot update any information.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (resource === 'users') {
    if (auth.role !== 'admin') return unauthorized();
    if (!id && method === 'GET') return userHandlers.list(request, env, auth);
    if (id && (method === 'PUT' || method === 'PATCH')) return userHandlers.update(request, env, auth, id);
    if (id && method === 'DELETE') return userHandlers.remove(request, env, auth, id);
    return notFound();
  }

  if (resource === 'organizations' && (id === 'current' || !id)) {
    if (method === 'GET') return organizationHandlers.getCurrent(request, env, auth);
    if (method === 'PUT' || method === 'PATCH') return organizationHandlers.updateCurrent(request, env, auth);
    return notFound();
  }

  if (resource === 'clients') {
    if (!id && method === 'GET') return clientHandlers.list(request, env, auth);
    if (!id && method === 'POST') return clientHandlers.create(request, env, auth);
    if (id && method === 'GET') return clientHandlers.getById(request, env, auth, id);
    if (id && (method === 'PUT' || method === 'PATCH')) return clientHandlers.update(request, env, auth, id);
    if (id && method === 'DELETE') return clientHandlers.remove(request, env, auth, id);
    return notFound();
  }

  if (resource === 'campaigns') {
    if (!id && method === 'GET') return campaignHandlers.list(request, env, auth);
    if (!id && method === 'POST') return campaignHandlers.create(request, env, auth);
    if (id && !sub && method === 'GET') return campaignHandlers.getById(request, env, auth, id);
    if (id && !sub && (method === 'PUT' || method === 'PATCH')) return campaignHandlers.update(request, env, auth, id);
    if (id && !sub && method === 'DELETE') return campaignHandlers.remove(request, env, auth, id);
    if (id && sub === 'influencers' && !subId && method === 'POST')
      return campaignHandlers.linkInfluencer(request, env, auth, id);
    if (id && sub === 'influencers' && subId && method === 'DELETE')
      return campaignHandlers.unlinkInfluencer(request, env, auth, id, subId);
    return notFound();
  }

  if (resource === 'influencers') {
    if (!id && method === 'GET') return influencerHandlers.list(request, env, auth);
    if (!id && method === 'POST') return influencerHandlers.create(request, env, auth);
    if (id && !sub && method === 'GET') return influencerHandlers.getById(request, env, auth, id);
    if (id && !sub && (method === 'PUT' || method === 'PATCH')) return influencerHandlers.update(request, env, auth, id);
    if (id && !sub && method === 'DELETE') return influencerHandlers.remove(request, env, auth, id);

    if (id && sub === 'campaigns' && !subId && method === 'GET')
      return influencerHandlers.getCampaigns(request, env, auth, id);

    if (id && sub === 'snapshots' && !subId && method === 'GET')
      return influencerHandlers.listSnapshots(request, env, auth, id);

    if (id && sub === 'notes' && !subId && method === 'GET') return influencerHandlers.listNotes(request, env, auth, id);
    if (id && sub === 'notes' && !subId && method === 'POST') return influencerHandlers.addNote(request, env, auth, id);
    if (id && sub === 'notes' && subId && method === 'DELETE')
      return influencerHandlers.removeNote(request, env, auth, id, subId);

    if (id && sub === 'tags' && !subId && method === 'GET')
      return influencerHandlers.listInfluencerTags(request, env, auth, id);
    if (id && sub === 'tags' && !subId && method === 'POST')
      return influencerHandlers.addInfluencerTag(request, env, auth, id);
    if (id && sub === 'tags' && subId && method === 'DELETE')
      return influencerHandlers.removeInfluencerTag(request, env, auth, id, subId);

    return notFound();
  }

  if (resource === 'images' && id === 'fetch-url' && method === 'POST') {
    return uploadHandlers.fetchUrl(request, env, auth);
  }

  if (resource === 'tags' && !id && method === 'GET') return tagHandlers.list(request, env, auth);

  if (resource === 'analytics') {
    if (!id && method === 'GET') return analyticsHandlers.list(request, env, auth);
    if (!id && method === 'POST') return analyticsHandlers.create(request, env, auth);
    if (id && method === 'GET') return analyticsHandlers.getById(request, env, auth, id);
    if (id && (method === 'PUT' || method === 'PATCH')) return analyticsHandlers.update(request, env, auth, id);
    if (id && method === 'DELETE') return analyticsHandlers.remove(request, env, auth, id);
    return notFound();
  }

  return notFound();
}
