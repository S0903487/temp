import type { AuthedRequest, Env } from '../types';
import { badRequest, errorResponse } from '../utils';

/**
 * Avatar image pipeline.
 *
 * Profile images are resized to 256x256 WebP *in the browser*
 * (frontend/src/lib/image.ts) and saved as a small base64 data URL
 * directly on the influencer record — there's no separate image storage
 * product involved (no R2/Images), so nothing here requires enabling a
 * paid Cloudflare product or adding a payment method.
 *
 * The one thing that still needs a server-side hop is a pasted external
 * link (e.g. an Instagram/TikTok profile picture URL): those CDNs
 * commonly reject direct <img>/fetch hotlinking from the browser (they
 * check Referer/Origin/User-Agent), but a Worker-to-origin fetch isn't
 * subject to the same browser restrictions. So:
 *
 *   POST /api/images/fetch-url  { url }  ->  returns the raw image bytes
 *
 * The browser then runs those bytes through the exact same
 * resizeImageToWebp() used for a direct file upload, so both paths end
 * up producing the same small, self-contained data URL.
 */

const MAX_REMOTE_FETCH_BYTES = 15 * 1024 * 1024; // guard against abuse

export async function fetchUrl(request: Request, _env: Env, _auth: AuthedRequest): Promise<Response> {
  const body = await request.json<{ url?: string }>().catch(() => ({}) as { url?: string });
  const sourceUrl = body.url?.trim();
  if (!sourceUrl) return badRequest('url is required');

  if (sourceUrl.startsWith('data:')) {
    const matches = sourceUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (!matches) {
      return badRequest('Invalid data URL format');
    }
    const contentType = matches[1] || 'image/webp';
    const base64Data = matches[2];
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Response(bytes, { headers: { 'Content-Type': contentType } });
    } catch {
      return badRequest('Invalid base64 encoding in data URL');
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return badRequest('Invalid url');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return badRequest('url must be http(s) or a data: URL');
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
    });
  } catch {
    return errorResponse('Could not reach that image URL', 502);
  }

  if (!upstream.ok) {
    return errorResponse(`Source image responded with ${upstream.status}`, 502);
  }

  const contentType = upstream.headers.get('Content-Type') ?? '';
  if (!contentType.startsWith('image/')) {
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

  // Pass the original bytes straight through — the browser resizes them
  // the same way it would a locally-picked file.
  return new Response(bytes, { headers: { 'Content-Type': contentType } });
}
