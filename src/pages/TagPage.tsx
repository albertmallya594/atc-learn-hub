import { useParams } from "react-router-dom";
import { QuestionsFeed } from "@/components/QuestionsFeed";

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  return (
    <div className="container py-8 space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-accent font-medium">Tag</p>
        <h1 className="font-display text-3xl text-primary">#{tag}</h1>
      </header>
      <QuestionsFeed filters={{ tag, sort: "newest" }} />
    </div>
  );
}
