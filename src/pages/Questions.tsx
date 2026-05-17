import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { QuestionsFeed } from "@/components/QuestionsFeed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function Questions() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? undefined;
  const dept = params.get("dept") ?? undefined;
  const [sort, setSort] = useState<"newest" | "votes" | "unanswered">("newest");

  const clearDept = () => {
    const next = new URLSearchParams(params);
    next.delete("dept");
    setParams(next, { replace: true });
  };

  return (
    <div className="container py-8 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-primary">All Questions</h1>
          <p className="text-sm text-muted-foreground">
            {search ? `Search: “${search}”` : "Browse the full archive."}
          </p>
          {dept && (
            <Badge variant="secondary" className="gap-1.5">
              Department: {dept}
              <Button
                type="button"
                onClick={clearDept}
                variant="ghost"
                size="icon"
                className="h-4 w-4 -mr-1 hover:bg-transparent"
                aria-label="Clear department filter"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
        <Tabs value={sort} onValueChange={(v) => setSort(v as any)}>
          <TabsList>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="votes">Top voted</TabsTrigger>
            <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      <QuestionsFeed filters={{ search, sort, tag: dept ? `dept:${dept}` : undefined }} />
    </div>
  );
}
