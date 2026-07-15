import type { NextFunction, Request, Response } from "express";
import { createSupabaseClient } from "./client";
import { prisma } from "./db";
import { AuthProvider } from "./generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const client = createSupabaseClient();

function toAuthProvider(provider: string | undefined): AuthProvider {
  switch (provider) {
    case "google":
      return AuthProvider.Google;
    case "github":
    default:
      return AuthProvider.Github;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }

  const { data, error } = await client.auth.getUser(token);
  const supabaseUser = data.user;

  if (error || !supabaseUser || !supabaseUser.email) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  // Map the Supabase identity to our local User row, creating it on first login.
  let user = await prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
  if (!user) {
    user = await prisma.user.upsert({
      where: { email: supabaseUser.email },
      update: { supabaseId: supabaseUser.id },
      create: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email,
        name:
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.user_metadata?.name ??
          supabaseUser.email.split("@")[0]!,
        provider: toAuthProvider(supabaseUser.app_metadata?.provider),
      },
    });
  }

  req.userId = user.id;
  next();
}
