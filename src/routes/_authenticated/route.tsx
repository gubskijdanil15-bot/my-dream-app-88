import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    // Avoid redirect loops during initial load — only redirect if we're not already on /auth
    if (!data.user) {
      const path = typeof window !== 'undefined' ? window.location.pathname : undefined;
      if (path !== '/auth') throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
