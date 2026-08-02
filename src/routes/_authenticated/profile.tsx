import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationSettings } from "@/components/notification-settings";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Paperweight" },
      {
        name: "description",
        content:
          "Manage your Paperweight account: display name, email address, password and light or dark appearance.",
      },
      { property: "og:title", content: "Profile — Paperweight" },
      { property: "og:description", content: "Manage your name, email, password and theme." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, lang } = useLang();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const account = useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw error ?? new Error("No user");
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();
      return {
        id: data.user.id,
        email: data.user.email ?? "",
        createdAt: data.user.created_at,
        displayName: profile?.display_name ?? "",
      };
    },
  });

  const [name, setName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (account.data) setName(account.data.displayName);
  }, [account.data]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!account.data) return;
    setBusy(true);
    try {
      const value = name.trim().slice(0, 80);
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: account.data.id, display_name: value });
      if (error) throw error;
      await supabase.auth.updateUser({ data: { display_name: value } });
      qc.invalidateQueries({ queryKey: ["account"] });
      toast.success(t("profile.nameSaved"));
    } catch {
      toast.error(t("profile.err"));
    } finally {
      setBusy(false);
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    const value = newEmail.trim();
    if (!value) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: value },
        { emailRedirectTo: window.location.origin },
      );
      if (error) throw error;
      setNewEmail("");
      toast.success(t("profile.emailSent"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.err"));
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw1.length < 6) return toast.error(t("profile.short"));
    if (pw1 !== pw2) return toast.error(t("profile.mismatch"));
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      setPw1("");
      setPw2("");
      toast.success(t("profile.passwordSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.err"));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const card = "rounded-2xl border border-border bg-card p-5";
  const field =
    "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-ring";
  const action =
    "rounded-full bg-foreground px-4 py-2.5 text-xs font-bold tracking-wide text-background transition-colors hover:bg-accent disabled:opacity-50";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-8">
        <Link
          to="/workspace"
          className="text-sm font-semibold text-muted-foreground hover:text-accent"
        >
          ← {t("share.myNotebook")}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-4 pb-20 sm:p-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("profile.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.sub")}</p>
        </div>

        <section className={card}>
          <h2 className="label-mono mb-3">{t("profile.account")}</h2>
          <p className="text-sm font-semibold break-all">{account.data?.email ?? "…"}</p>
          {account.data?.createdAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("profile.memberSince")}{" "}
              {new Date(account.data.createdAt).toLocaleDateString(
                lang === "uk" ? "uk-UA" : undefined,
                { year: "numeric", month: "long", day: "numeric" },
              )}
            </p>
          )}
          <button onClick={signOut} className="mt-4 text-xs font-semibold text-muted-foreground hover:text-destructive">
            {t("profile.signOut")}
          </button>
        </section>

        <section className={card}>
          <h2 className="label-mono mb-3">{t("profile.name")}</h2>
          <form onSubmit={saveName} className="flex flex-wrap gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className={`${field} min-w-0 flex-1`}
            />
            <button type="submit" disabled={busy} className={action}>
              {t("profile.saveName")}
            </button>
          </form>
        </section>

        <section className={card}>
          <h2 className="label-mono mb-3">{t("profile.email")}</h2>
          <form onSubmit={changeEmail} className="flex flex-wrap gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t("profile.newEmail")}
              maxLength={255}
              className={`${field} min-w-0 flex-1`}
            />
            <button type="submit" disabled={busy} className={action}>
              {t("profile.changeEmail")}
            </button>
          </form>
        </section>

        <section className={card}>
          <h2 className="label-mono mb-3">{t("profile.password")}</h2>
          <form onSubmit={changePassword} className="space-y-2">
            <input
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              placeholder={t("profile.newPassword")}
              minLength={6}
              className={field}
            />
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder={t("profile.confirmPassword")}
              minLength={6}
              className={field}
            />
            <button type="submit" disabled={busy} className={action}>
              {t("profile.changePassword")}
            </button>
          </form>
        </section>

        <section className={card}>
          <h2 className="label-mono mb-3">{t("profile.appearance")}</h2>
          <div className="inline-flex rounded-full border border-border p-1">
            {(["light", "dark"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-pressed={theme === value}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  theme === value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-accent"
                }`}
              >
                {t(value === "light" ? "profile.light" : "profile.dark")}
              </button>
            ))}
          </div>
        </section>

        <NotificationSettings />
      </main>
    </div>
  );
}
