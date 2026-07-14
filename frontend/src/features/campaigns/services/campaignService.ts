import { apiRequest } from '../../../lib/api';
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '../types';

export async function listCampaigns(): Promise<Campaign[]> {
  return apiRequest<Campaign[]>('/campaigns', { method: 'GET' });
}

export async function createCampaign(data: CreateCampaignInput): Promise<Campaign> {
  return apiRequest<Campaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id: string, data: UpdateCampaignInput): Promise<Campaign> {
  return apiRequest<Campaign>(`/campaigns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/campaigns/${id}`, { method: 'DELETE' });
}

export async function linkInfluencerToCampaign(campaignId: string, influencerId: string): Promise<Campaign> {
  return apiRequest<Campaign>(`/campaigns/${campaignId}/influencers`, {
    method: 'POST',
    body: JSON.stringify({ influencerId }),
  });
}

export async function unlinkInfluencerFromCampaign(campaignId: string, influencerId: string): Promise<Campaign> {
  return apiRequest<Campaign>(`/campaigns/${campaignId}/influencers/${influencerId}`, {
    method: 'DELETE',
  });
}
