import { useState } from "react";
import { useLang } from "@/lib/i18n";
import type { ExternalLink } from "@/lib/workspace-data";

type Props = {
  links: ExternalLink[];
  canEdit: boolean;
  onChange: (links: ExternalLink[]) => void;
  compact?: boolean;
};

function safeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Attach external references (Drive, Miro, docs…) to a note or task. */
export function LinkList({ links, canEdit, onChange, compact }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const safe = safeUrl(url);
    if (!safe) return setError(true);
    setError(false);
    onChange([...links, { label: (label.trim() || safe).slice(0, 80), url: safe }]);
    setLabel("");
    setUrl("");
    setOpen(false);
  }

  return (
    <section className={compact ? "" : "mt-6"}>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="label-mono">{t("links.title")}</h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold hover:border-accent hover:text-accent"
          >
            {open ? t("ws.close") : t("links.add")}
          </button>
        )}
      </div>

      {open && canEdit && (
        <form onSubmit={add} className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("links.label")}
            maxLength={80}
            className="min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("links.url")}
            maxLength={500}
            className="min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold text-background hover:bg-accent"
          >
            {t("ws.add")}
          </button>
          {error && (
            <p className="text-[11px] text-destructive sm:col-span-3">{t("links.invalid")}</p>
          )}
        </form>
      )}

      {links.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{t("links.empty")}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {links.map((l, i) => (
            <li
              key={`${l.url}-${i}`}
              className="flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"
            >
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs font-semibold hover:text-accent"
              >
                ↗ {l.label}
              </a>
              {canEdit && (
                <button
                  type="button"
                  aria-label={`${t("links.remove")} ${l.label}`}
                  onClick={() => onChange(links.filter((_, idx) => idx !== i))}
                  className="shrink-0 text-[11px] text-muted-foreground hover:text-destructive"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
