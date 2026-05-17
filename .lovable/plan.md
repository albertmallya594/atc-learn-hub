# Department filter in search bar

Add an ATC department dropdown next to the header search input. Selecting a department filters the Questions feed to only questions tagged with that department.

## What changes

- **Header search** (`src/components/layout/AppHeader.tsx`): add a compact `Select` of the 8 ATC departments + "All departments" beside the search input. Submitting navigates to `/questions?q=...&dept=<name>` (either param optional).
- **Questions page** (`src/pages/Questions.tsx`): read the `dept` URL param and pass it to `QuestionsFeed` as a `tag` filter using the existing `dept:<name>` convention. Show the active department in the subheading and as a removable chip.
- **Shared list** (`src/lib/departments.ts`): extract the 8 departments to one constant so AskQuestion, Auth, and header all share it.

## Technical notes

Questions already store the chosen department as a tag entry `dept:<Department Name>` (see `AskQuestion.tsx`). `QuestionsFeed` already supports `filters.tag` via `.contains("tags", [tag])`, so no DB changes are needed — the header just needs to pass `tag: "dept:<name>"`.

The Select uses a sentinel value `"all"` for "All departments" (Radix Select disallows empty string values). Submitting only appends `dept=` when a real department is selected.
