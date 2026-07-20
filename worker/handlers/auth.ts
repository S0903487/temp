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

async function seedAdminIfMissing(db: D1Database) {
  if (adminSeeded) return;
  const adminEmail = 'sarmad@influenceos.com';
  try {
    // Batch 1: Check admin + org in a single round-trip
    const checks = await db.batch([
      db.prepare('SELECT id FROM users WHERE email = ?').bind(adminEmail),
      db.prepare('SELECT id FROM organizations WHERE id = ?').bind('org_admin'),
    ]);

    const adminExists = checks[0].results[0];
    const orgExists = checks[1].results[0];

    if (!adminExists) {
      const now = nowIso();
      const orgId = 'org_admin';
      const userId = 'usr_admin';
      const { hash, salt } = await hashPassword('KUJD9i898d()DJ(*SAD(AW*JD9a8ws*&%(&%du03ewij09)(D))');

      // Batch 2: Insert org + admin user in a single round-trip
      const inserts: D1PreparedStatement[] = [];
      if (!orgExists) {
        inserts.push(
          db.prepare('INSERT INTO organizations (id, name, description, created_at) VALUES (?, ?, ?, ?)')
            .bind(orgId, 'InfluenceOS Org', 'Admin Workspace', now)
        );
      }
      inserts.push(
        db.prepare(
          `INSERT INTO users (id, organization_id, name, email, password_hash, password_salt, role, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)`
        )
          .bind(userId, orgId, 'Sarmad Hussain', adminEmail, hash, salt, now)
      );
      await db.batch(inserts);
    }

    // Batch 3: Find brand users missing client profiles (single query, no iteration)
    const { results: brandUsersMissing } = await db.prepare(
      `SELECT u.id, u.organization_id, u.name, u.email, u.created_at, o.name as org_name
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       LEFT JOIN clients c ON c.id = u.id
       WHERE u.role = 'brand' AND c.id IS NULL`
    ).all();

    if (brandUsersMissing && brandUsersMissing.length > 0) {
      const brandInserts = brandUsersMissing.map((user) =>
        db.prepare(
          `INSERT INTO clients (id, organization_id, name, contact_email, status, created_at)
           VALUES (?, ?, ?, ?, 'active', ?)`
        ).bind(user.id, user.organization_id, user.org_name || `${user.name}'s Company`, user.email, user.created_at || nowIso())
      );
      await db.batch(brandInserts);
    }

    // Batch 4: Find influencer users missing influencer profiles (single query, no iteration)
    const { results: influencerUsersMissing } = await db.prepare(
      `SELECT u.id, u.organization_id, u.name, u.email, u.created_at
       FROM users u
       LEFT JOIN influencers i ON i.id = u.id
       WHERE u.role = 'influencer' AND i.id IS NULL`
    ).all();

    if (influencerUsersMissing && influencerUsersMissing.length > 0) {
      const infInserts = influencerUsersMissing.map((user) =>
        db.prepare(
          `INSERT INTO influencers (
            id, organization_id, full_name, email, platform, status, pipeline_status,
            followers, engagement_rate, average_views, average_likes, average_comments, created_at
          ) VALUES (?, ?, ?, ?, 'Instagram', 'Active', 'New', 0, 0, 0, 0, 0, ?)`
        ).bind(user.id, user.organization_id, user.name, user.email, user.created_at || nowIso())
      );
      await db.batch(infInserts);
    }

    adminSeeded = true;
  } catch (err) {
    console.error('Error seeding admin or backfilling profiles:', err);
    // Don't set adminSeeded=true on error so it can retry next time
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
  try {
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

    // Batch: insert org + user + profile in a single round-trip
    const inserts: D1PreparedStatement[] = [
      env.DB.prepare('INSERT INTO organizations (id, name, description, created_at) VALUES (?, ?, ?, ?)')
        .bind(orgId, body.organizationName ?? `${body.name}'s Organization`, null, now),
      env.DB.prepare(
        `INSERT INTO users (id, organization_id, name, email, password_hash, password_salt, role, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(userId, orgId, body.name, body.email, hash, salt, selectedRole, now),
    ];

    if (selectedRole === 'influencer') {
      inserts.push(
        env.DB.prepare(
          `INSERT INTO influencers (
            id, organization_id, full_name, email, platform, status, pipeline_status,
            followers, engagement_rate, average_views, average_likes, average_comments, created_at
          ) VALUES (?, ?, ?, ?, 'Instagram', 'Active', 'New', 0, 0, 0, 0, 0, ?)`
        )
          .bind(userId, orgId, body.name, body.email, now)
      );
    }

    if (selectedRole === 'brand') {
      inserts.push(
        env.DB.prepare(
          `INSERT INTO clients (id, organization_id, name, contact_email, status, created_at)
           VALUES (?, ?, ?, ?, 'active', ?)`
        )
          .bind(userId, orgId, body.organizationName ?? `${body.name}'s Company`, body.email, now)
      );
    }

    await env.DB.batch(inserts);

    const token = await createSession(env.DB, userId);

    return json(
      {
        user: { id: userId, organizationId: orgId, name: body.name, email: body.email, role: selectedRole, isFrozen: false, createdAt: now },
        token,
      },
      201
    );
  } catch (err) {
    console.error('Register error:', err);
    return errorResponse('Registration failed', 500);
  }
}

export async function login(request: Request, env: Env): Promise<Response> {
  try {
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
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('Login failed', 500);
  }
}

export async function logout(request: Request, env: Env): Promise<Response> {
  try {
    const token = extractToken(request);
    if (token) {
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      sessionCache.delete(token);
    }
    return json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return json({ success: true });
  }
}

export async function me(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticate(request, env);
    if (!auth) return unauthorized();

    if (auth.user) {
      return json(publicUser(auth.user));
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(auth.userId).first();
    if (!user) return unauthorized();

    return json(publicUser(user));
  } catch (err) {
    console.error('Me error:', err);
    return errorResponse('Internal server error', 500);
  }
}

export async function forgotPassword(request: Request): Promise<Response> {
  await readJson(request).catch(() => undefined);
  return json({ success: true });
}

// ============ Shared auth middleware ============

function extractToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

const MAX_CACHE_SIZE = 500;
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

  try {
    const session = await env.DB.prepare(
      `SELECT s.user_id as user_id, s.expires_at as expires_at, u.organization_id as organization_id,
              u.role as role, u.is_frozen as is_frozen, u.name as user_name, u.email as user_email,
              u.created_at as user_created_at
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

    // Evict oldest entries if cache is full
    if (sessionCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = sessionCache.keys().next().value;
      if (oldestKey) sessionCache.delete(oldestKey);
    }
    sessionCache.set(token, { session: authed, cachedAt: now });
    return authed;
  } catch (err) {
    console.error('Authenticate error:', err);
    return null;
  }
}
