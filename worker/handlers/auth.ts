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

  await env.DB.prepare('INSERT INTO organizations (id, name, description, created_at) VALUES (?, ?, ?, ?)')
    .bind(orgId, body.organizationName ?? `${body.name}'s Organization`, null, now)
    .run();

  await env.DB.prepare(
    `INSERT INTO users (id, organization_id, name, email, password_hash, password_salt, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)`
  )
    .bind(userId, orgId, body.name, body.email, hash, salt, now)
    .run();

  const token = await createSession(env.DB, userId);

  return json(
    {
      user: { id: userId, organizationId: orgId, name: body.name, email: body.email, role: 'admin', createdAt: now },
      token,
    },
    201
  );
}

export async function login(request: Request, env: Env): Promise<Response> {
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
  }
  return json({ success: true });
}

export async function me(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (!auth) return unauthorized();

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

export async function authenticate(request: Request, env: Env): Promise<AuthedRequest | null> {
  const token = extractToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(
    `SELECT s.user_id as user_id, s.expires_at as expires_at, u.organization_id as organization_id, u.role as role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`
  )
    .bind(token)
    .first();

  if (!session) return null;
  if (new Date(session.expires_at as string).getTime() < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }

  return {
    userId: session.user_id as string,
    organizationId: session.organization_id as string,
    role: session.role as string,
  };
}
