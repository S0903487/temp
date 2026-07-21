import type { AuthedRequest, Env } from '../types';
import {
  badRequest,
  errorResponse,
  generateId,
  generateToken,
  hashPassword,
  json,
  nowIso,
  readJson,
  SESSION_TTL_MS,
  unauthorized,
  verifyPassword,
} from '../utils';

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
  role?: string;
}

let adminSeeded = false;

async function seedAdminIfMissing(db: any) {
  if (adminSeeded) return;
  const adminEmail = 'sarmad@influenceos.com';
  try {
    const existingAdmin = await db.prepare('SELECT id FROM users WHERE email = ?').bind(adminEmail).first();
    if (!existingAdmin) {
      const now = nowIso();
      const orgId = 'org_admin';
      const userId = 'usr_admin';
      const { hash, salt } = await hashPassword('KUJD9i898d()DJ(*SAD(AW*JD9a8ws*&%(&%du03ewij09)(D))');
      
      const org = await db.prepare('SELECT id FROM organizations WHERE id = ?').bind(orgId).first();
      if (!org) {
        await db.prepare('INSERT INTO organizations (id, name, description, created_at) VALUES (?, ?, ?, ?)')
          .bind(orgId, 'InfluenceOS Org', 'Admin Workspace', now)
          .run();
      }
      
      await db.prepare(
        `INSERT INTO users (id, organization_id, name, email, password_hash, password_salt, role, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)`
      )
        .bind(userId, orgId, 'Sarmad Hussain', adminEmail, hash, salt, now)
        .run();
    }

    // Backfill any brand user accounts without a client profile so they are
    // listed. This used to be an N+1 loop (one SELECT + one INSERT per user,
    // every time a fresh Worker isolate handled a login/register). With
    // enough users that could exceed the per-request subrequest limit and
    // crash the Worker outright. It's now a single bulk INSERT...SELECT.
    const now = nowIso();
    await db.prepare(
      `INSERT INTO clients (id, organization_id, name, contact_email, status, created_at)
       SELECT u.id, u.organization_id, COALESCE(o.name, u.name || '''s Company'), u.email, 'active', COALESCE(u.created_at, ?)
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE u.role = 'brand'
         AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = u.id)`
    )
      .bind(now)
      .run();

    // Backfill any influencer user accounts without an influencer profile —
    // same bulk approach instead of a per-user SELECT+INSERT loop.
    await db.prepare(
      `INSERT INTO influencers (
        id, organization_id, full_name, email, platform, status, pipeline_status, followers, engagement_rate, average_views, average_likes, average_comments, created_at
      )
      SELECT u.id, u.organization_id, u.name, u.email, 'Instagram', 'Active', 'New', 0, 0, 0, 0, 0, COALESCE(u.created_at, ?)
      FROM users u
      WHERE u.role = 'influencer'
        AND NOT EXISTS (SELECT 1 FROM influencers i WHERE i.id = u.id)`
    )
      .bind(now)
      .run();

    adminSeeded = true;
  } catch (err) {
    console.error('Error seeding admin or backfilling profiles:', err);
  }
}

interface LoginBody {
  email: string;
  password: string;
}

function publicUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    role: row.role,
    isFrozen: Boolean(row.is_frozen),
    createdAt: row.created_at,
  };
}

