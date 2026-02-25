import { useState } from "react";
import { usePlayers } from "../hooks/usePlayers";
import { useBingoBoard } from "../hooks/useBingoBoard";
import type { BingoCell } from "../types/database";

function detectBingoLines(cells: BingoCell[]): number {
  const grid: boolean[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => false),
  );
  for (const c of cells) {
    if (c.completed) grid[c.row][c.col] = true;
  }

  let lines = 0;

  // Rows
  for (let r = 0; r < 5; r++) {
    if (grid[r].every(Boolean)) lines++;
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    if (grid.every((row) => row[c])) lines++;
  }
  // Diagonals
  if ([0, 1, 2, 3, 4].every((i) => grid[i][i])) lines++;
  if ([0, 1, 2, 3, 4].every((i) => grid[i][4 - i])) lines++;

  return lines;
}

function CellContent({
  cell,
  onSetText,
  onToggle,
}: {
  cell: BingoCell;
  onSetText: (id: string, text: string) => void;
  onToggle: (id: string, completed: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSetText(cell.id, draft.trim());
          setEditing(false);
        }}
        className="flex h-full w-full flex-col items-center justify-center p-1"
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onSetText(cell.id, draft.trim());
            setEditing(false);
          }}
          className="w-full rounded bg-gray-700 px-1 py-0.5 text-center text-xs text-gray-100 outline-none"
          placeholder="Utfordring..."
        />
      </form>
    );
  }

  if (!cell.challenge_text) {
    return (
      <button
        onClick={() => {
          setDraft("");
          setEditing(true);
        }}
        className="flex h-full w-full items-center justify-center text-gray-700 text-xl"
      >
        +
      </button>
    );
  }

  return (
    <button
      onClick={() => onToggle(cell.id, cell.completed)}
      onDoubleClick={() => {
        setDraft(cell.challenge_text);
        setEditing(true);
      }}
      className={`flex h-full w-full items-center justify-center overflow-y-auto break-words p-1 text-center text-[10px] leading-tight transition-all duration-300 ${
        cell.completed
          ? "scale-95 text-green-300 line-through"
          : "text-gray-200 hover:bg-gray-700/50"
      }`}
    >
      {cell.challenge_text}
    </button>
  );
}

export function BingoPage() {
  const { players, loading: playersLoading } = usePlayers();
  const bingoPlayers = players.filter((p) => p.is_bingo_participant);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = selectedId ?? bingoPlayers[0]?.id ?? null;

  const { cells, loading: boardLoading, updateCellText, toggleCellCompleted } =
    useBingoBoard(activeId);

  if (playersLoading) {
    return <p className="text-center text-gray-500">Laster...</p>;
  }

  const grid: (BingoCell | undefined)[][] = Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) =>
      cells.find((cell) => cell.row === r && cell.col === c),
    ),
  );

  const completedCount = cells.filter((c) => c.completed).length;
  const pct = cells.length > 0 ? Math.round((completedCount / 25) * 100) : 0;
  const bingoLines = detectBingoLines(cells);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-center text-2xl font-bold text-amber-400">
        Alicante Bingo
      </h1>

      {/* Player tabs */}
      <div className="flex gap-2">
        {bingoPlayers.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              activeId === p.id
                ? "bg-amber-500 text-gray-950"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {boardLoading ? (
        <p className="text-center text-gray-500">Laster brett...</p>
      ) : (
        <>
          {/* Progress bar */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{completedCount}/25 fullført</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Bingo celebration */}
          {bingoLines > 0 && (
            <div className="animate-pulse rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-center">
              <span className="text-lg font-bold text-amber-400">
                🎉 BINGO! {bingoLines} linje{bingoLines > 1 ? "r" : ""} fullført!
              </span>
            </div>
          )}

          {/* 5x5 Grid */}
          <div className="grid grid-cols-5 gap-1">
            {grid.flat().map((cell) =>
              cell ? (
                <div
                  key={cell.id}
                  className={`flex min-h-[56px] min-w-[44px] items-center justify-center overflow-hidden rounded-md transition-all duration-300 ${
                    cell.completed
                      ? "border-2 border-green-500/60 bg-green-600/20 shadow-md shadow-green-900/30"
                      : cell.challenge_text
                        ? "border border-gray-700 bg-gray-800"
                        : "border border-gray-800/50 bg-gray-800/40"
                  }`}
                >
                  <CellContent
                    cell={cell}
                    onSetText={updateCellText}
                    onToggle={toggleCellCompleted}
                  />
                </div>
              ) : (
                <div
                  key={Math.random()}
                  className="min-h-[56px] rounded-md bg-gray-800/30"
                />
              ),
            )}
          </div>

          <p className="text-center text-xs text-gray-600">
            Trykk for å markere fullført. Dobbeltrykk for å redigere.
          </p>
        </>
      )}
    </div>
  );
}
