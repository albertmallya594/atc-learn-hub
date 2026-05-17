# Show vote breakdown on each answer

## Goal

Under each answer card on `QuestionDetail`, display the live up/down breakdown and net score, so it's obvious why an answer is highlighted as best (or why none is).

## Display

Small footer row below the comments area, right-aligned, muted text:

`▲ 5 upvotes · ▼ 1 downvote · net +4`

- Always shown for every answer (not just the best one), so readers can compare.
- On the best answer card, append a subtle hint chip: "Highlighted because accepted" or "Highlighted by votes" depending on `reason`.

## Technical notes

In `src/pages/QuestionDetail.tsx`:

- The `a.votes` array already contains `{ value: "up" | "down", user_id }` per answer (fetched in `load`). Compute `ups`, `downs`, `net` inline per answer.
- Render a new line inside the existing answer body block, after the comments section, using muted/`tabular-nums` styling consistent with the card.
- Pass the existing `reason` from the best-answer computation down so the hint chip can render conditionally.

No schema or query changes.
