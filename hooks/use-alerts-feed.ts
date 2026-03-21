"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { AlertRecord } from "@/lib/types/database";

export function useAlertsFeed(initialAlerts: AlertRecord[], userId: string, enabled = true) {
  const [alerts, setAlerts] = useState<AlertRecord[]>(initialAlerts);

  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  useEffect(() => {
    if (!enabled || !userId || !hasSupabaseEnv()) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`alerts-feed:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setAlerts((current) => [payload.new as AlertRecord, ...current].slice(0, 12));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId]);

  return alerts;
}
