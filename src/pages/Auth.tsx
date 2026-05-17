import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import atcLogo from "@/assets/atc-logo.png";

type AccountType = "atc_student" | "atc_staff" | "new_student" | "external_student" | "guest";

const DEPARTMENTS = [
  "Automotive Engineering Department",
  "Civil Engineering Department",
  "Department of Applied Sciences and Social Studies",
  "Electrical Engineering Department",
  "Information And Communication Technology",
  "Mechanical Engineering Department",
  "Transportation Engineering Department",
  "Vocational Education and Training Department",
] as const;

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "atc_student", label: "ATC Student" },
  { value: "atc_staff", label: "ATC Staff" },
  { value: "new_student", label: "New Student (applying)" },
  { value: "external_student", label: "Student from Another Institution" },
  { value: "guest", label: "Guest from Outside" },
];

const baseFields = {
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().min(7, "Enter your phone number").max(30),
  password: z.string().min(8, "Min 8 characters").max(72),
  confirmPassword: z.string(),
};

const emailField = z.string().trim().email("Invalid email").max(255);
const req = (msg: string) => z.string().trim().min(1, msg).max(150);

const signUpSchema = z.discriminatedUnion("accountType", [
  z.object({ accountType: z.literal("atc_student"), ...baseFields, email: emailField, department: req("Department required") }),
  z.object({ accountType: z.literal("atc_staff"), ...baseFields, email: emailField, department: req("Department required") }),
  z.object({ accountType: z.literal("new_student"), ...baseFields, admissionNumber: req("Index/Admission number required"), programme: req("Programme required") }),
  z.object({ accountType: z.literal("external_student"), ...baseFields, institutionName: req("Institution required"), admissionNumber: req("Admission/Student ID required"), programme: req("Course/Programme required") }),
  z.object({ accountType: z.literal("guest"), ...baseFields, organization: req("Organization required"), region: req("Region/Location required"), purpose: z.string().trim().max(300).optional() }),
]).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Required"),
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30) || "user";
const synthEmail = (fullName: string) =>
  `${slugify(fullName)}-${Math.random().toString(36).slice(2, 8)}@atc-forum.local`;

