import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  image: z
    .string()
    .startsWith("data:image/png;base64,")
    .max(4_000_000),
  language: z.enum(["en", "uk"]).default("en"),
});

/** Transcribe a handwritten drawing (PNG data URL) into plain text. */
export const recognizeHandwriting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const hint =
      data.language === "uk"
        ? "The handwriting is most likely in Ukrainian or English."
        : "The handwriting is most likely in English or Ukrainian.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You transcribe handwriting from an image. Reply with the transcribed text only — no quotes, no commentary, no markdown. If nothing legible is written, reply with an empty string.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Transcribe this handwriting. ${hint}` },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("NO_CREDITS");
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = (json.choices?.[0]?.message?.content ?? "").trim();
    return { text: text.slice(0, 4000) };
  });
