export interface AnalyticsRecord {
  id: string;
  influencerId: string;
  campaignId?: string;
  date: string; // ISO date string for the record
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
