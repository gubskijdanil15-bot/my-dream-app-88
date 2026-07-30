import { useState } from "react";
import { HandwritingPad } from "./handwriting-pad";
import { useLang } from "@/lib/i18n";

export function HandwritingDialog({ onInsert }: { onInsert: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold hover:border-accent hover:text-accent"
      >
        ✍️ {t("hw.open")}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="label-mono">{t("hw.open")}</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-2 py-1 text-[11px] hover:border-accent hover:text-accent"
              >
                {t("hw.close")}
              </button>
            </div>
            <HandwritingPad
              onTranscribe={(t) => {
                onInsert(t);
                setOpen(false);
              }}
              height={360}
            />
          </div>
        </div>
      )}
    </div>
  );
}
