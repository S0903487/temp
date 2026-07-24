import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addInfluencerNote,
  addInfluencerTag,
  bulkDeleteInfluencers,
  bulkUpsertInfluencers,
  createInfluencer,
  deleteInfluencer,
  getInfluencer,
  getInfluencerFull,
  listInfluencerCampaignHistory,
  listInfluencerNotes,
  listInfluencers,
  listInfluencersPaginated,
  listInfluencerSnapshots,
  listInfluencerTags,
  listOrgTags,
  removeInfluencerNote,
  removeInfluencerTag,
  updateInfluencer,
} from '../services/influencerService';
import type {
  BulkUpdateItem,
  CreateInfluencerInput,
  InfluencerFull,
  ListInfluencersParams,
  UpdateInfluencerInput,
} from '../services/influencerService';

export function usePaginatedInfluencers(params: ListInfluencersParams) {
  return useQuery({
    queryKey: ['influencers', 'paginated', params],
    queryFn: () => listInfluencersPaginated(params),
    staleTime: 60 * 1000,
  });
}

export function useBulkUpsertInfluencers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkUpdateItem[]) => bulkUpsertInfluencers(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INFLUENCERS_QUERY_KEY });
    },
  });
}

export function useBulkDeleteInfluencers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteInfluencers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INFLUENCERS_QUERY_KEY });
    },
  });
}

import type { Influencer } from '../types';

const INFLUENCERS_QUERY_KEY = ['influencers'];
const influencerKey = (id: string) => ['influencers', id];
const tagsKey = (id: string) => ['influencers', id, 'tags'];
const notesKey = (id: string) => ['influencers', id, 'notes'];
const snapshotsKey = (id: string) => ['influencers', id, 'snapshots'];
const campaignHistoryKey = (id: string) => ['influencers', id, 'campaigns'];
const fullKey = (id: string) => ['influencers', id, 'full'];

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

// Fetches influencer + tags + notes + snapshots + campaign history in one
// request (one D1 batch() round trip server-side) instead of the profile
// page firing 5 separate queries. Use this on the profile page; use the
// individual hooks above elsewhere they're still needed on their own.
export function useInfluencerFull(id: string | undefined) {
  return useQuery({
    queryKey: fullKey(id ?? ''),
    queryFn: () => getInfluencerFull(id as string),
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
      queryClient.invalidateQueries({ queryKey: fullKey(id) });
    },
  });
}

export function useRemoveInfluencerTag(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => removeInfluencerTag(id, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKey(id) });
      queryClient.invalidateQueries({ queryKey: fullKey(id) });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey(id) });
      queryClient.invalidateQueries({ queryKey: fullKey(id) });
    },
  });
}

export function useRemoveInfluencerNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => removeInfluencerNote(id, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKey(id) });
      queryClient.invalidateQueries({ queryKey: fullKey(id) });
    },
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
      await queryClient.cancelQueries({ queryKey: fullKey(id) });

      // Snapshot the previous values
      const previousInfluencer = queryClient.getQueryData<Influencer>(influencerKey(id));
      const previousInfluencers = queryClient.getQueryData<Influencer[]>(INFLUENCERS_QUERY_KEY);
      const previousFull = queryClient.getQueryData<InfluencerFull>(fullKey(id));

      // Optimistically update details page query cache
      if (previousInfluencer) {
        queryClient.setQueryData<Influencer>(influencerKey(id), {
          ...previousInfluencer,
          ...data,
        });
      }

      // Optimistically update the profile page's composite query cache
      if (previousFull) {
        queryClient.setQueryData<InfluencerFull>(fullKey(id), {
          ...previousFull,
          influencer: { ...previousFull.influencer, ...data },
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

      return { previousInfluencer, previousInfluencers, previousFull };
    },
    onError: (_err, variables, context) => {
      // Rollback values if the request fails
      if (context?.previousInfluencer) {
        queryClient.setQueryData(influencerKey(variables.id), context.previousInfluencer);
      }
      if (context?.previousFull) {
        queryClient.setQueryData(fullKey(variables.id), context.previousFull);
      }
      if (context?.previousInfluencers) {
        queryClient.setQueryData(INFLUENCERS_QUERY_KEY, context.previousInfluencers);
      }
    },
    onSettled: (_data, _error, variables) => {
      // Invalidate queries to sync with actual backend state
      queryClient.invalidateQueries({ queryKey: INFLUENCERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: influencerKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: snapshotsKey(variables.id) });
      queryClient.invalidateQueries({ queryKey: fullKey(variables.id) });
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
