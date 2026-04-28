import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import atcLogo from "@/assets/atc-logo.png";

export function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const load = async () => {
      const { count } = await supabase
        .from("notifications").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("is_read", false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase.channel("notif-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/questions?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md">
      <SidebarTrigger className="text-foreground" />
      <Link to="/" className="flex items-center gap-2 md:hidden" aria-label="ATC Forum home">
        <img src={atcLogo} alt="ATC Department of ICT logo" className="h-8 w-8 object-contain rounded-md bg-white/95 p-0.5" />
        <span className="font-display text-sm">ATC Forum</span>
      </Link>
      <form onSubmit={submit} className="relative hidden flex-1 max-w-xl md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search questions, tags, topics…"
          className="pl-9 bg-secondary/50 border-border focus-visible:ring-accent"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link to="/notifications" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 hover:bg-secondary/60">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{profile?.full_name || "Student"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserIcon className="mr-2 h-4 w-4" /> My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link to="/auth"><LogIn className="mr-2 h-4 w-4" /> Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
