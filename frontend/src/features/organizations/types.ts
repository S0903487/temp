export interface Organization {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string | null;
  conversion?: {
    rate: number;
    oldCurrency: string;
    newCurrency: string;
    rateSource: string;
  };
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  currency?: string;
}
