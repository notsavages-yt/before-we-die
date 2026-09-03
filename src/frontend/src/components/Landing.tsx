import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Flame } from "lucide-react";
import { motion } from "motion/react";

export function Landing() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url(/assets/generated/hero-ember.dim_1600x900.jpg)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background"
        aria-hidden="true"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-primary" aria-hidden="true" />
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            BEFORE WE DIE
          </span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-primary">
            A shared bucket list for the ones you love
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
            Before we die,{" "}
            <span className="text-gradient italic">we live.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Gather the people who matter, write down everything you still want
            to feel, and chase it together — one impossible dream at a time.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              onClick={() => login()}
              disabled={isLoggingIn}
              data-ocid="sign_in_button"
              className="shadow-ember"
            >
              {isLoggingIn ? "Signing in…" : "Begin the list"}
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 px-6 py-6 text-center text-sm text-muted-foreground">
        <span className="font-display italic">
          © {new Date().getFullYear()}. Before we die, we live.
        </span>
      </footer>
    </div>
  );
}
