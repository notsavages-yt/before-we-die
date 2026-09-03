import { Layout } from "@/components/Layout";
import { YouTab } from "@/components/YouTab";
import { ActiveJournalProvider } from "@/hooks/useActiveJournal";
import { useJoinJournal } from "@/hooks/useQueries";
import { Dashboard } from "@/pages/Dashboard";
import { OneDay } from "@/pages/OneDay";
import { People } from "@/pages/People";
import { Vault } from "@/pages/Vault";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";

interface JoinSearch {
  code?: string;
}

function Join() {
  const search = useSearch({ strict: false }) as JoinSearch;
  const code = search.code;
  const navigate = useNavigate();
  const join = useJoinJournal();

  useEffect(() => {
    if (!code) return;
    join.mutate(code, {
      onSuccess: () => {
        navigate({ to: "/" });
      },
    });
  }, [code, join.mutate, navigate]);

  if (!code) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <XCircle className="mb-4 size-10 text-destructive" aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Missing invitation
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite link is incomplete. Ask the journal owner for a fresh
          link.
        </p>
      </div>
    );
  }

  if (join.isPending) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <Loader2
          className="mb-4 size-10 animate-spin text-primary"
          aria-hidden="true"
        />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Joining the journey…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re adding you to this journal.
        </p>
      </div>
    );
  }

  if (join.isSuccess) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <CheckCircle2
          className="mb-4 size-10 text-success"
          aria-hidden="true"
        />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Welcome aboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve joined the journal. Taking you to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <XCircle className="mb-4 size-10 text-destructive" aria-hidden="true" />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Could not join
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This invitation may have expired or already been used. Ask the journal
        owner for a new link.
      </p>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <ActiveJournalProvider>
      <Layout />
    </ActiveJournalProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  component: People,
});

const vaultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vault",
  component: Vault,
});

const oneDayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/one-day",
  component: OneDay,
});

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join",
  component: Join,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  peopleRoute,
  vaultRoute,
  oneDayRoute,
  joinRoute,
]);

const router = createRouter({ routeTree });
import { Layout } from "@/components/Layout";
import { YouTab } from "@/components/YouTab";
import { ActiveJournalProvider } from "@/hooks/useActiveJournal";
import { useJoinJournal } from "@/hooks/useQueries";
import { Dashboard } from "@/pages/Dashboard";
import { OneDay } from "@/pages/OneDay";
import { People } from "@/pages/People";
import { Vault } from "@/pages/Vault";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";

interface JoinSearch {
  code?: string;
}

function Join() {
  const search = useSearch({ strict: false }) as JoinSearch;
  const code = search.code;
  const navigate = useNavigate();
  const join = useJoinJournal();

  useEffect(() => {
    if (!code) return;
    join.mutate(code, {
      onSuccess: () => {
        navigate({ to: "/" });
      },
    });
  }, [code, join.mutate, navigate]);

  if (!code) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <XCircle className="mb-4 size-10 text-destructive" aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Missing invitation
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This invite link is incomplete. Ask the journal owner for a fresh
          link.
        </p>
      </div>
    );
  }

  if (join.isPending) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <Loader2
          className="mb-4 size-10 animate-spin text-primary"
          aria-hidden="true"
        />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Joining the journey…
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re adding you to this journal.
        </p>
      </div>
    );
  }

  if (join.isSuccess) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <CheckCircle2
          className="mb-4 size-10 text-success"
          aria-hidden="true"
        />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Welcome aboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;ve joined the journal. Taking you to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <XCircle className="mb-4 size-10 text-destructive" aria-hidden="true" />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Could not join
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This invitation may have expired or already been used. Ask the journal
        owner for a new link.
      </p>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <ActiveJournalProvider>
      <Layout />
    </ActiveJournalProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  component: People,
});

const vaultRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vault",
  component: Vault,
});

const oneDayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/one-day",
  component: OneDay,
});

const youRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/you",
  component: YouTab,
});

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join",
  component: Join,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  peopleRoute,
  vaultRoute,
  oneDayRoute,
  youRoute,
  joinRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
