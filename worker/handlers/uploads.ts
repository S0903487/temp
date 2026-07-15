import type { AuthedRequest, Env } from '../types';
import { badRequest, errorResponse, generateId, json } from '../utils';

/**
 * Avatar / profile-image pipeline.
 *
 * Why this exists: profile images used to be read client-side as base64
 * and saved straight into the `influencers.profile_image` D1 column. That
 * meant every `GET /api/influencers` list request round-tripped every
 * photo (often 1-2MB of base64 text) for every row, which is the main
 * reason list/search pages felt slow. It also meant a pasted TikTok/
 * Instagram CDN link would frequently render as a broken image, because
 * those CDNs reject direct `<img>` hotlinking from other origins.
 *
 * Both problems share one fix: never store raw image bytes (or a
 * stranger's CDN link) in the app. Instead, always normalize the image
 * down to a small 256x256 WebP file and persist *that* in R2. D1 only
 * ever stores a short `/api/uploads/<key>` URL string.
 *
 *   - POST /api/uploads/file       body = already-resized WebP bytes
 *                                  (see frontend/src/lib/image.ts, which
 *                                  resizes in the browser before upload)
 *   - POST /api/uploads/from-url   { url } — used when a user pastes an
 *                                  Instagram/TikTok/etc profile picture
 *                                  link instead of uploading a file. The
 *                                  Worker fetches it server-to-server
 *                                  (no browser CORS/hotlink restrictions
 *                                  apply to Worker-to-origin fetches) and
 *                                  re-encodes it the same way.
 *   - GET  /api/uploads/:key       serves the stored file. Unauthenticated
 *                                  on purpose — browsers don't attach our
 *                                  Bearer token to <img> requests, so this
 *                                  route can't require auth like the rest
 *                                  of the API does.
 */

const MAX_UPLOAD_BYTES = 1024 * 1024; // 1MB — plenty for a 256x256 WebP avatar
const MAX_REMOTE_FETCH_BYTES = 15 * 1024 * 1024; // guard against abuse via from-url
const AVATAR_SIZE = 256;

function keyFor(organizationId: string): string {
  return `avatars/${organizationId}/${generateId('img')}.webp`;
}

/** POST /api/uploads/file — body is raw WebP bytes, already resized in-browser. */
export async function uploadFile(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.startsWith('image/')) {
    return badRequest('Expected an image/* Content-Type');
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) return badRequest('Empty file');
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return badRequest(`Image too large — max ${Math.floor(MAX_UPLOAD_BYTES / 1024)}KB after resizing`);
  }

  const key = keyFor(auth.organizationId);
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: 'image/webp' } });

  return json({ url: `/api/uploads/${key}` }, 201);
}

/**
 * POST /api/uploads/from-url — server-side fetch of an external image
 * (e.g. a TikTok/Instagram profile picture CDN link) so it can be resized
 * and re-hosted from our own origin. Direct hotlinking of those CDN URLs
 * from the browser frequently 403s because they check Referer/Origin/
 * User-Agent headers that a Worker-to-origin fetch doesn't have to send
 * the same way a browser <img> tag does.
 */
export async function uploadFromUrl(request: Request, env: Env, auth: AuthedRequest): Promise<Response> {
  const body = await request.json<{ url?: string }>().catch(() => ({}) as { url?: string });
  const sourceUrl = body.url?.trim();
  if (!sourceUrl) return badRequest('url is required');

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return badRequest('Invalid url');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return badRequest('url must be http(s)');
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      headers: {
        // Many social CDNs (Instagram/TikTok included) reject requests
        // that don't look like a normal browser, or that carry a
        // cross-site Referer. Spoofing a same-site-looking request here
        // is safe because this fetch happens server-side, not from the
        // user's browser.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: parsed.origin,
      },
      // Best-effort automatic resize at the edge via Cloudflare Image
      // Resizing. If the zone doesn't have that enabled, Cloudflare just
      // ignores this option and returns the original image — Workers
      // have no other way to decode/re-encode arbitrary image formats,
      // so in that case we store the original as-is below rather than
      // failing the request outright.
      cf: { image: { width: AVATAR_SIZE, height: AVATAR_SIZE, fit: 'cover', format: 'webp', quality: 85 } },
    } as RequestInit);
  } catch {
    return errorResponse('Could not reach that image URL', 502);
  }

  if (!upstream.ok) {
    return errorResponse(`Source image responded with ${upstream.status}`, 502);
  }

  const upstreamType = upstream.headers.get('Content-Type') ?? '';
  if (!upstreamType.startsWith('image/')) {
    return badRequest('That URL did not return an image');
  }

  const contentLength = Number(upstream.headers.get('Content-Length') ?? '0');
  if (contentLength && contentLength > MAX_REMOTE_FETCH_BYTES) {
    return badRequest('Source image is too large');
  }

  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength > MAX_REMOTE_FETCH_BYTES) {
    return badRequest('Source image is too large');
  }

  // If Image Resizing wasn't available, `upstreamType` won't be webp and
  // the file won't be 256x256 — we still store it so the avatar at least
  // renders reliably (fixing the broken-hotlink problem), rather than
  // failing the whole request over a resize we can't perform in-Worker.
  const finalType = upstreamType.startsWith('image/') ? upstreamType : 'application/octet-stream';
  const key = keyFor(auth.organizationId);
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: finalType } });

  return json({ url: `/api/uploads/${key}` }, 201);
}

/** GET /api/uploads/:key+ — public read of a stored avatar. Not auth-gated; see file header. */
export async function serve(_request: Request, env: Env, key: string): Promise<Response> {
  if (!key.startsWith('avatars/')) return errorResponse('Not found', 404);

  const object = await env.IMAGES.get(key);
  if (!object) return errorResponse('Not found', 404);

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      // Images are content-addressed by a random id and never mutated in
      // place, so it's safe to let browsers/CDN cache them indefinitely.
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: object.httpEtag,
    },
  });
}
