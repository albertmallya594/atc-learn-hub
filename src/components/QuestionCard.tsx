import { Link } from "react-router-dom";
import { MessageSquare, Eye, ArrowUp, CheckCircle2 } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

export interface QuestionRow {
  id: string;
  title: string;
  body: string;
  tags: string[];
  view_count: number;
  created_at: string;
  author: { full_name: string; username: string | null } | null;
  category: { name: string; slug: string } | null;
  vote_count: number;
  answer_count: number;
  has_accepted: boolean;
}

export function QuestionCard({ q }: { q: QuestionRow }) {
  return (
    <article className="card-elegant p-5 group">
      <div className="flex gap-4">
        <div className="hidden sm:flex flex-col items-center gap-3 text-xs text-muted-foreground min-w-[80px]">
          <div className="flex flex-col items-center">
            <ArrowUp className="h-4 w-4" />
            <span className="font-semibold text-foreground">{q.vote_count}</span>
            <span>votes</span>
          </div>
          <div className={`flex flex-col items-center rounded-md px-2 py-1 ${q.has_accepted ? "bg-success/10 text-success" : ""}`}>
            {q.has_accepted ? <CheckCircle2 className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            <span className="font-semibold">{q.answer_count}</span>
            <span>answers</span>
          </div>
          <div className="flex flex-col items-center">
            <Eye className="h-4 w-4" />
            <span className="font-semibold text-foreground">{q.view_count}</span>
            <span>views</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/questions/${q.id}`} className="font-display text-lg leading-snug text-primary hover:text-accent transition-colors">
            {q.title}
          </Link>
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{q.body.replace(/\n/g, " ")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {q.category && (
              <Link to={`/category/${q.category.slug}`} className="tag-chip bg-accent/10 text-accent border-accent/20 hover:bg-accent/15">
                {q.category.name}
              </Link>
            )}
            {q.tags.slice(0, 4).map((t) => (
              <Link key={t} to={`/tags/${t}`} className="tag-chip hover:bg-secondary">#{t}</Link>
            ))}
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                  {initials(q.author?.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{q.author?.full_name || "Unknown"}</span>
              · <span>{formatRelative(q.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
