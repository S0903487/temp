import type { AuthedRequest, Env } from '../types';
import { json } from '../utils';

// GET /api/dashboard/summary
//
// The dashboard used to call useClients() + useCampaigns() + useInfluencers()
// — three endpoints that each SELECT * every row, every column, for the
// entire organization (including base64 profile_image blobs on influencers)
// — just to show three counts and two 5-row preview tables. That's fine at
// 20 influencers; at 2,000 it means downloading megabytes of image data on
// every dashboard visit for a page that renders five rows of it.
//
// This endpoint does the aggregation in SQL (COUNT / LIMIT 5) instead of in
// the browser, selects only the columns the dashboard actually renders, and
// batches all six queries into one D1 round trip.
export async function getSummary(_request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const orgId = auth.organizationId;

  const [
    clientsCountRes,
    prospectCountRes,
    campaignsCountRes,
    activeCampaignsCountRes,
    topCampaignsRes,
    influencersCountRes,
    topInfluencersRes,
  ] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) as count FROM clients WHERE organization_id = ?').bind(orgId),
    env.DB.prepare(`SELECT COUNT(*) as count FROM clients WHERE organization_id = ? AND status = 'prospect'`).bind(orgId),
    env.DB.prepare(
      `SELECT COUNT(*) as count FROM campaigns c JOIN clients cl ON cl.id = c.client_id WHERE cl.organization_id = ?`
    ).bind(orgId),
    env.DB.prepare(
      `SELECT COUNT(*) as count FROM campaigns c JOIN clients cl ON cl.id = c.client_id WHERE cl.organization_id = ? AND c.status = 'active'`
    ).bind(orgId),
    env.DB.prepare(
      `SELECT c.id, c.name, c.budget, c.status FROM campaigns c JOIN clients cl ON cl.id = c.client_id
       WHERE cl.organization_id = ? ORDER BY c.created_at DESC LIMIT 5`
    ).bind(orgId),
    env.DB.prepare('SELECT COUNT(*) as count FROM influencers WHERE organization_id = ?').bind(orgId),
    env.DB.prepare(
      `SELECT id, full_name, username, followers, pipeline_status FROM influencers
       WHERE organization_id = ? ORDER BY created_at DESC LIMIT 5`
    ).bind(orgId),
  ]);

  return json({
    clients: {
      total: (clientsCountRes.results[0]?.count as number) ?? 0,
      newProspects: (prospectCountRes.results[0]?.count as number) ?? 0,
    },
    campaigns: {
      total: (campaignsCountRes.results[0]?.count as number) ?? 0,
      active: (activeCampaignsCountRes.results[0]?.count as number) ?? 0,
      top: topCampaignsRes.results.map((r) => ({
        id: r.id,
        name: r.name,
        budget: r.budget,
        status: r.status,
      })),
    },
    influencers: {
      total: (influencersCountRes.results[0]?.count as number) ?? 0,
      top: topInfluencersRes.results.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        username: r.username,
        followers: r.followers,
        pipelineStatus: r.pipeline_status,
      })),
    },
  });
}
