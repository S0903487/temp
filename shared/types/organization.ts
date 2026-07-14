export interface Organization {
  id: string;
  name: string;
  description?: string;
  userIds: string[]; // Users belonging to this organization
  clientIds: string[]; // Clients belonging to this organization
  createdAt: string;
  updatedAt?: string;
}
