import type { AuthResponse, LoginCredentials, PasswordResetRequest, RegisterCredentials, User } from '../types/auth';

// Talks to the Cloudflare Worker backend in `worker/handlers/auth.ts`,
// mounted at /api/auth/* (see worker/index.ts).
const API_BASE = '/api/auth';

interface ApiErrorBody {
  error?: string;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data as ApiErrorBody | null)?.error ?? 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data as T;
}

/**
 * POST /api/auth/login
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * POST /api/auth/register
 */
export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify({
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
    }),
  });
}

/**
 * GET /api/auth/me
 * The token itself is attached via the Authorization header in apiRequest;
 * the argument is kept so callers (useAuthUser) don't need to change.
 */
export async function verifyToken(token: string): Promise<User> {
  if (token) {
    // Already attached via apiRequest headers
  }
  return apiRequest<User>('/me', { method: 'GET' });
}

/**
 * POST /api/auth/logout
 */
export async function logoutUser(): Promise<void> {
  await apiRequest<{ success: boolean }>('/logout', { method: 'POST' });
}

/**
 * POST /api/auth/forgot-password
 */
export async function requestPasswordReset(data: PasswordResetRequest): Promise<void> {
  await apiRequest<{ success: boolean }>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}
