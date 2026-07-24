import type { AuthedRequest, Env } from '../types';
import { json } from '../utils';

// GET /api/tags — every tag defined for the organization, for autocomplete
// in the TagSelector. Attaching a tag to an influencer is done via
// POST /api/influencers/:id/tags instead (creates the tag if it's new).
export async function list(_request: Request, env: Env, _auth: AuthedRequest): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT DISTINCT id, name FROM tags ORDER BY name')
    .all();
  return json(results);
}
