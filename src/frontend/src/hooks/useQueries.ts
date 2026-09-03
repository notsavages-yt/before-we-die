import type { BucketListItem, InvitationLink, Journal, JournalId, Member } from "@/types";
import { MemberRole } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Helper utilities for local persistence
const getStored = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export function useJournals() {
  return useQuery({
    queryKey: ["journals"],
    queryFn: async (): Promise<Journal[]> => {
      return getStored<Journal[]>("bwd_journals", []);
    },
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string;
      description: string;
    }): Promise<Journal> => {
      const journals = getStored<Journal[]>("bwd_journals", []);
      const newJournal: Journal = {
        id: BigInt(Date.now()),
        title,
        description,
        created: BigInt(Date.now()),
        owner: "self" as any,
        members: [
          {
            principal: "self" as any,
            joinedAt: BigInt(Date.now()),
            role: MemberRole.owner,
          },
        ],
      };
      journals.push(newJournal);
      setStored("bwd_journals", journals);
      return newJournal;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useJournal(journalId: JournalId | null) {
  return useQuery({
    queryKey: ["journal", journalId],
    queryFn: async (): Promise<Journal | null> => {
      if (journalId === null) return null;
      const journals = getStored<Journal[]>("bwd_journals", []);
      return journals.find((j) => String(j.id) === String(journalId)) || null;
    },
    enabled: journalId !== null,
  });
}

export function useMembers(journalId: JournalId | null) {
  return useQuery({
    queryKey: ["members", journalId],
    queryFn: async (): Promise<Member[]> => {
      if (journalId === null) return [];
      const journals = getStored<Journal[]>("bwd_journals", []);
      const journal = journals.find((j) => String(j.id) === String(journalId));
      return journal?.members || [];
    },
    enabled: journalId !== null,
  });
}

export function useGenerateInvitationLink() {
  return useMutation({
    mutationFn: async (journalId: JournalId): Promise<InvitationLink> => {
      return {
        created: BigInt(Date.now()),
        code: `invite_${journalId}_${Math.random().toString(36).substring(7)}`,
        journalId,
      };
    },
  });
}

export function useJoinJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationCode: string): Promise<Journal> => {
      const journals = getStored<Journal[]>("bwd_journals", []);
      if (journals.length > 0) return journals[0];
      throw new Error("Invalid invitation code");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journalId }: { journalId: JournalId; member: any }) => {
      return {} as Journal;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useBucketListItems(journalId: JournalId | null) {
  return useQuery({
    queryKey: ["bucketListItems", journalId],
    queryFn: async (): Promise<BucketListItem[]> => {
      if (journalId === null) return [];
      const allItems = getStored<BucketListItem[]>("bwd_items", []);
      return allItems.filter((i) => String(i.journalId) === String(journalId));
    },
    enabled: journalId !== null,
  });
}

export function useAddBucketListItem() {
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
    }): Promise<BucketListItem> => {
      const items = getStored<BucketListItem[]>("bwd_items", []);
      const newItem: BucketListItem = {
        id: BigInt(Date.now()),
        journalId,
        title,
        note,
        completed: false,
        vaulted: false,
        created: BigInt(Date.now()),
      };
      items.push(newItem);
      setStored("bwd_items", items);
      return newItem;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}

export function useEditBucketListItem() {
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
    }): Promise<BucketListItem | null> => {
      const items = getStored<BucketListItem[]>("bwd_items", []);
      const item = items.find((i) => String(i.id) === String(itemId));
      if (item) {
        item.title = title;
        item.note = note;
        setStored("bwd_items", items);
        return item;
      }
      return null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}

export function useSetBucketListItemCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      completed,
    }: {
      itemId: bigint;
      completed: boolean;
    }): Promise<BucketListItem | null> => {
      const items = getStored<BucketListItem[]>("bwd_items", []);
      const item = items.find((i) => String(i.id) === String(itemId));
      if (item) {
        item.completed = completed;
        setStored("bwd_items", items);
        return item;
      }
      return null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}

export function useSetBucketListItemVaulted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      vaulted,
    }: {
      itemId: bigint;
      vaulted: boolean;
    }): Promise<BucketListItem | null> => {
      const items = getStored<BucketListItem[]>("bwd_items", []);
      const item = items.find((i) => String(i.id) === String(itemId));
      if (item) {
        item.vaulted = vaulted;
        setStored("bwd_items", items);
        return item;
      }
      return null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}

export function useDeleteBucketListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: bigint): Promise<boolean> => {
      let items = getStored<BucketListItem[]>("bwd_items", []);
      items = items.filter((i) => String(i.id) !== String(itemId));
      setStored("bwd_items", items);
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}
