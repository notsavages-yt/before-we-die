import Principal "mo:core/Principal";
import Types "../types/journals";

module {
  func isMember(j : Types.Journal, p : Principal) : Bool {
    j.owner == p or j.members.any(func m = m.principal == p);
  };

  public func createJournal(
    caller : Principal,
    title : Text,
    description : Text,
    created : Types.Timestamp,
  ) : Types.Journal {
    {
      id = 0;
      title;
      description;
      owner = caller;
      members = [];
      created;
    };
  };

  public func listJournals(caller : Principal, journals : [Types.Journal]) : [Types.Journal] {
    journals.filter(func j = isMember(j, caller));
  };

  public func getJournal(journals : [Types.Journal], journalId : Types.JournalId) : ?Types.Journal {
    journals.find(func j = j.id == journalId);
  };

  public func listItems(
    items : [Types.BucketListItem],
    journalId : Types.JournalId,
  ) : [Types.BucketListItem] {
    items.filter(func i = i.journalId == journalId);
  };

  public func addItem(
    _items : [Types.BucketListItem],
    journalId : Types.JournalId,
    title : Text,
    note : Text,
    created : Types.Timestamp,
  ) : Types.BucketListItem {
    {
      id = 0;
      journalId;
      title;
      note;
      completed = false;
      vaulted = false;
      created;
    };
  };

  public func editItem(
    items : [Types.BucketListItem],
    itemId : Types.ItemId,
    title : Text,
    note : Text,
  ) : ?Types.BucketListItem {
    switch (items.find(func i = i.id == itemId)) {
      case (?item) { ?{ item with title; note } };
      case null { null };
    };
  };

  public func setItemCompleted(
    items : [Types.BucketListItem],
    itemId : Types.ItemId,
    completed : Bool,
  ) : ?Types.BucketListItem {
    switch (items.find(func i = i.id == itemId)) {
      case (?item) { ?{ item with completed } };
      case null { null };
    };
  };

  public func setItemVaulted(
    items : [Types.BucketListItem],
    itemId : Types.ItemId,
    vaulted : Bool,
  ) : ?Types.BucketListItem {
    switch (items.find(func i = i.id == itemId)) {
      case (?item) { ?{ item with vaulted } };
      case null { null };
    };
  };

  public func deleteItem(
    items : [Types.BucketListItem],
    itemId : Types.ItemId,
  ) : Bool {
    items.any(func i = i.id == itemId);
  };

  public func listMembers(journal : Types.Journal) : [Types.Member] {
    journal.members;
  };

  public func generateInvitationLink(
    journalId : Types.JournalId,
    created : Types.Timestamp,
  ) : Types.InvitationLink {
    let code = journalId.toText() # "-" # created.toText();
    { code; journalId; created };
  };

  public func joinJournal(
    journal : Types.Journal,
    caller : Principal,
    joinedAt : Types.Timestamp,
  ) : Types.Journal {
    if (isMember(journal, caller)) {
      journal;
    } else {
      {
        journal with
        members = journal.members.concat([{ principal = caller; role = #member; joinedAt }]);
      };
    };
  };

  public func removeMember(
    journal : Types.Journal,
    member : Principal,
  ) : Types.Journal {
    {
      journal with
      members = journal.members.filter(func m = m.principal != member);
    };
  };
};
