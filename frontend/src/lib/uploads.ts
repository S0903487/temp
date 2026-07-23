import { getAuthToken } from '../features/auth/services/authService';
import { ApiError } from './api';

/**
 * Asks the backend to fetch a remote image URL (e.g. a pasted Instagram or
 * TikTok profile picture link) and hand back the raw bytes as a Blob.
 * Needed because those CDNs commonly block direct hotlinking from the
 * browser (they check Referer/Origin/User-Agent) — a Worker-to-origin
 * fetch isn't subject to the same restriction. The caller then runs the
 * result through the same resizeImageToWebp() used for a local file pick
 * (see lib/image.ts), so both paths end up producing an identical small,
 * self-contained data URL — nothing is stored server-side.
 */
export async function fetchRemoteImage(url: string): Promise<Blob> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new ApiError('Image URL or data cannot be empty', 400);
  }

  // If a data URL is passed directly (e.g. data:image/webp;base64,...), fetch it in the browser
  if (trimmed.startsWith('data:')) {
    try {
      const res = await fetch(trimmed);
      if (!res.ok) throw new Error();
      return await res.blob();
    } catch {
      throw new ApiError('Invalid image data URL format', 400);
    }
  }

  // If raw base64 without data: prefix is passed
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 50) {
    try {
      const cleanBase64 = trimmed.replace(/\s+/g, '');
      const dataUrl = `data:image/webp;base64,${cleanBase64}`;
      const res = await fetch(dataUrl);
      if (res.ok) return await res.blob();
    } catch {
      // Fallback to backend fetch below if it wasn't valid base64
    }
  }

  // Auto-prepend https:// if user pasted domain/path without protocol
  let targetUrl = trimmed;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  const token = getAuthToken();
  const response = await fetch('/api/images/fetch-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url: targetUrl }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError((data as { error?: string } | null)?.error ?? 'Could not import that image URL', response.status);
  }

  return response.blob();
}
