import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatRelative } from "@/lib/format";

export default function Admin() {
  const [stats, setStats] = useState({ users: 0, questions: 0, answers: 0, votes: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);

  const load = async () => {
    const [u, q, a, v, ul, ql, al] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("questions").select("id", { count: "exact", head: true }),
      supabase.from("answers").select("id", { count: "exact", head: true }),
      supabase.from("votes").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id,full_name,program,reputation,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("questions").select("id,title,created_at,author:profiles!questions_author_id_fkey(full_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("answers").select("id,body,created_at,question_id,author:profiles!answers_author_id_fkey(full_name)").order("created_at", { ascending: false }).limit(50),
    ]);
    setStats({ users: u.count ?? 0, questions: q.count ?? 0, answers: a.count ?? 0, votes: v.count ?? 0 });
    setUsers(ul.data ?? []); setQuestions(ql.data ?? []); setAnswers(al.data ?? []);
  };

  useEffect(() => { document.title = "Admin — ATC Forum"; load(); }, []);

  const delQ = async (id: string) => {
    if (!confirm("Delete this question and its answers?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  const delA = async (id: string) => {
    if (!confirm("Delete this answer?")) return;
    const { error } = await supabase.from("answers").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  const promote = async (uid: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" as any });
    if (error) toast.error(error.message); else toast.success("User promoted to admin");
  };

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-gold" />
        <div>
          <h1 className="font-display text-3xl text-primary">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor activity and moderate content.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Users", v: stats.users },
          { label: "Questions", v: stats.questions },
          { label: "Answers", v: stats.answers },
          { label: "Votes", v: stats.votes },
        ].map((s) => (
          <div key={s.label} className="card-elegant p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="font-display text-3xl text-primary mt-1">{s.v}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="answers">Answers</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="space-y-2 mt-4">
          {users.map((u) => (
            <div key={u.id} className="card-elegant p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{u.full_name}</div>
                <div className="text-xs text-muted-foreground">{u.program || "—"} · Rep {u.reputation} · joined {formatRelative(u.created_at)}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => promote(u.id)}>Make admin</Button>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="questions" className="space-y-2 mt-4">
          {questions.map((q) => (
            <div key={q.id} className="card-elegant p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <a href={`/questions/${q.id}`} className="font-medium text-primary hover:text-accent truncate block">{q.title}</a>
                <div className="text-xs text-muted-foreground">by {q.author?.full_name} · {formatRelative(q.created_at)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => delQ(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="answers" className="space-y-2 mt-4">
          {answers.map((a) => (
            <div key={a.id} className="card-elegant p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <a href={`/questions/${a.question_id}`} className="font-medium text-primary hover:text-accent line-clamp-1 block">{a.body}</a>
                <div className="text-xs text-muted-foreground">by {a.author?.full_name} · {formatRelative(a.created_at)}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => delA(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
