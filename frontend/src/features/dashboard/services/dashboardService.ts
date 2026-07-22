import { apiRequest } from '../../../lib/api';

export interface DashboardSummary {
  clients: {
    total: number;
    newProspects: number;
  };
  campaigns: {
    total: number;
    active: number;
    top: Array<{ id: string; name: string; budget: number | null; status: string }>;
  };
  influencers: {
    total: number;
    top: Array<{
      id: string;
      fullName: string;
      username: string | null;
      followers: number;
      pipelineStatus: string;
    }>;
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard/summary', { method: 'GET' });
}
