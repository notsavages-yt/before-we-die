import { supabase } from "@/lib/supabase";
import type { BucketListItem, InvitationLink, Journal, JournalId, Member } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const MemberRole = {
  member: "member",
  owner: "owner",
} as const;

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string;
  dob: string;
  bio: string;
}

export function getMyIdentity(): { id: string; name: string } {
  let id = localStorage.getItem("bwd_user_id");
  let name = localStorage.getItem("bwd_user_name");

  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("bwd_user_id", id);
  }
  if (!name) {
    name = "Explorer " + id.substring(5, 8).toUpperCase();
    localStorage.setItem("bwd_user_name", name);
  }
  return { id, name };
}

// ----------------- PROFILES -----------------

export function useMyProfile() {
  const me = getMyIdentity();
  return useQuery({
    queryKey: ["myProfile", me.id],
    queryFn: async (): Promise<UserProfile> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", me.id)
        .maybeSingle();

      if (error || !data) {
        return {
          id: me.id,
          displayName: me.name,
          avatarUrl: "",
          dob: "",
          bio: "",
        };
      }

      return {
        id: data.id,
        displayName: data.display_name || me.name,
        avatarUrl: data.avatar_url || "",
        dob: data.dob || "",
        bio: data.bio || "",
      };
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<UserProfile>): Promise<void> => {
      const me = getMyIdentity();
      const newName = profile.displayName || me.name;
      localStorage.setItem("bwd_user_name", newName);

      const payload: Record<string, any> = {
        id: me.id,
        updated_at: Date.now(),
      };
      if (profile.displayName !== undefined) payload.display_name = profile.displayName;
      if (profile.avatarUrl !== undefined) payload.avatar_url = profile.avatarUrl;
      if (profile.dob !== undefined) payload.dob = profile.dob;
      if (profile.bio !== undefined) payload.bio = profile.bio;

      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;

      // Update name in members table so collaborative members see it
      if (profile.displayName) {
        await supabase
          .from("members")
          .update({ user_name: profile.displayName })
          .eq("id_str", me.id);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// ----------------- JOURNALS -----------------

export function useJournals() {
  return useQuery({
    queryKey: ["journals"],
    queryFn: async (): Promise<Journal[]> => {
      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .order("created", { ascending: false });

      if (error) throw error;

      return (data || []).map((j) => ({
        id: BigInt(j.id),
        title: j.title,
        description: j.description || "",
        created: BigInt(j.created) * 1_000_000n,
        owner: j.owner as any,
        members: [],
      }));
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
      const id = String(Date.now());
      const now = Date.now();
      const me = getMyIdentity();

      const { error: jError } = await supabase.from("journals").insert({
        id,
        title,
        description: description || "",
        created: now,
        owner: me.name,
      });
      if (jError) throw jError;

      const { error: mError } = await supabase.from("members").insert({
        journal_id: id,
        user_name: me.name,
        role: MemberRole.owner,
        joined_at: now,
      });
      if (mError) throw mError;

      return {
        id: BigInt(id),
        title,
        description,
        created: BigInt(now) * 1_000_000n,
        owner: me.name as any,
        members: [
          {
            principal: me.name as any,
            joinedAt: BigInt(now) * 1_000_000n,
            role: MemberRole.owner as any,
          },
        ],
      };
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
      if (!journalId) return null;

      const { data, error } = await supabase
        .from("journals")
        .select("*")
        .eq("id", String(journalId))
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: BigInt(data.id),
        title: data.title,
        description: data.description || "",
        created: BigInt(data.created) * 1_000_000n,
        owner: data.owner as any,
        members: [],
      };
    },
    enabled: Boolean(journalId),
  });
}

// ----------------- MEMBERS -----------------

export function useMembers(journalId: JournalId | null) {
  return useQuery({
    queryKey: ["members", journalId ? String(journalId) : null],
    queryFn: async (): Promise<Member[]> => {
      if (!journalId) return [];

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("journal_id", String(journalId))
        .order("joined_at", { ascending: true });

      if (error) return [];

      return (data || []).map((m) => ({
        principal: m.user_name as any,
        joinedAt: BigInt(m.joined_at) * 1_000_000n,
        role: (m.role || MemberRole.member) as any,
      }));
    },
    enabled: Boolean(journalId),
  });
}

export function useGenerateInvitationLink() {
  return useMutation({
    mutationFn: async (journalId: JournalId): Promise<InvitationLink> => {
      return {
        created: BigInt(Date.now()) * 1_000_000n,
        code: `invite_${String(journalId)}`,
        journalId,
      };
    },
  });
}

export function useJoinJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationCode: string): Promise<Journal> => {
      let journalId = invitationCode.replace("invite_", "");

      try {
        if (journalId.startsWith("eyJ")) {
          const parsed = JSON.parse(decodeURIComponent(escape(atob(journalId))));
          if (parsed.id) journalId = parsed.id;
        }
      } catch {}

      const { data: journal, error: jError } = await supabase
        .from("journals")
        .select("*")
        .eq("id", journalId)
        .single();

      if (jError || !journal) throw new Error("Journal not found.");

      const me = getMyIdentity();

      const { data: existing } = await supabase
        .from("members")
        .select("id")
        .eq("journal_id", journalId)
        .eq("user_name", me.name);

      if (!existing || existing.length === 0) {
        await supabase.from("members").insert({
          journal_id: journalId,
          user_name: me.name,
          role: MemberRole.member,
          joined_at: Date.now(),
        });
      }

      return {
        id: BigInt(journal.id),
        title: journal.title,
        description: journal.description || "",
        created: BigInt(journal.created) * 1_000_000n,
        owner: journal.owner as any,
        members: [],
      };
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
    mutationFn: async ({
      journalId,
      member,
    }: {
      journalId: JournalId;
      member: any;
    }) => {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("journal_id", String(journalId))
        .eq("user_name", String(member));

      if (error) throw error;
      return { id: journalId } as Journal;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// ----------------- BUCKET ITEMS -----------------

export function useBucketListItems(journalId: JournalId | null) {
  return useQuery({
    queryKey: ["bucketListItems", journalId ? String(journalId) : null],
    queryFn: async (): Promise<BucketListItem[]> => {
      if (!journalId) return [];

      const { data, error } = await supabase
        .from("bucket_items")
        .select("*")
        .eq("journal_id", String(journalId))
        .order("created", { ascending: true });

      if (error) return [];

      return (data || []).map((i) => ({
        id: BigInt(i.id),
        journalId: BigInt(i.journal_id),
        title: i.title,
        note: i.note || "",
        completed: Boolean(i.completed),
        vaulted: Boolean(i.vaulted),
        created: BigInt(i.created) * 1_000_000n,
      }));
    },
    enabled: Boolean(journalId),
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
      const id = String(Date.now());
      const now = Date.now();

      const { error } = await supabase.from("bucket_items").insert({
        id,
        journal_id: String(journalId),
        title,
        note: note || "",
        completed: false,
        vaulted: false,
        created: now,
      });

      if (error) throw error;

      return {
        id: BigInt(id),
        journalId: BigInt(String(journalId)),
        title,
        note: note || "",
        completed: false,
        vaulted: false,
        created: BigInt(now) * 1_000_000n,
      };
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
      const { error } = await supabase
        .from("bucket_items")
        .update({ title, note })
        .eq("id", String(itemId));

      if (error) throw error;
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
      const { error } = await supabase
        .from("bucket_items")
        .update({ completed })
        .eq("id", String(itemId));

      if (error) throw error;
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
      const { error } = await supabase
        .from("bucket_items")
        .update({ vaulted })
        .eq("id", String(itemId));

      if (error) throw error;
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
      const { error } = await supabase
        .from("bucket_items")
        .delete()
        .eq("id", String(itemId));

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bucketListItems"] });
    },
  });
}
