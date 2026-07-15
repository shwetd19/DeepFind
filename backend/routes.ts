import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "./db";
import { MessageRole } from "./generated/prisma/enums";
import { streamDeepFind } from "./lib/deepfind";
import type { ModelMessage } from "ai";

export const router: Router = Router();

const askSchema = z.object({
  query: z.string().trim().min(1, "query is required").max(4000, "query is too long"),
});

/** How many prior messages we replay to the LLM on follow-ups. */
const HISTORY_LIMIT = 10;

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "conversation"}-${crypto.randomUUID().slice(0, 8)}`;
}

function startStream(res: Response, conversationId: string) {
  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Conversation-Id", conversationId);
  res.flushHeaders();
}

async function persistExchange(
  conversationId: string,
  query: string,
  result: { answer: string; followUps: string[]; sources: { title: string; url: string }[] }
) {
  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, role: MessageRole.User, content: query },
    }),
    prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.Assistant,
        content: result.answer,
        followUps: result.followUps,
        sources: result.sources,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

// Current user profile
router.get("/me", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, name: true, provider: true },
  });
  res.json({ user });
});

// List the user's conversations, most recently active first
router.get("/conversations", async (req: Request, res: Response) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.userId! },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, createdAt: true, updatedAt: true },
  });
  res.json({ conversations });
});

// A single conversation with its messages
router.get("/conversations/:conversationId", async (req: Request, res: Response) => {
  const conversation = await prisma.conversation.findFirst({
    where: { id: String(req.params.conversationId), userId: req.userId! },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          sources: true,
          followUps: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json({ conversation });
});

// Start a new conversation: streams the answer, X-Conversation-Id header carries the new id
router.post("/conversations", async (req: Request, res: Response) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  const { query } = parsed.data;

  const title = query.length > 80 ? `${query.slice(0, 77)}...` : query;
  const conversation = await prisma.conversation.create({
    data: { title, slug: slugify(title), userId: req.userId! },
  });

  startStream(res, conversation.id);
  const result = await streamDeepFind(res, { query });
  await persistExchange(conversation.id, query, result);
  res.end();
});

// Ask a follow-up inside an existing conversation
router.post("/conversations/:conversationId/messages", async (req: Request, res: Response) => {
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }
  const { query } = parsed.data;

  const conversation = await prisma.conversation.findFirst({
    where: { id: String(req.params.conversationId), userId: req.userId! },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT,
        select: { role: true, content: true },
      },
    },
  });

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history: ModelMessage[] = conversation.messages
    .reverse()
    .map(m =>
      m.role === MessageRole.User
        ? ({ role: "user", content: m.content } as const)
        : ({ role: "assistant", content: m.content } as const)
    );

  startStream(res, conversation.id);
  const result = await streamDeepFind(res, {
    query,
    history,
    // Follow-ups are often context-dependent ("does it support windows?"),
    // so anchor the web search with the conversation topic.
    searchQuery: `${conversation.title} — ${query}`.slice(0, 400),
  });
  await persistExchange(conversation.id, query, result);
  res.end();
});
