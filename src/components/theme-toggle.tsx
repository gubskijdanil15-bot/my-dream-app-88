import { useEffect, useState } from "react";

const STORAGE_KEY = "paperweight-theme"; // "light" | "dark" | "system"

type Mode = "light" | "dark" | "system";

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "system";
    setMode(saved);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function apply(current: Mode) {
      const root = document.documentElement;
      const dark = current === "dark" || (current === "system" && mql.matches);
      root.classList.toggle("dark", dark);
    }
    apply(mode);
    const onChange = () => mode === "system" && apply("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mode]);

  function update(next: Mode) {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div className={className}>
      <label className="label-mono mr-2">Тема</label>
      <select
        value={mode}
        onChange={(e) => update(e.target.value as Mode)}
        className="rounded-xl border border-border bg-card px-2 py-1.5 text-xs"
        aria-label="Перемикач теми"
      >
        <option value="light">Світла</option>
        <option value="dark">Темна</option>
        <option value="system">Системна</option>
      </select>
    </div>
  );
}
