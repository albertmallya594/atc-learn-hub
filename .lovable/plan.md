# Improve Ask Question page

## Changes

1. **Remove the Tags field** from `src/pages/AskQuestion.tsx` (label, input, and the `tags` parsing logic). Insert questions with `tags: []`.

2. **Redesign the question composition area** for a more polished, focused writing experience:
   - Wrap the form in a cleaner two-section card: a compact "Meta" row (Title + Category side-by-side on desktop, stacked on mobile) and a large "Details" section for the body.
   - Make the body `Textarea` taller (min ~320px), with a subtle inner background, monospace-friendly padding, and a live character counter (e.g. `120 / 8000`).
   - Add a small helper toolbar above the textarea with formatting hints (bold, code, link — as plain markdown hint chips, not active buttons) and a "Markdown supported" note.
   - Replace the plain header with a richer intro card: icon + title + 3 short tips ("Be specific", "Show what you tried", "Explain expected outcome").
   - Sticky footer action bar inside the form: Cancel (ghost) on the left, Post question (primary) on the right, with a subtle top border.
   - Use semantic tokens only (`bg-card`, `border-border`, `text-muted-foreground`, `text-primary`).

## Technical notes

- File touched: `src/pages/AskQuestion.tsx` only.
- Remove `tags` from the zod schema and from the insert payload (pass empty array since the column is `not null` with default `{}`).
- Add `useState` for body length to drive the counter.
- No new dependencies; use existing lucide icons (`Lightbulb`, `Bold`, `Code`, `Link`).
