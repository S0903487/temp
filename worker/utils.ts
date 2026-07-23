// ============ HTTP helpers ============

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export const notFound = () => errorResponse('Not found', 404);
export const unauthorized = () => errorResponse('Unauthorized', 401);
export const badRequest = (message = 'Bad request') => errorResponse(message, 400);
export const conflict = (message = 'Conflict') => errorResponse(message, 409);

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError('Invalid JSON body', 400);
  }
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ============ IDs ============

export function generateId(prefix: string): string {
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}_${rand}`;
}

// Influencer IDs are `username.platform` (e.g. "makeupbyhajraadnan.instagram")
// instead of a random ID. This is deliberate, not just cosmetic:
//   - it's human-readable in URLs, logs, and D1 queries when you're
//     debugging at 50k+ rows
//   - the same person on two platforms gets two distinct, meaningful IDs
//     ("makeupbyhajraadnan.instagram" vs "makeupbyhajraadnan.tiktok")
//     instead of colliding or needing an arbitrary suffix
//   - it makes bulk import/update deterministic: given a spreadsheet row
//     with just a username + platform, you can compute the exact row to
//     update without a lookup query first — see bulkUpdate() below, which
//     depends on this
export function slugifyInfluencerId(username: string, platform: string): string {
  const slug = username
    .trim()
    .toLowerCase()
    .replace(/^@/, '')            // strip a leading @ if pasted from a handle
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const platformSlug = platform.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `${slug}.${platformSlug}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// ============ Password hashing (PBKDF2 via Web Crypto) ============

const PBKDF2_ITERATIONS = 100_000;

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hashBuffer = await deriveBits(password, salt);
  return { hash: bufferToHex(hashBuffer), salt: bufferToHex(salt.buffer as ArrayBuffer) };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const saltBytes = hexToBuffer(salt);
  const hashBuffer = await deriveBits(password, saltBytes);
  const candidate = bufferToHex(hashBuffer);
  return timingSafeEqual(candidate, hash);
}

async function deriveBits(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============ Session tokens ============

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bufferToHex(bytes.buffer as ArrayBuffer);
}

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
