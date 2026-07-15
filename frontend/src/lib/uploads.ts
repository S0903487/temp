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
  const token = getAuthToken();
  const response = await fetch('/api/images/fetch-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError((data as { error?: string } | null)?.error ?? 'Could not import that image URL', response.status);
  }

  return response.blob();
}