function Field({ name, label, type = "text", placeholder, maxLength = 150, required = true, autoComplete }: {
  name: string; label: string; type?: string; placeholder?: string; maxLength?: number; required?: boolean; autoComplete?: string;
}) {
  const id = `su-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required={required} placeholder={placeholder} maxLength={maxLength} autoComplete={autoComplete} />
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [department, setDepartment] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);

  if (user) {
    navigate("/", { replace: true });
  }

  const from = (location.state as any)?.from?.pathname || "/";

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw: Record<string, any> = { accountType, department };
    fd.forEach((v, k) => { raw[k] = typeof v === "string" ? v : undefined; });

    const parsed = signUpSchema.safeParse(raw);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const data = parsed.data;

    const email = "email" in data ? data.email : synthEmail(data.fullName);

    setBusy(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: data.fullName },
      },
    });
    if (error) { setBusy(false); toast.error(error.message); return; }

    const userId = signUpData.user?.id;
    if (userId) {
      const profileUpdate: Record<string, any> = {
        account_type: data.accountType,
        phone: data.phone,
        full_name: data.fullName,
      };
      if ("department" in data) profileUpdate.department = data.department;
      if ("admissionNumber" in data) profileUpdate.admission_number = data.admissionNumber;
      if ("programme" in data) profileUpdate.programme = data.programme;
      if ("institutionName" in data) profileUpdate.institution_name = data.institutionName;
      if ("organization" in data) profileUpdate.organization = data.organization;
      if ("region" in data) profileUpdate.region = data.region;
      if ("purpose" in data && data.purpose) profileUpdate.purpose = data.purpose;

      await supabase.from("profiles").update(profileUpdate as any).eq("id", userId);
    }

    setBusy(false);
    toast.success("Account created — welcome to ATC Forum!");
    navigate(from, { replace: true });
  };

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
    navigate(from, { replace: true });
  };

  const onForgot = async () => {
    const email = prompt("Enter your email to reset your password:");
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent. Check your inbox.");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative hero-gradient text-primary-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-3 font-display text-xl">
          <img src={atcLogo} alt="ATC logo" className="h-11 w-11 object-contain rounded-md bg-white p-0.5" />
          ATC Forum
        </Link>
        <div className="space-y-6 max-w-md">
          <img src={atcLogo} alt="ATC Department of ICT logo" className="h-20 w-20 object-contain" />
          <h1 className="font-display text-4xl leading-tight">
            Where ATC students think, ask, and grow — together.
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            A centralized academic platform for Arusha Technical College. Ask questions, share answers, and build a permanent knowledge base for every program.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} Arusha Technical College</p>
      </div>

      <div className="flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <img src={atcLogo} alt="ATC logo" className="h-10 w-10 object-contain" />
            <span className="font-display text-lg">ATC Forum</span>
          </div>
          <div>
            <h2 className="font-display text-2xl">Welcome</h2>
            <p className="text-muted-foreground text-sm">Sign in or create your student account.</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="si-password">Password</Label>
                    <button type="button" onClick={onForgot} className="text-xs text-accent hover:underline">Forgot?</button>
                  </div>
                  <PasswordInput id="si-password" name="password" required autoComplete="current-password" />
                </div>
                <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {step === 1 || !accountType ? (
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>I am signing up as</Label>
                    <Select value={accountType ?? undefined} onValueChange={(v) => setAccountType(v as AccountType)}>
                      <SelectTrigger><SelectValue placeholder="Choose account type" /></SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Pick the role that matches you — the next step asks for the right details.</p>
                  </div>
                  <Button
                    type="button"
                    disabled={!accountType}
                    onClick={() => setStep(2)}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                <form key={accountType} onSubmit={onSignUp} className="space-y-4 pt-4">
                  <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <span>
                      Signing up as{" "}
                      <strong>{ACCOUNT_TYPES.find((t) => t.value === accountType)?.label}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-accent hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <Field name="fullName" label="Full name" placeholder="Jane Mwangi" maxLength={100} />

                  {(accountType === "atc_student" || accountType === "atc_staff") && (
                    <>
                      <Field name="email" type="email" label="Email" placeholder="you@atc.ac.tz" autoComplete="email" />
                      <Field name="department" label="Department" placeholder="e.g. ICT" />
                    </>
                  )}

                  {accountType === "new_student" && (
                    <>
                      <Field name="admissionNumber" label="Form Four/Six Index or Admission Number" />
                      <Field name="programme" label="Programme Applied" />
                    </>
                  )}

                  {accountType === "external_student" && (
                    <>
                      <Field name="institutionName" label="Institution / College / University" />
                      <Field name="admissionNumber" label="Admission Number or Student ID" />
                      <Field name="programme" label="Course / Programme" />
                    </>
                  )}

                  {accountType === "guest" && (
                    <>
                      <Field name="organization" label="Place of Work / Organization" />
                      <Field name="region" label="Region or Location" />
                      <Field name="purpose" label="Purpose of Access (optional)" required={false} />
                    </>
                  )}

                  <Field name="phone" type="tel" label="Phone number" placeholder="+255 ..." autoComplete="tel" />

                  <div className="space-y-2">
                    <Label htmlFor="su-password">Password</Label>
                    <PasswordInput id="su-password" name="password" required minLength={8} autoComplete="new-password" />
                    <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-confirm">Confirm password</Label>
                    <PasswordInput id="su-confirm" name="confirmPassword" required minLength={8} autoComplete="new-password" />
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button type="submit" disabled={busy} className="flex-1">{busy ? "Creating…" : "Create account"}</Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to use the forum for academic purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
