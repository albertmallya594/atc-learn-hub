import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { castVote, VoteTarget } from "@/lib/votes";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  targetType: VoteTarget;
  targetId: string;
  initialCount: number;
  initialUserVote: "up" | "down" | null;
}

export function VoteControl({ targetType, targetId, initialCount, initialUserVote }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(initialCount);
  const [my, setMy] = useState<"up" | "down" | null>(initialUserVote);
  const [busy, setBusy] = useState(false);

  const click = async (kind: "up" | "down") => {
    if (!user) { toast.error("Sign in to vote"); navigate("/auth"); return; }
    if (busy) return;
    setBusy(true);
    const prev = my;
    let delta = 0;
    let next: "up" | "down" | null = kind;
    if (prev === kind) { delta = kind === "up" ? -1 : 1; next = null; }
    else if (prev) { delta = kind === "up" ? 2 : -2; }
    else { delta = kind === "up" ? 1 : -1; }
    setMy(next); setCount(count + delta);
    const { error } = await castVote(user.id, targetType, targetId, kind);
    if (error) { setMy(prev); setCount(count); toast.error(error.message); }
    setBusy(false);
  };

  return (
    <div className="flex flex-col items-center gap-1 text-muted-foreground">
      <button onClick={() => click("up")} aria-label="Upvote"
        className={cn("p-1.5 rounded-md hover:bg-secondary transition", my === "up" && "text-success bg-success/10")}>
        <ArrowUp className="h-5 w-5" />
      </button>
      <span className="font-display text-lg text-foreground tabular-nums">{count}</span>
      <button onClick={() => click("down")} aria-label="Downvote"
        className={cn("p-1.5 rounded-md hover:bg-secondary transition", my === "down" && "text-destructive bg-destructive/10")}>
        <ArrowDown className="h-5 w-5" />
      </button>
    </div>
  );
}
