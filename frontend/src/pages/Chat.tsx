import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { askDeepFind, fetchConversation, type ApiMessage } from "@/lib/api";
import { ChatInput } from "@/components/chat/ChatInput";
import { ExchangeView, type Exchange } from "@/components/chat/ExchangeView";
import { useShell } from "@/components/layout/AppShell";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatLocationState {
  query?: string;
  preloaded?: Exchange[];
}

/** Pairs the flat message list from the API into query/answer exchanges. */
function toExchanges(messages: ApiMessage[]): Exchange[] {
  const exchanges: Exchange[] = [];
  for (const message of messages) {
    if (message.role === "User") {
      exchanges.push({ query: message.content, answer: "" });
    } else {
      const last = exchanges[exchanges.length - 1];
      if (last && !last.answer) {
        last.answer = message.content;
        last.sources = message.sources ?? undefined;
        last.followUps = message.followUps;
      }
    }
  }
  return exchanges;
}

export default function Chat() {
  const { conversationId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshConversations } = useShell();

  const isNew = conversationId === "new";
  const state = (location.state ?? {}) as ChatLocationState;

  const [exchanges, setExchanges] = useState<Exchange[] | null>(isNew ? [] : null);
  const [streaming, setStreaming] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const exchangesRef = useRef<Exchange[]>([]);
  const startedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function setAndTrack(updater: (prev: Exchange[]) => Exchange[]) {
    setExchanges(prev => {
      const next = updater(prev ?? []);
      exchangesRef.current = next;
      return next;
    });
  }

  // Load a persisted conversation (skipped when we just streamed it and carried the state over)
  useEffect(() => {
    if (isNew) return;
    if (state.preloaded) {
      exchangesRef.current = state.preloaded;
      setExchanges(state.preloaded);
      return;
    }
    setExchanges(null);
    setLoadError(null);
    fetchConversation(conversationId)
      .then(conversation => {
        exchangesRef.current = toExchanges(conversation.messages);
        setExchanges(exchangesRef.current);
      })
      .catch(error => setLoadError(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Kick off a brand-new conversation carried over from the Home page
  useEffect(() => {
    if (!isNew || startedRef.current) return;
    startedRef.current = true;
    if (!state.query) {
      navigate("/conversations", { replace: true });
      return;
    }
    void ask(state.query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges]);

  async function ask(query: string) {
    setStreaming(true);
    setAndTrack(prev => [...prev, { query, answer: "", streaming: true }]);

    const updateLast = (patch: Partial<Exchange>) =>
      setAndTrack(prev => prev.map((e, i) => (i === prev.length - 1 ? { ...e, ...patch } : e)));

    try {
      const result = await askDeepFind({
        query,
        conversationId: isNew ? undefined : conversationId,
        onAnswer: answer => updateLast({ answer }),
      });
      updateLast({
        answer: result.answer,
        sources: result.sources,
        followUps: result.followUps,
        streaming: false,
      });
      refreshConversations();
      if (isNew && result.conversationId) {
        navigate(`/conversations/${result.conversationId}`, {
          replace: true,
          state: { preloaded: exchangesRef.current } satisfies ChatLocationState,
        });
      }
    } catch (error) {
      updateLast({
        streaming: false,
        error: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setStreaming(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-3xl space-y-10 px-4 pb-10 pt-2 sm:px-6">
          {exchanges === null ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            exchanges.map((exchange, index) => (
              <div key={index} className="space-y-10">
                {index > 0 && <Separator />}
                <ExchangeView
                  exchange={exchange}
                  showFollowUps={index === exchanges.length - 1}
                  onFollowUp={ask}
                  followUpsDisabled={streaming}
                />
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 px-4 pb-4 pt-1 sm:px-6 md:pb-6">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput onSubmit={ask} disabled={streaming} placeholder="Ask a follow-up..." />
        </div>
      </div>
    </div>
  );
}
