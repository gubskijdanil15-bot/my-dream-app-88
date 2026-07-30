import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";

/*
  HandwritingPad — простий canvas для рукописного вводу стилусом/пальцем з перетворенням у текст.
  Використовує Pointer Events, підтримує стирання, очистку, імпорт зображення і OCR через Tesseract.js (лениве завантаження).
  Примітка: точність OCR для рукопису обмежена. Для кращої якості радимо друковані літери або сторонні моделі.
*/

export type HandwritingPadProps = {
  onTranscribe: (text: string) => void;
  height?: number;
  strokeWidth?: number;
};

export function HandwritingPad({ onTranscribe, height = 320, strokeWidth = 3 }: HandwritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-foreground").trim() || "#222";
    ctx.lineWidth = strokeWidth;
    ctxRef.current = ctx;
  }, [strokeWidth]);

  function getPos(e: PointerEvent | React.PointerEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ("clientX" in e ? e.clientX : (e as PointerEvent).clientX) - rect.left;
    const y = ("clientY" in e ? e.clientY : (e as PointerEvent).clientY) - rect.top;
    return { x, y };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = getPos(e);
    const ctx = ctxRef.current!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawing.current) return;
    const { x, y } = getPos(e);
    const ctx = ctxRef.current!;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function onPointerUp(e: React.PointerEvent) {
    drawing.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = ctxRef.current!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function importImage(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Image load failed"));
      img.src = url;
    });
    const canvas = canvasRef.current!;
    const ctx = ctxRef.current!;
    // Fit image into canvas keeping aspect ratio
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const scale = Math.min(cw / img.width, ch / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, x, y, w, h);
    URL.revokeObjectURL(url);
  }

  async function transcribe() {
    try {
      setBusy(true);
      const canvas = canvasRef.current!;
      // Ліниве завантаження Tesseract.js, щоб не збільшувати бандл
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker({
        logger: () => {},
      });
      await worker.loadLanguage("eng+ukr");
      await worker.initialize("eng+ukr");
      const { data } = await worker.recognize(canvas);
      await worker.terminate();
      const text = (data.text || "").trim();
      if (!text) toast.info("Текст не розпізнано");
      onTranscribe(text);
    } catch (e) {
      console.error(e);
      toast.error("Не вдалося розпізнати рукопис");
    } finally {
      setBusy(false);
    }
  }

  const { t } = useLang();
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="label-mono">{t("hw.title")}</span>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && importImage(e.target.files[0])}
              className="text-[11px]"
              aria-label="Завантажити зображення"
            />
            <button onClick={clear} className="rounded-xl border border-border px-3 py-1.5 text-xs hover:border-accent hover:text-accent">
              {t("hw.clear")}
            </button>
            <button disabled={busy} onClick={transcribe} className="rounded-xl bg-foreground px-3 py-1.5 text-xs font-bold text-background hover:bg-accent disabled:opacity-50">
              {t("hw.recognize")}
            </button>
          </div>
        </div>
        <div style={{ height }} className="overflow-hidden rounded-xl border border-border bg-background">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ width: "100%", height: "100%", touchAction: "none", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
