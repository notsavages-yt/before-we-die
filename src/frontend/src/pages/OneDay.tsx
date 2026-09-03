import { useActiveJournal } from "@/hooks/useActiveJournal";
import { useBucketListItems, useJournal } from "@/hooks/useQueries";
import { ChevronLeft, ChevronRight, Flame, Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const SLIDE_DURATION_MS = 6000;

function useSlideshow(count: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!playing || count === 0) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [playing, count]);

  return { index, playing, setPlaying, next, prev, goTo };
}

function EmptyState({ journalTitle }: { journalTitle: string }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-6 text-center"
      data-ocid="empty_state"
    >
      <div className="mb-8 flex size-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-ember">
        <Flame className="size-7 text-primary" aria-hidden="true" />
      </div>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-primary">
        One Day
      </p>
      <h2 className="max-w-2xl font-display text-3xl font-medium italic leading-tight text-foreground sm:text-5xl">
        {journalTitle
          ? `Nothing on the list yet, ${journalTitle}.`
          : "No journal selected."}
      </h2>
      <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
        {journalTitle
          ? "Add your first dream to the bucket list, then come back to watch it unfold, one day at a time."
          : "Select a journal to begin the cinematic countdown of everything you still want to do."}
      </p>
    </div>
  );
}

export function OneDay() {
  const { activeJournalId } = useActiveJournal();
  const { data: items = [], isLoading } = useBucketListItems(activeJournalId);
  const { data: journal } = useJournal(activeJournalId);

  const { index, playing, setPlaying, next, prev, goTo } = useSlideshow(
    items.length,
  );

  const current = items[index];

  return (
    <section
      className="relative flex h-[calc(100dvh-4rem)] min-h-[480px] w-full flex-col overflow-hidden bg-gradient-subtle"
      data-ocid="one_day_slideshow"
      aria-label="ONE DAY cinematic slideshow"
    >
      {/* Ember glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, oklch(0.74 0.16 65 / 0.22), transparent 60%)",
        }}
      />

      {/* Top progress bar */}
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-border/40">
        {items.length > 0 && (
          <motion.div
            key={index}
            className="h-full bg-gradient-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: SLIDE_DURATION_MS / 1000,
              ease: "linear",
            }}
            data-ocid="slideshow_progress"
          />
        )}
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 sm:px-12">
        <AnimatePresence mode="wait">
          {current ? (
            <motion.div
              key={current.id.toString()}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl text-center"
              data-ocid="slide"
            >
              <p className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-primary sm:text-sm">
                {current.completed ? "Lived" : "Still to live"} ·{" "}
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </p>
              <h2
                className={`font-display text-4xl font-medium italic leading-[1.1] tracking-tight sm:text-6xl md:text-7xl ${
                  current.completed ? "text-accent" : "text-foreground"
                }`}
              >
                {current.title}
              </h2>
              {current.note ? (
                <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {current.note}
                </p>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <EmptyState journalTitle={journal?.title ?? ""} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {items.length > 0 && (
        <div className="relative z-20 flex items-center justify-center gap-6 pb-8 sm:gap-8">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="flex size-12 items-center justify-center rounded-full border border-border bg-card/60 text-foreground backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-ocid="slideshow_prev"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            className="flex size-12 items-center justify-center rounded-full border border-border bg-card/60 text-foreground backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-ocid="slideshow_play_pause"
          >
            {playing ? (
              <Pause className="size-5" aria-hidden="true" />
            ) : (
              <Play className="size-5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="flex size-12 items-center justify-center rounded-full border border-border bg-card/60 text-foreground backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-white focus-visible:ring-2 focus-visible:ring-ring"
            data-ocid="slideshow_next"
          >
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Dots */}
      {items.length > 1 && (
        <div
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
          data-ocid="slideshow_dots"
        >
          {items.map((item, i) => (
            <button
              key={item.id.toString()}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                i === index
                  ? "w-6 bg-primary"
                  : "w-2 bg-border hover:bg-muted-foreground"
              }`}
              data-ocid={`slideshow_dot.${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-sm"
          data-ocid="loading_state"
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <Flame
              className="size-5 animate-pulse text-primary"
              aria-hidden="true"
            />
            <span className="font-mono text-xs uppercase tracking-[0.3em]">
              Loading
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
