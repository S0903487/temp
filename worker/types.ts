export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  // Cross-isolate session cache. In-memory caching (a plain module-level
  // Map/variable) only survives within a single Worker isolate — Cloudflare
  // recycles isolates often, so relying on it alone means most requests
  // still hit D1 for auth. KV is edge-replicated and shared across every
  // isolate, so a session validated once is cheap to re-validate everywhere
  // for the life of the cache entry.
  SESSIONS?: KVNamespace;
}

export interface AuthedRequest {
  userId: string;
  organizationId: string;
  role: string;
  isFrozen?: boolean;
  user?: any;
}
