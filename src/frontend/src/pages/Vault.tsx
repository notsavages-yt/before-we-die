import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveJournal } from "@/hooks/useActiveJournal";
import {
  useBucketListItems,
  useJournal,
  useSetBucketListItemVaulted,
} from "@/hooks/useQueries";
import { ArrowLeft, Lock, LockKeyhole, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function Vault() {
  const { activeJournalId } = useActiveJournal();
  const { data: journal } = useJournal(activeJournalId);
  const { data: items = [], isLoading } = useBucketListItems(activeJournalId);
  const setVaulted = useSetBucketListItemVaulted();

  const vaultedItems = items.filter((item) => item.vaulted);

  const handleReturn = (itemId: bigint) => {
    setVaulted.mutate({ itemId, vaulted: false });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
          Vault
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The private vault
        </h1>
        <p className="mt-2 text-muted-foreground">
          {journal
            ? `Locked dreams inside ${journal.title}`
            : "Select a journal to see its vault."}
        </p>
      </div>

      {activeJournalId === null ? (
        <div
          className="rounded-2xl border border-dashed bg-card p-10 text-center"
          data-ocid="empty_state"
        >
          <LockKeyhole className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h2 className="font-display text-xl text-foreground">
            No journal selected
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Choose a journal from the switcher above to open its private vault.
          </p>
        </div>
      ) : (
        <>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8 overflow-hidden rounded-2xl border bg-gradient-subtle p-6 shadow-elevated sm:p-8"
            data-ocid="vault_hero"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                    Dreams kept in the dark
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    Some wishes are too tender to share. These are locked away
                    from the shared list — seen only by you, until you are ready
                    to set them free.
                  </p>
                </div>
              </div>
              <div className="shrink-0 rounded-xl border bg-card px-5 py-3 text-center">
                <p className="font-mono text-2xl font-semibold text-primary">
                  {isLoading ? "…" : vaultedItems.length}
                </p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  locked
                </p>
              </div>
            </div>
          </motion.section>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={`skeleton-${i}`}
                  className="rounded-2xl border bg-card p-5"
                  data-ocid={`vault_skeleton_${i + 1}`}
                >
                  <Skeleton className="mb-3 h-4 w-24" />
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : vaultedItems.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed bg-card p-10 text-center"
              data-ocid="empty_state"
            >
              <Lock className="mx-auto mb-4 size-10 text-muted-foreground" />
              <h2 className="font-display text-xl text-foreground">
                The vault is empty
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Nothing is hidden away yet. Move a bucket-list item into the
                vault from the dashboard to keep it private.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vaultedItems.map((item, index) => (
                <motion.article
                  key={item.id.toString()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex flex-col rounded-2xl border bg-card p-5 shadow-subtle transition-smooth hover:shadow-elevated"
                  data-ocid={`vault_item_${index + 1}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
                      <Lock className="size-3" aria-hidden="true" />
                      Locked
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatDate(item.created)}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
                    {item.title}
                  </h3>

                  {item.note ? (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {item.note}
                    </p>
                  ) : null}

                  <div className="mt-auto pt-5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleReturn(item.id)}
                      disabled={setVaulted.isPending}
                      data-ocid={`vault_return_button_${index + 1}`}
                    >
                      <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
                      Return to the list
                    </Button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
