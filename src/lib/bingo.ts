import { supabase } from "./supabase";

type CreateBoardArgs = {
  playerId: string;
  gameId: string;
  size: 4 | 5;
};

// Creates a bingo_boards row and seeds size*size empty cells for it.
export async function createBingoBoardWithCells({
  playerId,
  gameId,
  size,
}: CreateBoardArgs) {
  const { data: board, error } = await supabase
    .from("bingo_boards")
    .insert({ player_id: playerId, game_id: gameId })
    .select()
    .single();

  if (error || !board) throw error;

  const cells = Array.from({ length: size * size }, (_, i) => ({
    board_id: board.id,
    row: Math.floor(i / size),
    col: i % size,
    challenge_text: "",
    completed: false,
  }));

  const { error: cellError } = await supabase.from("bingo_cells").insert(cells);
  if (cellError) throw cellError;

  return board;
}
