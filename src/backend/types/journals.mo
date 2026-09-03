import Principal "mo:core/Principal";

module {
  public type JournalId = Nat;
  public type ItemId = Nat;
  public type Timestamp = Int;

  public type MemberRole = {
    #owner;
    #member;
  };

  public type Member = {
    principal : Principal;
    role : MemberRole;
    joinedAt : Timestamp;
  };

  public type Journal = {
    id : JournalId;
    title : Text;
    description : Text;
    owner : Principal;
    members : [Member];
    created : Timestamp;
  };

  public type BucketListItem = {
    id : ItemId;
    journalId : JournalId;
    title : Text;
    note : Text;
    completed : Bool;
    vaulted : Bool;
    created : Timestamp;
  };

  public type InvitationLink = {
    code : Text;
    journalId : JournalId;
    created : Timestamp;
  };
};
