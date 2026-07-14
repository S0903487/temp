import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCampaign,
  deleteCampaign,
  linkInfluencerToCampaign,
  listCampaigns,
  unlinkInfluencerFromCampaign,
  updateCampaign,
} from '../services/campaignService';
import type { CreateCampaignInput, UpdateCampaignInput } from '../types';

const CAMPAIGNS_QUERY_KEY = ['campaigns'];

export function useCampaigns() {
  return useQuery({
    queryKey: CAMPAIGNS_QUERY_KEY,
    queryFn: listCampaigns,
    staleTime: 60 * 1000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignInput) => createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignInput }) => updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });
}

export function useLinkInfluencer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, influencerId }: { campaignId: string; influencerId: string }) =>
      linkInfluencerToCampaign(campaignId, influencerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });
}

export function useUnlinkInfluencer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, influencerId }: { campaignId: string; influencerId: string }) =>
      unlinkInfluencerFromCampaign(campaignId, influencerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
    },
  });
}
