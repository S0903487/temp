export interface Client {
  id: string;
  organizationId: string;
  name: string;
  contactEmail?: string;
  // Relations by ID
  campaignIds: string[];
  createdAt: string;
  updatedAt?: string;
}
