import { apiRequest } from '../../../lib/api';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';

export async function listClients(): Promise<Client[]> {
  return apiRequest<Client[]>('/clients', { method: 'GET' });
}

export async function createClient(data: CreateClientInput): Promise<Client> {
  return apiRequest<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(id: string, data: UpdateClientInput): Promise<Client> {
  return apiRequest<Client>(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/clients/${id}`, { method: 'DELETE' });
}
