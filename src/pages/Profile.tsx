import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { QuestionsFeed } from "@/components/QuestionsFeed";

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", program: "", year_of_study: "", bio: "" });

  useEffect(() => {
    document.title = "My Profile — ATC Forum";
    if (profile) setForm({
      full_name: profile.full_name ?? "",
      program: profile.program ?? "",
      year_of_study: profile.year_of_study?.toString() ?? "",
      bio: profile.bio ?? "",
    });
  }, [profile]);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      program: form.program.trim() || null,
      year_of_study: form.year_of_study ? parseInt(form.year_of_study) : null,
      bio: form.bio.trim() || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); refreshProfile(); }
  };

  return (
    <div className="container py-8 max-w-4xl space-y-8">
      <div className="card-elegant p-6 flex items-center gap-5">
        <Avatar className="h-20 w-20"><AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials(profile?.full_name)}</AvatarFallback></Avatar>
        <div>
          <h1 className="font-display text-2xl text-primary">{profile?.full_name || "Your name"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-accent mt-1">Reputation: {profile?.reputation ?? 0}</p>
        </div>
      </div>

      <form onSubmit={save} className="card-elegant p-6 space-y-4">
        <h2 className="font-display text-lg text-primary">Edit profile</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Program</Label>
            <Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} maxLength={100} placeholder="e.g. Computer Engineering" />
          </div>
          <div className="space-y-2">
            <Label>Year of study</Label>
            <Input type="number" min={1} max={6} value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} />
        </div>
        <div className="flex justify-end"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button></div>
      </form>

      <section>
        <h2 className="font-display text-xl text-primary mb-3">My questions</h2>
        <QuestionsFeed filters={{ authorId: user.id, sort: "newest" }} />
      </section>
    </div>
  );
}
