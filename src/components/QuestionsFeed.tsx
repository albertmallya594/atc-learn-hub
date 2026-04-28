import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuestionCard, QuestionRow } from "./QuestionCard";
import atcLogo from "@/assets/atc-logo.png";

export interface FeedFilters {
  search?: string;
  categorySlug?: string;
  tag?: string;
  authorId?: string;
  sort?: "newest" | "votes" | "unanswered";
}

export function QuestionsFeed({ filters }: { filters: FeedFilters }) {
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("questions")
        .select(`
          id,title,body,tags,view_count,created_at,
          author:profiles!questions_author_id_fkey(full_name,username),
          category:categories(name,slug),
          answers(id,is_accepted),
          votes:votes!votes_target_id_fkey(value,target_type)
        `)
        .limit(50);
      if (filters.search) query = query.ilike("title", `%${filters.search}%`);
      if (filters.authorId) query = query.eq("author_id", filters.authorId);
      if (filters.tag) query = query.contains("tags", [filters.tag]);

      // category slug filter via join requires id lookup
      if (filters.categorySlug) {
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", filters.categorySlug).maybeSingle();
        if (cat) query = query.eq("category_id", cat.id);
      }

      query = filters.sort === "votes" ? query.order("created_at", { ascending: false }) : query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) { console.error(error); setLoading(false); return; }

      const mapped: QuestionRow[] = (data ?? []).map((q: any) => {
        const qVotes = (q.votes ?? []).filter((v: any) => v.target_type === "question");
        const vote_count = qVotes.reduce((s: number, v: any) => s + (v.value === "up" ? 1 : -1), 0);
        const answers = q.answers ?? [];
        return {
          id: q.id, title: q.title, body: q.body, tags: q.tags ?? [],
          view_count: q.view_count, created_at: q.created_at,
          author: q.author, category: q.category,
          vote_count,
          answer_count: answers.length,
          has_accepted: answers.some((a: any) => a.is_accepted),
        };
      });

      let final = mapped;
      if (filters.sort === "votes") final = [...mapped].sort((a, b) => b.vote_count - a.vote_count);
      if (filters.sort === "unanswered") final = mapped.filter((m) => m.answer_count === 0);

      setRows(final);
      setLoading(false);
    };
    load();
  }, [filters.search, filters.categorySlug, filters.tag, filters.authorId, filters.sort]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-elegant p-5 h-32 animate-pulse bg-muted/30" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card-elegant p-10 text-center flex flex-col items-center">
        <img src={atcLogo} alt="ATC Department of ICT logo" className="h-16 w-16 object-contain opacity-60 mb-4" />
        <p className="font-display text-lg text-foreground">No questions yet</p>
        <p className="text-sm text-muted-foreground mt-1">Be the first to start the discussion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((q) => <QuestionCard key={q.id} q={q} />)}
    </div>
  );
}
