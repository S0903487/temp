export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  influencerIds: string[];
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCampaignInput {
  clientId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: CampaignStatus;
}

export type UpdateCampaignInput = Partial<Omit<CreateCampaignInput, 'clientId'>>;
