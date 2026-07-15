import { useState } from "react";
import { AlertCircle, Layers, ListPlus, Plus, Sparkles, type LucideIcon } from "lucide-react";
import type { Source } from "@/lib/api";
import { Markdown } from "@/components/chat/Markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const domain = domainOf(source.url);
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex flex-col justify-between gap-2 rounded-xl border border-transparent bg-secondary/70 p-3",
        "transition-colors hover:border-border hover:bg-accent"
      )}
    >
      <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground/90 group-hover:text-foreground">
        {source.title || domain}
      </p>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          loading="lazy"
          className="size-4 rounded-sm"
          onError={event => {
            event.currentTarget.style.display = "none";
          }}
        />
        <span className="truncate">{domain}</span>
        <span aria-hidden>·</span>
        <span>{index + 1}</span>
      </span>
    </a>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold">
      <Icon className="size-4 text-primary" />
      {children}
    </h3>
  );
}

const VISIBLE_SOURCES = 4;

export function ExchangeView({ exchange, showFollowUps, onFollowUp, followUpsDisabled }: ExchangeViewProps) {
  const [expanded, setExpanded] = useState(false);

  const sources = exchange.sources ?? [];
  const visibleSources = expanded ? sources : sources.slice(0, VISIBLE_SOURCES);
  const hiddenCount = sources.length - visibleSources.length;

  return (
    <article className="space-y-6">
      <h2 className="text-2xl font-semibold leading-snug tracking-tight sm:text-[1.75rem]">
        {exchange.query}
      </h2>

      {sources.length > 0 && (
        <section className="space-y-3">
          <SectionLabel icon={Layers}>
            Sources
            <span className="font-normal text-muted-foreground">· {sources.length}</span>
          </SectionLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {visibleSources.map((source, index) => (
              <SourceCard key={source.url} source={source} index={index} />
            ))}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={cn(
                  "flex items-center justify-center rounded-xl bg-secondary/70 p-3 text-xs font-medium text-muted-foreground",
                  "transition-colors hover:bg-accent hover:text-foreground"
                )}
              >
                +{hiddenCount} more
              </button>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <SectionLabel icon={Sparkles}>Answer</SectionLabel>
        {exchange.error ? (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {exchange.error}
          </p>
        ) : exchange.answer ? (
          <Markdown>{exchange.answer}</Markdown>
        ) : (
          <div className="space-y-2.5" aria-label="Searching the web">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}
      </section>

      {showFollowUps && !exchange.streaming && exchange.followUps && exchange.followUps.length > 0 && (
        <section>
          <SectionLabel icon={ListPlus}>Related</SectionLabel>
          <div className="mt-2 divide-y divide-border border-t">
            {exchange.followUps.map(question => (
              <Button
                key={question}
                variant="ghost"
                disabled={followUpsDisabled}
                onClick={() => onFollowUp?.(question)}
                className={cn(
                  "h-auto w-full justify-between gap-4 whitespace-normal rounded-none px-1 py-3 text-left text-sm",
                  "font-normal text-foreground/85 hover:bg-transparent hover:text-primary"
                )}
              >
                <span>{question}</span>
                <Plus className="size-4 shrink-0 text-primary" />
              </Button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
