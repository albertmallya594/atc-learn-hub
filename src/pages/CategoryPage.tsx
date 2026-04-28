import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuestionsFeed } from "@/components/QuestionsFeed";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [name, setName] = useState("");
  useEffect(() => {
    if (!slug) return;
    supabase.from("categories").select("name").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) { setName(data.name); document.title = `${data.name} — ATC Forum`; }
    });
  }, [slug]);

  return (
    <div className="container py-8 space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-accent font-medium">Category</p>
        <h1 className="font-display text-3xl text-primary">{name || "…"}</h1>
      </header>
      <QuestionsFeed filters={{ categorySlug: slug, sort: "newest" }} />
    </div>
  );
}
