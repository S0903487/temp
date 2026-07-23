import { apiRequest } from '../../../lib/api';
import type {
  Influencer,
  InfluencerCampaignHistoryItem,
  InfluencerNote,
  InfluencerSnapshot,
  Tag,
} from '../types';

export interface CreateInfluencerInput {
  fullName: string;
  // Required, not optional — the backend derives the influencer's id from
  // `username.platform` (e.g. "makeupbyhajraadnan.instagram"), so this is
  // no longer just a display field.
  username: string;
  platform?: Influencer['platform'];
  category?: string;
  country?: string;
  language?: string;
  followers?: number;
  following?: number;
  totalPosts?: number;
  firstJoinedDate?: string;
  engagementRate?: number;
  averageViews?: number;
  averageLikes?: number;
  averageComments?: number;
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
  email?: string;
  phone?: string;
  pricePost?: number;
  priceStory?: number;
  verified?: boolean;
  brandSafe?: boolean;
  status?: Influencer['status'];
  pipelineStatus?: Influencer['pipelineStatus'];
  notes?: string;
  tags?: string[];
  bio?: string;
  profileImage?: string | null;
  profileLink?: string;
  roi?: number;
  cpa?: number;
  cpi?: number;
  ltv?: number;
}

export type UpdateInfluencerInput = Partial<CreateInfluencerInput>;

export interface ListInfluencersParams {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
  category?: string;
  pipelineStatus?: string;
  status?: string;
  country?: string;
  language?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedInfluencersResponse {
  items: Influencer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listInfluencers(params?: ListInfluencersParams): Promise<Influencer[]> {
  if (!params) {
    return apiRequest<Influencer[]>('/influencers', { method: 'GET' });
  }
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.platform) query.set('platform', params.platform);
  if (params.category) query.set('category', params.category);
  if (params.pipelineStatus) query.set('pipelineStatus', params.pipelineStatus);
  if (params.status) query.set('status', params.status);
  if (params.country) query.set('country', params.country);
  if (params.language) query.set('language', params.language);
  if (params.sortField) query.set('sortField', params.sortField);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await apiRequest<PaginatedInfluencersResponse | Influencer[]>(`/influencers?${query.toString()}`, { method: 'GET' });
  if (Array.isArray(res)) return res;
  return res.items;
}

export async function listInfluencersPaginated(params: ListInfluencersParams): Promise<PaginatedInfluencersResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.platform) query.set('platform', params.platform);
  if (params.category) query.set('category', params.category);
  if (params.pipelineStatus) query.set('pipelineStatus', params.pipelineStatus);
  if (params.status) query.set('status', params.status);
  if (params.country) query.set('country', params.country);
  if (params.language) query.set('language', params.language);
  if (params.sortField) query.set('sortField', params.sortField);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await apiRequest<PaginatedInfluencersResponse | Influencer[]>(`/influencers?${query.toString()}`, { method: 'GET' });
  if (Array.isArray(res)) {
    return { items: res, total: res.length, page: 1, limit: res.length, totalPages: 1 };
  }
  return res;
}

export async function getInfluencer(id: string): Promise<Influencer> {
  return apiRequest<Influencer>(`/influencers/${id}`, { method: 'GET' });
}

// Composite fetch — influencer + tags + notes + snapshots + campaign history
// in one request, backed by a single D1 batch() round trip on the Worker.
// Used by the profile page instead of firing 5 separate requests.
export interface InfluencerFull {
  influencer: Influencer;
  tags: Tag[];
  notes: InfluencerNote[];
  snapshots: InfluencerSnapshot[];
  campaignHistory: InfluencerCampaignHistoryItem[];
}

export async function getInfluencerFull(id: string): Promise<InfluencerFull> {
  return apiRequest<InfluencerFull>(`/influencers/${id}/full`, { method: 'GET' });
}

// Bulk update — the JSON/Excel import path. Each item identifies its row
// by `id`, or by `username` + `platform` (no lookup needed, since the
// backend derives id = `${username}.${platform}` the same way create()
// does). Excel/CSV files should be parsed to this shape client-side
// (e.g. with SheetJS) and sent in chunks of up to 500 rows — the backend
// rejects a single request with more than that.
export interface BulkUpdateItem extends Partial<CreateInfluencerInput> {
  id?: string;
}

export interface BulkUpdateResult {
  index: number;
  id?: string;
  success: boolean;
  error?: string;
}

export interface BulkUpdateResponse {
  total: number;
  updated: number;
  failed: number;
  results: BulkUpdateResult[];
}

export const BULK_UPDATE_MAX_ITEMS = 500;

export async function bulkUpdateInfluencers(items: BulkUpdateItem[]): Promise<BulkUpdateResponse> {
  return apiRequest<BulkUpdateResponse>('/influencers/bulk', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export interface BulkUpsertResponse {
  total: number;
  processed: number;
  successful: number;
  items: Array<{ index: number; id: string; name: string }>;
}

export async function bulkUpsertInfluencers(items: BulkUpdateItem[]): Promise<BulkUpsertResponse> {
  return apiRequest<BulkUpsertResponse>('/influencers/bulk-upsert', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export interface BulkDeleteResponse {
  total: number;
  deleted: number;
}

export async function bulkDeleteInfluencers(ids: string[]): Promise<BulkDeleteResponse> {
  return apiRequest<BulkDeleteResponse>('/influencers/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function createInfluencer(data: CreateInfluencerInput): Promise<Influencer> {
  return apiRequest<Influencer>('/influencers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInfluencer(id: string, data: UpdateInfluencerInput): Promise<Influencer> {
  return apiRequest<Influencer>(`/influencers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInfluencer(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/influencers/${id}`, { method: 'DELETE' });
}

// ---- Tags ----

export async function listOrgTags(): Promise<Tag[]> {
  return apiRequest<Tag[]>('/tags', { method: 'GET' });
}

export async function listInfluencerTags(influencerId: string): Promise<Tag[]> {
  return apiRequest<Tag[]>(`/influencers/${influencerId}/tags`, { method: 'GET' });
}

export async function addInfluencerTag(influencerId: string, name: string): Promise<Tag> {
  return apiRequest<Tag>(`/influencers/${influencerId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function removeInfluencerTag(influencerId: string, tagId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/influencers/${influencerId}/tags/${tagId}`, { method: 'DELETE' });
}

// ---- Notes ----

export async function listInfluencerNotes(influencerId: string): Promise<InfluencerNote[]> {
  return apiRequest<InfluencerNote[]>(`/influencers/${influencerId}/notes`, { method: 'GET' });
}

export async function addInfluencerNote(influencerId: string, body: string): Promise<InfluencerNote> {
  return apiRequest<InfluencerNote>(`/influencers/${influencerId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function removeInfluencerNote(influencerId: string, noteId: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/influencers/${influencerId}/notes/${noteId}`, { method: 'DELETE' });
}

// ---- Growth history ----

export async function listInfluencerSnapshots(influencerId: string): Promise<InfluencerSnapshot[]> {
  return apiRequest<InfluencerSnapshot[]>(`/influencers/${influencerId}/snapshots`, { method: 'GET' });
}

// ---- Campaign history ----

export async function listInfluencerCampaignHistory(influencerId: string): Promise<InfluencerCampaignHistoryItem[]> {
  return apiRequest<InfluencerCampaignHistoryItem[]>(`/influencers/${influencerId}/campaigns`, { method: 'GET' });
}
