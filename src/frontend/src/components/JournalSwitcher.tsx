import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveJournal } from "@/hooks/useActiveJournal";
import { useJournals } from "@/hooks/useQueries";

export function JournalSwitcher() {
  const { data: journals = [] } = useJournals();
  const { activeJournalId, setActiveJournalId } = useActiveJournal();

  return (
    <Select
      value={activeJournalId === null ? undefined : String(activeJournalId)}
      onValueChange={(value) =>
        setActiveJournalId(value ? BigInt(value) : null)
      }
    >
      <SelectTrigger
        className="w-[180px] sm:w-[220px]"
        data-ocid="journal_switcher"
        aria-label="Switch active journal"
      >
        <SelectValue placeholder="Select a journal" />
      </SelectTrigger>
      <SelectContent data-ocid="journal_switcher_list">
        {journals.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No journals yet
          </div>
        ) : (
          journals.map((journal) => (
            <SelectItem
              key={journal.id.toString()}
              value={journal.id.toString()}
            >
              {journal.title}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
