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
  username?: string;
  platform?: Influencer['platform'];
  category?: string;
  country?: string;
  language?: string;
  followers?: number;
  engagementRate?: number;
  averageViews?: number;
  averageLikes?: number;
  averageComments?: number;
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

export async function listInfluencers(): Promise<Influencer[]> {
  return apiRequest<Influencer[]>('/influencers', { method: 'GET' });
}

export async function getInfluencer(id: string): Promise<Influencer> {
  return apiRequest<Influencer>(`/influencers/${id}`, { method: 'GET' });
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
