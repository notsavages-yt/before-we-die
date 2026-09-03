import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveJournal } from "@/hooks/useActiveJournal";
import {
  useGenerateInvitationLink,
  useJournal,
  useMembers,
  useRemoveMember,
} from "@/hooks/useQueries";
import type { InvitationLink, Member } from "@/types";
import {
  Check,
  Copy,
  Crown,
  Link2,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const MemberRole = {
  member: "member",
  owner: "owner",
} as const;

function formatJoinedAt(timestamp: any): string {
  try {
    if (!timestamp) return "—";
    const cleanBigInt = BigInt(String(timestamp).replace(/n$/, ""));
    const date = new Date(Number(cleanBigInt / BigInt(1000000)));
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function shortPrincipal(principal: string): string {
  if (!principal) return "Unknown";
  if (principal.length <= 14) return principal;
  return `${principal.slice(0, 6)}…${principal.slice(-4)}`;
}

export function People() {
  const { activeJournalId } = useActiveJournal();
  const { data: journal, isLoading: journalLoading } =
    useJournal(activeJournalId);
  const { data: members = [], isLoading: membersLoading } =
    useMembers(activeJournalId);

  const ownerMember: Member | null = journal
    ? {
        principal: (journal.owner || "self") as any,
        joinedAt: journal.created,
        role: MemberRole.owner as any,
      }
    : null;

  const allMembers = ownerMember
    ? [
        ownerMember,
        ...members.filter(
          (m) => String(m.principal) !== String(ownerMember.principal),
        ),
      ]
    : members;

  const [invitation, setInvitation] = useState<InvitationLink | null>(null);
  const [copied, setCopied] = useState(false);

  const generateLink = useGenerateInvitationLink();
  const removeMember = useRemoveMember();

  const currentPrincipal = "self";
  const isOwner = true;

  const inviteUrl = invitation
    ? `${window.location.origin}/join?code=${encodeURIComponent(
        invitation.code,
      )}`
    : "";

  const handleGenerate = () => {
    if (activeJournalId === null || activeJournalId === undefined) return;
    generateLink.mutate(activeJournalId, {
      onSuccess: (link) => {
        setInvitation(link);
        setCopied(false);
      },
    });
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleRemove = (member: Member) => {
    if (activeJournalId === null || activeJournalId === undefined) return;
    removeMember.mutate({
      journalId: activeJournalId,
      member: member.principal,
    });
  };

  if (activeJournalId === null || activeJournalId === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
            People
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            The ones who matter
          </h1>
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center"
          data-ocid="people_empty_state"
        >
          <Users
            className="mb-4 size-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="font-display text-xl font-semibold text-foreground">
            No journal selected
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Choose a journal from the switcher above to see who is sharing this
            journey with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8"
      >
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
          People
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The ones who matter
        </h1>
        <p className="mt-2 text-muted-foreground">
          {journalLoading
            ? "Loading journal…"
            : journal
              ? `Everyone walking ${journal.title} with you.`
              : "Select a journal to see its members."}
        </p>
      </motion.div>

      {/* Invite card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
        className="mb-10 overflow-hidden rounded-2xl border bg-card shadow-subtle"
        data-ocid="invite_panel"
      >
        <div className="bg-gradient-primary p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-primary-foreground">
                Invite someone to the journey
              </h2>
              <p className="mt-1 max-w-md text-sm text-primary-foreground/80">
                Share a link and let them join this journal before the time runs
                out.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generateLink.isPending}
              className="shrink-0 bg-background text-foreground hover:bg-background/90"
              data-ocid="invite_button"
            >
              <UserPlus className="size-4" aria-hidden="true" />
              {generateLink.isPending ? "Generating…" : "Generate invite link"}
            </Button>
          </div>
        </div>

        {invitation && (
          <div className="flex flex-col gap-3 border-t p-6 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
              <Link2
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span
                className="truncate font-mono text-sm text-foreground"
                data-ocid="invite_link"
              >
                {inviteUrl}
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopy}
              className="shrink-0"
              data-ocid="copy_invite_button"
            >
              {copied ? (
                <Check className="size-4 text-success" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        )}

        {generateLink.isError && (
          <p
            className="border-t px-6 py-3 text-sm text-destructive"
            data-ocid="invite_error"
          >
            Could not generate an invite link. Please try again.
          </p>
        )}
      </motion.section>

      {/* Members list */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        data-ocid="members_section"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Members
          </h2>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {membersLoading ? "…" : `${allMembers.length} total`}
          </span>
        </div>

        {membersLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["a", "b", "c"].map((id) => (
              <Skeleton
                key={id}
                className="h-24 rounded-2xl"
                data-ocid={`member_skeleton_${id}`}
              />
            ))}
          </div>
        ) : allMembers.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center"
            data-ocid="members_empty_state"
          >
            <Users
              className="mb-4 size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="font-display text-lg font-semibold text-foreground">
              No members yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Generate an invite link above to bring the first people into this
              journal.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allMembers.map((member, index) => {
              const memberPrincipal = String(member.principal || "member");
              const isOwnerMember = member.role === MemberRole.owner;
              const isSelf = memberPrincipal === currentPrincipal;
              const canRemove = isOwner && !isOwnerMember && !isSelf;
              return (
                <li
                  key={memberPrincipal + index}
                  className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-subtle"
                  data-ocid={`member_item_${index + 1}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${
                        isOwnerMember
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      {memberPrincipal.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">
                          {isSelf ? "You" : shortPrincipal(memberPrincipal)}
                        </span>
                        {isOwnerMember && (
                          <Crown
                            className="size-3.5 shrink-0 text-primary"
                            aria-label="Owner"
                          />
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        Joined {formatJoinedAt(member.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant={isOwnerMember ? "default" : "secondary"}
                      data-ocid={`member_role_${index + 1}`}
                    >
                      {isOwnerMember ? "Owner" : "Member"}
                    </Badge>
                    {canRemove && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${shortPrincipal(memberPrincipal)}`}
                        onClick={() => handleRemove(member)}
                        disabled={removeMember.isPending}
                        className="text-muted-foreground hover:text-destructive"
                        data-ocid={`remove_member_button_${index + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {removeMember.isError && (
          <p
            className="mt-4 text-sm text-destructive"
            data-ocid="remove_member_error"
          >
            Could not remove that member. Please try again.
          </p>
        )}
      </motion.section>
    </div>
  );
}
