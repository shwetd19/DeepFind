import { ExternalLink, Globe, LoaderCircle, Sparkles } from "lucide-react";
import type { Source } from "@/lib/api";
import { Markdown } from "@/components/chat/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface Exchange {
  query: string;
  answer: string;
  sources?: Source[];
  followUps?: string[];
  streaming?: boolean;
  error?: string;
}

interface ExchangeViewProps {
  exchange: Exchange;
  /** Only the latest exchange shows clickable follow-ups. */
  showFollowUps?: boolean;
  onFollowUp?: (question: string) => void;
  followUpsDisabled?: boolean;
}

export function ExchangeView({ exchange, showFollowUps, onFollowUp, followUpsDisabled }: ExchangeViewProps) {
  return (
    <article className="space-y-4">
      <h2 className="text-xl font-semibold leading-snug">{exchange.query}</h2>

      {exchange.sources && exchange.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Globe className="size-3.5" /> Sources
          </span>
          {exchange.sources.map(source => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              <Badge variant="secondary" className="max-w-64 gap-1 hover:bg-accent">
                <span className="truncate">{source.title || new URL(source.url).hostname}</span>
                <ExternalLink className="size-3 shrink-0" />
              </Badge>
            </a>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <Sparkles className="mt-1 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          {exchange.error ? (
            <p className="text-sm text-destructive">{exchange.error}</p>
          ) : exchange.answer ? (
            <Markdown>{exchange.answer}</Markdown>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Searching the web...
            </p>
          )}
        </div>
      </div>

      {showFollowUps && !exchange.streaming && exchange.followUps && exchange.followUps.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Related</p>
          <div className="flex flex-col items-start gap-1.5">
            {exchange.followUps.map(question => (
              <Button
                key={question}
                variant="ghost"
                size="sm"
                disabled={followUpsDisabled}
                className="h-auto whitespace-normal px-2 py-1.5 text-left text-sm font-normal text-primary"
                onClick={() => onFollowUp?.(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
