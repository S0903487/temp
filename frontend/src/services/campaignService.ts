import type { Campaign } from '../types/campaign';

const generateId = (prefix = ''): string => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}-${suffix}` : suffix;
};

const campaigns: Campaign[] = [];

export const campaignService = {
  async getAll(): Promise<Campaign[]> {
    return Promise.resolve([...campaigns]);
  },

  async getById(id: string): Promise<Campaign | undefined> {
    return Promise.resolve(campaigns.find((c) => c.id === id));
  },

  async create(data: Partial<Campaign>): Promise<Campaign> {
    const now = new Date().toISOString();
    const created: Campaign = {
      id: data.id ?? generateId('cmp'),
      clientId: data.clientId ?? '',
      name: data.name ?? 'Untitled Campaign',
      description: data.description,
      influencerIds: data.influencerIds ?? [],
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      status: data.status ?? 'draft',
      createdAt: now,
      updatedAt: undefined,
    };
    campaigns.push(created);
    return Promise.resolve(created);
  },

  async update(id: string, patch: Partial<Campaign>): Promise<Campaign | undefined> {
    const idx = campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return Promise.resolve(undefined);
    const updated: Campaign = { ...campaigns[idx], ...patch, updatedAt: new Date().toISOString() };
    campaigns[idx] = updated;
    return Promise.resolve(updated);
  },

  async delete(id: string): Promise<boolean> {
    const idx = campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return Promise.resolve(false);
    campaigns.splice(idx, 1);
    return Promise.resolve(true);
  },
};
