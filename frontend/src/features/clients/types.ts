export type ClientStatus = 'prospect' | 'active';

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  contactEmail: string | null;
  industry: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateClientInput {
  name: string;
  contactEmail?: string;
  industry?: string;
  status?: ClientStatus;
}

export type UpdateClientInput = Partial<CreateClientInput>;
