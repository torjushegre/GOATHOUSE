import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { WashWeek, WashTask } from "../types/database";

export const WASH_TASKS = [
  "Støvsuge hele huset",
  "Vaske kjøkkenet og benkene",
  "Moppe gulvene og badet",
  "Vaske badet",
  "Tørke støv i vinduskarmer",
] as const;

export function getCurrentWeek(): { week: number; year: number } {
  const now = new Date();
  // ISO week calculation
  const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: tmp.getUTCFullYear() };
}

export interface WashWeekWithTasks extends WashWeek {
  wash_tasks: WashTask[];
}

export function useWashSchedule(year: number) {
  const [weeks, setWeeks] = useState<WashWeekWithTasks[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("wash_weeks")
      .select("*, wash_tasks(*)")
      .eq("year", year)
      .order("week_number", { ascending: true });
    if (data) setWeeks(data as WashWeekWithTasks[]);
  }, [year]);

  useEffect(() => {
    refetch().then(() => setLoading(false));

    const channel = supabase
      .channel(`wash_realtime_${year}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wash_tasks" },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wash_weeks" },
        () => refetch(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, year]);

  const assignWeek = useCallback(
    async (weekNumber: number, playerId: string | null) => {
      // Upsert wash_week
      const { data, error } = await supabase
        .from("wash_weeks")
        .upsert(
          { week_number: weekNumber, year, player_id: playerId },
          { onConflict: "week_number,year" },
        )
        .select()
        .single();

      if (error || !data) return;

      // Check if tasks already exist
      const { data: existing } = await supabase
        .from("wash_tasks")
        .select("id")
        .eq("wash_week_id", data.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        const tasks = WASH_TASKS.map((_, i) => ({
          wash_week_id: data.id,
          task_index: i,
          completed: false,
        }));
        await supabase.from("wash_tasks").insert(tasks);
      }

      await refetch();
    },
    [year, refetch],
  );

  const toggleTask = useCallback(
    async (taskId: string, completed: boolean) => {
      // Optimistic update
      setWeeks((prev) =>
        prev.map((w) => ({
          ...w,
          wash_tasks: w.wash_tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !completed } : t,
          ),
        })),
      );
      await supabase
        .from("wash_tasks")
        .update({ completed: !completed })
        .eq("id", taskId);
    },
    [],
  );

  return { weeks, loading, assignWeek, toggleTask };
}
