import type { Player } from "../types/database";

interface PlayerPickerProps {
  label: string;
  players: Player[];
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
}

export function PlayerPicker({
  label,
  players,
  value,
  onChange,
  excludeId,
}: PlayerPickerProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-300">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-100"
      >
        <option value="">Velg spiller...</option>
        {players
          .filter((p) => p.id !== excludeId)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </select>
    </label>
  );
}
