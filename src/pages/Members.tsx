import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

interface Member { id: string; full_name: string; program: string | null; reputation: number; }

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    document.title = "Members — ATC Forum";
    supabase.from("profiles").select("id,full_name,program,reputation").order("reputation", { ascending: false }).limit(60)
      .then(({ data }) => data && setMembers(data));
  }, []);
  return (
    <div className="container py-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl text-primary">Members</h1>
        <p className="text-sm text-muted-foreground">The students powering the ATC knowledge base.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {members.map((m) => (
          <div key={m.id} className="card-elegant p-4 flex items-center gap-3">
            <Avatar className="h-12 w-12"><AvatarFallback className="bg-primary text-primary-foreground">{initials(m.full_name)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <div className="font-medium text-primary truncate">{m.full_name || "Anonymous"}</div>
              <div className="text-xs text-muted-foreground">{m.program || "ATC student"}</div>
              <div className="text-xs text-accent">Reputation: {m.reputation}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
