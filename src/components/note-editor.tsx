import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";
import { HandwritingPad } from "@/components/handwriting-pad";
import { useLang } from "@/lib/i18n";
import type { Note } from "@/lib/workspace-data";


const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "strike",
    "br",
    "p",
    "div",
    "span",
    "font",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "blockquote",
  ],
  ALLOWED_ATTR: ["style", "color", "size", "face"],
};

export function sanitizeNote(html: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html ?? "", SANITIZE_CONFIG);
}

function escapePlain(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

const TEXT_COLORS = ["#3a3330", "#b4522c", "#1f6f5c", "#2b5fa8", "#8a3ba0"];
const HIGHLIGHTS = ["#ffe9a8", "#c9f0d8", "#d8e6ff", "#ffd6d6", "#eddcff"];

type Props = {
  note: Note;
  canEdit: boolean;
  saving?: boolean;
  onSave: (input: { title: string; body_html: string; body: string }) => void;
  onDelete: () => void;
};

export function NoteEditor({ note, canEdit, saving, onSave, onDelete }: Props) {
  const { t } = useLang();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(note.title);
  const [showColors, setShowColors] = useState(false);

  // Load note content only when a different note is opened, so typing never
  // re-renders (and therefore never blurs) the editable area.
  useEffect(() => {
    setTitle(note.title);
    const html = note.body_html?.trim() ? note.body_html : escapePlain(note.body ?? "");
    if (bodyRef.current) bodyRef.current.innerHTML = sanitizeNote(html);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  function exec(command: string, value?: string) {
    bodyRef.current?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
  }

  function save() {
    const html = sanitizeNote(bodyRef.current?.innerHTML ?? "");
    const plain = (bodyRef.current?.innerText ?? "").slice(0, 8000);
    onSave({ title: title.trim() || "Untitled", body_html: html, body: plain });
  }

  const btn =
    "rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs transition-colors hover:border-accent hover:text-accent active:scale-95";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
        {!canEdit && (
          <span className="mr-auto rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            {t("share.readOnly")}
          </span>
        )}
        {canEdit && (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="text-xs font-semibold tracking-wide text-muted-foreground hover:text-accent disabled:opacity-50"
            >
              {t("ws.save")}
            </button>
            <button
              onClick={onDelete}
              className="text-xs font-semibold tracking-wide text-muted-foreground hover:text-destructive"
            >
              {t("ws.delete")}
            </button>
          </>
        )}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        readOnly={!canEdit}
        maxLength={200}
        className="mb-4 w-full border-none bg-transparent text-lg font-bold tracking-tight focus:outline-none sm:text-xl"
      />

      {canEdit && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <button className={`${btn} font-bold`} onClick={() => exec("bold")} title={t("fmt.bold")}>
            B
          </button>
          <button className={`${btn} italic`} onClick={() => exec("italic")} title={t("fmt.italic")}>
            I
          </button>
          <button
            className={`${btn} underline`}
            onClick={() => exec("underline")}
            title={t("fmt.underline")}
          >
            U
          </button>
          <button
            className={`${btn} line-through`}
            onClick={() => exec("strikeThrough")}
            title={t("fmt.strike")}
          >
            S
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button className={btn} onClick={() => exec("fontSize", "2")} title={t("fmt.small")}>
            A−
          </button>
          <button className={btn} onClick={() => exec("fontSize", "4")} title={t("fmt.normal")}>
            A
          </button>
          <button
            className={`${btn} text-base`}
            onClick={() => exec("fontSize", "6")}
            title={t("fmt.large")}
          >
            A+
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button
            className={btn}
            onClick={() => exec("insertUnorderedList")}
            title={t("fmt.bullets")}
          >
            •
          </button>
          <button className={btn} onClick={() => exec("insertOrderedList")} title={t("fmt.numbers")}>
            1.
          </button>
          <button className={btn} onClick={() => setShowColors((v) => !v)}>
            {t("fmt.colors")}
          </button>
          <button className={btn} onClick={() => exec("removeFormat")} title={t("fmt.clear")}>
            {t("fmt.clear")}
          </button>
        </div>
      )}

      {canEdit && showColors && (
        <div className="mb-3 space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <span className="w-16 text-[11px] text-muted-foreground">{t("fmt.text")}</span>
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                aria-label={`${t("fmt.text")} ${c}`}
                onClick={() => exec("foreColor", c)}
                className="size-6 rounded-full border border-border"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-[11px] text-muted-foreground">{t("fmt.highlight")}</span>
            {HIGHLIGHTS.map((c) => (
              <button
                key={c}
                aria-label={`${t("fmt.highlight")} ${c}`}
                onClick={() => exec("hiliteColor", c)}
                className="size-6 rounded-full border border-border"
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onClick={() => exec("hiliteColor", "transparent")}
              className="rounded-lg border border-border px-2 py-1 text-[11px]"
            >
              {t("fmt.none")}
            </button>
          </div>
        </div>
      )}

      <div
        ref={bodyRef}
        contentEditable={canEdit}
        suppressContentEditableWarning
        data-placeholder={t("ws.writeItOut")}
        className="rich-note min-h-48 w-full rounded-2xl border border-border bg-card p-4 text-base leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
