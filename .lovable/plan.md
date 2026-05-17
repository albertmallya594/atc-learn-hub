# Fix "No questions yet" on public feed

## Problem

The home and `/questions` pages always show "No questions yet" even though questions exist. The PostgREST query in `QuestionsFeed` tries to embed `votes!votes_target_id_fkey`, but the `votes` table has no foreign key to `questions` (votes are polymorphic — `target_id` points to either a question or an answer). The request returns HTTP 400 and the feed renders the empty state.

The same issue breaks answers loading on `QuestionDetail` (embedded `votes` on `answers`).

## Fix

Stop embedding `votes` through a non-existent FK. Fetch votes in a second query and merge in JS.

### `src/components/QuestionsFeed.tsx`
- Remove `votes:votes!votes_target_id_fkey(...)` from the select.
- After loading questions, run a second query: `supabase.from('votes').select('target_id,value').eq('target_type','question').in('target_id', ids)`.
- Aggregate up/down per `target_id` and merge into each row's `vote_count`.

### `src/pages/QuestionDetail.tsx`
- Same treatment for the answers query: drop the embedded `votes`, fetch votes for the answer ids in a follow-up query, and merge counts + the current user's vote.

No schema or RLS changes needed; `votes` already has public SELECT.
