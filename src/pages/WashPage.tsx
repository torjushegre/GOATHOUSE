import { useState, useEffect } from "react";
import { usePlayers } from "../hooks/usePlayers";
import {
  useWashSchedule,
  getCurrentWeek,
  WASH_TASKS,
} from "../hooks/useWashSchedule";

function WeekCell({
  weekNumber,
  isCurrent,
  assigneeName,
  onClick,
}: {
  weekNumber: number;
  isCurrent: boolean;
  assigneeName: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-lg px-1 py-1.5 text-center transition-colors ${
        isCurrent
          ? "bg-amber-500/20 ring-1 ring-amber-500/60"
          : "bg-gray-800/50 hover:bg-gray-800"
      }`}
    >
      <span
        className={`text-[11px] font-semibold ${isCurrent ? "text-amber-400" : "text-gray-400"}`}
      >
        {weekNumber}
      </span>
      <span className="truncate text-[10px] text-gray-500 max-w-full">
        {assigneeName ?? "—"}
      </span>
    </button>
  );
}

function WeekAssignModal({
  weekNumber,
  currentPlayerId,
  players,
  onAssign,
  onClose,
}: {
  weekNumber: number;
  currentPlayerId: string | null | undefined;
  players: { id: string; name: string }[];
  onAssign: (weekNumber: number, playerId: string | null) => void;
  onClose: () => void;
}) {
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
        <h3 className="mb-4 text-lg font-bold text-gray-100">Uke {weekNumber}</h3>

        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onAssign(weekNumber, p.id);
                onClose();
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                currentPlayerId === p.id
                  ? "bg-amber-500 text-gray-950"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => {
              onAssign(weekNumber, null);
              onClose();
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              currentPlayerId === null
                ? "bg-amber-500 text-gray-950"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Ferie 🏖️
          </button>
        </div>
      </div>
    </div>
  );
}

export function WashPage() {
  const { week: currentWeek, year: currentYear } = getCurrentWeek();
  const [year] = useState(currentYear);
  const { players, loading: playersLoading } = usePlayers();
  const { weeks, loading, assignWeek, toggleTask } = useWashSchedule(year);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  const currentWeekData = weeks.find((w) => w.week_number === currentWeek);
  const currentTasks = currentWeekData?.wash_tasks
    ?.slice()
    .sort((a, b) => a.task_index - b.task_index) ?? [];

  const currentAssignee = currentWeekData
    ? currentWeekData.player_id
      ? playerMap.get(currentWeekData.player_id) ?? "Ukjent"
      : "Ferie 🏖️"
    : null;

  if (loading || playersLoading) {
    return <p className="text-center text-gray-500">Laster...</p>;
  }

  const selectedWeekData = selectedWeek
    ? weeks.find((w) => w.week_number === selectedWeek) ?? null
    : null;

  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-center text-2xl font-bold text-amber-400">
        Vaskeliste
      </h1>

      {/* Current week section */}
      <section className="rounded-xl border-2 border-amber-500/50 bg-gray-900 p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-400">
          Uke {currentWeek} — Denne uken
        </h2>

        {currentAssignee ? (
          <>
            <p className="mb-3 text-lg font-bold text-gray-100">
              {currentAssignee}
            </p>
            {currentTasks.length > 0 && (
              <div className="flex flex-col gap-2">
                {currentTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id, task.completed)}
                    className="flex items-center gap-3 rounded-lg bg-gray-800 px-3 py-2 text-left transition-colors"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs transition-colors ${
                        task.completed
                          ? "border-green-500 bg-green-500/20 text-green-400"
                          : "border-gray-600"
                      }`}
                    >
                      {task.completed && "✓"}
                    </span>
                    <span
                      className={`text-sm ${
                        task.completed
                          ? "text-gray-500 line-through"
                          : "text-gray-200"
                      }`}
                    >
                      {WASH_TASKS[task.task_index]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">Ingen er tildelt denne uken.</p>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => assignWeek(currentWeek, p.id)}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-amber-500/20 hover:text-amber-400"
                >
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => assignWeek(currentWeek, null)}
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-amber-500/20 hover:text-amber-400"
              >
                Ferie 🏖️
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Full year calendar grid */}
      <section className="rounded-xl bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Årsplan {year}
        </h2>

        {/* Quarter headers */}
        <div className="mb-1 grid grid-cols-4 gap-1">
          {quarters.map((q) => (
            <div key={q} className="text-center text-xs font-semibold text-gray-500">
              {q}
            </div>
          ))}
        </div>

        {/* 4x13 calendar grid */}
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 13 }, (_, row) =>
            Array.from({ length: 4 }, (_, col) => {
              const wn = col * 13 + row + 1;
              if (wn > 52) return <div key={`empty-${col}-${row}`} />;
              const weekData = weeks.find((w) => w.week_number === wn);
              const assigneeName = weekData
                ? weekData.player_id
                  ? playerMap.get(weekData.player_id) ?? "?"
                  : "Ferie"
                : null;

              return (
                <WeekCell
                  key={wn}
                  weekNumber={wn}
                  isCurrent={wn === currentWeek}
                  assigneeName={assigneeName}
                  onClick={() => setSelectedWeek(wn)}
                />
              );
            }),
          )}
        </div>
      </section>

      {selectedWeek && (
        <WeekAssignModal
          weekNumber={selectedWeek}
          currentPlayerId={selectedWeekData ? selectedWeekData.player_id : undefined}
          players={players}
          onAssign={(wn, pid) => {
            assignWeek(wn, pid);
          }}
          onClose={() => setSelectedWeek(null)}
        />
      )}
    </div>
  );
}
