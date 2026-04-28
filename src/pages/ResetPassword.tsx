import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places recovery in URL hash; onAuthStateChange fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "PASSWORD_RECOVERY" || evt === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    if (password.length < 8) { toast.error("Min 8 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); navigate("/"); }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 subtle-gradient">
      <form onSubmit={onSubmit} className="w-full max-w-sm card-elegant p-8 space-y-4">
        <h1 className="font-display text-2xl">Reset password</h1>
        <p className="text-sm text-muted-foreground">Enter a new password for your account.</p>
        <div className="space-y-2">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <Button type="submit" disabled={busy || !ready} className="w-full">
          {busy ? "Updating…" : ready ? "Update password" : "Verifying link…"}
        </Button>
      </form>
    </div>
  );
}
