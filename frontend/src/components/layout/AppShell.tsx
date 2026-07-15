import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from "react-router";
import { ChevronsUpDown, LogOut, MessageSquare, Moon, Plus, Sparkles, Sun } from "lucide-react";
import { supabase, useAuth } from "@/lib/auth";
import { fetchConversations, type ConversationSummary } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export interface ShellContext {
  refreshConversations: () => void;
}

export function useShell() {
  return useOutletContext<ShellContext>();
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </div>
      <span className="text-lg font-semibold tracking-tight">DeepFind</span>
    </div>
  );
}

function AppSidebar({ conversations }: { conversations: ConversationSummary[] | null }) {
  const { session } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDark(isDark);
  }

  const closeMobile = () => setOpenMobile(false);

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
    <Sidebar>
      <SidebarHeader className="gap-4 px-3 pt-3">
        <Link to="/conversations" onClick={closeMobile} className="px-1">
          <Brand />
        </Link>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent"
          onClick={() => {
            closeMobile();
            navigate("/conversations");
          }}
        >
          <Plus className="size-4 text-primary" />
          New Thread
          <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            {conversations === null ? (
              <SidebarMenu>
                {Array.from({ length: 4 }, (_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No threads yet.</p>
            ) : (
              <SidebarMenu>
                {conversations.map(conversation => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/conversations/${conversation.id}`}
                      tooltip={conversation.title}
                    >
                      <Link to={`/conversations/${conversation.id}`} onClick={closeMobile}>
                        <MessageSquare className="text-muted-foreground" />
                        <span className="truncate">{conversation.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-7">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-medium">{displayName}</span>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme}>
                  {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {dark ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppShell() {
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

  // ⌘K / Ctrl+K starts a new thread from anywhere
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/conversations");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <SidebarProvider>
      <AppSidebar conversations={conversations} />
      <SidebarInset className="h-svh min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 px-3">
          <SidebarTrigger />
          <Link to="/conversations" className="md:hidden">
            <span className="text-sm font-semibold tracking-tight">DeepFind</span>
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet context={{ refreshConversations } satisfies ShellContext} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
