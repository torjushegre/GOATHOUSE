import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { createBingoBoardWithCells } from "../lib/bingo";
import type { BingoGame, Player } from "../types/database";

// Find the most recently created non-archived game, or null if there is none.
async function fetchActiveGame(): Promise<BingoGame | null> {
  const { data } = await supabase
    .from("bingo_games")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as BingoGame) ?? null;
}

// Create a board for the player on the current active game, if one exists.
// Archived games are intentionally left alone so history stays frozen.
async function seedBoardForActiveGame(playerId: string) {
  const activeGame = await fetchActiveGame();
  if (!activeGame) return;
  await createBingoBoardWithCells({
    playerId,
    gameId: activeGame.id,
    size: activeGame.size,
  });
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("name");
    if (data) setPlayers(data);
  }, []);

  useEffect(() => {
    refetch().then(() => setLoading(false));
  }, [refetch]);

  const addPlayer = useCallback(
    async (name: string, isBingo: boolean) => {
      const { data, error } = await supabase
        .from("players")
        .insert({ name, is_bingo_participant: isBingo })
        .select()
        .single();

      if (error) throw error;
      if (data && isBingo) await seedBoardForActiveGame(data.id);
      await refetch();
    },
    [refetch],
  );

  const updatePlayer = useCallback(
    async (
      id: string,
      updates: { name?: string; is_bingo_participant?: boolean },
    ) => {
      const current = players.find((p) => p.id === id);

      const { error } = await supabase
        .from("players")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Bingo toggled ON → create board on the active game only
      if (
        updates.is_bingo_participant === true &&
        current &&
        !current.is_bingo_participant
      ) {
        await seedBoardForActiveGame(id);
      }

      // Bingo toggled OFF → remove only boards on active (non-archived) games.
      // Archived games keep their historical boards intact.
      if (
        updates.is_bingo_participant === false &&
        current &&
        current.is_bingo_participant
      ) {
        const { data: activeGames } = await supabase
          .from("bingo_games")
          .select("id")
          .is("archived_at", null);
        const activeIds = (activeGames ?? []).map((g) => g.id);
        if (activeIds.length > 0) {
          await supabase
            .from("bingo_boards")
            .delete()
            .eq("player_id", id)
            .in("game_id", activeIds);
        }
      }

      await refetch();
    },
    [refetch, players],
  );

  const deletePlayer = useCallback(
    async (id: string) => {
      // Delete ice_events referencing this player (FK has no cascade)
      await supabase
        .from("ice_events")
        .delete()
        .or(`placer_id.eq.${id},victim_id.eq.${id}`);

      // Delete all bingo boards for this player (cascade handles cells)
      await supabase.from("bingo_boards").delete().eq("player_id", id);

      // Delete the player
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;

      await refetch();
    },
    [refetch],
  );

  return { players, loading, addPlayer, updatePlayer, deletePlayer, refetch };
}
