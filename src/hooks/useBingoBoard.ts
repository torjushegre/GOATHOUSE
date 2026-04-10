import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { BingoBoard, BingoCell } from "../types/database";

export function useBingoBoard(
  playerId: string | null,
  gameId: string | null,
) {
  const [board, setBoard] = useState<BingoBoard | null>(null);
  const [cells, setCells] = useState<BingoCell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear previous state immediately so stale cells from the prior
    // player/game never render under the new selection.
    setBoard(null);
    setCells([]);

    if (!playerId || !gameId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Cancelled flag guards against a slower in-flight fetch finishing
    // after a newer one has already replaced the state.
    let cancelled = false;

    supabase
      .from("bingo_boards")
      .select("*")
      .eq("player_id", playerId)
      .eq("game_id", gameId)
      .maybeSingle()
      .then(({ data: boardData }) => {
        if (cancelled) return;
        if (!boardData) {
          setBoard(null);
          setCells([]);
          setLoading(false);
          return;
        }
        setBoard(boardData);

        supabase
          .from("bingo_cells")
          .select("*")
          .eq("board_id", boardData.id)
          .order("row")
          .order("col")
          .then(({ data: cellData }) => {
            if (cancelled) return;
            setCells(cellData ?? []);
            setLoading(false);
          });
      });

    return () => {
      cancelled = true;
    };
  }, [playerId, gameId]);

  // Realtime subscription for cell changes
  useEffect(() => {
    if (!board) return;

    const channel = supabase
      .channel(`bingo_cells_${board.id}`)
      .on<BingoCell>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bingo_cells",
          filter: `board_id=eq.${board.id}`,
        },
        (payload) => {
          setCells((prev) =>
            prev.map((c) => (c.id === payload.new.id ? payload.new : c)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [board]);

  const updateCellText = useCallback(
    async (cellId: string, text: string) => {
      await supabase
        .from("bingo_cells")
        .update({ challenge_text: text })
        .eq("id", cellId);
      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId ? { ...c, challenge_text: text } : c,
        ),
      );
    },
    [],
  );

  const toggleCellCompleted = useCallback(
    async (cellId: string, currentlyCompleted: boolean) => {
      const completed = !currentlyCompleted;
      const completed_at = completed ? new Date().toISOString() : null;
      await supabase
        .from("bingo_cells")
        .update({ completed, completed_at })
        .eq("id", cellId);
      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId ? { ...c, completed, completed_at } : c,
        ),
      );
    },
    [],
  );

  return { board, cells, loading, updateCellText, toggleCellCompleted };
}
