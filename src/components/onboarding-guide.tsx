import { useState } from "react";
import { useLang, type TranslationKey } from "@/lib/i18n";

export type GuideTarget = "notes" | "okr" | "plan" | "calendar" | "ideas" | null;

type Step = {
  id: string;
  title: TranslationKey;
  body: TranslationKey;
  target: GuideTarget;
  mark: string;
};

const STEPS: Step[] = [
  { id: "notes", title: "guide.notes.t", body: "guide.notes.b", target: "notes", mark: "01" },
  { id: "okr", title: "guide.okr.t", body: "guide.okr.b", target: "okr", mark: "02" },
  { id: "plan", title: "guide.plan.t", body: "guide.plan.b", target: "plan", mark: "03" },
  { id: "boards", title: "guide.boards.t", body: "guide.boards.b", target: null, mark: "04" },
  { id: "cal", title: "guide.cal.t", body: "guide.cal.b", target: "calendar", mark: "05" },
  { id: "ideas", title: "guide.ideas.t", body: "guide.ideas.b", target: "ideas", mark: "06" },
];

/** Step-by-step interactive walkthrough of the whole workspace. Fully translated. */
export function OnboardingGuide({ onOpen }: { onOpen: (target: Exclude<GuideTarget, null>) => void }) {
  const { t } = useLang();
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      {/* Step rail */}
      <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {STEPS.map((s, i) => {
          const active = i === index;
          return (
            <li key={s.id} className="shrink-0 lg:shrink">
              <button
                onClick={() => setIndex(i)}
                aria-current={active ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.mark}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold">{t(s.title)}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <article className="animate-entry rounded-2xl border border-border bg-card p-5 sm:p-7">
        <p className="text-[11px] font-bold uppercase text-muted-foreground">
          {t("guide.step")} {index + 1} / {STEPS.length}
        </p>
        <h3 className="mt-2 break-words text-xl font-extrabold sm:text-2xl">{t(step.title)}</h3>
        <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {t(step.body)}
        </p>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-full border border-border px-5 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            {t("guide.prev")}
          </button>
          <button
            onClick={() => setIndex((i) => (last ? 0 : i + 1))}
            className="rounded-full bg-foreground px-5 py-2.5 text-xs font-bold text-background transition-colors hover:bg-accent"
          >
            {last ? t("guide.done") : t("guide.next")}
          </button>
          {step.target && (
            <button
              onClick={() => onOpen(step.target!)}
              className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground"
            >
              {t(step.title)} →
            </button>
          )}
        </div>
      </article>
    </div>
  );
}
