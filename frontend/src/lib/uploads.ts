import { getAuthToken } from '../features/auth/services/authService';
import { ApiError } from './api';

/**
 * Uploads an already-resized image blob (see lib/image.ts) to
 * POST /api/uploads/file and returns the stable `/api/uploads/...` URL to
 * store on the record (e.g. influencer.profileImage). Unlike apiRequest,
 * this sends raw bytes rather than JSON.
 */
export async function uploadImageFile(blob: Blob): Promise<string> {
  const token = getAuthToken();
  const response = await fetch('/api/uploads/file', {
    method: 'POST',
    headers: {
      'Content-Type': blob.type || 'image/webp',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: blob,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError((data as { error?: string } | null)?.error ?? 'Image upload failed', response.status);
  }
  return (data as { url: string }).url;
}

/**
 * Asks the backend to fetch a remote image URL (e.g. a pasted Instagram or
 * TikTok profile picture link), resize it, and re-host it from our own
 * origin. Needed because those CDNs commonly block direct hotlinking from
 * the browser, so just saving the pasted URL as-is renders as a broken
 * image for everyone viewing the influencer.
 */
export async function uploadImageFromUrl(url: string): Promise<string> {
  const token = getAuthToken();
  const response = await fetch('/api/uploads/from-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError((data as { error?: string } | null)?.error ?? 'Could not import that image URL', response.status);
  }
  return (data as { url: string }).url;
}
