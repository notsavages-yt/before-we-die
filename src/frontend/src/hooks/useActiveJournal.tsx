import type { JournalId } from "@/types";
import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

interface ActiveJournalContextValue {
  activeJournalId: JournalId | null;
  setActiveJournalId: (id: JournalId | null) => void;
}

const ActiveJournalContext = createContext<
  ActiveJournalContextValue | undefined
>(undefined);

export function ActiveJournalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [activeJournalId, setActiveJournalId] = useState<JournalId | null>(
    null,
  );
  const value = useMemo(
    () => ({ activeJournalId, setActiveJournalId }),
    [activeJournalId],
  );
  return (
    <ActiveJournalContext.Provider value={value}>
      {children}
    </ActiveJournalContext.Provider>
  );
}

export function useActiveJournal(): ActiveJournalContextValue {
  const ctx = useContext(ActiveJournalContext);
  if (!ctx) {
    throw new Error(
      "useActiveJournal must be used within an ActiveJournalProvider",
    );
  }
  return ctx;
}
