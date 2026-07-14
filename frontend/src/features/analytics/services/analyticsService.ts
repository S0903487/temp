import { apiRequest } from '../../../lib/api';
import type { AnalyticsRecord, CreateAnalyticsInput } from '../types';

export async function listAnalytics(): Promise<AnalyticsRecord[]> {
  return apiRequest<AnalyticsRecord[]>('/analytics', { method: 'GET' });
}

export async function createAnalyticsRecord(data: CreateAnalyticsInput): Promise<AnalyticsRecord> {
  return apiRequest<AnalyticsRecord>('/analytics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
