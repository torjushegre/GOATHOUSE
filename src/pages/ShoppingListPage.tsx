import { useState } from "react";
import { useShoppingList } from "../hooks/useShoppingList";

export function ShoppingListPage() {
  const { items, loading, addItem, toggleItem, deleteItem, clearChecked } =
    useShoppingList();
  const [newText, setNewText] = useState("");

  const unchecked = items.filter((it) => !it.checked);
  const checked = items.filter((it) => it.checked);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    addItem(newText);
    setNewText("");
  };

  if (loading) {
    return <p className="text-center text-gray-500">Laster...</p>;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-center text-2xl font-bold text-amber-400">
        Handleliste
      </h1>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Legg til vare..."
          className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-950 transition-colors active:bg-amber-600"
        >
          Legg til
        </button>
      </form>

      {/* Unchecked items */}
      {unchecked.length === 0 && checked.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          Handlelisten er tom
        </p>
      )}

      {unchecked.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl bg-gray-900 p-2">
          {unchecked.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2"
            >
              <button
                onClick={() => toggleItem(it.id, it.checked)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-gray-600 transition-colors hover:border-amber-500"
              />
              <span className="flex-1 text-sm text-gray-100">{it.text}</span>
              <button
                onClick={() => deleteItem(it.id)}
                className="text-sm text-gray-600 transition-colors hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Handlet ({checked.length})
            </span>
            <button
              onClick={() => {
                if (window.confirm("Fjerne alle handlede varer?"))
                  clearChecked();
              }}
              className="text-xs text-red-400 transition-colors hover:text-red-300"
            >
              Tøm handlet
            </button>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-gray-900 p-2">
            {checked.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
              >
                <button
                  onClick={() => toggleItem(it.id, it.checked)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-amber-500 bg-amber-500/20 text-amber-400 transition-colors"
                >
                  ✓
                </button>
                <span className="flex-1 text-sm text-gray-500 line-through">
                  {it.text}
                </span>
                <button
                  onClick={() => deleteItem(it.id)}
                  className="text-sm text-gray-600 transition-colors hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
