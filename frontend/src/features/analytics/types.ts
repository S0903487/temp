export interface AnalyticsRecord {
  id: string;
  influencerId: string;
  campaignId?: string;
  date: string;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  revenue: number | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateAnalyticsInput {
  influencerId: string;
  campaignId?: string;
  date: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
}
