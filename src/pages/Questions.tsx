import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { QuestionsFeed } from "@/components/QuestionsFeed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Questions() {
  const [params] = useSearchParams();
  const search = params.get("q") ?? undefined;
  const [sort, setSort] = useState<"newest" | "votes" | "unanswered">("newest");

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary">All Questions</h1>
          <p className="text-sm text-muted-foreground">{search ? `Search: “${search}”` : "Browse the full archive."}</p>
        </div>
        <Tabs value={sort} onValueChange={(v) => setSort(v as any)}>
          <TabsList>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="votes">Top voted</TabsTrigger>
            <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      <QuestionsFeed filters={{ search, sort }} />
    </div>
  );
}
