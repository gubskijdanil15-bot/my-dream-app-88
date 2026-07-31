import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

import { useLang, type TranslationKey } from "@/lib/i18n";
import {
  useActivity,
  useJoinJournal,
  useJoinedJournals,
  useMembers,
  useMyJournalCode,
  useRemoveMembership,
  useSetPermission,
} from "@/lib/journal-data";

export const Route = createFileRoute("/_authenticated/shared")({
  head: () => ({
    meta: [
      { title: "Shared notebooks — Paperweight" },
      {
        name: "description",
        content:
          "Share your Paperweight notebook with a 6-digit code, set view or edit access, and see who changed what.",
      },
      { property: "og:title", content: "Shared notebooks — Paperweight" },
      { property: "og:description", content: "Invite people with a code and track their changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SharedPage,
});

function SharedPage() {
  const { t, lang } = useLang();
  const locale = lang === "uk" ? "uk-UA" : undefined;

  const code = useMyJournalCode();
  const members = useMembers();
  const joined = useJoinedJournals();
  const activity = useActivity();
  const join = useJoinJournal();
  const setPermission = useSetPermission();
  const removeMembership = useRemoveMembership();

  const [input, setInput] = useState("");

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault();
    const value = input.replace(/\D/g, "");
    if (value.length !== 6) return;
    try {
      await join.mutateAsync(value);
      setInput("");
      toast.success(t("share.joinedOk"));
    } catch {
      toast.error(t("share.errJoin"));
    }
  }

  const card = "rounded-2xl border border-border bg-card p-5";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-8">
        <Link to="/workspace" className="text-sm font-semibold text-muted-foreground hover:text-accent">
          ← {t("share.myNotebook")}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>


      <main className="mx-auto max-w-3xl space-y-8 p-4 pb-20 sm:p-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("share.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("share.sub")}</p>
        </div>

        {/* my code + join */}
        <div className="grid gap-4 sm:grid-cols-2">
          <section className={card}>
            <h2 className="label-mono mb-3">{t("share.myCode")}</h2>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-bold tracking-[0.2em] text-accent">
                {code.data ?? "······"}
              </span>
              <button
                onClick={() => {
                  if (!code.data) return;
                  navigator.clipboard?.writeText(code.data);
                  toast.success(t("share.copied"));
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
              >
                {t("share.copy")}
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t("share.myCodeHint")}
            </p>
          </section>

          <section className={card}>
            <h2 className="label-mono mb-3">{t("share.join")}</h2>
            <form onSubmit={submitJoin} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder={t("share.joinPlaceholder")}
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-base tracking-[0.2em] focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={join.isPending}
                className="shrink-0 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold tracking-wide text-background hover:bg-accent disabled:opacity-50"
              >
                {t("share.joinBtn")}
              </button>
            </form>
          </section>
        </div>

        {/* people in my notebook */}
        <section className={card}>
          <h2 className="label-mono mb-4">{t("share.members")}</h2>
          {members.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("share.membersEmpty")}</p>
          )}
          <ul className="space-y-3">
            {members.data?.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {m.name ?? t("share.someone")}
                </span>
                <select
                  value={m.permission}
                  onChange={(e) =>
                    setPermission.mutate(
                      { id: m.id, permission: e.target.value as "read" | "edit" },
                      { onSuccess: () => toast.success(t("share.permUpdated")) },
                    )
                  }
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
                >
                  <option value="read">{t("share.permRead")}</option>
                  <option value="edit">{t("share.permEdit")}</option>
                </select>
                <button
                  onClick={() =>
                    removeMembership.mutate(m.id, {
                      onSuccess: () => toast.success(t("share.removed")),
                    })
                  }
                  className="text-xs font-semibold text-muted-foreground hover:text-destructive"
                >
                  {t("share.remove")}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* notebooks I joined */}
        <section className={card}>
          <h2 className="label-mono mb-4">{t("share.joined")}</h2>
          {joined.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("share.joinedEmpty")}</p>
          )}
          <ul className="space-y-3">
            {joined.data?.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {j.name ?? t("share.someone")}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                  {j.permission === "edit" ? t("share.permEdit") : t("share.permRead")}
                </span>
                <Link
                  to="/workspace"
                  className="text-xs font-semibold text-muted-foreground hover:text-accent"
                >
                  {t("share.open")}
                </Link>
                <button
                  onClick={() => removeMembership.mutate(j.id)}
                  className="text-xs font-semibold text-muted-foreground hover:text-destructive"
                >
                  {t("share.leave")}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* activity */}
        <section className={card}>
          <h2 className="label-mono mb-4">{t("share.activity")}</h2>
          {activity.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("share.activityEmpty")}</p>
          )}
          <ul className="space-y-3">
            {activity.data?.map((a) => (
              <li key={a.id} className="text-sm leading-relaxed">
                <span className="font-semibold">{a.name ?? t("share.someone")}</span>{" "}
                <span className="text-muted-foreground">
                  {t(`act.${a.action}` as TranslationKey)}{" "}
                  {t(`act.${a.entity_type}` as TranslationKey)}
                </span>
                {a.entity_title ? <span> “{a.entity_title}”</span> : null}
                <div className="text-[11px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleString(locale, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
