import { useState } from "react";
import { usePlayers } from "../hooks/usePlayers";

export function PlayersPage() {
  const { players, loading, addPlayer, updatePlayer, deletePlayer } =
    usePlayers();

  const [newName, setNewName] = useState("");
  const [newBingo, setNewBingo] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBingo, setEditBingo] = useState(false);
  const [editError, setEditError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAddError("");
    try {
      await addPlayer(trimmed, newBingo);
      setNewName("");
      setNewBingo(false);
    } catch {
      setAddError("Navnet finnes allerede");
    }
  };

  const startEdit = (id: string) => {
    const p = players.find((pl) => pl.id === id);
    if (!p) return;
    setEditingId(id);
    setEditName(p.name);
    setEditBingo(p.is_bingo_participant);
    setEditError("");
  };

  const handleSave = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    setEditError("");
    try {
      await updatePlayer(editingId, {
        name: trimmed,
        is_bingo_participant: editBingo,
      });
      setEditingId(null);
    } catch {
      setEditError("Navnet finnes allerede");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Slette ${name}? Alle ICE-hendelser blir også slettet.`,
      )
    )
      return;
    await deletePlayer(id);
    setEditingId(null);
  };

  if (loading) {
    return <p className="text-center text-gray-500">Laster...</p>;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-center text-2xl font-bold text-amber-400">
        Spillere
      </h1>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 p-3"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nytt navn..."
          className="min-w-0 flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-500"
        />
        <button
          type="button"
          onClick={() => setNewBingo((b) => !b)}
          className={`rounded-lg px-2 py-2 text-lg transition-colors ${
            newBingo ? "bg-amber-500/20 text-amber-400" : "text-gray-600"
          }`}
          title="Bingo-deltaker"
        >
          🎯
        </button>
        <button
          type="submit"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-950 transition-colors active:bg-amber-600"
        >
          Legg til
        </button>
      </form>
      {addError && (
        <p className="text-center text-sm text-red-400">{addError}</p>
      )}

      {/* Player list */}
      <div className="flex flex-col gap-1 rounded-xl border border-gray-700 bg-gray-900">
        {players.map((p) => (
          <div key={p.id}>
            {editingId === p.id ? (
              /* Editing row */
              <div className="flex flex-col gap-2 border-b border-gray-800 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditBingo((b) => !b)}
                    className={`rounded-lg px-2 py-2 text-lg transition-colors ${
                      editBingo
                        ? "bg-amber-500/20 text-amber-400"
                        : "text-gray-600"
                    }`}
                    title="Bingo-deltaker"
                  >
                    🎯
                  </button>
                </div>
                {editError && (
                  <p className="text-sm text-red-400">{editError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-gray-950 active:bg-amber-600"
                  >
                    Lagre
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="flex-1 rounded-lg bg-red-600/20 py-2 text-sm font-semibold text-red-400 active:bg-red-600/30"
                  >
                    Slett
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 rounded-lg bg-gray-800 py-2 text-sm font-semibold text-gray-400 active:bg-gray-700"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              /* Display row */
              <div className="flex items-center border-b border-gray-800 px-4 py-3 last:border-b-0">
                <span className="flex-1 text-sm font-medium text-gray-100">
                  {p.name}
                </span>
                {p.is_bingo_participant && (
                  <span className="mr-3 text-lg" title="Bingo-deltaker">
                    🎯
                  </span>
                )}
                <button
                  onClick={() => startEdit(p.id)}
                  className="text-lg text-gray-500 active:text-gray-300"
                  title="Rediger"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            Ingen spillere ennå
          </p>
        )}
      </div>
    </div>
  );
}
