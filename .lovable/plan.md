# Public Questions + Admin-only Members

## Goals
1. Ensure posted questions are visible to everyone (including signed-out visitors) on the public feed.
2. Hide the "Active members" area and member list from regular users — only admins can see them.

## Changes

### 1. Public questions feed
- Verify `QuestionsFeed` works for anonymous users (RLS already allows public SELECT on questions/answers/votes/profiles/categories — confirmed).
- On `src/pages/Index.tsx`:
  - Remove the "Active members" stat card from the stats row for non-admins. Replace with a 2-column layout (Questions, Answers) for regular users; keep 3 columns for admins.
- Confirm the Latest Questions feed renders for signed-out users (no auth guard needed — already public).

### 2. Hide Members from non-admins
- `src/components/layout/AppSidebar.tsx`: hide the "Members" nav link unless `isAdmin`.
- `src/App.tsx`: wrap `/members` route in `<ProtectedRoute adminOnly>` so direct URL access redirects non-admins.
- `src/pages/Index.tsx`: hide the "Active members" stat for non-admins (see above).

## Technical notes
- No database/RLS changes needed — questions are already publicly readable.
- `ProtectedRoute adminOnly` already exists and redirects non-admins to `/`.
- `useAuth()` exposes `isAdmin` for conditional rendering.

## Files touched
- src/App.tsx
- src/components/layout/AppSidebar.tsx
- src/pages/Index.tsx
