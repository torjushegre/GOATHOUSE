import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayers } from "../hooks/usePlayers";
import { useBingoBoard } from "../hooks/useBingoBoard";
import { useBingoGames } from "../hooks/useBingoGames";
import type { BingoCell, BingoGame } from "../types/database";

function detectBingoLines(cells: BingoCell[], size: number): number {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );
  for (const c of cells) {
    if (c.completed) grid[c.row][c.col] = true;
  }

  let lines = 0;

  for (let r = 0; r < size; r++) {
    if (grid[r].every(Boolean)) lines++;
  }
  for (let c = 0; c < size; c++) {
    if (grid.every((row) => row[c])) lines++;
  }

  const idx = Array.from({ length: size }, (_, i) => i);
  if (idx.every((i) => grid[i][i])) lines++;
  if (idx.every((i) => grid[i][size - 1 - i])) lines++;

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
  readOnly,
}: {
  cell: BingoCell;
  onClick: (cell: BingoCell) => void;
  readOnly: boolean;
}) {
  const textRef = useAutoFontSize(cell.challenge_text);

  if (!cell.challenge_text) {
    return (
      <button
        disabled={readOnly}
        onClick={() => !readOnly && onClick(cell)}
        className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-700/30 bg-gray-800/20 text-xl text-gray-700 transition-colors ${
          readOnly ? "cursor-default" : "hover:bg-gray-800/40"
        }`}
      >
        {readOnly ? "" : "+"}
      </button>
    );
  }

  return (
    <button
      disabled={readOnly}
      onClick={() => !readOnly && onClick(cell)}
      className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl p-1 text-center leading-tight transition-all duration-300 ${
        cell.completed
          ? "border-2 border-green-500/60 bg-green-600/20 shadow-md shadow-green-900/30"
          : "border border-gray-700 bg-gray-800"
      } ${readOnly ? "cursor-default opacity-90" : "hover:bg-gray-700/50"}`}
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

function NewGameModal({
  onCreate,
  onClose,
}: {
  onCreate: (name: string, size: 4 | 5) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [size, setSize] = useState<4 | 5>(4);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onCreate(trimmed, size);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-5">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">Nytt spill</h2>

        <label className="mb-1 block text-xs text-gray-400">Navn</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="F.eks. Alicante 2027"
          className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500/50"
        />

        <label className="mb-1 block text-xs text-gray-400">Størrelse</label>
        <div className="mb-4 flex gap-2">
          {([4, 5] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                size === s
                  ? "bg-amber-500 text-gray-950"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {s}×{s}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 transition-colors hover:text-gray-300"
          >
            Avbryt
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || saving}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Opprett
          </button>
        </div>
      </div>
    </div>
  );
}

function GameTitle({
  game,
  onRename,
}: {
  game: BingoGame;
  onRename: (name: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(game.name);

  useEffect(() => {
    setDraft(game.name);
  }, [game.name]);

  const commit = async () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed && trimmed !== game.name) {
      await onRename(trimmed);
    } else {
      setDraft(game.name);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(game.name);
            setEditing(false);
          }
        }}
        className="mx-auto block w-full max-w-xs rounded-lg border border-amber-500/50 bg-gray-900 px-3 py-1 text-center text-2xl font-bold text-amber-400 outline-none"
      />
    );
  }

  return (
    <h1 className="flex items-center justify-center gap-2 text-center text-2xl font-bold text-amber-400">
      <span>{game.name}</span>
      <button
        onClick={() => setEditing(true)}
        title="Gi nytt navn"
        className="text-sm text-amber-400/60 transition-colors hover:text-amber-400"
      >
        ✎
      </button>
    </h1>
  );
}

