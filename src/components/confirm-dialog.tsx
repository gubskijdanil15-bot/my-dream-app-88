import { useLang, type TranslationKey } from "@/lib/i18n";

type Props = {
  open: boolean;
  messageKey: TranslationKey;
  detail?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Small confirmation modal used before destructive actions. */
export function ConfirmDialog({ open, messageKey, detail, onCancel, onConfirm }: Props) {
  const { t } = useLang();
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-entry w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-lg"
      >
        <h2 className="text-base font-bold">{t("confirm.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t(messageKey)}</p>
        {detail && <p className="mt-1 truncate text-sm font-semibold">{detail}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2.5 text-xs font-bold hover:border-accent hover:text-accent"
          >
            {t("confirm.cancel")}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="rounded-full bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground hover:opacity-90"
          >
            {t("confirm.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
