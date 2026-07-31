import { useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { recognizeHandwriting } from "@/lib/handwriting.functions";
import { useLang } from "@/lib/i18n";

type Props = {
  onText: (text: string) => void;
  onClose: () => void;
};

/** Finger / stylus writing pad that transcribes the drawing into text. */
export function HandwritingPad({ onText, onClose }: Props) {
  const { t, lang } = useLang();
  const recognize = useServerFn(recognizeHandwriting);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [busy, setBusy] = useState(false);

  function ctx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    // Size the bitmap once, to the element's rendered size.
    if (canvas.width !== canvas.clientWidth * 2) {
      canvas.width = canvas.clientWidth * 2;
      canvas.height = canvas.clientHeight * 2;
      const c = canvas.getContext("2d");
      if (c) {
        c.fillStyle = "#ffffff";
        c.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    const c = canvas.getContext("2d");
    if (c) {
      c.lineWidth = 4;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = "#1a1a1a";
    }
    return c;
  }

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * 2, y: (e.clientY - rect.top) * 2 };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const c = ctx();
    if (!c) return;
    const p = pos(e);
    drawing.current = true;
    dirty.current = true;
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(p.x + 0.1, p.y);
    c.stroke();
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    e.preventDefault();
    const c = ctx();
    if (!c) return;
    const p = pos(e);
    c.lineTo(p.x, p.y);
    c.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const c = canvas?.getContext("2d");
    if (!canvas || !c) return;
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
  }

  async function transcribe() {
    const canvas = canvasRef.current;
    if (!canvas || !dirty.current) {
      toast.error(t("hw.empty"));
      return;
    }
    setBusy(true);
    try {
      const image = canvas.toDataURL("image/png");
      const { text } = await recognize({ data: { image, language: lang } });
      if (!text) {
        toast.error(t("hw.nothing"));
        return;
      }
      onText(text);
      clear();
      toast.success(t("hw.inserted"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(
        message.includes("RATE_LIMIT")
          ? t("hw.rate")
          : message.includes("NO_CREDITS")
            ? t("hw.credits")
            : t("hw.failed"),
      );
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold transition-colors hover:border-accent hover:text-accent disabled:opacity-50";

  return (
    <div className="mb-3 rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="label-mono">{t("hw.title")}</span>
        <button onClick={onClose} className="text-xs font-semibold text-muted-foreground hover:text-accent">
          {t("ws.close")}
        </button>
      </div>
      <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">{t("hw.hint")}</p>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        className="h-48 w-full touch-none rounded-xl border border-border bg-white"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={transcribe} disabled={busy} className={btn}>
          {busy ? t("hw.reading") : t("hw.insert")}
        </button>
        <button onClick={clear} disabled={busy} className={btn}>
          {t("hw.clear")}
        </button>
      </div>
    </div>
  );
}
