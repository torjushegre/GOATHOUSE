import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { createBingoBoardWithCells } from "../lib/bingo";
import type { BingoGame } from "../types/database";

export function useBingoGames() {
  const [games, setGames] = useState<BingoGame[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    // Active games first (archived_at is null), then most recent.
    const { data } = await supabase
      .from("bingo_games")
      .select("*")
      .order("archived_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false });
    if (data) setGames(data);
  }, []);

  useEffect(() => {
    refetch().then(() => setLoading(false));
  }, [refetch]);

  // Realtime: pick up new games, renames, archive flips from other clients.
  useEffect(() => {
    const channel = supabase
      .channel("bingo_games_all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bingo_games" },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const createGame = useCallback(
    async (name: string, size: 4 | 5) => {
      const { data: game, error } = await supabase
        .from("bingo_games")
        .insert({ name, size })
        .select()
        .single();

      if (error || !game) throw error;

      // Seed a board for every current bingo participant.
      const { data: participants } = await supabase
        .from("players")
        .select("id")
        .eq("is_bingo_participant", true);

      if (participants) {
        for (const p of participants) {
          await createBingoBoardWithCells({
            playerId: p.id,
            gameId: game.id,
            size,
          });
        }
      }

      await refetch();
      return game as BingoGame;
    },
    [refetch],
  );

  const renameGame = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      await supabase.from("bingo_games").update({ name: trimmed }).eq("id", id);
      await refetch();
    },
    [refetch],
  );

  const archiveGame = useCallback(
    async (id: string) => {
      await supabase
        .from("bingo_games")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id);
      await refetch();
    },
    [refetch],
  );

  return { games, loading, createGame, renameGame, archiveGame, refetch };
}
