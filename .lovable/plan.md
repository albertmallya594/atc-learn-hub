# Show department and author on Ask Question page

## Changes (UI only, `src/pages/AskQuestion.tsx`)

1. **Read-only "Posting as" strip** at the top of the form card:
   - Avatar (initials fallback) + full name from `profile.full_name`
   - Subtle muted line: `@username` if present
   - Pulled from `useAuth().profile` — no extra fetch.

2. **Meta row becomes a 3-column grid** (stacks on mobile):
   ```
   [ Title (flex) ] [ Department ] [ Category ]
   ```
   - **Department** — new required `Select` populated from a static list of ATC ICT departments (e.g. Information Technology, Computer Science, Software Engineering, Networking, Data Science, Other). Stored in component state `departmentId`.
   - **Category** — unchanged.

3. **Validation**
   - Extend the zod schema with `department: z.string().min(1, "Pick a department")`.
   - Block submit with a toast if missing.

4. **Persistence**
   - Save the chosen department into the existing `questions.tags` array as a single tag like `dept:<slug>` so no schema change is needed (column is `text[] not null default {}`).
   - Keep `tags: [\`dept:\${departmentId}\`]` on insert.

## Out of scope

- No DB migration.
- No changes to feed/filtering by department in this pass (can be added later by filtering `tags` with `contains ['dept:xxx']`).
- No changes to other pages.

## Technical notes

- Use existing `Select`, `Label`, semantic tokens.
- Use `Avatar` from `@/components/ui/avatar` for the user chip.
- Departments are a hard-coded const in the file for now.
