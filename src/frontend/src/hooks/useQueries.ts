import type { BucketListItem, InvitationLink, Journal, JournalId, Member } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const MemberRole = {
  member: "member",
  owner: "owner",
} as const;

// Motoko nanosecond timestamp helper without raw BigInt literal
const getNowNano = (): bigint => {
  return BigInt(Date.now()) * BigInt(1000000);
};

// Safe JSON serialization for BigInt
const getStored = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw, (_, value) => {
      if (typeof value === "string" && /^\d+n$/.test(value)) {
        return BigInt(value.slice(0, -1));
      }
      return value;
    });
  } catch {
    return fallback;
  }
};

const setStored = <T>(key: string, value: T): void => {
  const serialized = JSON.stringify(value, (_, v) =>
    typeof v === "bigint" ? v.toString() + "n" : v
  );
  localStorage.setItem(key, serialized);
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
      const now = getNowNano();
      const newJournal: Journal = {
        id: now,
        title,
        description,
        created: now,
        owner: "self" as any,
        members: [
          {
            principal: "self" as any,
            joinedAt: now,
            role: MemberRole.owner as any,
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
    queryKey: ["journal", journalId ? String(journalId) : null],
    queryFn: async (): Promise<Journal | null> => {
      if (journalId === null || journalId === undefined) return null;
      const journals = getStored<Journal[]>("bwd_journals", []);
      return journals.find((j) => String(j.id) === String(journalId)) || null;
    },
    enabled: journalId !== null && journalId !== undefined,
  });
}

export function useMembers(journalId: JournalId | null) {
  return useQuery({
    queryKey: ["members", journalId ? String(journalId) : null],
    queryFn: async (): Promise<Member[]> => {
      if (journalId === null || journalId === undefined) return [];
      const journals = getStored<Journal[]>("bwd_journals", []);
      const journal = journals.find((j) => String(j.id) === String(journalId));
      return journal?.members || [];
    },
    enabled: journalId !== null && journalId !== undefined,
  });
}

export function useGenerateInvitationLink() {
  return useMutation({
    mutationFn: async (journalId: JournalId): Promise<InvitationLink> => {
      const journals = getStored<Journal[]>("bwd_journals", []);
      const targetJournal = journals.find((j) => String(j.id) === String(journalId));
      
      // Encode basic journal metadata so it can be restored on another device/browser
      const payload = {
        id: String(journalId),
        title: targetJournal?.title || "Shared Journal",
        desc: targetJournal?.description || "",
        t: Date.now(),
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const code = `invite_${encoded}`;

      return {
        created: getNowNano(),
        code,
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
      let targetJournalId: string | null = null;
      let fallbackTitle = "Shared Journal";
      let fallbackDesc = "";

      if (invitationCode.startsWith("invite_")) {
        const rawPayload = invitationCode.replace("invite_", "");
        try {
          // If it's a base64 encoded journal payload
          const parsed = JSON.parse(decodeURIComponent(escape(atob(rawPayload))));
          targetJournalId = parsed.id;
          fallbackTitle = parsed.title;
          fallbackDesc = parsed.desc;
        } catch {
          // Legacy format: invite_<journalId>_<random>
          const parts = invitationCode.split("_");
          if (parts[1]) targetJournalId = parts[1];
        }
      }

      let journal = journals.find((j) => String(j.id) === String(targetJournalId));

      // If opening on a new browser/device where the journal does not exist yet:
      if (!journal) {
        const now = getNowNano();
        journal = {
          id: targetJournalId ? BigInt(targetJournalId) : now,
          title: fallbackTitle,
          description: fallbackDesc,
          created: now,
          owner: "creator" as any,
          members: [],
        };
        journals.push(journal);
      }

      // Add guest/member to the journal members list
      const memberId = "guest_" + Math.random().toString(36).substring(7);
      if (!journal.members) journal.members = [];
      
      const alreadyMember = journal.members.some((m) => String(m.principal) === memberId);
      if (!alreadyMember) {
        journal.members.push({
          principal: memberId as any,
          joinedAt: getNowNano(),
          role: MemberRole.member as any,
        });
      }

      setStored("bwd_journals", journals);
      return journal;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["journals"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journalId }: { journalId: JournalId; member: any }) => {
      return { id: journalId } as Journal;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

export function useBucketListItems(journalId: JournalId | null) {
  return useQuery({
    queryKey: ["bucketListItems", journalId ? String(journalId) : null],
    queryFn: async (): Promise<BucketListItem[]> => {
      if (journalId === null || journalId === undefined) return [];
      const allItems = getStored<BucketListItem[]>("bwd_items", []);
      return allItems.filter((i) => String(i.journalId) === String(journalId));
    },
    enabled: journalId !== null && journalId !== undefined,
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
      const now = getNowNano();
      const newItem: BucketListItem = {
        id: now,
        journalId: BigInt(String(journalId)),
        title,
        note: note || "",
        completed: false,
        vaulted: false,
        created: now,
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
