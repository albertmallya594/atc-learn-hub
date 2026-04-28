import { supabase } from "@/integrations/supabase/client";

export type VoteTarget = "question" | "answer";
export type VoteKind = "up" | "down";

export async function castVote(userId: string, targetType: VoteTarget, targetId: string, kind: VoteKind) {
  // Toggle: if existing same kind => remove. If different => update. Else insert.
  const { data: existing } = await supabase
    .from("votes")
    .select("id,value")
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (!existing) {
    return supabase.from("votes").insert({ user_id: userId, target_type: targetType, target_id: targetId, value: kind });
  }
  if (existing.value === kind) {
    return supabase.from("votes").delete().eq("id", existing.id);
  }
  return supabase.from("votes").update({ value: kind }).eq("id", existing.id);
}

export function tallyVotes(votes: { value: "up" | "down" }[] | null | undefined) {
  if (!votes) return 0;
  return votes.reduce((s, v) => s + (v.value === "up" ? 1 : -1), 0);
}
