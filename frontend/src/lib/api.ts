import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.BUN_PUBLIC_API_URL || "http://localhost:4000";

const supabase = createClient();

export interface Source {
  title: string;
  url: string;
}

export interface ApiMessage {
  id: number;
  role: "User" | "Assistant";
  content: string;
  sources: Source[] | null;
  followUps: string[];
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ApiMessage[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: await authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const data = await apiGet<{ conversations: ConversationSummary[] }>("/api/conversations");
  return data.conversations;
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
  const data = await apiGet<{ conversation: ConversationDetail }>(`/api/conversations/${id}`);
  return data.conversation;
}

export interface AskResult {
  conversationId: string;
  answer: string;
  followUps: string[];
  sources: Source[];
}

/**
 * Extracts the human-visible answer from a (possibly partial) stream buffer.
 * The wire protocol is: <ANSWER>markdown</ANSWER> <FOLLOW_UPS>...</FOLLOW_UPS>\n<SOURCES>json</SOURCES>
 */
function extractAnswer(buffer: string): string {
  const start = buffer.indexOf("<ANSWER>");
  let text = start === -1 ? buffer : buffer.slice(start + "<ANSWER>".length);
  const end = text.indexOf("</ANSWER>");
  if (end !== -1) return text.slice(0, end).trim();
  // Hide a partially-streamed tag (e.g. a trailing "</ANSW") until it completes.
  return text.replace(/<\/?[A-Z_]*$/, "").trimStart();
}

export async function askDeepFind(opts: {
  query: string;
  conversationId?: string;
  onAnswer: (partialAnswer: string) => void;
  signal?: AbortSignal;
}): Promise<AskResult> {
  const url = opts.conversationId
    ? `${API_URL}/api/conversations/${opts.conversationId}/messages`
    : `${API_URL}/api/conversations`;

  const res = await fetch(url, {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ query: opts.query }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }

  const conversationId = res.headers.get("X-Conversation-Id") ?? opts.conversationId ?? "";

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    opts.onAnswer(extractAnswer(buffer));
  }
  buffer += decoder.decode();

  if (buffer.includes("<ERROR>")) {
    throw new Error("Something went wrong while generating the answer. Please try again.");
  }

  const answer = extractAnswer(buffer);
  opts.onAnswer(answer);

  const followUps = [...buffer.matchAll(/<question>([\s\S]*?)<\/question>/g)]
    .map(m => m[1]!.trim())
    .filter(Boolean);

  let sources: Source[] = [];
  const sourcesMatch = buffer.match(/<SOURCES>([\s\S]*?)<\/SOURCES>/);
  if (sourcesMatch) {
    try {
      sources = JSON.parse(sourcesMatch[1]!);
    } catch {
      // sources are best-effort; the answer is already complete
    }
  }

  return { conversationId, answer, followUps, sources };
}
