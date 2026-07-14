import { getAuthToken } from '../features/auth/services/authService';

interface ApiErrorBody {
  error?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Shared fetch wrapper for every /api/* resource (clients, campaigns,
 * influencers, analytics, organizations). Attaches the stored auth token
 * as a Bearer header, same as authService's own apiRequest.
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data as ApiErrorBody | null)?.error ?? 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status);
  }

  return data as T;
}