export function BingoPage() {
  const { players, loading: playersLoading } = usePlayers();
  const {
    games,
    loading: gamesLoading,
    createGame,
    renameGame,
  } = useBingoGames();

  const bingoPlayers = players.filter((p) => p.is_bingo_participant);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<BingoCell | null>(null);
  const [showNewGame, setShowNewGame] = useState(false);

  // Default game: first active game, else first in list.
  const activeGameId = useMemo(() => {
    if (selectedGameId) return selectedGameId;
    const firstLive = games.find((g) => g.archived_at === null);
    return firstLive?.id ?? games[0]?.id ?? null;
  }, [selectedGameId, games]);

  const activeGame = useMemo(
    () => games.find((g) => g.id === activeGameId) ?? null,
    [games, activeGameId],
  );

  const activePlayerId = selectedPlayerId ?? bingoPlayers[0]?.id ?? null;
  const size = activeGame?.size ?? 5;
  const totalCells = size * size;
  const isArchived = activeGame?.archived_at !== null;

  const { cells, loading: boardLoading, updateCellText, toggleCellCompleted } =
    useBingoBoard(activePlayerId, activeGameId);

  if (playersLoading || gamesLoading) {
    return <p className="text-center text-gray-500">Laster...</p>;
  }

  if (games.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <h1 className="text-center text-2xl font-bold text-amber-400">Bingo</h1>
        <p className="text-center text-sm text-gray-400">
          Ingen spill enda. Opprett ditt første spill.
        </p>
        <button
          onClick={() => setShowNewGame(true)}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-amber-400"
        >
          + Nytt spill
        </button>
        {showNewGame && (
          <NewGameModal
            onCreate={async (name, gameSize) => {
              const game = await createGame(name, gameSize);
              setSelectedGameId(game.id);
            }}
            onClose={() => setShowNewGame(false)}
          />
        )}
      </div>
    );
  }

  const grid: (BingoCell | undefined)[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) =>
      cells.find((cell) => cell.row === r && cell.col === c),
    ),
  );

  const completedCount = cells.filter((c) => c.completed).length;
  const pct = cells.length > 0 ? Math.round((completedCount / totalCells) * 100) : 0;
  const bingoLines = detectBingoLines(cells, size);

  const handleSaveCell = async (text: string, completed: boolean) => {
    if (!editingCell || isArchived) return;
    if (text !== editingCell.challenge_text) {
      await updateCellText(editingCell.id, text);
    }
    if (completed !== editingCell.completed) {
      await toggleCellCompleted(editingCell.id, editingCell.completed);
    }
    setEditingCell(null);
  };

  const gridColsClass = size === 4 ? "grid-cols-4" : "grid-cols-5";

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      {activeGame && (
        <GameTitle
          game={activeGame}
          onRename={(name) => renameGame(activeGame.id, name)}
        />
      )}

      {/* Game selector pills */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {games.map((g) => {
          const selected = g.id === activeGameId;
          const archived = g.archived_at !== null;
          return (
            <button
              key={g.id}
              onClick={() => setSelectedGameId(g.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                selected
                  ? "border-amber-500 bg-amber-500/10 text-amber-400"
                  : archived
                    ? "border-gray-700 bg-gray-800/50 text-gray-500"
                    : "border-gray-700 bg-gray-800 text-gray-300"
              }`}
            >
              <span>{g.name}</span>
              <span className="rounded bg-black/30 px-1 text-[10px] text-gray-400">
                {g.size}×{g.size}
              </span>
              {archived && <span className="text-[10px]">📦</span>}
            </button>
          );
        })}
        <button
          onClick={() => setShowNewGame(true)}
          className="flex shrink-0 items-center rounded-full border border-dashed border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-400 transition-colors hover:border-amber-500/50 hover:text-amber-400"
        >
          + Nytt spill
        </button>
      </div>

      {/* Player tabs */}
      {bingoPlayers.length > 0 && (
        <div className="flex gap-2">
          {bingoPlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                activePlayerId === p.id
                  ? "bg-amber-500 text-gray-950"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {boardLoading ? (
        <p className="text-center text-gray-500">Laster brett...</p>
      ) : cells.length === 0 ? (
        <p className="text-center text-sm text-gray-500">
          Ingen brett for denne spilleren i dette spillet.
        </p>
      ) : (
        <>
          {/* Progress bar */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                {completedCount}/{totalCells} fullført
              </span>
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

          {/* Grid */}
          <div className={`grid ${gridColsClass} gap-1.5`}>
            {grid.flat().map((cell, i) =>
              cell ? (
                <BingoGridCell
                  key={cell.id}
                  cell={cell}
                  onClick={setEditingCell}
                  readOnly={isArchived}
                />
              ) : (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-xl bg-gray-800/20 border border-dashed border-gray-700/30"
                />
              ),
            )}
          </div>

          <p className="text-center text-xs text-gray-600">
            {isArchived
              ? "Arkivert spill — kun lesing."
              : "Trykk en celle for å redigere eller fullføre."}
          </p>
        </>
      )}

      {editingCell && !isArchived && (
        <CellEditModal
          cell={editingCell}
          onSave={handleSaveCell}
          onClose={() => setEditingCell(null)}
        />
      )}

      {showNewGame && (
        <NewGameModal
          onCreate={async (name, gameSize) => {
            const game = await createGame(name, gameSize);
            setSelectedGameId(game.id);
          }}
          onClose={() => setShowNewGame(false)}
        />
      )}
    </div>
  );
}
