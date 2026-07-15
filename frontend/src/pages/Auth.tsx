import { useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.744.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 6.006 0c2.29-1.552 3.297-1.23 3.297-1.23.655 1.653.243 2.873.12 3.176.77.84 1.234 1.91 1.234 3.22 0 4.61-2.805 5.624-5.478 5.92.43.372.814 1.103.814 2.222 0 1.605-.015 2.896-.015 3.29 0 .32.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  );
}

export default function Auth() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function login(provider: "github") {
    setError(null);
    setPending(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/conversations`,
      },
    });

    if (error) {
      setError("Could not start the sign-in flow. Please try again.");
      setPending(false);
    }
    // On success the browser redirects to the OAuth provider, so nothing else to do here.
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-96 w-2xl -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Sparkles className="size-6" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">DeepFind</span>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              AI answers, grounded in live web search. Sign in to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button size="lg" className="w-full" disabled={pending} onClick={() => login("github")}>
              <GithubIcon className="size-4" />
              Continue with GitHub
            </Button>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-xs text-muted-foreground">
              Answers cite their sources so you can verify everything.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
