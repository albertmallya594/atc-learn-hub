# Best-answer highlighting on QuestionDetail

## Goal

Make the "best" answer visually stand out on a question page, using a clear, predictable rule that combines acceptance and votes.

## Rule

Pick at most one "best answer" per question:

1. If any answer is `is_accepted = true`, that is the best answer.
2. Otherwise, the answer with the highest vote score wins, **only if** its score is `>= 2` and strictly greater than every other answer's score. Ties or low-vote answers get no highlight.

This way unanswered/low-signal questions stay neutral, and we never fight the asker's explicit accept choice.

## Visual treatment

In `src/pages/QuestionDetail.tsx`, for the best answer card:

- Add a gold/success ribbon at the top: small badge with a trophy icon and label
  - "Accepted answer" when accepted
  - "Top voted answer" when chosen by votes
- Stronger ring + subtle gradient background using existing tokens (`success` for accepted, `gold` for top-voted) so it's distinct from regular cards.
- Keep the existing accepted check icon behavior; just upgrade the surrounding card.

Non-best answers keep the current neutral card styling. The accepted card already has a faint ring — this replaces it with the richer treatment.

## Technical notes

- Compute `bestAnswerId` in `QuestionDetail` after `answers` is loaded, using the vote tallies already available via the per-answer `votes` arrays.
- Pass an `isBest` + `reason` ("accepted" | "voted") into the answer card render block and switch classes/ribbon accordingly.
- No schema, RLS, or query changes.
