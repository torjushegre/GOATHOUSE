import { useState, useRef, useEffect } from "react";
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

function useAutoFontSize(text: string, max = 12, min = 7) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;
    const parent = el.parentElement;
    if (!parent) return;

    for (let size = max; size >= min; size--) {
      el.style.fontSize = `${size}px`;
      if (el.scrollHeight <= parent.clientHeight && el.scrollWidth <= parent.clientWidth) {
        return;
      }
    }
    el.style.fontSize = `${min}px`;
  }, [text, max, min]);

  return ref;
}

function BingoGridCell({
  cell,
  onClick,
}: {
  cell: BingoCell;
  onClick: (cell: BingoCell) => void;
}) {
  const textRef = useAutoFontSize(cell.challenge_text);

  if (!cell.challenge_text) {
    return (
      <button
        onClick={() => onClick(cell)}
        className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-700/30 bg-gray-800/20 text-xl text-gray-700 transition-colors hover:bg-gray-800/40"
      >
        +
      </button>
    );
  }

  return (
    <button
      onClick={() => onClick(cell)}
      className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl p-1 text-center leading-tight transition-all duration-300 ${
        cell.completed
          ? "border-2 border-green-500/60 bg-green-600/20 shadow-md shadow-green-900/30"
          : "border border-gray-700 bg-gray-800 hover:bg-gray-700/50"
      }`}
    >
      <span
        ref={textRef}
        className={`break-words ${cell.completed ? "text-green-300" : "text-gray-200"}`}
      >
        {cell.challenge_text}
      </span>
      {cell.completed && (
        <span className="absolute right-0.5 top-0.5 text-[10px] text-green-400">✓</span>
      )}
    </button>
  );
}

function CellEditModal({
  cell,
  onSave,
  onClose,
}: {
  cell: BingoCell;
  onSave: (text: string, completed: boolean) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(cell.challenge_text);
  const [completed, setCompleted] = useState(cell.completed);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-5">
        <textarea
          autoFocus
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500/50"
          placeholder="Skriv utfordring..."
        />

        <div className="mt-3 flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
            <button
              type="button"
              onClick={() => setCompleted(!completed)}
              className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs transition-colors ${
                completed
                  ? "border-green-500 bg-green-500/20 text-green-400"
                  : "border-gray-600"
              }`}
            >
              {completed && "✓"}
            </button>
            Fullført
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => {
              onSave("", false);
            }}
            className="text-sm text-red-400 transition-colors hover:text-red-300"
          >
            Slett tekst
          </button>
          <button
            onClick={() => {
              onSave(draft.trim(), completed);
            }}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-amber-400"
          >
            Lagre
          </button>
        </div>
      </div>
    </div>
  );
}

export function BingoPage() {
  const { players, loading: playersLoading } = usePlayers();
  const bingoPlayers = players.filter((p) => p.is_bingo_participant);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<BingoCell | null>(null);

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

  const handleSaveCell = async (text: string, completed: boolean) => {
    if (!editingCell) return;
    if (text !== editingCell.challenge_text) {
      await updateCellText(editingCell.id, text);
    }
    if (completed !== editingCell.completed) {
      await toggleCellCompleted(editingCell.id, editingCell.completed);
    }
    setEditingCell(null);
  };

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
          <div className="grid grid-cols-5 gap-1.5">
            {grid.flat().map((cell) =>
              cell ? (
                <BingoGridCell
                  key={cell.id}
                  cell={cell}
                  onClick={setEditingCell}
                />
              ) : (
                <div
                  key={Math.random()}
                  className="aspect-square rounded-xl bg-gray-800/20 border border-dashed border-gray-700/30"
                />
              ),
            )}
          </div>

          <p className="text-center text-xs text-gray-600">
            Trykk en celle for å redigere eller fullføre.
          </p>
        </>
      )}

      {editingCell && (
        <CellEditModal
          cell={editingCell}
          onSave={handleSaveCell}
          onClose={() => setEditingCell(null)}
        />
      )}
    </div>
  );
}
