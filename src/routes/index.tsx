import { createFileRoute, Link } from "@tanstack/react-router";
import { LanguageToggle } from "@/components/language-toggle";
import { RulerProgress } from "@/components/ruler-progress";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paperweight — Notes, goals and a daily plan" },
      {
        name: "description",
        content:
          "Paperweight is a quiet workspace for capturing notes, setting goals with real progress, and planning your day.",
      },
      { property: "og:title", content: "Paperweight — Notes, goals and a daily plan" },
      {
        property: "og:description",
        content: "A quiet workspace for notes, goals and daily planning.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useLang();

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-8 sm:py-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
            P
          </div>
          <span className="truncate font-mono text-xs tracking-wide">Paperweight</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <Link
            to="/auth"
            className="rounded-full bg-foreground px-4 py-2 text-xs font-bold tracking-wide text-background transition-colors hover:bg-accent"
          >
            {t("nav.signin")}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-24">
        <p className="label-mono mb-5">{t("brand.tagline")}</p>
        <h1 className="animate-entry max-w-2xl text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.05]">
          {t("landing.h1")}
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base">
          {t("landing.sub")}
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-block w-full rounded-full bg-foreground px-6 py-3.5 text-center text-xs font-bold tracking-wide text-background transition-colors hover:bg-accent sm:mt-10 sm:w-auto"
        >
          {t("landing.cta")}
        </Link>
      </section>

      {/* 01 — Capture: a paper card with a live-looking capture line */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto grid max-w-3xl gap-6 px-5 py-12 sm:grid-cols-[auto_1fr] sm:gap-10 sm:px-8 sm:py-16">
          <span className="font-mono text-4xl font-bold text-accent/25 sm:text-5xl">01</span>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{t("capture.title")}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("capture.body")}
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="size-2 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0 truncate text-sm">{t("capture.demo")}</span>
                <span className="ml-auto shrink-0 font-mono text-[10px] tracking-wide text-muted-foreground">
                  ⏎
                </span>
              </div>
              <div className="mt-3 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
                {t("capture.hint")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — Aim: the pencil-ruler progress in action */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-3xl gap-6 px-5 py-12 sm:grid-cols-[auto_1fr] sm:gap-10 sm:px-8 sm:py-16">
          <span className="font-mono text-4xl font-bold text-accent/25 sm:text-5xl">02</span>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{t("aim.title")}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("aim.body")}
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold">{t("aim.demoGoal")}</h3>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {t("aim.demoTarget")}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs">62%</span>
              </div>
              <RulerProgress value={62} />
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Plan: a real-looking checklist */}
      <section className="border-t border-border bg-paper">
        <div className="mx-auto grid max-w-3xl gap-6 px-5 py-12 sm:grid-cols-[auto_1fr] sm:gap-10 sm:px-8 sm:py-16">
          <span className="font-mono text-4xl font-bold text-accent/25 sm:text-5xl">03</span>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{t("plan.title")}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t("plan.body")}
            </p>
            <ul className="mt-6 rounded-2xl border border-border bg-card px-5 shadow-sm">
              {(
                [
                  ["plan.demo1", "priority.high", true],
                  ["plan.demo2", "priority.medium", false],
                  ["plan.demo3", "priority.low", false],
                ] as const
              ).map(([key, prio, done]) => (
                <li
                  key={key}
                  className="flex items-center gap-3 border-b border-border/40 py-3 last:border-0"
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      done ? "border-accent bg-accent" : "border-border"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full bg-background ${done ? "" : "opacity-0"}`}
                    />
                  </span>
                  <span
                    className={`min-w-0 truncate text-sm ${done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {t(key)}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground/60">
                    {t(prio)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-10 text-center sm:px-8">
        <Link
          to="/auth"
          className="inline-block rounded-full bg-accent px-6 py-3 text-xs font-bold tracking-wide text-accent-foreground"
        >
          {t("landing.cta")}
        </Link>
      </footer>
    </main>
  );
}
