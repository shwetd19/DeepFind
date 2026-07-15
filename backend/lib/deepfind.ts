import { tavily } from "@tavily/core";
import { streamText, type ModelMessage } from "ai";
import type { Response } from "express";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "../prompts";

const searchClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

const MODEL = process.env.DEEPFIND_MODEL ?? "openai/gpt-5-nano";

export interface Source {
  title: string;
  url: string;
}

export interface DeepFindResult {
  /** Full raw model output, including the ANSWER/FOLLOW_UPS tags. */
  raw: string;
  /** Markdown answer extracted from <ANSWER>. */
  answer: string;
  followUps: string[];
  sources: Source[];
}

export async function webSearch(query: string) {
  const response = await searchClient.search(query, { searchDepth: "advanced" });
  const sources: Source[] = response.results.map(r => ({ title: r.title, url: r.url }));
  return { results: response.results, sources };
}

export function buildUserPrompt(query: string, webSearchResults: unknown) {
  return PROMPT_TEMPLATE
    .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
    .replace("{{USER_QUERY}}", query);
}

export function parseModelOutput(raw: string) {
  const answer = raw.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/)?.[1]?.trim() ?? raw.trim();
  const followUps = [...raw.matchAll(/<question>([\s\S]*?)<\/question>/g)]
    .map(m => m[1]!.trim())
    .filter(Boolean);
  return { answer, followUps };
}

/**
 * Streams a DeepFind answer to an Express response.
 *
 * Wire protocol (plain text, in order):
 *   <ANSWER>...</ANSWER> <FOLLOW_UPS>...</FOLLOW_UPS>   <- streamed as the model generates
 *   \n<SOURCES>[{"title":"...","url":"..."}]</SOURCES>\n <- appended once, after the model is done
 *
 * Returns the parsed result so the caller can persist it. Does NOT end the response.
 */
export async function streamDeepFind(
  res: Response,
  opts: {
    query: string;
    history?: ModelMessage[];
    /** Optional standalone query for web search — useful when `query` is a context-dependent follow-up. */
    searchQuery?: string;
  }
): Promise<DeepFindResult> {
  const { results, sources } = await webSearch(opts.searchQuery ?? opts.query);

  const messages: ModelMessage[] = [
    ...(opts.history ?? []),
    { role: "user", content: buildUserPrompt(opts.query, results) },
  ];

  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages,
  });

  let raw = "";
  for await (const textPart of result.textStream) {
    raw += textPart;
    res.write(textPart);
  }

  res.write(`\n<SOURCES>${JSON.stringify(sources)}</SOURCES>\n`);

  const { answer, followUps } = parseModelOutput(raw);
  return { raw, answer, followUps, sources };
}
