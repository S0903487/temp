export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  clientId: string; // owning client
  name: string;
  description?: string;
  // Relations by ID
  influencerIds: string[]; // Influencers participating in this campaign
  startDate?: string;
  endDate?: string;
  budget?: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt?: string;
}
