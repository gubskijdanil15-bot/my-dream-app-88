import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/** Light / dark switch. Semantic tokens only. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  return (
    <button
      onClick={toggle}
      aria-label={t(theme === "dark" ? "theme.toLight" : "theme.toDark")}
      title={t(theme === "dark" ? "theme.toLight" : "theme.toDark")}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
