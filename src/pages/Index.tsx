import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuestionsFeed } from "@/components/QuestionsFeed";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, ScanSearch, Users, BookOpen, MessageSquareQuote } from "lucide-react";

export default function Index() {
  const { user, isAdmin } = useAuth();
  const [params] = useSearchParams();
  const [stats, setStats] = useState({ q: 0, a: 0, u: 0 });
  const [sort, setSort] = useState<"newest" | "votes" | "unanswered">("newest");

  useEffect(() => {
    document.title = "ATC Q&A Forum — Arusha Technical College";
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); return m;
    })();
    meta.setAttribute("content", "Academic Q&A platform for Arusha Technical College students. Ask questions, share answers, build collective knowledge.");

    Promise.all([
      supabase.from("questions").select("id", { count: "exact", head: true }),
      supabase.from("answers").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([q, a, u]) => setStats({ q: q.count ?? 0, a: a.count ?? 0, u: u.count ?? 0 }));
  }, []);

  const search = params.get("q") ?? undefined;

  return (
    <div className="container py-6 lg:py-10 space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl hero-gradient text-primary-foreground p-8 lg:p-12 shadow-[var(--shadow-elegant)]">
        <div className="relative z-10 max-w-2xl space-y-5 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-xs text-gold">
            <ScanSearch className="h-3.5 w-3.5" /> Built for ATC students
          </div>
          <h1 className="font-display text-4xl lg:text-5xl leading-tight">
            Academic answers,<br /><span className="text-gold">always within reach.</span>
          </h1>
          <p className="text-primary-foreground/80 text-base lg:text-lg max-w-xl">
            Stop losing knowledge in WhatsApp chats. Ask, answer, vote, and search across every program at Arusha Technical College.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {user ? (
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/ask">Ask your first question <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/auth">Join the forum <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/questions">Browse questions</Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
      </section>

      {/* Stats */}
      <section className={`grid grid-cols-1 gap-4 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {[
          { label: "Questions", value: stats.q, icon: MessageSquareQuote },
          { label: "Answers shared", value: stats.a, icon: BookOpen },
          ...(isAdmin ? [{ label: "Active members", value: stats.u, icon: Users }] : []),
        ].map((s) => (
          <div key={s.label} className="card-elegant p-5 flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/5 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-2xl text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Feed */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-2xl text-primary">
              {search ? `Results for “${search}”` : "Latest questions"}
            </h2>
            <p className="text-sm text-muted-foreground">Curated from across all programs.</p>
          </div>
          <Tabs value={sort} onValueChange={(v) => setSort(v as any)}>
            <TabsList>
              <TabsTrigger value="newest">Newest</TabsTrigger>
              <TabsTrigger value="votes">Top voted</TabsTrigger>
              <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <QuestionsFeed filters={{ search, sort }} />
      </section>
    </div>
  );
}
