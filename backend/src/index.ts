export interface Env {
  // D1 bindings will be added later, e.g. DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Simple router placeholder
    if (url.pathname.startsWith('/api/influencers')) {
      // TODO: implement D1-backed handlers
      return new Response(JSON.stringify({ message: 'influencers endpoint not implemented' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
