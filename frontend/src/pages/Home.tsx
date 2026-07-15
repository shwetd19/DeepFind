import { useNavigate } from "react-router";
import { BookOpen, Cpu, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";

const SUGGESTIONS: { icon: LucideIcon; label: string }[] = [
  { icon: TrendingUp, label: "What are the best ways to learn Rust in 2026?" },
  { icon: Cpu, label: "Compare Bun vs Node.js for production APIs" },
  { icon: BookOpen, label: "What is retrieval-augmented generation?" },
];

export default function Home() {
  const navigate = useNavigate();

  function ask(query: string) {
    navigate("/conversations/new", { state: { query } });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="size-6 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            What do you want to know?
          </h1>
          <p className="text-muted-foreground">
            Ask anything. DeepFind searches the web and answers with sources.
          </p>
        </div>

        <ChatInput variant="hero" onSubmit={ask} autoFocus placeholder="Ask anything..." />

        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map(({ icon: Icon, label }) => (
            <Button
              key={label}
              variant="outline"
              size="sm"
              className="h-auto gap-2 whitespace-normal rounded-full bg-transparent py-1.5 font-normal text-muted-foreground hover:text-foreground"
              onClick={() => ask(label)}
            >
              <Icon className="size-3.5 shrink-0 text-primary" />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
