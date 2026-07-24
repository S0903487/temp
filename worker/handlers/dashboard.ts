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
  const [
    clientsCountRes,
    prospectCountRes,
    topClientsRes,
    campaignsCountRes,
    activeCampaignsCountRes,
    topCampaignsRes,
    influencersCountRes,
    topInfluencersRes,
  ] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) as count FROM clients'),
    env.DB.prepare(`SELECT COUNT(*) as count FROM clients WHERE status = 'prospect'`),
    env.DB.prepare(
      `SELECT cl.id, cl.name, cl.contact_email, cl.industry, cl.status, cl.organization_id
       FROM clients cl
       ORDER BY cl.created_at DESC LIMIT 10`
    ),
    env.DB.prepare('SELECT COUNT(*) as count FROM campaigns'),
    env.DB.prepare(`SELECT COUNT(*) as count FROM campaigns WHERE status = 'active'`),
    env.DB.prepare(
      `SELECT c.id, c.name, c.budget, c.status FROM campaigns c ORDER BY c.created_at DESC LIMIT 5`
    ),
    env.DB.prepare('SELECT COUNT(*) as count FROM influencers'),
    env.DB.prepare(
      `SELECT i.id, i.full_name, i.username, i.followers, i.pipeline_status, i.organization_id
       FROM influencers i
       ORDER BY i.created_at DESC LIMIT 10`
    ),
  ]);

  const myOrgId = auth.organizationId;

  return json({
    clients: {
      total: (clientsCountRes.results[0]?.count as number) ?? 0,
      newProspects: (prospectCountRes.results[0]?.count as number) ?? 0,
      top: topClientsRes.results.map((r) => {
        const isMe = r.organization_id === myOrgId;
        return {
          id: r.id,
          name: r.name,
          contactEmail: r.contact_email,
          industry: r.industry,
          status: r.status,
          organizationId: r.organization_id,
          isMe,
          createdBy: isMe ? auth.userId : (r.organization_id as string),
          createdByName: isMe ? 'You' : 'Created by Other',
        };
      }),
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
      top: topInfluencersRes.results.map((r) => {
        const isMe = r.organization_id === myOrgId;
        return {
          id: r.id,
          fullName: r.full_name,
          username: r.username,
          followers: r.followers,
          pipelineStatus: r.pipeline_status,
          organizationId: r.organization_id,
          isMe,
          createdBy: isMe ? auth.userId : (r.organization_id as string),
          createdByName: isMe ? 'You' : 'Created by Other',
        };
      }),
    },
  });
}
