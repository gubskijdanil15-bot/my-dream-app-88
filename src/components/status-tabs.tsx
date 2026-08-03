import { useLang } from "@/lib/i18n";
import type { StatusFilter } from "@/lib/workspace-data";

const OPTIONS = [
  ["active", "status.active"],
  ["completed", "status.completed"],
  ["all", "status.all"],
] as const;

/** Compact Active | Completed history | All segmented control. */
export function StatusTabs({
  value,
  onChange,
  className = "",
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  className?: string;
}) {
  const { t } = useLang();
  return (
    <div className={`mb-5 flex ${className}`}>
      <div className="inline-flex max-w-full overflow-x-auto rounded-full border border-border p-1">
        {OPTIONS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            aria-pressed={value === key}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              value === key
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-accent"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
}
