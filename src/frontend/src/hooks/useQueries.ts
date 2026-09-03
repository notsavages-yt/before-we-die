import { createActor } from "@/backend";
import type { JournalId } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useJournals() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["journals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyJournals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateJournal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createJournal(title, description);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useJournal(journalId: JournalId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["journal", journalId],
    queryFn: async () => {
      if (!actor || journalId === null) return null;
      return actor.getJournal(journalId);
    },
    enabled: !!actor && !isFetching && journalId !== null,
  });
}

export function useMembers(journalId: JournalId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["members", journalId],
    queryFn: async () => {
      if (!actor || journalId === null) return [];
      return actor.listMembers(journalId);
    },
    enabled: !!actor && !isFetching && journalId !== null,
  });
}

export function useGenerateInvitationLink() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (journalId: JournalId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.generateInvitationLink(journalId);
    },
  });
}

export function useJoinJournal() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationCode: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.joinJournal(invitationCode);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      journalId,
      member,
    }: {
      journalId: JournalId;
      member: Principal;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeMember(journalId, member);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useBucketListItems(journalId: JournalId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["bucketListItems", journalId],
    queryFn: async () => {
      if (!actor || journalId === null) return [];
      return actor.listBucketListItems(journalId);
    },
    enabled: !!actor && !isFetching && journalId !== null,
  });
}

export function useAddBucketListItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      journalId,
      title,
      note,
    }: {
      journalId: JournalId;
      title: string;
      note: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addBucketListItem(journalId, title, note);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}

export function useEditBucketListItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      title,
      note,
    }: {
      itemId: bigint;
      title: string;
      note: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.editBucketListItem(itemId, title, note);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}

export function useSetBucketListItemCompleted() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      completed,
    }: {
      itemId: bigint;
      completed: boolean;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setBucketListItemCompleted(itemId, completed);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}

export function useSetBucketListItemVaulted() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      vaulted,
    }: {
      itemId: bigint;
      vaulted: boolean;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setBucketListItemVaulted(itemId, vaulted);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}

export function useDeleteBucketListItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteBucketListItem(itemId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}
