import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useOutletContext } from "react-router";
import { LogOut, MessageSquare, Sparkles, SquarePen } from "lucide-react";
import { supabase, useAuth } from "@/lib/auth";
import { fetchConversations, type ConversationSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface ShellContext {
  refreshConversations: () => void;
}

export function useShell() {
  return useOutletContext<ShellContext>();
}

export default function AppShell() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  const refreshConversations = useCallback(() => {
    fetchConversations()
      .then(setConversations)
      .catch(() => setConversations([]));
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  const user = session?.user;
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "Account";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-4 py-4">
          <Sparkles className="size-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">DeepFind</span>
        </div>

        <div className="px-3">
          <Button className="w-full justify-start gap-2" variant="outline" onClick={() => navigate("/conversations")}>
            <SquarePen className="size-4" />
            New search
          </Button>
        </div>

        <Separator className="my-3" />

        <div className="px-4 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          History
        </div>

        <ScrollArea className="flex-1 px-2">
          {conversations === null ? (
            <div className="space-y-2 px-2 py-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <nav className="flex flex-col gap-1 pb-4">
              {conversations.map(conversation => (
                <NavLink
                  key={conversation.id}
                  to={`/conversations/${conversation.id}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )
                  }
                >
                  <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{conversation.title}</span>
                </NavLink>
              ))}
            </nav>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                <Avatar className="size-6">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet context={{ refreshConversations } satisfies ShellContext} />
      </main>
    </div>
  );
}
