# Design Brief

## Direction

The Last Light — a cinematic, emotional shared bucket-list journal where every screen glows like the final embers of a dying day against deep warm charcoal night.

## Tone

Dark, atmospheric, film-noir-meets-dawn: dramatic Fraunces serif headlines over layered charcoal surfaces with ember-amber light, built to make mortality feel urgent and beautiful, not morbid.

## Differentiation

The ONE DAY full-screen slideshow renders each bucket-list wish as a single dramatic typographic frame (Fraunces italic on deep gradient), while a mono-numeral "time remaining" motif threads urgency through the dashboard.

## Color Palette

| Token      | OKLCH (dark)    | Role                                   |
| ---------- | --------------- | -------------------------------------- |
| background | 0.13 0.018 50   | deep warm charcoal night               |
| foreground | 0.93 0.012 60   | warm ivory text                        |
| card       | 0.165 0.02 50   | elevated surface                       |
| primary    | 0.74 0.16 65    | ember amber — the last light           |
| accent     | 0.63 0.14 22    | dusty ember rose — completed/loved     |
| secondary  | 0.21 0.022 50   | raised panels                          |
| muted      | 0.21 0.02 50    | quiet surfaces                         |
| muted-foreground | 0.55 0.015 55 | secondary text                     |
| destructive| 0.55 0.22 25    | removal / delete                       |
| success    | 0.6 0.16 150    | completion / joined                    |

## Typography

- Display: Fraunces — cinematic wordmark, ONE DAY slideshow, hero headings, journal titles
- Body: General Sans — UI labels, paragraphs, buttons
- Mono: JetBrains Mono — countdowns, progress numerals, "time remaining" motif
- Scale: hero `text-5xl md:text-7xl font-display tracking-tight`, h2 `text-3xl md:text-5xl font-display`, label `text-xs font-semibold tracking-[0.25em] uppercase`, body `text-base`

## Elevation & Depth

Layered charcoal surfaces (background < card < popover) with warm, diffused shadows (`shadow-subtle` / `shadow-elevated`) and an ember glow reserved for primary actions — depth through layers, never full-page gradients.

## Structural Zones

| Zone    | Background       | Border   | Notes                                   |
| ------- | ---------------- | -------- | --------------------------------------- |
| Header  | card/60 + blur   | border-b | sticky, frosted, ember active nav       |
| Content | background       | —        | cards on background, muted/30 alternation|
| Footer  | muted/40         | border-t | quiet, small, mono time motif           |

## Spacing & Rhythm

Generous cinematic spacing (section gap `py-16 md:py-24`, card `gap-6`), tight micro-spacing inside cards, large negative space around the ONE DAY slideshow for emotional weight.

## Component Patterns

- Buttons: primary = ember gradient + `shadow-ember`; secondary = elevated charcoal; destructive = dusty red; hover lifts 1px
- Cards: `rounded-2xl` (12-16px), `bg-card`, `shadow-subtle`, hover `shadow-elevated`
- Badges: `rounded-full` pills, ember for active, muted for counts, rose for completed

## Motion

- Entrance: staggered `animate-fade-up` / `animate-slide-left` (0.6-0.7s, cubic-bezier 0.4,0,0.2,1)
- Hover: smooth 0.3s lift + shadow transition
- Decorative: `animate-pulse-ember` on the ONE DAY progress ember; slideshow crossfades `animate-fade-in`

## Constraints

- Dark mode is primary; light mode is a warm-paper echo, never inverted grey
- AA+ contrast on all text (muted-foreground tuned, not opacity)
- Mobile-first: slideshow fills viewport, nav collapses to bottom bar
- No bucket-list photos/media; no join notifications

## Signature Detail

The ONE DAY slideshow — each wish as a full-bleed Fraunces italic frame over the ember gradient, with a mono "time remaining" counter — turns a CRUD list into a cinematic memento mori.
