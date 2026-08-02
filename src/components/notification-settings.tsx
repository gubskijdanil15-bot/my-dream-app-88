import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import {
  notificationPermission,
  requestNotificationPermission,
  useNotificationPrefs,
  useSaveNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notifications";

const ROWS = [
  ["taskReminders", "notif.taskReminders"],
  ["dailyRecap", "notif.dailyRecap"],
  ["system", "notif.system"],
] as const;

export function NotificationSettings() {
  const { t } = useLang();
  const prefs = useNotificationPrefs();
  const save = useSaveNotificationPrefs();
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => setPermission(notificationPermission()), []);

  async function enable() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") toast.success(t("notif.granted"));
    if (result === "denied") toast.error(t("notif.denied"));
  }

  function toggle(key: keyof NotificationPrefs) {
    if (!prefs.data) return;
    const next = { ...prefs.data, [key]: !prefs.data[key] };
    save.mutate(next, { onSuccess: () => toast.success(t("notif.saved")) });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="label-mono mb-3">{t("notif.title")}</h2>

      {permission === "granted" ? (
        <p className="mb-4 text-xs text-muted-foreground">{t("notif.granted")}</p>
      ) : permission === "denied" ? (
        <p className="mb-4 text-xs text-muted-foreground">{t("notif.denied")}</p>
      ) : (
        <button
          onClick={enable}
          className="mb-4 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background hover:bg-accent"
        >
          {t("notif.enable")}
        </button>
      )}

      <ul className="space-y-3">
        {ROWS.map(([key, label]) => (
          <li key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <span className="min-w-0 text-sm">{t(label)}</span>
            <button
              role="switch"
              aria-checked={!!prefs.data?.[key]}
              aria-label={t(label)}
              onClick={() => toggle(key)}
              className={`h-6 w-11 shrink-0 rounded-full border transition-colors ${
                prefs.data?.[key] ? "border-accent bg-accent" : "border-border bg-muted"
              }`}
            >
              <span
                className={`block size-4 rounded-full bg-background transition-transform ${
                  prefs.data?.[key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Polite one-time banner asking for browser notification permission. */
export function NotificationBanner() {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("paperweight-notif-asked")) return;
    if (notificationPermission() === "default") setShow(true);
  }, []);

  function dismiss() {
    window.localStorage.setItem("paperweight-notif-asked", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="mx-4 mt-3 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:mx-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">{t("notif.banner")}</p>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={dismiss}
          className="rounded-full border border-border px-3 py-2 text-[11px] font-bold hover:border-accent hover:text-accent"
        >
          {t("notif.later")}
        </button>
        <button
          onClick={async () => {
            const result = await requestNotificationPermission();
            if (result === "granted") toast.success(t("notif.granted"));
            dismiss();
          }}
          className="rounded-full bg-foreground px-3 py-2 text-[11px] font-bold text-background hover:bg-accent"
        >
          {t("notif.enable")}
        </button>
      </div>
    </div>
  );
}
