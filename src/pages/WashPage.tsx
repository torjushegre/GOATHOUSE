import { useState } from "react";
import { usePlayers } from "../hooks/usePlayers";
import {
  useWashSchedule,
  getCurrentWeek,
  WASH_TASKS,
} from "../hooks/useWashSchedule";

export function WashPage() {
  const { week: currentWeek, year: currentYear } = getCurrentWeek();
  const [year] = useState(currentYear);
  const { players, loading: playersLoading } = usePlayers();
  const { weeks, loading, assignWeek, toggleTask } = useWashSchedule(year);

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

      {/* Full year schedule */}
      <section className="rounded-xl bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Årsplan {year}
        </h2>
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {Array.from({ length: 52 }, (_, i) => i + 1).map((wn) => {
            const weekData = weeks.find((w) => w.week_number === wn);
            const isCurrent = wn === currentWeek;
            const assignee = weekData
              ? weekData.player_id
                ? playerMap.get(weekData.player_id) ?? "Ukjent"
                : "Ferie 🏖️"
              : null;

            return (
              <WeekRow
                key={wn}
                weekNumber={wn}
                isCurrent={isCurrent}
                assignee={assignee}
                players={players}
                onAssign={(playerId) => assignWeek(wn, playerId)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function WeekRow({
  weekNumber,
  isCurrent,
  assignee,
  players,
  onAssign,
}: {
  weekNumber: number;
  isCurrent: boolean;
  assignee: string | null;
  players: { id: string; name: string }[];
  onAssign: (playerId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-lg px-3 py-2 ${
        isCurrent ? "bg-amber-500/10 ring-1 ring-amber-500/40" : "bg-gray-800/50"
      }`}
    >
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm">
          <span className={`font-semibold ${isCurrent ? "text-amber-400" : "text-gray-300"}`}>
            Uke {weekNumber}
          </span>
        </span>
        <span className="text-sm text-gray-400">
          {assignee ?? "—"}
        </span>
      </div>

      {open && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onAssign(p.id);
                setOpen(false);
              }}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-amber-500/20 hover:text-amber-400"
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => {
              onAssign(null);
              setOpen(false);
            }}
            className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-amber-500/20 hover:text-amber-400"
          >
            Ferie 🏖️
          </button>
        </div>
      )}
    </div>
  );
}
