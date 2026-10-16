import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { enGB, uk, ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLang } from "@/lib/i18n";

export function ProjectDatePicker({ label, value, onChange, min }: {
  label: string; value: string | null; onChange: (value: string | null) => void; min?: string | null;
}) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  return <div className="grid min-w-0 gap-2">
    <span className="text-sm font-bold">{label}</span>
    <div className="flex min-w-0 gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" aria-label={label} className="min-h-11 min-w-0 flex-1 justify-start font-normal">
            <CalendarIcon />{selected ? selected.toLocaleDateString(lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-GB") : t("projects.chooseDate")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0 pointer-events-auto">
          <Calendar mode="single" locale={lang === "uk" ? uk : lang === "ru" ? ru : enGB} weekStartsOn={1}
            selected={selected} defaultMonth={selected} disabled={min ? { before: new Date(`${min}T00:00:00`) } : undefined}
            className="pointer-events-auto [--cell-size:2.5rem]"
            onSelect={(date) => {
              if (date) {
                onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
                setOpen(false);
              }
            }} />
        </PopoverContent>
      </Popover>
      {value && <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={`${t("projects.removeDate")}: ${label}`} title={t("projects.removeDate")} onClick={() => onChange(null)}><X /></Button>}
    </div>
  </div>;
}