mixin () {
  public query func getApiDoc() : async Text {
    "# BEFORE WE DIE — Backend API

A shared bucket-list journal app. Users create journals, invite others to join
them, and maintain a shared bucket-list of items per journal. Items can be
marked complete and moved into a private 'vault'. The backend also exposes its
persisted data through an OQL query layer (schema / execute).

## Public methods

### Journals

- `createJournal(title : Text, description : Text) -> async Journal`
  Creates a new journal owned by the caller. `description` may be empty.
- `listMyJournals() -> async [Journal]` (query)
  Lists every journal the caller is a member of (owner or member).
- `getJournal(journalId : Nat) -> async ?Journal` (query)
  Returns the journal if the caller is a member, otherwise `null`.

### Bucket-list items

- `listBucketListItems(journalId : Nat) -> async [BucketListItem]` (query)
  Lists every bucket-list item of a journal the caller belongs to.
- `addBucketListItem(journalId : Nat, title : Text, note : Text) -> async BucketListItem`
  Adds an item to a journal the caller belongs to. `note` may be empty.
- `editBucketListItem(itemId : Nat, title : Text, note : Text) -> async ?BucketListItem`
  Updates an item's title and note. Returns the updated item, or `null` if the
  item does not exist.
- `setBucketListItemCompleted(itemId : Nat, completed : Bool) -> async ?BucketListItem`
  Sets an item's completion state. Returns the updated item or `null`.
- `setBucketListItemVaulted(itemId : Nat, vaulted : Bool) -> async ?BucketListItem`
  Moves an item into (or out of) the private vault. Returns the updated item or
  `null`.
- `deleteBucketListItem(itemId : Nat) -> async Bool`
  Removes an item. Returns `true` if an item was removed, `false` otherwise.

### People & invitations

- `listMembers(journalId : Nat) -> async [Member]` (query)
  Lists the members of a journal the caller belongs to.
- `generateInvitationLink(journalId : Nat) -> async InvitationLink`
  Creates a shareable invitation link for a journal the caller belongs to.
- `joinJournal(invitationCode : Text) -> async Journal`
  Joins the journal referenced by a valid invitation code, adding the caller as
  a member. Returns the joined journal.
- `removeMember(journalId : Nat, member : Principal) -> async Journal`
  Removes a member from a journal. Only the journal owner may call this.

### OQL data layer

- `schema() -> async Text` (query)
  Returns the JSON schema of the queryable entities.
- `execute(qJson : Text) -> async Result` (query)
  Runs a JSON OQL query against the exposed entities.

### Access control

- `_internet_identity_sign_in_start() -> async Blob`
  Begins an Internet Identity sign-in challenge.
- `_internet_identity_sign_in_finish() -> async Result.Result<(), Error>`
  Completes a sign-in and registers the caller.
- `_initialize_access_control() -> async ()`
  Registers the caller. The first caller to register becomes `#admin`; every
  subsequent caller becomes `#user`.
- `getCallerUserRole() -> async UserRole` (query)
  Returns the caller's role (`#admin`, `#user`, or `#guest`).
- `assignCallerUserRole(user : Principal, role : UserRole) -> async ()`
  Assigns a role to a user. Only an admin may assign roles.
- `isCallerAdmin() -> async Bool` (query)
  Returns whether the caller is an admin.

### Documentation

- `getApiDoc() -> async Text` (query)
  This document.

## Authentication and authorization

Every journal and item method requires a **signed-in (non-anonymous) caller**
with at least the `#user` role. Anonymous callers are `#guest` and are rejected
by every role-guarded method.

Registration happens only when a caller signs in through the app's own
frontend. The app's frontend pins an Internet Identity derivation origin,
published at `/.well-known/ii-derivation-origin` when available. An agent
already holding the user's Internet Identity authorization derives the correct
per-app principal against that origin (for example
`icp identity link web <name> --app <host>`). Such a delegation acts with the
user's full authority in this app until it expires.

A direct API caller registers by calling `_initialize_access_control()` once as
a signed-in caller before any role-guarded call (guarded queries included). The
first initializer receives the `#admin` role; every subsequent caller receives
`#user`. A caller can be unregistered while the app already knows it because
registration happens only through the app's own frontend sign-in — a principal
that never did so is unregistered even when it belongs to the app's owner, and
a signed-in caller derived against a different origin is a different principal
than the one the frontend registered.

An unregistered or anonymous caller on a guarded endpoint receives a trap with
the message `Unauthorized: Only users can perform this action`.

Beyond the user gate, journal-scoped methods require membership:

- `getJournal`, `listBucketListItems`, `addBucketListItem`, `editBucketListItem`,
  `setBucketListItemCompleted`, `setBucketListItemVaulted`,
  `deleteBucketListItem`, `listMembers`, `generateInvitationLink` require the
  caller to be a member (owner or member) of the target journal. A non-member
  traps with `Unauthorized: Not a member of this journal`.
- `removeMember` additionally requires the caller to be the journal owner. A
  non-owner traps with `Unauthorized: Only the owner can remove members`.

`createJournal`, `listMyJournals`, and `joinJournal` require only the user role,
not prior membership.

## Units and encodings

- **Identifiers**: `JournalId` and `ItemId` are `Nat` counters, unique per
  journal and per item respectively. They are assigned by the backend and never
  reused.
- **Timestamps**: `created` and `joinedAt` are `Int` nanoseconds since the Unix
  epoch (`Time.now()`).
- **Principals**: `owner` and `Member.principal` are Internet Computer
  principals, encoded as Candid `principal`.
- **Roles**: `MemberRole` is `#owner` or `#member`. `UserRole` is `#admin`,
  `#user`, or `#guest`.
- **Invitation codes**: `InvitationLink.code` is a `Text` of the form
  `<journalId>-<createdNs>`, unique per journal and creation time.
- **Optional values**: `getJournal`, `editBucketListItem`,
  `setBucketListItemCompleted`, and `setBucketListItemVaulted` return `?T`;
  `null` means the target does not exist (or, for `getJournal`, that the caller
  is not a member).

## Lifecycle and polling

There is no long-running or asynchronous work in this backend. All methods
complete within a single message; there is nothing to poll. `schema()` and
`execute()` reflect the current persisted state at call time.

## Mutation retry safety

- **Idempotent updates**: `editBucketListItem`, `setBucketListItemCompleted`,
  and `setBucketListItemVaulted` set absolute values, so re-sending the same
  call is safe and converges.
- **`joinJournal`** is idempotent: joining a journal the caller already belongs
  to returns the journal unchanged and does not duplicate the member.
- **`createJournal`** is not idempotent — each call creates a new journal with
  a fresh id.
- **`generateInvitationLink`** appends a new link each call; codes are unique
  per journal and creation time, so repeated calls produce distinct codes.
- **`deleteBucketListItem`** returns `false` if the item is already gone, so
  retrying is harmless.
- **`removeMember`** removes the member if present; removing a non-member is a
  no-op on the member list.

## Errors, traps, and limits

- Guarded methods **trap** (reject the message) rather than returning an error
  variant when the caller is unauthorized or the target is missing. A trap
  rolls back the whole message. Trap messages:
  - `Unauthorized: Only users can perform this action` — anonymous/guest caller.
  - `Unauthorized: Not a member of this journal` — caller not a member.
  - `Unauthorized: Only the owner can remove members` — non-owner on
    `removeMember`.
  - `Journal not found` — the journal id does not exist.
  - `Item not found` — the item id does not exist.
  - `Invalid invitation code` — the code does not match any generated link.
- `execute` traps with `OQL: invalid query — <detail>` on malformed JSON.

## Non-obvious gotchas

- `getJournal` returns `null` for a journal the caller is not a member of,
  rather than trapping — it does not reveal the journal's existence.
- `listMyJournals` returns only journals the caller belongs to; journals owned
  by others are never listed.
- Invitation codes are sensitive: anyone holding a valid code can join the
  journal. Codes are not revoked by this backend.
- `removeMember` cannot remove the owner (the owner is not in the `members`
  list), and a journal always retains its owner.
- OQL authorization is per entity: journals and items are `controllerOrScoped`
  (the platform controller reads all rows; a signed-in user reads only rows of
  journals they belong to), while invitations are controller-only and never
  readable by end users through OQL.
"
  };
};
