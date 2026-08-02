import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "./workspace-data";
import type { Task } from "./workspace-data";

export type NotificationPrefs = {
  taskReminders: boolean;
  dailyRecap: boolean;
  system: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  taskReminders: true,
  dailyRecap: false,
  system: true,
};

const FIRED_KEY = "paperweight-fired-reminders";

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  return Notification.requestPermission();
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ["notification-prefs"],
    queryFn: async (): Promise<NotificationPrefs> => {
      const me = await currentUserId();
      const { data } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", me)
        .maybeSingle();
      const raw = (data?.notification_prefs ?? {}) as Partial<NotificationPrefs>;
      return { ...DEFAULT_PREFS, ...raw };
    },
  });
}

export function useSaveNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: NotificationPrefs) => {
      const me = await currentUserId();
      const { error } = await supabase
        .from("profiles")
        .update({ notification_prefs: prefs })
        .eq("id", me);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-prefs"] }),
  });
}

function alreadyFired(id: string) {
  try {
    const raw = window.localStorage.getItem(FIRED_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (list.includes(id)) return true;
    window.localStorage.setItem(FIRED_KEY, JSON.stringify([...list.slice(-200), id]));
    return false;
  } catch {
    return false;
  }
}

/** Fires a browser notification when a task's reminder time arrives. */
export function useTaskReminders(tasks: Task[] | undefined, enabled: boolean) {
  const ref = useRef(tasks);
  ref.current = tasks;

  useEffect(() => {
    if (!enabled || notificationPermission() !== "granted") return;
    const tick = () => {
      const now = Date.now();
      for (const task of ref.current ?? []) {
        if (task.done || !task.remind_at) continue;
        const at = new Date(task.remind_at).getTime();
        if (at <= now && now - at < 10 * 60 * 1000 && !alreadyFired(`${task.id}-${task.remind_at}`)) {
          new Notification("Paperweight", { body: task.title });
        }
      }
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [enabled]);
}
