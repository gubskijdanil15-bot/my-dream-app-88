import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import {
  attachmentUrl,
  formatBytes,
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
  type Attachment,
} from "@/lib/attachments-data";

function AttachmentRow({
  file,
  canEdit,
  onDelete,
}: {
  file: Attachment;
  canEdit: boolean;
  onDelete: () => void;
}) {
  const { t } = useLang();
  const [url, setUrl] = useState<string | null>(null);
  const kind = file.mime_type.split("/")[0];
  const previewable = kind === "image" || kind === "audio" || kind === "video";

  useEffect(() => {
    let alive = true;
    attachmentUrl(file.path)
      .then((u) => alive && setUrl(u))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [file.path]);

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{file.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatBytes(file.size_bytes)} · {file.mime_type}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              download={file.name}
              className="text-xs font-semibold text-muted-foreground hover:text-accent"
            >
              {t("files.open")}
            </a>
          )}
          {canEdit && (
            <button
              onClick={onDelete}
              className="text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              {t("ws.delete")}
            </button>
          )}
        </div>
      </div>
      {previewable && url && (
        <div className="mt-3">
          {kind === "image" && (
            <img src={url} alt={file.name} className="max-h-72 rounded-lg" loading="lazy" />
          )}
          {kind === "audio" && <audio src={url} controls className="w-full" />}
          {kind === "video" && <video src={url} controls className="max-h-80 w-full rounded-lg" />}
        </div>
      )}
    </li>
  );
}

export function NoteAttachments({
  noteId,
  ownerId,
  canEdit,
}: {
  noteId: string;
  ownerId?: string;
  canEdit: boolean;
}) {
  const { t } = useLang();
  const list = useAttachments(noteId);
  const upload = useUploadAttachment(noteId, ownerId);
  const remove = useDeleteAttachment(noteId);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      try {
        await upload.mutateAsync(file);
      } catch (err) {
        toast.error(
          (err as Error)?.message === "too-large" ? t("files.tooLarge") : t("files.error"),
        );
      }
    }
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="label-mono">{t("files.title")}</h3>
        {canEdit && (
          <label className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-accent hover:text-accent">
            {upload.isPending ? t("files.uploading") : t("files.add")}
            <input type="file" multiple className="hidden" onChange={onPick} />
          </label>
        )}
      </div>
      {list.data?.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("files.empty")}</p>
      )}
      <ul className="space-y-3">
        {list.data?.map((f) => (
          <AttachmentRow
            key={f.id}
            file={f}
            canEdit={canEdit}
            onDelete={() =>
              remove.mutate(f, { onError: () => toast.error(t("files.error")) })
            }
          />
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("files.hint")}</p>
    </section>
  );
}
