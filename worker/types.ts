export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** R2 bucket that stores resized (256x256 WebP) avatar images. See worker/handlers/uploads.ts. */
  IMAGES: R2Bucket;
}

export interface AuthedRequest {
  userId: string;
  organizationId: string;
  role: string;
}
