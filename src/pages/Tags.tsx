import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import atcLogo from "@/assets/atc-logo.png";

interface Tally { tag: string; count: number; }

export default function Tags() {
  const [tags, setTags] = useState<Tally[]>([]);
  useEffect(() => {
    document.title = "Tags — ATC Forum";
    supabase.from("questions").select("tags").then(({ data }) => {
      const map = new Map<string, number>();
      (data ?? []).forEach((r: any) => (r.tags ?? []).forEach((t: string) => map.set(t, (map.get(t) ?? 0) + 1)));
      setTags([...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count));
    });
  }, []);
  return (
    <div className="container py-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl text-primary">Tags</h1>
        <p className="text-sm text-muted-foreground">Browse by topic across all programs.</p>
      </header>
      {tags.length === 0 ? (
        <div className="card-elegant p-10 text-center text-muted-foreground flex flex-col items-center">
          <img src={atcLogo} alt="ATC Department of ICT logo" className="h-16 w-16 object-contain opacity-60 mb-4" />
          No tags yet — ask a question with tags to seed this list.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tags.map((t) => (
            <Link key={t.tag} to={`/tags/${t.tag}`} className="card-elegant p-4">
              <div className="tag-chip">#{t.tag}</div>
              <div className="mt-2 text-xs text-muted-foreground">{t.count} question{t.count === 1 ? "" : "s"}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
