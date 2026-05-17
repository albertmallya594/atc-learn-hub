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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Lightbulb, Bold, Code, Link as LinkIcon, BadgeHelp, Building2 } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 chars").max(200),
  body: z.string().trim().min(20, "Provide more detail (min 20 chars)").max(8000),
  category_id: z.string().uuid("Pick a category"),
  department: z.string().min(1, "Pick a department"),
});

interface Category { id: string; name: string; }

const DEPARTMENTS = [
  "Automotive Engineering Department",
  "Civil Engineering Department",
  "Department of Applied Sciences and Social Studies",
  "Electrical Engineering Department",
  "Information And Communication Technology",
  "Mechanical Engineering Department",
  "Transportation Engineering Department",
  "Vocational Education and Training Department",
];

const MAX_BODY = 8000;

export default function AskQuestion() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [bodyLen, setBodyLen] = useState(0);

  useEffect(() => {
    supabase.from("categories").select("id,name").order("name").then(({ data }) => data && setCats(data));
  }, []);

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      title: fd.get("title"),
      body: fd.get("body"),
      category_id: categoryId,
      department,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setBusy(true);
    const { data, error } = await supabase.from("questions").insert({
      author_id: user.id,
      category_id: parsed.data.category_id,
      title: parsed.data.title,
      body: parsed.data.body,
      tags: [`dept:${parsed.data.department}`],
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Question posted");
    navigate(`/questions/${data!.id}`);
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="card-elegant p-6 flex gap-4 items-start">
        <div className="rounded-xl bg-primary/10 text-primary p-3 shrink-0">
          <BadgeHelp className="size-5" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl text-primary leading-tight">Ask a question</h1>
          <p className="text-sm text-muted-foreground">A great question gets great answers. Keep these in mind:</p>
          <ul className="grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            <li className="flex gap-2 items-start"><span className="text-primary">•</span> Be specific and concise</li>
            <li className="flex gap-2 items-start"><span className="text-primary">•</span> Show what you tried</li>
            <li className="flex gap-2 items-start"><span className="text-primary">•</span> Explain the expected outcome</li>
          </ul>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card-elegant overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-3 border-b border-border bg-muted/20">
          <Avatar className="size-9">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Posting as</p>
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || "You"}
              {profile?.username && <span className="text-muted-foreground font-normal"> · @{profile.username}</span>}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5 border-b border-border">
          <div className="grid sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px] gap-4">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required maxLength={200} placeholder="e.g. How do I implement JWT auth in Node.js?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-1.5">
                <Building2 className="size-3.5" /> Department
              </Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <Label htmlFor="body" className="text-base">Question detail</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{bodyLen} / {MAX_BODY}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border"><Bold className="size-3" /> **bold**</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border"><Code className="size-3" /> `code`</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border"><LinkIcon className="size-3" /> [text](url)</span>
            <span className="inline-flex items-center gap-1 ml-auto"><Lightbulb className="size-3" /> Markdown supported</span>
          </div>

          <Textarea
            id="body"
            name="body"
            required
            maxLength={MAX_BODY}
            onChange={(e) => setBodyLen(e.target.value.length)}
            className="min-h-[320px] bg-background font-mono text-sm leading-relaxed resize-y"
            placeholder={`Explain the problem in detail.\n\nWhat have you tried?\nWhat error or unexpected result did you get?\nWhat do you expect to happen?`}
          />
        </div>

        <div className="p-4 flex items-center justify-between gap-2 border-t border-border bg-card">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post question"}</Button>
        </div>
      </form>
    </div>
  );
}
