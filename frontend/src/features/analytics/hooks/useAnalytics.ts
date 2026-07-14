import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAnalyticsRecord, listAnalytics } from '../services/analyticsService';
import type { CreateAnalyticsInput } from '../types';

const ANALYTICS_QUERY_KEY = ['analytics'];

export function useAnalyticsRecords() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: listAnalytics,
    staleTime: 60 * 1000,
  });
}

export function useCreateAnalyticsRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnalyticsInput) => createAnalyticsRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
}