async function createSession(db: D1Database, userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db
    .prepare('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(token, userId, expiresAt, nowIso())
    .run();
  return token;
}

export async function register(request: Request, env: Env): Promise<Response> {
  await seedAdminIfMissing(env.DB);
  const body = await readJson<RegisterBody>(request);
  if (!body.email || !body.password || !body.name) {
    return badRequest('name, email, and password are required');
  }
  if (body.password.length < 8) {
    return badRequest('Password must be at least 8 characters');
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(body.email).first();
  if (existing) {
    return errorResponse('Email already registered', 409);
  }

  const now = nowIso();
  const orgId = generateId('org');
  const userId = generateId('usr');
  const { hash, salt } = await hashPassword(body.password);
  const selectedRole = (body.role === 'brand') ? 'brand' : 'influencer';

  await env.DB.prepare('INSERT INTO organizations (id, name, description, created_at) VALUES (?, ?, ?, ?)')
    .bind(orgId, body.organizationName ?? `${body.name}'s Organization`, null, now)
    .run();

  await env.DB.prepare(
    `INSERT INTO users (id, organization_id, name, email, password_hash, password_salt, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(userId, orgId, body.name, body.email, hash, salt, selectedRole, now)
    .run();

  if (selectedRole === 'influencer') {
    await env.DB.prepare(
      `INSERT INTO influencers (
        id, organization_id, full_name, email, platform, status, pipeline_status, followers, engagement_rate, average_views, average_likes, average_comments, created_at
      ) VALUES (?, ?, ?, ?, 'Instagram', 'Active', 'New', 0, 0, 0, 0, 0, ?)`
    )
      .bind(userId, orgId, body.name, body.email, now)
      .run();
  }

  if (selectedRole === 'brand') {
    await env.DB.prepare(
      `INSERT INTO clients (id, organization_id, name, contact_email, status, created_at)
       VALUES (?, ?, ?, ?, 'active', ?)`
    )
      .bind(userId, orgId, body.organizationName ?? `${body.name}'s Company`, body.email, now)
      .run();
  }

  const token = await createSession(env.DB, userId);

  return json(
    {
      user: { id: userId, organizationId: orgId, name: body.name, email: body.email, role: selectedRole, isFrozen: false, createdAt: now },
      token,
    },
    201
  );
}

export async function login(request: Request, env: Env): Promise<Response> {
  await seedAdminIfMissing(env.DB);
  const body = await readJson<LoginBody>(request);
  if (!body.email || !body.password) {
    return badRequest('email and password are required');
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(body.email).first();
  if (!user) {
    return errorResponse('Invalid email or password', 401);
  }

  const valid = await verifyPassword(body.password, user.password_hash as string, user.password_salt as string);
  if (!valid) {
    return errorResponse('Invalid email or password', 401);
  }

  const token = await createSession(env.DB, user.id as string);
  return json({ user: publicUser(user), token });
}

export async function logout(request: Request, env: Env): Promise<Response> {
  const token = extractToken(request);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    sessionCache.delete(token);
  }
  return json({ success: true });
}

export async function me(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth) return unauthorized();

  if (auth.user) {
    return json(publicUser(auth.user));
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(auth.userId).first();
  if (!user) return unauthorized();

  return json(publicUser(user));
}

export async function forgotPassword(request: Request): Promise<Response> {
  // No outbound email integration configured yet; acknowledge without revealing
  // whether the address exists.
  await readJson(request).catch(() => undefined);
  return json({ success: true });
}

// ============ Shared auth middleware ============

function extractToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

const sessionCache = new Map<string, { session: AuthedRequest; cachedAt: number }>();
const SESSION_CACHE_TTL_MS = 15000;

export async function authenticate(request: Request, env: Env): Promise<AuthedRequest | null> {
  const token = extractToken(request);
  if (!token) return null;

  const now = Date.now();
  const cached = sessionCache.get(token);
  if (cached && (now - cached.cachedAt) < SESSION_CACHE_TTL_MS) {
    return cached.session;
  }

  const session = await env.DB.prepare(
    `SELECT s.user_id as user_id, s.expires_at as expires_at, u.organization_id as organization_id, u.role as role, u.is_frozen as is_frozen,
            u.name as user_name, u.email as user_email, u.created_at as user_created_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`
  )
    .bind(token)
    .first();

  if (!session) return null;
  if (new Date(session.expires_at as string).getTime() < now) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    sessionCache.delete(token);
    return null;
  }

  const authed: AuthedRequest = {
    userId: session.user_id as string,
    organizationId: session.organization_id as string,
    role: session.role as string,
    isFrozen: Boolean(session.is_frozen),
    user: {
      id: session.user_id as string,
      organization_id: session.organization_id as string,
      name: session.user_name as string,
      email: session.user_email as string,
      role: session.role as string,
      is_frozen: session.is_frozen,
      created_at: session.user_created_at as string,
    }
  };

  sessionCache.set(token, { session: authed, cachedAt: now });
  return authed;
}
