import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addInfluencerNote,
  addInfluencerTag,
  createInfluencer,
  deleteInfluencer,
  getInfluencer,
  listInfluencerCampaignHistory,
  listInfluencerNotes,
  listInfluencers,
  listInfluencerSnapshots,
  listInfluencerTags,
  listOrgTags,
  removeInfluencerNote,
  removeInfluencerTag,
  updateInfluencer,
} from '../services/influencerService';
import type { CreateInfluencerInput, UpdateInfluencerInput } from '../services/influencerService';
import type { Influencer } from '../types';

const INFLUENCERS_QUERY_KEY = ['influencers'];
const influencerKey = (id: string) => ['influencers', id];
const tagsKey = (id: string) => ['influencers', id, 'tags'];
const notesKey = (id: string) => ['influencers', id, 'notes'];
const snapshotsKey = (id: string) => ['influencers', id, 'snapshots'];
const campaignHistoryKey = (id: string) => ['influencers', id, 'campaigns'];

export function useInfluencers() {
  return useQuery({
    queryKey: INFLUENCERS_QUERY_KEY,
    queryFn: listInfluencers,
    staleTime: 60 * 1000,
  });
}

export function useInfluencer(id: string | undefined) {
  return useQuery({
    queryKey: influencerKey(id ?? ''),
    queryFn: () => getInfluencer(id as string),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useOrgTags() {
  return useQuery({ queryKey: ['tags'], queryFn: listOrgTags, staleTime: 60 * 1000 });
}

export function useInfluencerTags(id: string | undefined) {
  return useQuery({
    queryKey: tagsKey(id ?? ''),
    queryFn: () => listInfluencerTags(id as string),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useAddInfluencerTag(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => addInfluencerTag(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey(id) });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useRemoveInfluencerTag(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => removeInfluencerTag(id, tagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tagsKey(id) }),
  });
}

export function useInfluencerNotes(id: string | undefined) {
  return useQuery({
    queryKey: notesKey(id ?? ''),
    queryFn: () => listInfluencerNotes(id as string),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useAddInfluencerNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => addInfluencerNote(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey(id) }),
  });
}

export function useRemoveInfluencerNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => removeInfluencerNote(id, noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKey(id) }),
  });
}

export function useInfluencerSnapshots(id: string | undefined) {
  return useQuery({
    queryKey: snapshotsKey(id ?? ''),
    queryFn: () => listInfluencerSnapshots(id as string),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useInfluencerCampaignHistory(id: string | undefined) {
  return useQuery({
    queryKey: campaignHistoryKey(id ?? ''),
    queryFn: () => listInfluencerCampaignHistory(id as string),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateInfluencer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInfluencerInput) => createInfluencer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INFLUENCERS_QUERY_KEY });
    },
  });
}

export function useUpdateInfluencer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInfluencerInput }) => updateInfluencer(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: influencerKey(id) });
      await queryClient.cancelQueries({ queryKey: INFLUENCERS_QUERY_KEY });

      // Snapshot the previous values
      const previousInfluencer = queryClient.getQueryData<Influencer>(influencerKey(id));
      const previousInfluencers = queryClient.getQueryData<Influencer[]>(INFLUENCERS_QUERY_KEY);

      // Optimistically update details page query cache
      if (previousInfluencer) {
        queryClient.setQueryData<Influencer>(influencerKey(id), {
          ...previousInfluencer,
          ...data,
        });
      }

      // Optimistically update all influencers list query cache
      if (previousInfluencers) {
        queryClient.setQueryData<Influencer[]>(
          INFLUENCERS_QUERY_KEY,
          previousInfluencers.map((inf) =>
            inf.id === id ? { ...inf, ...data } : inf
          )
        );
      }

      return { previousInfluencer, previousInfluencers };
    },
    onError: (_err, variables, context) => {
      // Rollback values if the request fails
      if (context?.previousInfluencer) {
        queryClient.setQueryData(influencerKey(variables.id), context.previousInfluencer);
      }
      if (context?.previousInfluencers) {
        queryClient.setQueryData(INFLUENCERS_QUERY_KEY, context.previousInfluencer);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Invalidate queries to sync with actual backend state
      queryClient.invalidateQueries({ queryKey: INFLUENCERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: influencerKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: snapshotsKey(variables.id) });
    },
  });
}

export function useDeleteInfluencer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInfluencer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INFLUENCERS_QUERY_KEY });
    },
  });
}
