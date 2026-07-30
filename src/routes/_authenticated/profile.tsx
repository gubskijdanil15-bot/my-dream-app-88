import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LanguageToggle } from "@/components/language-toggle";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  component: ProfilePage,
});

function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (user) {
      setEmail(user.email ?? "");
      // display_name у таблиці profiles
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      setName(prof?.display_name ?? "");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;
      if (!id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id, display_name: name }, { onConflict: "id" });
      if (error) throw error;
      toast.success("Профіль оновлено");
    } catch (e) {
      console.error(e);
      toast.error("Не вдалося оновити профіль");
    } finally {
      setBusy(false);
    }
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast.success("Пошту оновлено. Перевірте підтвердження, якщо потрібно.");
    } catch (e) {
      console.error(e);
      toast.error("Не вдалося оновити пошту");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      toast.success("Пароль змінено");
    } catch (e) {
      console.error(e);
      toast.error("Не вдалося змінити пароль");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-8">
        <a href="/workspace" className="text-sm font-semibold text-muted-foreground hover:text-accent">
          ← Назад
        </a>
        <LanguageToggle />
      </header>

      <main className="mx-auto max-w-2xl space-y-8 p-4 pb-20 sm:p-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Профіль</h1>
          <p className="mt-1 text-sm text-muted-foreground">Редагуйте ім'я, пошту і пароль.</p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="label-mono mb-3">Ім'я</h2>
          <form onSubmit={saveProfile} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              disabled={busy}
              className="shrink-0 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold tracking-wide text-background hover:bg-accent disabled:opacity-50"
            >
              Зберегти
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="label-mono mb-3">Пошта</h2>
          <form onSubmit={saveEmail} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              disabled={busy}
              className="shrink-0 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold tracking-wide text-background hover:bg-accent disabled:opacity-50"
            >
              Оновити
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="label-mono mb-3">Пароль</h2>
          <form onSubmit={savePassword} className="flex gap-2">
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              disabled={busy}
              className="shrink-0 rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold tracking-wide text-background hover:bg-accent disabled:opacity-50"
            >
              Змінити
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
