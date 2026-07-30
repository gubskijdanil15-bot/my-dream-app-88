import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Paperweight" },
      { name: "description", content: "Your notes and daily plan." },
    ],
  }),
  component: WorkspacePlaceholder,
});

function WorkspacePlaceholder() {
  const { t } = useLang();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Minimal, safe sign-out that cannot throw
  async function handleSignOut() {
    try {
      await qc.cancelQueries();
      qc.clear();
    } catch {}
    try {
      const mod = await import("@/integrations/supabase/client");
      await mod.supabase.auth.signOut();
    } catch {}
    navigate({ to: "/auth", replace: true });
  }

  // No data fetching, no effects that mutate state in loops
  const [now, setNow] = useState<string>(new Date().toLocaleString());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toLocaleString()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground md:flex-row">
      {/* Left rail */}
      <nav className="hidden w-16 flex-col items-center gap-8 border-r border-border py-8 md:flex">
        <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">P</div>
        <div className="mt-auto flex flex-col items-center gap-4">
          <Link to="/shared" className="text-center text-[11px] font-semibold leading-tight text-muted-foreground hover:text-accent">
            {t("ws.tabShare")}
          </Link>
          <LanguageToggle className="scale-90" />
          <ThemeToggle className="scale-90" />
          <button onClick={handleSignOut} className="text-[11px] font-semibold text-muted-foreground hover:text-accent">
            {t("ws.out")}
          </button>
        </div>
      </nav>

      {/* Header (mobile) */}
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-[10px] font-bold text-background">P</div>
          <span className="truncate text-sm font-bold tracking-tight">Paperweight</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button onClick={handleSignOut} className="text-xs font-semibold text-muted-foreground">
            {t("ws.out")}
          </button>
        </div>
      </header>

      {/* Main content — simple, non-crashing placeholder */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/80 px-4 py-4 sm:px-8 sm:py-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{t("ws.planner")}</h1>
            <p className="truncate font-mono text-xs text-muted-foreground sm:text-sm">{now}</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
          <section className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="label-mono mb-2">{t("ws.notes")}</h2>
            <p className="text-xs text-muted-foreground">This is a temporary safe placeholder. Your notes UI is disabled while we stabilize the page.</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <h2 className="label-mono mb-2">{t("ws.todayList")}</h2>
            <p className="text-xs text-muted-foreground">Daily plan UI is disabled temporarily. You can still switch theme/language or sign out.</p>
          </section>
        </div>
      </main>

      {/* Bottom tabs (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {["notes","plan","note","shared"].map((key) => (
          <button key={key} className="py-3.5 text-xs font-semibold tracking-wide text-muted-foreground">
            {key}
          </button>
        ))}
      </nav>
    </div>
  );
}
