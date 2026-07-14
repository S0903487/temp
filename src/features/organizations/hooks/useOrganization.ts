import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentOrganization, updateCurrentOrganization } from '../services/organizationService';
import type { UpdateOrganizationInput } from '../types';

const ORG_QUERY_KEY = ['organization', 'current'];

export function useOrganization() {
  return useQuery({
    queryKey: ORG_QUERY_KEY,
    queryFn: getCurrentOrganization,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationInput) => updateCurrentOrganization(data),
    onSuccess: (organization) => {
      queryClient.setQueryData(ORG_QUERY_KEY, organization);
    },
  });
}
