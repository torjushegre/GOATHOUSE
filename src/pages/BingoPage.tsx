import { useState } from "react";
import { usePlayers } from "../hooks/usePlayers";
import { useBingoBoard } from "../hooks/useBingoBoard";
import type { BingoCell } from "../types/database";

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
        className="flex h-full w-full items-center justify-center text-gray-600 text-xl"
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
      className={`flex h-full w-full items-center justify-center p-1 text-center text-[10px] leading-tight transition-colors ${
        cell.completed
          ? "bg-green-600/30 text-green-300 line-through"
          : "text-gray-200"
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

  // Auto-select first bingo player once loaded
  const activeId = selectedId ?? bingoPlayers[0]?.id ?? null;

  const { cells, loading: boardLoading, updateCellText, toggleCellCompleted } =
    useBingoBoard(activeId);

  if (playersLoading) {
    return <p className="text-center text-gray-500">Laster...</p>;
  }

  // Build 5x5 grid array
  const grid: (BingoCell | undefined)[][] = Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) =>
      cells.find((cell) => cell.row === r && cell.col === c),
    ),
  );

  const completedCount = cells.filter((c) => c.completed).length;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-center text-2xl font-bold text-amber-400">
        Tur-Bingo
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
          <p className="text-center text-sm text-gray-400">
            {completedCount}/25 fullført
          </p>

          {/* 5x5 Grid */}
          <div className="grid grid-cols-5 gap-1">
            {grid.flat().map((cell) =>
              cell ? (
                <div
                  key={cell.id}
                  className="flex aspect-square min-h-[44px] min-w-[44px] items-center justify-center overflow-hidden rounded-md border border-gray-700 bg-gray-800"
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
                  className="aspect-square rounded-md bg-gray-800/50"
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
