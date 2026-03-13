import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to Postgres changes on a table and call `onUpdate` on any event.
 * Automatically cleans up subscription on unmount.
 */
export function useRealtimeSubscription(
  tableName: string,
  onUpdate: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`realtime-${tableName}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => {
          onUpdate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, onUpdate, enabled]);
}
