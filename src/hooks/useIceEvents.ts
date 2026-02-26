import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { IceEvent } from "../types/database";

export function useIceEvents() {
  const [events, setEvents] = useState<IceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("ice_events")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setEvents(data);
        setLoading(false);
      });

    const channel = supabase
      .channel("ice_events_realtime")
      .on<IceEvent>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ice_events" },
        (payload) => {
          setEvents((prev) => [payload.new, ...prev]);
        },
      )
      .on<IceEvent>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ice_events" },
        (payload) => {
          setEvents((prev) =>
            prev.map((e) => (e.id === payload.new.id ? payload.new : e)),
          );
        },
      )
      .on<IceEvent>(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "ice_events" },
        (payload) => {
          setEvents((prev) => prev.filter((e) => e.id !== payload.old.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await supabase.from("ice_events").delete().eq("id", eventId);
  }, []);

  const updateEvent = useCallback(
    async (
      eventId: string,
      fields: { placer_id: string; victim_id: string; comment: string | null },
    ) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...fields } : e)),
      );
      await supabase.from("ice_events").update(fields).eq("id", eventId);
    },
    [],
  );

  return { events, loading, deleteEvent, updateEvent };
}
