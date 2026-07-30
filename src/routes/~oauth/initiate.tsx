import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/~oauth/initiate")({
  ssr: false,
  component: InitiateOAuth,
});

function InitiateOAuth() {
  useEffect(() => {
    async function run() {
      try {
        const url = new URL(window.location.href);
        const provider = (url.searchParams.get("provider") || "google").toLowerCase();
        const base = window.location.origin;
        const urlPrefix = import.meta.env.BASE_URL && import.meta.env.BASE_URL !== "/" ? import.meta.env.BASE_URL.replace(/\/$/, "") : "";
        const redirectParam = url.searchParams.get("redirect_uri");
        const redirectUri = redirectParam || (base + urlPrefix + "/");

        if (provider !== "google") {
          // Only Google is supported in this app for now
          window.location.replace("/auth");
          return;
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: redirectUri },
        });
        if (error) throw error;
        if (data?.url) {
          window.location.href = data.url;
        } else {
          // Fallback to auth page if no URL returned
          window.location.replace("/auth");
        }
      } catch (e) {
        console.error("OAuth initiate failed", e);
        window.location.replace("/auth");
      }
    }
    run();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center text-sm text-muted-foreground">
        Redirecting to Google sign-in…
      </div>
    </main>
  );
}
