import { apiRequest } from '../../../lib/api';
import type { Organization, UpdateOrganizationInput } from '../types';

export async function getCurrentOrganization(): Promise<Organization> {
  return apiRequest<Organization>('/organizations/current', { method: 'GET' });
}

export async function updateCurrentOrganization(data: UpdateOrganizationInput): Promise<Organization> {
  return apiRequest<Organization>('/organizations/current', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
