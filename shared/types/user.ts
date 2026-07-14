export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role?: 'admin' | 'member' | 'viewer';
  createdAt: string;
  updatedAt?: string;
}
