import type { Client } from '../types/client';

const generateId = (prefix = ''): string => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}-${suffix}` : suffix;
};

const clients: Client[] = [];

export const clientService = {
  async getAll(): Promise<Client[]> {
    return Promise.resolve([...clients]);
  },

  async getById(id: string): Promise<Client | undefined> {
    return Promise.resolve(clients.find((c) => c.id === id));
  },

  async create(data: Partial<Client>): Promise<Client> {
    const now = new Date().toISOString();
    const created: Client = {
      id: data.id ?? generateId('clt'),
      organizationId: data.organizationId ?? '',
      name: data.name ?? 'Untitled Client',
      contactEmail: data.contactEmail,
      campaignIds: data.campaignIds ?? [],
      createdAt: now,
      updatedAt: undefined,
    };
    clients.push(created);
    return Promise.resolve(created);
  },

  async update(id: string, patch: Partial<Client>): Promise<Client | undefined> {
    const idx = clients.findIndex((c) => c.id === id);
    if (idx === -1) return Promise.resolve(undefined);
    const updated: Client = { ...clients[idx], ...patch, updatedAt: new Date().toISOString() };
    clients[idx] = updated;
    return Promise.resolve(updated);
  },

  async delete(id: string): Promise<boolean> {
    const idx = clients.findIndex((c) => c.id === id);
    if (idx === -1) return Promise.resolve(false);
    clients.splice(idx, 1);
    return Promise.resolve(true);
  },
};
