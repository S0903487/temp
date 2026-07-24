import type { AuthedRequest, Env } from '../types';
import { badRequest, json, notFound, readJson, unauthorized } from '../utils';

export async function list(_request: Request, env: Env, _auth: AuthedRequest): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.organization_id, u.name, u.email, u.role, u.is_frozen, u.created_at, o.name as organization_name
     FROM users u
     LEFT JOIN organizations o ON o.id = u.organization_id
     ORDER BY u.created_at DESC`
  ).all();

  return json(
    results.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      organizationName: row.organization_name,
      name: row.name,
      email: row.email,
      role: row.role,
      isFrozen: Boolean(row.is_frozen),
      createdAt: row.created_at,
    }))
  );
}

export async function update(request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (auth.role !== 'admin') return unauthorized();

  const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
  if (!existing) return notFound();

  const body = await readJson<{ name?: string; email?: string; role?: string; isFrozen?: boolean }>(request);

  const name = body.name?.trim();
  const email = body.email?.trim();
  const role = body.role?.trim();
  const isFrozen = typeof body.isFrozen === 'boolean' ? (body.isFrozen ? 1 : 0) : undefined;

  if (email) {
    const dupe = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?').bind(email, id).first();
    if (dupe) {
      return badRequest('Email already taken');
    }
  }

  // Enforce role immutability
  if (role !== undefined) {
    const userRow = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(id).first();
    if (userRow && role !== userRow.role) {
      return badRequest('User role cannot be changed once created.');
    }
  }

  // Dynamically build the update query
  const sets: string[] = [];
  const args: any[] = [];

  if (name !== undefined) {
    sets.push('name = ?');
    args.push(name);
  }
  if (email !== undefined) {
    sets.push('email = ?');
    args.push(email);
  }
  if (role !== undefined) {
    sets.push('role = ?');
    args.push(role);

    // Profile backfill safeguards
    if (role === 'brand') {
      const exists = await env.DB.prepare('SELECT id FROM clients WHERE id = ?').bind(id).first();
      if (!exists) {
        const now = new Date().toISOString();
        const userRow = await env.DB.prepare('SELECT name, email, organization_id FROM users WHERE id = ?').bind(id).first();
        if (userRow) {
          await env.DB.prepare(
            `INSERT INTO clients (id, organization_id, name, contact_email, status, created_at)
             VALUES (?, ?, ?, ?, 'active', ?)`
          )
            .bind(id, userRow.organization_id, userRow.name || 'Company', userRow.email, now)
            .run().catch((e: any) => console.error('Failed to backfill client profile:', e));
        }
      }
    } else if (role === 'influencer') {
      const exists = await env.DB.prepare('SELECT id FROM influencers WHERE id = ?').bind(id).first();
      if (!exists) {
        const now = new Date().toISOString();
        const userRow = await env.DB.prepare('SELECT name, email, organization_id FROM users WHERE id = ?').bind(id).first();
        if (userRow) {
          await env.DB.prepare(
            `INSERT INTO influencers (
              id, organization_id, full_name, email, platform, status, pipeline_status, followers, engagement_rate, average_views, average_likes, average_comments, created_at
            ) VALUES (?, ?, ?, ?, 'Instagram', 'Active', 'New', 0, 0, 0, 0, 0, ?)`
          )
            .bind(id, userRow.organization_id, userRow.name, userRow.email, now)
            .run().catch((e: any) => console.error('Failed to backfill influencer profile:', e));
        }
      }
    }
  }
  if (isFrozen !== undefined) {
    sets.push('is_frozen = ?');
    args.push(isFrozen);
  }

  if (sets.length === 0) {
    return json({ success: true });
  }

  const sql = `UPDATE users SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`;
  const now = new Date().toISOString();
  await env.DB.prepare(sql).bind(...args, now, id).run();

  return json({ success: true });
}

export async function remove(_request: Request, env: Env, auth: AuthedRequest, id: string): Promise<Response> {
  if (auth.role !== 'admin') return unauthorized();

  // Prevent admin from deleting themselves
  if (id === auth.userId) {
    return badRequest('You cannot delete your own admin account');
  }

  // 1. Clean up influencer profiles and all sub-records associated with this ID if they are registered as an influencer
  await env.DB.prepare('DELETE FROM influencer_snapshots WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM influencer_notes WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM influencer_tags WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM campaign_influencers WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM analytics_records WHERE influencer_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM influencers WHERE id = ?').bind(id).run();

  // 2. Clean up client/brand records, including their campaigns, campaign links, and analytics, if they are registered as a brand
  await env.DB.prepare('DELETE FROM campaign_influencers WHERE campaign_id IN (SELECT id FROM campaigns WHERE client_id = ?)').bind(id).run();
  await env.DB.prepare('DELETE FROM analytics_records WHERE campaign_id IN (SELECT id FROM campaigns WHERE client_id = ?)').bind(id).run();
  await env.DB.prepare('DELETE FROM campaigns WHERE client_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();

  // 3. Clean up active sessions
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();

  // 4. Finally, delete the core user record
  const result = await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return notFound();

  return json({ success: true });
}
