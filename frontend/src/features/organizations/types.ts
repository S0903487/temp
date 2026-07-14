export interface Organization {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  currency?: string;
}
