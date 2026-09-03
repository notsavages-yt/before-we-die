import {
  ActiveJournalProvider,
  useActiveJournal,
} from "@/hooks/useActiveJournal";
import type {
  BucketListItem,
  InvitationLink,
  Journal,
  Member,
  MemberRole,
} from "@/types";
import type { Principal } from "@icp-sdk/core/principal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { vi } from "vitest";

// The generated backend bindings import @caffeineai/object-storage, whose
// dist/index.js references a ./blob module that is not resolvable in the
// jsdom test environment. The frontend journeys do not exercise object
// storage, so we stub the module to let the app tree load.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: class ExternalBlob {},
}));

export interface MockActor {
  listMyJournals: () => Promise<Journal[]>;
  createJournal: (title: string, description: string) => Promise<Journal>;
  getJournal: (id: bigint) => Promise<Journal | null>;
  listMembers: (id: bigint) => Promise<Member[]>;
  generateInvitationLink: (id: bigint) => Promise<InvitationLink>;
  joinJournal: (code: string) => Promise<Journal>;
  removeMember: (id: bigint, member: Principal) => Promise<Journal>;
  listBucketListItems: (id: bigint) => Promise<BucketListItem[]>;
  addBucketListItem: (
    id: bigint,
    title: string,
    note: string,
  ) => Promise<BucketListItem>;
  editBucketListItem: (
    itemId: bigint,
    title: string,
    note: string,
  ) => Promise<BucketListItem | null>;
  setBucketListItemCompleted: (
    itemId: bigint,
    completed: boolean,
  ) => Promise<BucketListItem | null>;
  setBucketListItemVaulted: (
    itemId: bigint,
    vaulted: boolean,
  ) => Promise<BucketListItem | null>;
  deleteBucketListItem: (itemId: bigint) => Promise<boolean>;
}

export interface MockActorState {
  journals: Journal[];
  membersByJournal: Map<bigint, Member[]>;
  itemsByJournal: Map<bigint, BucketListItem[]>;
  invitations: Map<bigint, InvitationLink>;
}

let journalSeq = 1n;
let itemSeq = 1n;

export function createMockActor(
  state: MockActorState,
  owner: Principal,
): MockActor {
  return {
    async listMyJournals() {
      return state.journals;
    },
    async createJournal(title, description) {
      const journal: Journal = {
        id: journalSeq++,
        title,
        description,
        created: 1_700_000_000_000_000_000n,
        owner,
        members: [],
      };
      state.journals.push(journal);
      state.membersByJournal.set(journal.id, []);
      state.itemsByJournal.set(journal.id, []);
      return journal;
    },
    async getJournal(id) {
      return state.journals.find((j) => j.id === id) ?? null;
    },
    async listMembers(id) {
      return state.membersByJournal.get(id) ?? [];
    },
    async generateInvitationLink(id) {
      const link: InvitationLink = {
        code: `invite-${id.toString()}`,
        journalId: id,
        created: 1_700_000_000_000_000_000n,
      };
      state.invitations.set(id, link);
      return link;
    },
    async joinJournal(code) {
      const entry = [...state.invitations.entries()].find(
        ([, l]) => l.code === code,
      );
      if (!entry) throw new Error("invalid invitation");
      const journal = state.journals.find((j) => j.id === entry[0]);
      if (!journal) throw new Error("invalid invitation");
      return journal;
    },
    async removeMember(id, member) {
      const members = state.membersByJournal.get(id) ?? [];
      state.membersByJournal.set(
        id,
        members.filter((m) => m.principal.toString() !== member.toString()),
      );
      const journal = state.journals.find((j) => j.id === id);
      if (!journal) throw new Error("missing journal");
      return journal;
    },
    async listBucketListItems(id) {
      return state.itemsByJournal.get(id) ?? [];
    },
    async addBucketListItem(id, title, note) {
      const item: BucketListItem = {
        id: itemSeq++,
        title,
        note,
        created: 1_700_000_000_000_000_000n,
        completed: false,
        vaulted: false,
        journalId: id,
      };
      const items = state.itemsByJournal.get(id) ?? [];
      items.push(item);
      state.itemsByJournal.set(id, items);
      return item;
    },
    async editBucketListItem(itemId, title, note) {
      for (const items of state.itemsByJournal.values()) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          item.title = title;
          item.note = note;
          return item;
        }
      }
      return null;
    },
    async setBucketListItemCompleted(itemId, completed) {
      for (const items of state.itemsByJournal.values()) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          item.completed = completed;
          return item;
        }
      }
      return null;
    },
    async setBucketListItemVaulted(itemId, vaulted) {
      for (const items of state.itemsByJournal.values()) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          item.vaulted = vaulted;
          return item;
        }
      }
      return null;
    },
    async deleteBucketListItem(itemId) {
      for (const [key, items] of state.itemsByJournal.entries()) {
        const idx = items.findIndex((i) => i.id === itemId);
        if (idx >= 0) {
          items.splice(idx, 1);
          state.itemsByJournal.set(key, items);
          return true;
        }
      }
      return false;
    },
  };
}

export function freshState(): MockActorState {
  return {
    journals: [],
    membersByJournal: new Map(),
    itemsByJournal: new Map(),
    invitations: new Map(),
  };
}

export function makeJournal(
  id: bigint,
  title: string,
  owner: Principal,
  description = "",
  members: Member[] = [],
): Journal {
  return {
    id,
    title,
    description,
    created: 1_700_000_000_000_000_000n,
    owner,
    members,
  };
}

export function makeMember(principal: Principal, role: MemberRole): Member {
  return {
    principal,
    joinedAt: 1_700_000_000_000_000_000n,
    role,
  };
}

export function makeItem(
  id: bigint,
  journalId: bigint,
  title: string,
  note = "",
  completed = false,
  vaulted = false,
): BucketListItem {
  return {
    id,
    title,
    note,
    created: 1_700_000_000_000_000_000n,
    completed,
    vaulted,
    journalId,
  };
}

export function renderApp(
  ui: ReactNode,
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

/**
 * Set the active journal id once the ActiveJournalProvider is mounted. The
 * provider starts with a null id, and pages read it via useActiveJournal, so
 * we seed it before rendering the page under test.
 */
function ActiveJournalSetter({ id }: { id: bigint | null }) {
  const { setActiveJournalId } = useActiveJournal();
  useEffect(() => {
    setActiveJournalId(id);
  }, [id, setActiveJournalId]);
  return null;
}

/**
 * Render a single page component (not the whole routed app) with the providers
 * it needs. Rendering pages directly avoids the module-level TanStack Router
 * singleton in App.tsx, whose history persists across tests in the same file
 * and leaks the previous test's location into the next render.
 */
export function renderPage(
  ui: ReactNode,
  activeJournalId: bigint | null = null,
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveJournalProvider>
        <ActiveJournalSetter id={activeJournalId} />
        {ui}
      </ActiveJournalProvider>
    </QueryClientProvider>,
  );
}
