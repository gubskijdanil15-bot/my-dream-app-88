import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { LanguageProvider } from "../lib/i18n";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  // Error reporting to external service can be added here (e.g., Sentry)
  // useEffect(() => { captureException(error) }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Paperweight" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@300..900&family=Quicksand:wght@400..700&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Handle Supabase OAuth redirects (implicit hash or PKCE code)
  useEffect(() => {
    const url = new URL(window.location.href);

    // Check for implicit flow (tokens in URL hash)
    const hash = window.location.hash?.startsWith('#')
      ? new URLSearchParams(window.location.hash.slice(1))
      : null;
    const access_token = hash?.get('access_token') || undefined;
    const refresh_token = hash?.get('refresh_token') || undefined;

    // Check for PKCE code flow (?code=...)
    const code = url.searchParams.get('code') || undefined;

    if (!access_token && !code) return;

    (async () => {
      try {
        let didUpdate = false;
        if (access_token) {
          // Store session immediately from hash tokens
          await supabase.auth.setSession({ access_token, refresh_token });
          // Clear the hash (keep search params intact)
          window.history.replaceState({}, document.title, url.pathname + url.search);
          didUpdate = true;
        } else if (code) {
          // Exchange PKCE code for a session
          await supabase.auth.exchangeCodeForSession(code);
          // Clean query params
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          const qs = url.searchParams.toString();
          window.history.replaceState({}, document.title, url.pathname + (qs ? `?${qs}` : ''));
          didUpdate = true;
        }

        if (didUpdate) {
          // Ensure session is available before re-render
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            router.navigate({ to: "/workspace", replace: true });
          }
          queryClient.invalidateQueries();
        }
      } catch (e) {
        console.error('OAuth callback handling failed', e);
      }
    })();
  }, [router, queryClient]);


  // Keep existing auth state listener
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Avoid global churn: only touch what’s needed
      if (event === "SIGNED_IN") {
        router.navigate({ to: "/workspace", replace: true });
        queryClient.invalidateQueries();
      } else if (event === "USER_UPDATED") {
        queryClient.invalidateQueries({ stale: true });
      } else if (event === "SIGNED_OUT") {
        router.invalidate();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
        <Toaster position="bottom-right" />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
