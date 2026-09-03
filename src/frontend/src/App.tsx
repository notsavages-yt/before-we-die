import { Layout } from "@/components/Layout";
import { ActiveJournalProvider } from "@/hooks/useActiveJournal";
import { useJoinJournal, useMyProfile, useUpdateProfile } from "@/hooks/useQueries";
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
import { Calendar, Check, CheckCircle2, Heart, Loader2, Sparkles, User, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

// ----------------- INVITATION JOIN VIEW -----------------

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
          This invite link is incomplete. Ask the journal owner for a fresh link.
        </p>
      </div>
    );
  }

  if (join.isPending) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <Loader2 className="mb-4 size-10 animate-spin text-primary" aria-hidden="true" />
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
        <CheckCircle2 className="mb-4 size-10 text-success" aria-hidden="true" />
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
        This invitation may have expired or already been used. Ask the journal owner for a new link.
      </p>
    </div>
  );
}

// ----------------- YOU VIEW -----------------

function YouPage() {
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setDob(profile.dob || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      displayName: displayName.trim(),
      dob,
      bio: bio.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  let lifeStats: { ageYears: number; livedPercent: number; daysLeft: number } | null = null;
  if (dob) {
    const birth = new Date(dob).getTime();
    const now = Date.now();
    const ageMs = now - birth;
    if (ageMs > 0) {
      const ageYears = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
      const targetAge = 80;
      const targetMs = birth + targetAge * 365.25 * 24 * 60 * 60 * 1000;
      const daysLeft = Math.max(0, Math.floor((targetMs - now) / (24 * 60 * 60 * 1000)));
      const livedPercent = Math.min(100, Math.max(0, Math.round((ageMs / (targetMs - birth)) * 100)));
      lifeStats = { ageYears, livedPercent, daysLeft };
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-[#8c674b]">Identity</span>
        <h2 className="text-3xl font-serif font-bold text-[#321c10] mt-1">You</h2>
        <p className="text-[#6d513e] text-sm mt-1">
          Define how your fellow explorers see you on your shared journey.
        </p>
      </div>

      {lifeStats && (
        <div className="p-6 rounded-2xl bg-[#efe3d3]/70 border border-[#ddcbba] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-mono tracking-wider text-[#7a482b] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Mortality perspective
            </span>
            <span className="text-sm font-semibold text-[#321c10] font-mono">
              {lifeStats.livedPercent}% lived
            </span>
          </div>

          <div className="w-full bg-[#dfcebe] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#7a482b] h-full rounded-full transition-all duration-700"
              style={{ width: `${lifeStats.livedPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-[#6d513e]">
            <span>Age: {lifeStats.ageYears} years</span>
            <span>~{lifeStats.daysLeft.toLocaleString()} days remaining</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="p-7 rounded-2xl bg-[#fdfaf7] border border-[#e8dacb] shadow-sm space-y-6">
        <div>
          <label className="block text-xs uppercase font-mono tracking-wider text-[#6d513e] mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Display Name
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Aman"
            className="w-full px-4 py-2.5 rounded-xl border border-[#d9c5b2] bg-white text-[#321c10] placeholder-[#b59e8b] focus:outline-none focus:ring-2 focus:ring-[#7a482b]"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-mono tracking-wider text-[#6d513e] mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#d9c5b2] bg-white text-[#321c10] focus:outline-none focus:ring-2 focus:ring-[#7a482b]"
          />
          <p className="text-[11px] text-[#8c674b] mt-1.5">Used to calculate your life progress percentage.</p>
        </div>

        <div>
          <label className="block text-xs uppercase font-mono tracking-wider text-[#6d513e] mb-2 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" /> Personal Bio / Motto
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What drives you to live fully before the time runs out?"
            className="w-full px-4 py-2.5 rounded-xl border border-[#d9c5b2] bg-white text-[#321c10] placeholder-[#b59e8b] focus:outline-none focus:ring-2 focus:ring-[#7a482b] resize-none"
          />
        </div>

        <div className="pt-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="px-6 py-2.5 rounded-xl bg-[#7a482b] text-white font-medium hover:bg-[#623820] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {updateProfile.isPending ? "Saving..." : "Save Identity"}
          </button>
          {saved && (
            <span className="text-xs text-[#2e5e34] font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> Profile updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

// ----------------- ROUTES & CONFIG -----------------

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
  component: YouPage,
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
