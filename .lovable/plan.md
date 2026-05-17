# Toast feedback on vote

Add an instant toast after a successful upvote/downvote/un-vote in `src/components/VoteControl.tsx`, showing the action and the new net score. Errors already toast — keep that.

## Behavior

After the optimistic update succeeds (no error from `castVote`):
- Upvote added → `toast.success("Upvoted · net {newCount}")`
- Downvote added → `toast.success("Downvoted · net {newCount}")`
- Vote removed (clicked same arrow twice) → `toast("Vote removed · net {newCount}")`
- Switched direction → same as adding the new direction.

Toasts are short (`duration: 1500`) so rapid clicks don't pile up.

## Technical

Inside `click()` in `VoteControl.tsx`, after the `if (error)` branch, compute the new count (`count + delta`) and the action label from `prev`/`next`, then call the appropriate `toast` variant. No new deps, no schema changes, no UI structure changes.
