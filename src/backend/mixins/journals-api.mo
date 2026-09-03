import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/journals";
import JournalsLib "../lib/journals";

mixin (
  accessControlState : AccessControl.AccessControlState,
  journals : List.List<Types.Journal>,
  items : List.List<Types.BucketListItem>,
  invitations : List.List<Types.InvitationLink>,
  nextJournalId : { var next : Types.JournalId },
  nextItemId : { var next : Types.ItemId },
) {
  func requireUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  func isMember(j : Types.Journal, p : Principal) : Bool {
    j.owner == p or j.members.any(func m = m.principal == p);
  };

  func requireMember(j : Types.Journal, caller : Principal) {
    if (not isMember(j, caller)) {
      Runtime.trap("Unauthorized: Not a member of this journal");
    };
  };

  func replaceItem(updated : Types.BucketListItem) {
    let snapshot = items.toArray();
    items.clear();
    for (i in snapshot.values()) {
      if (i.id == updated.id) { items.add(updated) } else { items.add(i) };
    };
  };

  func removeItemById(itemId : Types.ItemId) : Bool {
    var removed = false;
    let snapshot = items.toArray();
    items.clear();
    for (i in snapshot.values()) {
      if (i.id == itemId) { removed := true } else { items.add(i) };
    };
    removed;
  };

  func replaceJournal(updated : Types.Journal) {
    let snapshot = journals.toArray();
    journals.clear();
    for (j in snapshot.values()) {
      if (j.id == updated.id) { journals.add(updated) } else { journals.add(j) };
    };
  };

  public shared ({ caller }) func createJournal(title : Text, description : Text) : async Types.Journal {
    requireUser(caller);
    let created = Time.now();
    let base = JournalsLib.createJournal(caller, title, description, created);
    let journal = { base with id = nextJournalId.next };
    nextJournalId.next += 1;
    journals.add(journal);
    journal;
  };

  public query ({ caller }) func listMyJournals() : async [Types.Journal] {
    requireUser(caller);
    JournalsLib.listJournals(caller, journals.toArray());
  };

  public query ({ caller }) func getJournal(journalId : Types.JournalId) : async ?Types.Journal {
    requireUser(caller);
    switch (JournalsLib.getJournal(journals.toArray(), journalId)) {
      case (?j) {
        if (isMember(j, caller)) { ?j } else { null };
      };
      case null { null };
    };
  };

  public query ({ caller }) func listBucketListItems(journalId : Types.JournalId) : async [Types.BucketListItem] {
    requireUser(caller);
    let journal = JournalsLib.getJournal(journals.toArray(), journalId) ?? Runtime.trap("Journal not found");
    requireMember(journal, caller);
    JournalsLib.listItems(items.toArray(), journalId);
  };

  public shared ({ caller }) func addBucketListItem(
    journalId : Types.JournalId,
    title : Text,
    note : Text,
  ) : async Types.BucketListItem {
    requireUser(caller);
    let journal = JournalsLib.getJournal(journals.toArray(), journalId) ?? Runtime.trap("Journal not found");
    requireMember(journal, caller);
    let created = Time.now();
    let base = JournalsLib.addItem(items.toArray(), journalId, title, note, created);
    let item = { base with id = nextItemId.next };
    nextItemId.next += 1;
    items.add(item);
    item;
  };

  public shared ({ caller }) func editBucketListItem(
    itemId : Types.ItemId,
    title : Text,
    note : Text,
  ) : async ?Types.BucketListItem {
    requireUser(caller);
    let item = items.find(func i = i.id == itemId) ?? Runtime.trap("Item not found");
    let journal = JournalsLib.getJournal(journals.toArray(), item.journalId) ?? Runtime.trap("Journal not found");
    requireMember(journal, caller);
    switch (JournalsLib.editItem(items.toArray(), itemId, title, note)) {
      case (?u) {
        replaceItem(u);
        ?u;
      };
      case null { null };
    };
  };

  public shared ({ caller }) func setBucketListItemCompleted(
    itemId : Types.ItemId,
    completed : Bool,
  ) : async ?Types.BucketListItem {
    requireUser(caller);
    let item = items.find(func i = i.id == itemId) ?? Runtime.trap("Item not found");
    let journal = JournalsLib.getJournal(journals.toArray(), item.journalId) ?? Runtime.trap("Journal not found");
    requireMember(journal, caller);
    switch (JournalsLib.setItemCompleted(items.toArray(), itemId, completed)) {
      case (?u) {
        replaceItem(u);
        ?u;
      };
      case null { null };
    };
  };

  public shared ({ caller }) func setBucketListItemVaulted(
    itemId : Types.ItemId,
    vaulted : Bool,
  ) : async ?Types.BucketListItem {
    requireUser(caller);
    let item = items.find(func i = i.id == itemId) ?? Runtime.trap("Item not found");
    let journal = JournalsLib.getJournal(journals.toArray(), item.journalId) ?? Runtime.trap("Journal not found");
    requireMember(journal, caller);
    switch (JournalsLib.setItemVaulted(items.toArray(), itemId, vaulted)) {
      case (?u) {
        replaceItem(u);
        ?u;
      };
      case null { null };
    };
  };

  public shared ({ caller }) func deleteBucketListItem(itemId : Types.ItemId) : async Bool {
    requireUser(caller);
    let item = items.find(func i = i.id == itemId) ?? Runtime.trap("Item not found");
    let journal = JournalsLib.getJournal(journals.toArray(), item.journalId) ?? Runtime.trap("Journal not found");
    requireMember(journal, caller);
    removeItemById(itemId);
  };

  public query ({ caller }) func listMembers(journalId : Types.JournalId) : async [Types.Member] {
    requireUser(caller);
    let journal = JournalsLib.getJournal(journals.toArray(), journalId) ?? Runtime.trap("Journal not found");
    requireMember(journal, caller);
    JournalsLib.listMembers(journal);
  };

  public shared ({ caller }) func generateInvitationLink(journalId : Types.JournalId) : async Types.InvitationLink {
    requireUser(caller);
    let journal = JournalsLib.getJournal(journals.toArray(), journalId) ?? Runtime.trap("Journal not found");
    requireMember(journal, caller);
    let created = Time.now();
    let link = JournalsLib.generateInvitationLink(journalId, created);
    invitations.add(link);
    link;
  };

  public shared ({ caller }) func joinJournal(invitationCode : Text) : async Types.Journal {
    requireUser(caller);
    let link = invitations.find(func l = l.code == invitationCode) ?? Runtime.trap("Invalid invitation code");
    let journal = JournalsLib.getJournal(journals.toArray(), link.journalId) ?? Runtime.trap("Journal not found");
    let joined = JournalsLib.joinJournal(journal, caller, Time.now());
    replaceJournal(joined);
    joined;
  };

  public shared ({ caller }) func removeMember(journalId : Types.JournalId, member : Principal) : async Types.Journal {
    requireUser(caller);
    let journal = JournalsLib.getJournal(journals.toArray(), journalId) ?? Runtime.trap("Journal not found");
    if (journal.owner != caller) {
      Runtime.trap("Unauthorized: Only the owner can remove members");
    };
    let updated = JournalsLib.removeMember(journal, member);
    replaceJournal(updated);
    updated;
  };
};
