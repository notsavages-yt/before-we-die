import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type JournalId = Nat;
  type ItemId = Nat;
  type Timestamp = Int;

  type MemberRole = {
    #owner;
    #member;
  };

  type Member = {
    principal : Principal;
    role : MemberRole;
    joinedAt : Timestamp;
  };

  type Journal = {
    id : JournalId;
    title : Text;
    description : Text;
    owner : Principal;
    members : [Member];
    created : Timestamp;
  };

  type BucketListItem = {
    id : ItemId;
    journalId : JournalId;
    title : Text;
    note : Text;
    completed : Bool;
    vaulted : Bool;
    created : Timestamp;
  };

  type InvitationLink = {
    code : Text;
    journalId : JournalId;
    created : Timestamp;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControlState;
    journals : List.List<Journal>;
    items : List.List<BucketListItem>;
    invitations : List.List<InvitationLink>;
    nextJournalId : { var next : JournalId };
    nextItemId : { var next : ItemId };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      journals = List.empty();
      items = List.empty();
      invitations = List.empty();
      nextJournalId = { var next = 0 };
      nextItemId = { var next = 0 };
    };
  };
};
