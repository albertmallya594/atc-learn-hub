import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoteControl } from "@/components/VoteControl";
import { CheckCircle2, Trash2, MessageCircle } from "lucide-react";
import { initials, formatRelative } from "@/lib/format";
import { toast } from "sonner";

interface QData {
  id: string; title: string; body: string; tags: string[]; view_count: number;
  created_at: string; author_id: string;
  author: { full_name: string; username: string | null } | null;
  category: { name: string; slug: string } | null;
}
interface AData {
  id: string; body: string; created_at: string; is_accepted: boolean; author_id: string;
  author: { full_name: string } | null;
  votes: { value: "up" | "down"; user_id: string }[];
  comments: { id: string; body: string; created_at: string; author_id: string; author: { full_name: string } | null }[];
}

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState<QData | null>(null);
  const [qVotes, setQVotes] = useState<{ value: "up" | "down"; user_id: string }[]>([]);
  const [answers, setAnswers] = useState<AData[]>([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: ques }, { data: vts }, { data: ans }] = await Promise.all([
      supabase.from("questions").select(`
        id,title,body,tags,view_count,created_at,author_id,
        author:profiles!questions_author_id_fkey(full_name,username),
        category:categories(name,slug)
      `).eq("id", id).maybeSingle(),
      supabase.from("votes").select("value,user_id").eq("target_type", "question").eq("target_id", id),
      supabase.from("answers").select(`
        id,body,created_at,is_accepted,author_id,
        author:profiles!answers_author_id_fkey(full_name),
        comments(id,body,created_at,author_id,author:profiles!comments_author_id_fkey(full_name))
      `).eq("question_id", id).order("is_accepted", { ascending: false }).order("created_at", { ascending: true }),
    ]);
    setQ(ques as any);
    setQVotes(vts ?? []);

    const answerIds = (ans ?? []).map((a: any) => a.id);
    let votesByAnswer = new Map<string, { value: "up" | "down"; user_id: string }[]>();
    if (answerIds.length) {
      const { data: aVotes } = await supabase
        .from("votes")
        .select("target_id,value,user_id")
        .eq("target_type", "answer")
        .in("target_id", answerIds);
      for (const v of aVotes ?? []) {
        const arr = votesByAnswer.get(v.target_id) ?? [];
        arr.push({ value: v.value, user_id: v.user_id });
        votesByAnswer.set(v.target_id, arr);
      }
    }
    const mapped = (ans ?? []).map((a: any) => ({
      ...a,
      votes: votesByAnswer.get(a.id) ?? [],
    }));
    setAnswers(mapped);
  }, [id]);

  useEffect(() => {
    load();
    // increment view count
    if (id) supabase.from("questions").select("view_count").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) supabase.from("questions").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", id);
    });
  }, [id, load]);

  useEffect(() => {
    if (q) document.title = `${q.title} — ATC Forum`;
  }, [q]);

  const tally = (vs: { value: "up" | "down" }[]) => vs.reduce((s, v) => s + (v.value === "up" ? 1 : -1), 0);
  const myVote = (vs: { value: "up" | "down"; user_id: string }[]) =>
    user ? vs.find((v) => v.user_id === user.id)?.value ?? null : null;

  const submitAnswer = async () => {
    if (!user || !id) { navigate("/auth"); return; }
    if (body.trim().length < 10) { toast.error("Answer must be at least 10 characters"); return; }
    setPosting(true);
    const { error } = await supabase.from("answers").insert({
      question_id: id, author_id: user.id, body: body.trim(),
    });
    setPosting(false);
    if (error) toast.error(error.message);
    else { setBody(""); toast.success("Answer posted"); load(); }
  };

  const accept = async (aid: string) => {
    if (!q || !user || user.id !== q.author_id) return;
    // Unset others, set this one
    await supabase.from("answers").update({ is_accepted: false }).eq("question_id", q.id);
    const { error } = await supabase.from("answers").update({ is_accepted: true }).eq("id", aid);
    if (error) toast.error(error.message);
    else { toast.success("Answer accepted"); load(); }
  };

  const removeAnswer = async (aid: string) => {
    if (!confirm("Delete this answer?")) return;
    const { error } = await supabase.from("answers").delete().eq("id", aid);
    if (error) toast.error(error.message); else load();
  };

  const removeQuestion = async () => {
    if (!q || !confirm("Delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", q.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); navigate("/questions"); }
  };

  const addComment = async (aid: string, text: string) => {
    if (!user) { navigate("/auth"); return; }
    if (text.trim().length < 2) return;
    const { error } = await supabase.from("comments").insert({ answer_id: aid, author_id: user.id, body: text.trim() });
    if (error) toast.error(error.message); else load();
  };

  if (!q) return <div className="container py-10"><div className="card-elegant p-6 animate-pulse h-40 bg-muted/20" /></div>;

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <article className="card-elegant p-6">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          {q.category && (
            <Link to={`/category/${q.category.slug}`} className="tag-chip bg-accent/10 text-accent border-accent/20">
              {q.category.name}
            </Link>
          )}
          <span className="text-xs text-muted-foreground">Asked {formatRelative(q.created_at)}</span>
          <span className="text-xs text-muted-foreground">· {q.view_count} views</span>
          {(user?.id === q.author_id || isAdmin) && (
            <button onClick={removeQuestion} className="ml-auto text-xs text-destructive hover:underline flex items-center gap-1">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
        <h1 className="font-display text-3xl text-primary leading-tight">{q.title}</h1>

        <div className="mt-5 flex gap-5">
          <VoteControl targetType="question" targetId={q.id} initialCount={tally(qVotes)} initialUserVote={myVote(qVotes)} />
          <div className="flex-1 min-w-0">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90">{q.body}</div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {q.tags.map((t) => <Link key={t} to={`/tags/${t}`} className="tag-chip">#{t}</Link>)}
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{initials(q.author?.full_name)}</AvatarFallback></Avatar>
                <span className="font-medium text-foreground">{q.author?.full_name || "Unknown"}</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section>
        <h2 className="font-display text-xl text-primary mb-3">{answers.length} {answers.length === 1 ? "Answer" : "Answers"}</h2>
        <div className="space-y-4">
          {answers.map((a) => (
            <div key={a.id} className={`card-elegant p-5 ${a.is_accepted ? "ring-1 ring-success/40 bg-success/5" : ""}`}>
              <div className="flex gap-5">
                <div className="flex flex-col items-center gap-3">
                  <VoteControl targetType="answer" targetId={a.id} initialCount={tally(a.votes)} initialUserVote={myVote(a.votes)} />
                  {q.author_id === user?.id && (
                    <button onClick={() => accept(a.id)} title={a.is_accepted ? "Accepted" : "Mark as accepted"}
                      className={`p-1 rounded-md hover:bg-secondary ${a.is_accepted ? "text-success" : "text-muted-foreground"}`}>
                      <CheckCircle2 className="h-6 w-6" />
                    </button>
                  )}
                  {a.is_accepted && q.author_id !== user?.id && <CheckCircle2 className="h-6 w-6 text-success" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90">{a.body}</div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-accent text-accent-foreground">{initials(a.author?.full_name)}</AvatarFallback></Avatar>
                    <span className="font-medium text-foreground">{a.author?.full_name}</span>
                    · <span>{formatRelative(a.created_at)}</span>
                    {(user?.id === a.author_id || isAdmin) && (
                      <button onClick={() => removeAnswer(a.id)} className="ml-auto text-destructive hover:underline">Delete</button>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="mt-4 border-t border-border pt-3 space-y-2">
                    {a.comments.map((c) => (
                      <div key={c.id} className="text-xs text-foreground/80 flex gap-2">
                        <span className="font-medium text-accent">{c.author?.full_name}:</span>
                        <span className="flex-1">{c.body}</span>
                        <span className="text-muted-foreground">{formatRelative(c.created_at)}</span>
                      </div>
                    ))}
                    {user && <CommentForm onSubmit={(t) => addComment(a.id, t)} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-elegant p-6">
        <h3 className="font-display text-lg text-primary mb-3">Your answer</h3>
        {user ? (
          <div className="space-y-3">
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share what you know…" maxLength={8000} />
            <div className="flex justify-end">
              <Button onClick={submitAnswer} disabled={posting}>{posting ? "Posting…" : "Post answer"}</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link to="/auth" className="text-accent hover:underline">Sign in</Link> to post an answer.
          </p>
        )}
      </section>
    </div>
  );
}

function CommentForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-accent hover:underline flex items-center gap-1">
      <MessageCircle className="h-3 w-3" /> Add a comment
    </button>
  );
  return (
    <div className="flex gap-2">
      <input
        autoFocus value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment…" maxLength={500}
        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
      />
      <Button size="sm" onClick={() => { onSubmit(text); setText(""); setOpen(false); }}>Post</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
