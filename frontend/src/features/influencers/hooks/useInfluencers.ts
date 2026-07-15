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
  });
}

export function useInfluencerCampaignHistory(id: string | undefined) {
  return useQuery({
    queryKey: campaignHistoryKey(id ?? ''),
    queryFn: () => listInfluencerCampaignHistory(id as string),
    enabled: Boolean(id),
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
    onSuccess: (_result, variables) => {
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
