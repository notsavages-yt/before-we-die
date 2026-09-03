import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InvitationLink {
    created: Timestamp;
    code: string;
    journalId: JournalId;
}
export type Timestamp = bigint;
export interface BucketListItem {
    id: ItemId;
    title: string;
    created: Timestamp;
    note: string;
    completed: boolean;
    journalId: JournalId;
    vaulted: boolean;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type JournalId = bigint;
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Journal {
    id: JournalId;
    title: string;
    created: Timestamp;
    members: Array<Member>;
    owner: Principal;
    description: string;
}
export type ItemId = bigint;
export interface Cell {
    value: Value;
    name: string;
}
export interface Member {
    principal: Principal;
    joinedAt: Timestamp;
    role: MemberRole;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum MemberRole {
    member = "member",
    owner = "owner"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBucketListItem(journalId: JournalId, title: string, note: string): Promise<BucketListItem>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createJournal(title: string, description: string): Promise<Journal>;
    deleteBucketListItem(itemId: ItemId): Promise<boolean>;
    editBucketListItem(itemId: ItemId, title: string, note: string): Promise<BucketListItem | null>;
    execute(qJson: string): Promise<Result>;
    generateInvitationLink(journalId: JournalId): Promise<InvitationLink>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getJournal(journalId: JournalId): Promise<Journal | null>;
    isCallerAdmin(): Promise<boolean>;
    joinJournal(invitationCode: string): Promise<Journal>;
    listBucketListItems(journalId: JournalId): Promise<Array<BucketListItem>>;
    listMembers(journalId: JournalId): Promise<Array<Member>>;
    listMyJournals(): Promise<Array<Journal>>;
    removeMember(journalId: JournalId, member: Principal): Promise<Journal>;
    schema(): Promise<string>;
    setBucketListItemCompleted(itemId: ItemId, completed: boolean): Promise<BucketListItem | null>;
    setBucketListItemVaulted(itemId: ItemId, vaulted: boolean): Promise<BucketListItem | null>;
}
