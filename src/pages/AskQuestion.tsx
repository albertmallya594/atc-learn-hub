import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 chars").max(200),
  body: z.string().trim().min(20, "Provide more detail (min 20 chars)").max(8000),
  category_id: z.string().uuid("Pick a category"),
  tags: z.string().max(200).optional(),
});

interface Category { id: string; name: string; }

export default function AskQuestion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");

  useEffect(() => {
    supabase.from("categories").select("id,name").order("name").then(({ data }) => data && setCats(data));
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      title: fd.get("title"),
      body: fd.get("body"),
      category_id: categoryId,
      tags: fd.get("tags") ?? "",
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const tags = (parsed.data.tags ?? "")
      .split(",").map((t) => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean).slice(0, 6);

    setBusy(true);
    const { data, error } = await supabase.from("questions").insert({
      author_id: user.id,
      category_id: parsed.data.category_id,
      title: parsed.data.title,
      body: parsed.data.body,
      tags,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Question posted");
    navigate(`/questions/${data!.id}`);
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl text-primary">Ask a question</h1>
        <p className="text-sm text-muted-foreground">Be specific. Provide context, what you tried, and the expected outcome.</p>
      </header>

      <form onSubmit={onSubmit} className="card-elegant p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required maxLength={200} placeholder="e.g. How do I implement JWT auth in Node.js?" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category"><SelectValue placeholder="Choose a category" /></SelectTrigger>
            <SelectContent>
              {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Question detail</Label>
          <Textarea id="body" name="body" required rows={10} placeholder="Explain the problem, share code or error messages, describe what you tried…" />
          <p className="text-xs text-muted-foreground">Markdown formatting will render in the answer.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags <span className="text-muted-foreground">(comma-separated, up to 6)</span></Label>
          <Input id="tags" name="tags" maxLength={200} placeholder="javascript, jwt, security" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post question"}</Button>
        </div>
      </form>
    </div>
  );
}
