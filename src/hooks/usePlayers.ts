import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Player } from "../types/database";

async function createBingoBoard(playerId: string) {
  const { data: board, error } = await supabase
    .from("bingo_boards")
    .insert({ player_id: playerId })
    .select()
    .single();

  if (error || !board) throw error;

  const cells = Array.from({ length: 25 }, (_, i) => ({
    board_id: board.id,
    row: Math.floor(i / 5),
    col: i % 5,
    challenge_text: "",
    completed: false,
  }));

  const { error: cellError } = await supabase
    .from("bingo_cells")
    .insert(cells);

  if (cellError) throw cellError;
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
      if (data && isBingo) await createBingoBoard(data.id);
      await refetch();
    },
    [refetch],
  );

  const updatePlayer = useCallback(
    async (
      id: string,
      updates: { name?: string; is_bingo_participant?: boolean },
    ) => {
      // Check current state to detect bingo toggle
      const current = players.find((p) => p.id === id);

      const { error } = await supabase
        .from("players")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Bingo toggled ON → create board + cells
      if (
        updates.is_bingo_participant === true &&
        current &&
        !current.is_bingo_participant
      ) {
        await createBingoBoard(id);
      }

      // Bingo toggled OFF → delete board (cascade handles cells)
      if (
        updates.is_bingo_participant === false &&
        current &&
        current.is_bingo_participant
      ) {
        await supabase.from("bingo_boards").delete().eq("player_id", id);
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

      // Delete bingo board (cascade handles cells)
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
