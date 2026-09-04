import { LANGS, useLang } from "@/lib/i18n";

/** Compact EN / UK / RU switch. Uses semantic tokens only. */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border border-border bg-card p-0.5 ${className}`}
    >
      {LANGS.map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
            lang === code
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-accent"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
