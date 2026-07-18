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

async function routeApi(request: Request, env: Env, url: URL): Promise<Response> {
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
