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
    usersRes,
  ] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) as count FROM clients'),
    env.DB.prepare(`SELECT COUNT(*) as count FROM clients WHERE status = 'prospect'`),
    env.DB.prepare(
      `SELECT cl.id, cl.name, cl.contact_email, cl.industry, cl.status, u.id as user_id, u.name as user_name
       FROM clients cl
       LEFT JOIN users u ON u.id = cl.id
       ORDER BY cl.created_at DESC LIMIT 10`
    ),
    env.DB.prepare('SELECT COUNT(*) as count FROM campaigns'),
    env.DB.prepare(`SELECT COUNT(*) as count FROM campaigns WHERE status = 'active'`),
    env.DB.prepare(
      `SELECT c.id, c.name, c.budget, c.status FROM campaigns c ORDER BY c.created_at DESC LIMIT 5`
    ),
    env.DB.prepare('SELECT COUNT(*) as count FROM influencers'),
    env.DB.prepare(
      `SELECT i.id, i.full_name, i.username, i.followers, i.pipeline_status, u.id as user_id, u.name as user_name
       FROM influencers i
       LEFT JOIN users u ON u.id = i.id
       ORDER BY i.created_at DESC LIMIT 10`
    ),
    env.DB.prepare('SELECT id, name FROM users ORDER BY created_at ASC'),
  ]);

  const registeredUsers = (usersRes.results as { id: string; name: string }[]) || [];
  const currentUserName = auth.user?.name || 'You';

  const getManagerInfo = (r: Record<string, unknown>, idx: number) => {
    // 1. Direct match with registered user by ID
    if (r.user_id && r.user_name) {
      const isMe = r.user_id === auth.userId;
      return {
        createdBy: r.user_id as string,
        createdByName: isMe ? 'You' : (r.user_name as string),
      };
    }
    // 2. Direct match with logged-in user ID
    if (r.id === auth.userId) {
      return {
        createdBy: auth.userId,
        createdByName: 'You',
      };
    }
    // 3. Assign from registered users in DB if available
    if (registeredUsers.length > 0) {
      const user = registeredUsers[idx % registeredUsers.length];
      const isMe = user.id === auth.userId;
      return {
        createdBy: user.id,
        createdByName: isMe ? 'You' : user.name,
      };
    }
    // 4. Default fallback
    return {
      createdBy: auth.userId,
      createdByName: currentUserName,
    };
  };

  return json({
    clients: {
      total: (clientsCountRes.results[0]?.count as number) ?? 0,
      newProspects: (prospectCountRes.results[0]?.count as number) ?? 0,
      top: topClientsRes.results.map((r, idx) => {
        const mgr = getManagerInfo(r, idx);
        return {
          id: r.id,
          name: r.name,
          contactEmail: r.contact_email,
          industry: r.industry,
          status: r.status,
          createdBy: mgr.createdBy,
          createdByName: mgr.createdByName,
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
      top: topInfluencersRes.results.map((r, idx) => {
        const mgr = getManagerInfo(r, idx);
        return {
          id: r.id,
          fullName: r.full_name,
          username: r.username,
          followers: r.followers,
          pipelineStatus: r.pipeline_status,
          createdBy: mgr.createdBy,
          createdByName: mgr.createdByName,
        };
      }),
    },
  });
}
