import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatRelative } from "@/lib/format";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notif { id: string; type: string; message: string; link: string | null; is_read: boolean; created_at: string; }

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    document.title = "Notifications — ATC Forum";
    if (!user) return;
    const load = () => supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => data && setItems(data));
    load();
    const ch = supabase.channel("notifs").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  };

  return (
    <div className="container py-8 max-w-2xl space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-primary flex items-center gap-2"><Bell className="h-6 w-6" /> Notifications</h1>
        <Button variant="outline" size="sm" onClick={markAll}><CheckCheck className="h-4 w-4 mr-2" /> Mark all read</Button>
      </header>
      <div className="space-y-2">
        {items.length === 0 && <div className="card-elegant p-8 text-center text-muted-foreground">You're all caught up.</div>}
        {items.map((n) => (
          <Link key={n.id} to={n.link || "#"}
            onClick={async () => { if (!n.is_read) await supabase.from("notifications").update({ is_read: true }).eq("id", n.id); }}
            className={`block card-elegant p-4 ${!n.is_read ? "border-l-4 border-l-accent" : ""}`}>
            <div className="flex justify-between gap-3">
              <span className="text-sm">{n.message}</span>
              <span className="text-xs text-muted-foreground shrink-0">{formatRelative(n.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
