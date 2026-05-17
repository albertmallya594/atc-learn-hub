# Password show/hide toggle

Add an eye icon inside every password input so users can toggle visibility.

## Approach

Create a small reusable `PasswordInput` component at `src/components/ui/password-input.tsx` that wraps the existing `Input` and adds an `Eye` / `EyeOff` lucide button positioned inside the field. It forwards all standard input props (id, name, required, minLength, autoComplete, placeholder, etc.) so it's a drop-in replacement.

## Where it gets used

Replace `<Input type="password" ... />` with `<PasswordInput ... />` in:
- `src/pages/Auth.tsx` (sign-in password, sign-up password, confirm password)
- `src/pages/ResetPassword.tsx` (new password)

## Technical

- `forwardRef<HTMLInputElement>` so refs/forms keep working.
- Internal `useState` for `visible`; toggles `type` between `password` and `text`.
- Button is `type="button"` (so it doesn't submit the form), absolutely positioned right inside a relative wrapper, with `aria-label="Show password" / "Hide password"`.
- Adds right padding (`pr-10`) to the input so text doesn't sit under the icon.
- Uses semantic tokens (`text-muted-foreground`, `hover:text-foreground`) — no hard-coded colors.
