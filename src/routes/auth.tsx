import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/workspace" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — Paperweight" },
      {
        name: "description",
        content:
          "Sign in to Paperweight to capture notes, track goals and plan your day in one quiet workspace.",
      },
      { property: "og:title", content: "Sign in — Paperweight" },
      {
        property: "og:description",
        content: "Your notes, goals and daily plan in one quiet workspace.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your inbox if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getUser();
      if (data.user) navigate({ to: "/workspace", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Could not sign in with Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/workspace", replace: true });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 py-10">
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="animate-entry w-full max-w-[380px] rounded-2xl border border-border bg-paper p-6 shadow-sm sm:p-8">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-md bg-foreground text-xl font-bold text-background">
          P
        </div>
        <h1 className="mb-1 text-center text-xl font-bold tracking-tight">
          {mode === "signin" ? t("auth.welcome") : t("auth.start")}
        </h1>
        <p className="mb-8 text-center text-xs text-muted-foreground">
          {t("auth.sub")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="label-mono block" htmlFor="name">
                {t("auth.name")}
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="label-mono block" htmlFor="email">
              {t("auth.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="w-full rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="label-mono block" htmlFor="password">
              {t("auth.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-foreground py-3 text-xs font-bold tracking-wide text-background transition-colors hover:bg-accent disabled:opacity-50"
          >
            {mode === "signin" ? t("auth.resume") : t("auth.create")}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="label-mono">{t("auth.or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full rounded-full border border-border bg-card py-3 text-xs font-bold tracking-wide transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {t("auth.google")}
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-[10px] tracking-wide text-muted-foreground hover:text-accent"
        >
          {mode === "signin" ? t("auth.toSignup") : t("auth.toSignin")}
        </button>
      </div>
    </main>
  );
}
