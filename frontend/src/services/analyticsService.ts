import type { AnalyticsRecord } from '../types/analytics';

const generateId = (prefix = ''): string => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}-${suffix}` : suffix;
};

const analyticsStore: AnalyticsRecord[] = [];

export const analyticsService = {
  async getAll(): Promise<AnalyticsRecord[]> {
    return Promise.resolve([...analyticsStore]);
  },

  async getById(id: string): Promise<AnalyticsRecord | undefined> {
    return Promise.resolve(analyticsStore.find((a) => a.id === id));
  },

  async create(data: Partial<AnalyticsRecord>): Promise<AnalyticsRecord> {
    const now = new Date().toISOString();
    const created: AnalyticsRecord = {
      id: data.id ?? generateId('anl'),
      influencerId: data.influencerId ?? '',
      campaignId: data.campaignId,
      date: data.date ?? now,
      impressions: data.impressions,
      clicks: data.clicks,
      conversions: data.conversions,
      revenue: data.revenue,
      metadata: data.metadata,
      createdAt: now,
    };
    analyticsStore.push(created);
    return Promise.resolve(created);
  },

  async update(id: string, patch: Partial<AnalyticsRecord>): Promise<AnalyticsRecord | undefined> {
    const idx = analyticsStore.findIndex((a) => a.id === id);
    if (idx === -1) return Promise.resolve(undefined);
    const updated: AnalyticsRecord = { ...analyticsStore[idx], ...patch } as AnalyticsRecord;
    analyticsStore[idx] = updated;
    return Promise.resolve(updated);
  },

  async delete(id: string): Promise<boolean> {
    const idx = analyticsStore.findIndex((a) => a.id === id);
    if (idx === -1) return Promise.resolve(false);
    analyticsStore.splice(idx, 1);
    return Promise.resolve(true);
  },
};
