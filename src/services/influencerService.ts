import type { Influencer } from '../types/influencer';

const generateId = (prefix = ''): string => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}-${suffix}` : suffix;
};

// Mock data store
const influencers: Influencer[] = [
  {
    id: generateId('inf'),
    name: 'Jane Doe',
    bio: 'Lifestyle creator',
    profileImageUrl: '',
    campaignIds: [],
    analyticsIds: [],
    createdAt: new Date().toISOString(),
  },
];

export const influencerService = {
  async getAll(): Promise<Influencer[]> {
    return Promise.resolve([...influencers]);
  },

  async getById(id: string): Promise<Influencer | undefined> {
    return Promise.resolve(influencers.find((i) => i.id === id));
  },

  async create(data: Partial<Influencer>): Promise<Influencer> {
    const now = new Date().toISOString();
    const created: Influencer = {
      id: data.id ?? generateId('inf'),
      name: data.name ?? 'Untitled Influencer',
      bio: data.bio,
      profileImageUrl: data.profileImageUrl,
      campaignIds: data.campaignIds ?? [],
      analyticsIds: data.analyticsIds ?? [],
      createdAt: now,
      updatedAt: undefined,
    };
    influencers.push(created);
    return Promise.resolve(created);
  },

  async update(id: string, patch: Partial<Influencer>): Promise<Influencer | undefined> {
    const idx = influencers.findIndex((i) => i.id === id);
    if (idx === -1) return Promise.resolve(undefined);
    const updated: Influencer = { ...influencers[idx], ...patch, updatedAt: new Date().toISOString() };
    influencers[idx] = updated;
    return Promise.resolve(updated);
  },

  async delete(id: string): Promise<boolean> {
    const idx = influencers.findIndex((i) => i.id === id);
    if (idx === -1) return Promise.resolve(false);
    influencers.splice(idx, 1);
    return Promise.resolve(true);
  },
};
