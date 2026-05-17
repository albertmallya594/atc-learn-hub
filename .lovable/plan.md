# Multi-role Sign-up

Extend the Register tab on `/auth` so users can pick one of four account types and fill the matching fields. All data beyond the standard Supabase auth fields is persisted to the `profiles` table.

## User type picker

On the Register tab, show a single dropdown (or segmented control) "I am signing up as…" with options:

1. ATC Student
2. ATC Staff
3. New Student (applying)
4. Student from Another Institution
5. Guest from Outside

The form fields below the picker change based on selection.

## Required fields per type

Common to all: Full Name, Phone Number, Password, Confirm Password. Email is also required for ATC Staff (existing flow). For the other types we don't have a real email; we'll generate a synthetic placeholder email so Supabase auth still works (see Technical section).

- **ATC Student**: Full Name, Email, Phone, Department, Password, Confirm Password
- **ATC Staff**: Full Name, Email, Phone, Department, Password, Confirm Password
- **New Student**: Full Name, Form Four/Six Index or Admission Number, Phone, Programme Applied, Password, Confirm Password
- **Student from Another Institution**: Full Name, Institution Name, Admission Number / Student ID, Phone, Course/Programme, Password, Confirm Password
- **Guest from Outside**: Full Name, Place of Work / Organization, Region or Location, Phone, Purpose of Access (optional), Password, Confirm Password

All sign-ups validate `password === confirmPassword` client-side with zod.

## Technical details

### Database
Add nullable columns to `public.profiles`:
- `account_type` text (enum-like: 'atc_student' | 'atc_staff' | 'new_student' | 'external_student' | 'guest')
- `phone` text
- `department` text
- `admission_number` text       (covers Form Four/Six index too)
- `programme` text              (covers "programme applied" and "course/programme")
- `institution_name` text
- `organization` text
- `region` text
- `purpose` text

No RLS changes needed — existing profile policies cover it. `handle_new_user` trigger keeps creating the base profile row; the client `update`s the new columns after sign-up using the returned user id.

### Frontend (`src/pages/Auth.tsx`)
- Add a `Select` for account type at the top of the Register tab.
- Render field groups conditionally based on selected type.
- Build a discriminated-union zod schema with one variant per type, all requiring `password`/`confirmPassword` match.
- For types without a real email, generate `${slug(fullName)}-${randomId}@atc-forum.local` and pass `full_name` in `options.data` so the trigger picks it up.
- After `supabase.auth.signUp`, run `supabase.from('profiles').update({...typeSpecificFields, account_type}).eq('id', data.user.id)`.
- Keep the existing Sign-in tab unchanged.

### Out of scope
- No admin UI to view/edit account_type (can come later).
- No email verification flow changes.
- No new routes.
