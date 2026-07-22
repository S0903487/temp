import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../services/dashboardService';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
    staleTime: 60 * 1000,
  });
}
