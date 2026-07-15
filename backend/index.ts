import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { requireAuth } from "./middleware";
import { router } from "./routes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    exposedHeaders: ["X-Conversation-Id"],
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Everything under /api requires a valid Supabase session token
app.use("/api", requireAuth, router);

// Central error handler: JSON if we haven't started streaming, otherwise end the stream
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) {
    res.end("\n<ERROR>Something went wrong while generating the answer.</ERROR>\n");
    return;
  }
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`🚀 DeepFind backend listening on http://localhost:${port}`);
});
