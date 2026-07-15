import { useNavigate } from "react-router";
import { Sparkles } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "What are the best ways to learn Rust in 2026?",
  "Compare Bun vs Node.js for production APIs",
  "What is retrieval-augmented generation?",
];

export default function Home() {
  const navigate = useNavigate();

  function ask(query: string) {
    navigate("/conversations/new", { state: { query } });
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="size-7 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">DeepFind</h1>
          </div>
          <p className="text-muted-foreground">
            Ask anything. DeepFind searches the web and answers with sources.
          </p>
        </div>

        <ChatInput onSubmit={ask} autoFocus placeholder="What do you want to know?" />

        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map(suggestion => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              className="h-auto whitespace-normal py-1.5 font-normal text-muted-foreground"
              onClick={() => ask(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
