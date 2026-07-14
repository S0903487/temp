export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

export interface AuthedRequest {
  userId: string;
  organizationId: string;
  role: string;
}
