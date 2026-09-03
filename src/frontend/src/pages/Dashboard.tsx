import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useActiveJournal } from "@/hooks/useActiveJournal";
import {
  useAddBucketListItem,
  useBucketListItems,
  useCreateJournal,
  useDeleteBucketListItem,
  useEditBucketListItem,
  useJournal,
  useJournals,
  useSetBucketListItemCompleted,
  useSetBucketListItemVaulted,
} from "@/hooks/useQueries";
import type { BucketListItem, Journal } from "@/types";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Flame,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import { motion } from "motion/react";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function timestampToDate(timestamp: any): Date | null {
  try {
    if (!timestamp) return null;
    const cleanBigInt = BigInt(String(timestamp).replace(/n$/, ""));
    const date = new Date(Number(cleanBigInt / BigInt(1000000)));
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function formatCreated(timestamp: any): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysLeftInYear(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
}

function journalProgress(items: BucketListItem[], journalId: any) {
  const targetId = String(journalId);
  const journalItems = items.filter((i) => String(i.journalId) === targetId);
  const completed = journalItems.filter((i) => i.completed).length;
  const total = journalItems.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, pct };
}

/* ------------------------------------------------------------------ */
/* Create journal dialog                                              */
/* ------------------------------------------------------------------ */

function CreateJournalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setActiveJournalId } = useActiveJournal();
  const createJournal = useCreateJournal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && !createJournal.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const capturedTitle = title.trim();
    const capturedDescription = description.trim();
    setTitle("");
    setDescription("");
    setError(null);
    try {
      const created = await createJournal.mutateAsync({
        title: capturedTitle,
        description: capturedDescription,
      });
      setActiveJournalId(created.id);
      onOpenChange(false);
    } catch {
      setTitle((current) => (current === "" ? capturedTitle : current));
      setDescription((current) =>
        current === "" ? capturedDescription : current,
      );
      setError("Could not create the journal. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="create_journal_modal">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Begin a new journal
          </DialogTitle>
          <DialogDescription>
            Name the dreams you want to chase together. A description is
            optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="journal-title"
              className="text-sm font-medium text-foreground"
            >
              Title
            </label>
            <Input
              id="journal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Last Light"
              data-ocid="journal_title_input"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="journal-description"
              className="text-sm font-medium text-foreground"
            >
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="journal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this journal about?"
              data-ocid="journal_description_input"
            />
          </div>
          {error ? (
            <p
              className="text-sm text-destructive"
              data-ocid="create_journal_error"
            >
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-ocid="cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              data-ocid="create_journal_submit_button"
            >
              {createJournal.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Flame className="size-4" aria-hidden="true" />
              )}
              {createJournal.isPending ? "Creating…" : "Create journal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Add / edit item dialog                                             */
/* ------------------------------------------------------------------ */

function ItemDialog({
  open,
  onOpenChange,
  journalId,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journalId: any;
  item: BucketListItem | null;
}) {
  const addItem = useAddBucketListItem();
  const editItem = useEditBucketListItem();
  const isEdit = item !== null;
  const [title, setTitle] = useState(item?.title ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 && !addItem.isPending && !editItem.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const capturedTitle = title.trim();
    const capturedNote = note.trim();
    setTitle("");
    setNote("");
    setError(null);
    try {
      if (isEdit && item) {
        await editItem.mutateAsync({
          itemId: item.id,
          title: capturedTitle,
          note: capturedNote,
        });
      } else if (journalId !== null && journalId !== undefined) {
        await addItem.mutateAsync({
          journalId,
          title: capturedTitle,
          note: capturedNote,
        });
      }
      onOpenChange(false);
    } catch {
      setTitle((current) => (current === "" ? capturedTitle : current));
      setNote((current) => (current === "" ? capturedNote : current));
      setError(isEdit ? "Could not save the item." : "Could not add the item.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="item_modal">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? "Edit this dream" : "Add a dream"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Refine the title or the note behind it."
              : "Something you want to do before you die."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label
              htmlFor="item-title"
              className="text-sm font-medium text-foreground"
            >
              Title
            </label>
            <Input
              id="item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. See the aurora from an igloo"
              data-ocid="item_title_input"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="item-note"
              className="text-sm font-medium text-foreground"
            >
              Note <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="item-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why does this matter?"
              data-ocid="item_note_input"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" data-ocid="item_error">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-ocid="cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              data-ocid="item_submit_button"
            >
              {addItem.isPending || editItem.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Flame className="size-4" aria-hidden="true" />
              )}
              {isEdit ? "Save changes" : "Add dream"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Journal card                                                       */
/* ------------------------------------------------------------------ */

function JournalCard({
  journal,
  active,
  onSelect,
}: {
  journal: Journal;
  active: boolean;
  onSelect: () => void;
}) {
  const { data: items = [] } = useBucketListItems(journal.id);
  const { completed, total, pct } = journalProgress(items, journal.id);
  const memberCount = (journal.members?.length || 0) + 1;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex flex-col gap-4 rounded-2xl border p-6 text-left shadow-subtle transition-colors ${
        active
          ? "border-primary/60 bg-card shadow-ember"
          : "border-border bg-card hover:border-primary/40"
      }`}
      data-ocid={`journal_card_${String(journal.id)}`}
      aria-pressed={active}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
          {journal.title}
        </h3>
        <Badge
          variant={active ? "default" : "outline"}
          className={active ? "shrink-0" : "shrink-0 text-muted-foreground"}
          data-ocid="journal_status_badge"
        >
          {active ? "Active" : "Open"}
        </Badge>
      </div>

      {journal.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {journal.description}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
        <span className="font-mono text-xs uppercase tracking-wider text-primary">
          {completed}/{total} done
        </span>
      </div>

      <div className="grid gap-1.5">
        <Progress value={pct} data-ocid="journal_progress" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {pct}% of the list lived
        </span>
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Bucket-list item row                                               */
/* ------------------------------------------------------------------ */

function ItemRow({
  item,
  onEdit,
}: {
  item: BucketListItem;
  onEdit: () => void;
}) {
  const setCompleted = useSetBucketListItemCompleted();
  const setVaulted = useSetBucketListItemVaulted();
  const deleteItem = useDeleteBucketListItem();

  function toggleCompleted() {
    setCompleted.mutate({ itemId: item.id, completed: !item.completed });
  }

  function handleMoveToVault() {
    setVaulted.mutate({ itemId: item.id, vaulted: true });
  }

  function handleDelete() {
    deleteItem.mutate(item.id);
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 rounded-xl border p-4 shadow-subtle transition-colors ${
        item.completed ? "border-accent/40 bg-card/60" : "border-border bg-card"
      }`}
      data-ocid={`item_row_${String(item.id)}`}
    >
      <Checkbox
        checked={item.completed}
        onCheckedChange={toggleCompleted}
        disabled={setCompleted.isPending}
        aria-label={`Mark "${item.title}" as ${item.completed ? "pending" : "completed"}`}
        data-ocid={`item_checkbox_${String(item.id)}`}
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4
            className={`font-display text-base font-medium leading-snug ${
              item.completed
                ? "text-muted-foreground line-through decoration-accent/60"
                : "text-foreground"
            }`}
          >
            {item.title}
          </h4>
          <Badge
            variant={item.completed ? "secondary" : "outline"}
            className={
              item.completed
                ? "shrink-0 border-transparent bg-accent/20 text-accent-foreground"
                : "shrink-0 text-primary"
            }
            data-ocid="item_status_badge"
          >
            {item.completed ? "Completed" : "Pending"}
          </Badge>
        </div>

        {item.note ? (
          <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
        ) : null}

        <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="size-3" aria-hidden="true" />
          Dreamed {formatCreated(item.created)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for "${item.title}"`}
            data-ocid={`item_menu_${String(item.id)}`}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-ocid="item_menu_content">
          <DropdownMenuItem onSelect={onEdit} data-ocid="edit_button">
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleMoveToVault}
            disabled={setVaulted.isPending}
            data-ocid="move_to_vault_button"
          >
            <Lock className="size-4" aria-hidden="true" />
            Move to vault
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={handleDelete}
            disabled={deleteItem.isPending}
            data-ocid="delete_button"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard page                                                     */
/* ------------------------------------------------------------------ */

export function Dashboard() {
  const { activeJournalId, setActiveJournalId } = useActiveJournal();
  const { data: journals = [], isLoading: journalsLoading } = useJournals();
  const { data: activeJournal } = useJournal(activeJournalId);
  const { data: activeItems = [], isLoading: itemsLoading } =
    useBucketListItems(activeJournalId);
  const reduceMotion = useReducedMotion();

  const [createOpen, setCreateOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null);

  function openAddItem() {
    setEditingItem(null);
    setItemDialogOpen(true);
  }

  function openEditItem(item: BucketListItem) {
    setEditingItem(item);
    setItemDialogOpen(true);
  }

  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <motion.div {...motionProps} className="mb-10">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
          Dashboard
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {activeJournal ? (
            <span className="text-gradient">{activeJournal.title}</span>
          ) : (
            "Your journals"
          )}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {activeJournal
            ? activeJournal.description ||
              "The dreams you are chasing together."
            : "Every life is a list of things left undone. Choose a journal — or begin a new one."}
        </p>
        {activeJournal ? (
          <p className="mt-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary">
            <Flame className="size-3.5" aria-hidden="true" />
            {daysLeftInYear()} days left this year
          </p>
        ) : null}
      </motion.div>

      {/* Journals grid */}
      <motion.section
        {...motionProps}
        className="mb-12"
        data-ocid="journals_section"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Your journals
          </h2>
          <Button
            onClick={() => setCreateOpen(true)}
            data-ocid="open_create_journal_button"
          >
            <Plus className="size-4" aria-hidden="true" />
            New journal
          </Button>
        </div>

        {journalsLoading ? (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-ocid="loading_state"
          >
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : journals.length === 0 ? (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center"
            data-ocid="empty_state"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Flame className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                No journals yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Before we die, we live. Create your first journal and start
                writing the list.
              </p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              data-ocid="empty_create_button"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create your first journal
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {journals.map((journal) => (
              <JournalCard
                key={String(journal.id)}
                journal={journal}
                active={String(activeJournalId) === String(journal.id)}
                onSelect={() => setActiveJournalId(journal.id)}
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* Active journal bucket list */}
      {activeJournal ? (
        <motion.section {...motionProps} data-ocid="bucket_list_section">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                The list
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeItems.length === 0
                  ? "Nothing here yet."
                  : `${activeItems.filter((i) => i.completed).length} of ${activeItems.length} lived`}
              </p>
            </div>
            <Button onClick={openAddItem} data-ocid="open_add_item_button">
              <Plus className="size-4" aria-hidden="true" />
              Add dream
            </Button>
          </div>

          {itemsLoading ? (
            <div className="grid gap-3" data-ocid="loading_state">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : activeItems.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center"
              data-ocid="empty_state"
            >
              <Circle
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  The list is empty
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Add the first thing you want to do before you die.
                </p>
              </div>
              <Button onClick={openAddItem} data-ocid="empty_add_item_button">
                <Plus className="size-4" aria-hidden="true" />
                Add your first dream
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3">
              {activeItems.map((item) => (
                <ItemRow
                  key={String(item.id)}
                  item={item}
                  onEdit={() => openEditItem(item)}
                />
              ))}
            </ul>
          )}
        </motion.section>
      ) : (
        <motion.div
          {...motionProps}
          className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center"
          data-ocid="no_active_journal"
        >
          <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Select a journal
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Pick one of your journals above to see its bucket list, or create
              a new one to begin.
            </p>
          </div>
        </motion.div>
      )}

      <CreateJournalDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ItemDialog
        key={editingItem ? String(editingItem.id) : "new"}
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        journalId={activeJournalId}
        item={editingItem}
      />
    </div>
  );
}
