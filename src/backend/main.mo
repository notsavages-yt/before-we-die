import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import IntValue "mo:caffeineai-oql/IntValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Types "types/journals";
import JournalsApi "mixins/journals-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  let journals : List.List<Types.Journal>;
  let items : List.List<Types.BucketListItem>;
  let invitations : List.List<Types.InvitationLink>;
  let nextJournalId : { var next : Types.JournalId };
  let nextItemId : { var next : Types.ItemId };

  include JournalsApi(accessControlState, journals, items, invitations, nextJournalId, nextItemId);

  transient let anyP = Principal.fromText("aaaaa-aa");

  func canSeeJournal(caller : Principal, idVal : OQL.Value) : Bool {
    switch (idVal) {
      case (#nat id) {
        switch (journals.find(func j = j.id == id)) {
          case (?j) { isMember(j, caller) };
          case null { false };
        };
      };
      case _ { false };
    };
  };

  func canSeeItem(caller : Principal, jidVal : OQL.Value) : Bool {
    switch (jidVal) {
      case (#nat jid) {
        switch (journals.find(func j = j.id == jid)) {
          case (?j) { isMember(j, caller) };
          case null { false };
        };
      };
      case _ { false };
    };
  };

  include Expose({
    entities = [
      journals.toEntityManual("journal", "Journal", "id")
        .sample({ id = 0; title = ""; description = ""; owner = anyP; members = []; created = 0 })
        .payload("id", func j = j.id)
        .payload("title", func j = j.title)
        .payload("description", func j = j.description)
        .payload("owner", func j = j.owner)
        .payload("memberCount", func j = j.members.size())
        .payload("created", func j = j.created)
        .ownedByWith("id", canSeeJournal)
        .controllerOrScoped()
        .build(),
      items.toEntity("item", "BucketListItem", "id")
        .sample({ id = 0; journalId = 0; title = ""; note = ""; completed = false; vaulted = false; created = 0 })
        .ownedByWith("journalId", canSeeItem)
        .controllerOrScoped()
        .build(),
      invitations.toEntity("invitation", "InvitationLink", "code")
        .sample({ code = ""; journalId = 0; created = 0 })
        .edge("journalId", "journal")
        .controllerOnly()
        .build(),
    ];
  });

  include ApiDocMixin();
};
