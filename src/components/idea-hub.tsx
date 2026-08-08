import { useState } from "react";
import { toast } from "sonner";
import { useLang, type TranslationKey } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusTabs } from "@/components/status-tabs";
import {
  IDEA_TAGS,
  useCreateIdea,
  useDeleteIdea,
  useIdeas,
  useToggleVote,
  useUpdateIdea,
  type Idea,
  type IdeaTag,
} from "@/lib/production-data";
import type { StatusFilter } from "@/lib/workspace-data";

const tagLabel: Record<string, TranslationKey> = {
  reels: "tag.reels",
  shorts: "tag.shorts",
  shortfilm: "tag.shortfilm",
  bts: "tag.bts",
};

type Props = { ownerId?: string; canEdit: boolean; formOpen: boolean; onCloseForm: () => void };

export function IdeaHub({ ownerId, canEdit, formOpen, onCloseForm }: Props) {
  const { t } = useLang();
  const [filter, setFilter] = useState<StatusFilter>("active");
  const ideas = useIdeas(ownerId, filter);
  const createIdea = useCreateIdea(ownerId);
  const updateIdea = useUpdateIdea();
  const deleteIdea = useDeleteIdea();
  const vote = useToggleVote(ownerId);

  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [tag, setTag] = useState<IdeaTag>("");
  const [pending, setPending] = useState<Idea | null>(null);

  const customTags = Array.from(
    new Set((ideas.data ?? []).map((i) => i.tag).filter((x) => !(x in tagLabel))),
  );

  const tagText = (value: string) => (value in tagLabel ? t(tagLabel[value]!) : value);

  const field =
    "w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    try {
      await createIdea.mutateAsync({
        title: value.slice(0, 200),
        detail: detail.trim() || null,
        tag: tag.trim().slice(0, 40) || "reels",
      });
      setTitle("");
      setDetail("");
      setTag("");
      onCloseForm();
    } catch {
      toast.error(t("ws.errNote"));
    }
  }

  return (
    <div>
      <StatusTabs value={filter} onChange={setFilter} />

      {formOpen && canEdit && (
        <form
          onSubmit={submit}
          className="animate-entry mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,10rem)_auto] sm:items-end"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("idea.placeholder")}
            maxLength={200}
            className={`${field} sm:col-span-3`}
          />
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t("idea.detail")}
            maxLength={400}
            className={field}
          />
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            list="idea-tag-suggestions"
            placeholder={t("tag.custom")}
            maxLength={40}
            aria-label={t("idea.title")}
            className={field}
          />
          <datalist id="idea-tag-suggestions">
            {[...IDEA_TAGS.map((x) => t(tagLabel[x]!)), ...customTags].map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground"
          >
            {t("ws.add")}
          </button>
          {(title || detail || tag) && (
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setDetail("");
                setTag("");
              }}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive sm:col-span-3 sm:justify-self-start"
            >
              {t("form.clear")}
            </button>
          )}
        </form>
      )}

      {ideas.data?.length === 0 && <p className="text-xs text-muted-foreground">{t("idea.empty")}</p>}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {ideas.data?.map((idea) => (
          <article
            key={idea.id}
            className="animate-entry grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <button
              onClick={() => vote.mutate({ ideaId: idea.id, voted: idea.voted })}
              aria-pressed={idea.voted}
              aria-label={`${idea.title} — ${t("idea.votes")}`}
              className={`flex w-12 shrink-0 flex-col items-center rounded-xl border px-2 py-1.5 text-xs font-bold transition-colors ${
                idea.voted
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:border-accent hover:text-accent"
              }`}
            >
              <span aria-hidden>▲</span>
              {idea.votes}
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words text-sm font-bold">{idea.title}</h3>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {tagText(idea.tag)}
                </span>
                {idea.status === "completed" && (
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t("status.badge")}
                  </span>
                )}
              </div>
              {idea.detail && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{idea.detail}</p>
              )}
              {canEdit && (
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      updateIdea.mutate({
                        id: idea.id,
                        status: idea.status === "completed" ? "active" : "completed",
                      })
                    }
                    className="text-[11px] font-semibold text-muted-foreground hover:text-accent"
                  >
                    {t(idea.status === "completed" ? "status.reopen" : "status.markDone")}
                  </button>
                  <button
                    onClick={() => setPending(idea)}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                  >
                    {t("ws.delete")}
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={!!pending}
        messageKey="confirm.deleteIdea"
        detail={pending?.title}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && deleteIdea.mutate(pending.id)}
      />
    </div>
  );
}
