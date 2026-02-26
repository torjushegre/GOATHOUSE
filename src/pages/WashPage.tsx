import { useState, useEffect, useRef } from "react";
import { usePlayers } from "../hooks/usePlayers";
import {
  useWashSchedule,
  getCurrentWeek,
  WASH_TASKS,
  type WashWeekWithTasks,
} from "../hooks/useWashSchedule";

const PLAYER_COLORS = [
  { bg: "bg-blue-500/25", ring: "ring-blue-400", text: "text-blue-300", dot: "bg-blue-400" },
  { bg: "bg-emerald-500/25", ring: "ring-emerald-400", text: "text-emerald-300", dot: "bg-emerald-400" },
  { bg: "bg-purple-500/25", ring: "ring-purple-400", text: "text-purple-300", dot: "bg-purple-400" },
  { bg: "bg-rose-500/25", ring: "ring-rose-400", text: "text-rose-300", dot: "bg-rose-400" },
  { bg: "bg-orange-500/25", ring: "ring-orange-400", text: "text-orange-300", dot: "bg-orange-400" },
  { bg: "bg-cyan-500/25", ring: "ring-cyan-400", text: "text-cyan-300", dot: "bg-cyan-400" },
  { bg: "bg-pink-500/25", ring: "ring-pink-400", text: "text-pink-300", dot: "bg-pink-400" },
  { bg: "bg-yellow-500/25", ring: "ring-yellow-400", text: "text-yellow-300", dot: "bg-yellow-400" },
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getProgressStatus(weekData: WashWeekWithTasks | undefined, currentWeek: number, weekNumber: number): "done" | "partial" | null {
  if (!weekData || weekNumber >= currentWeek) return null;
  const tasks = weekData.wash_tasks ?? [];
  if (tasks.length === 0) return null;
  const completed = tasks.filter((t) => t.completed).length;
  if (completed === tasks.length) return "done";
  if (completed > 0) return "partial";
  return null;
}

function WeekCell({
  weekNumber,
  isCurrent,
  initials,
  colorClasses,
  progressStatus,
  onClick,
  cellRef,
}: {
  weekNumber: number;
  isCurrent: boolean;
  initials: string | null;
  colorClasses: (typeof PLAYER_COLORS)[number] | null;
  progressStatus: "done" | "partial" | null;
  onClick: () => void;
  cellRef?: React.Ref<HTMLButtonElement>;
}) {
  const bgClass = colorClasses ? colorClasses.bg : "bg-gray-800/30";
  const textClass = colorClasses ? colorClasses.text : "text-gray-600";

  return (
    <button
      ref={cellRef}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center rounded-lg px-1 py-1.5 text-center transition-colors ${bgClass} ${
        isCurrent ? "ring-2 ring-amber-400" : ""
      }`}
    >
      <span
        className={`text-[11px] font-semibold ${isCurrent ? "text-amber-400" : "text-gray-400"}`}
      >
        {weekNumber}
      </span>
      <span className={`text-[11px] font-bold ${textClass}`}>
        {initials ?? "—"}
      </span>
      {progressStatus && (
        <span
          className={`absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full ${
            progressStatus === "done" ? "bg-green-400" : "bg-amber-400"
          }`}
        />
      )}
    </button>
  );
}

function WeekAssignModal({
  weekNumber,
  currentPlayerId,
  players,
  playerColorMap,
  onAssign,
  onClose,
}: {
  weekNumber: number;
  currentPlayerId: string | null | undefined;
  players: { id: string; name: string }[];
  playerColorMap: Map<string, (typeof PLAYER_COLORS)[number]>;
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
          {players.map((p) => {
            const color = playerColorMap.get(p.id);
            return (
              <button
                key={p.id}
                onClick={() => {
                  onAssign(weekNumber, p.id);
                  onClose();
                }}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  currentPlayerId === p.id
                    ? "bg-amber-500 text-gray-950"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {color && (
                  <span className={`h-3 w-3 rounded-full ${color.dot}`} />
                )}
                {p.name}
              </button>
            );
          })}
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
  const currentWeekRef = useRef<HTMLButtonElement>(null);

  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
  const playerColorMap = new Map(
    sortedPlayers.map((p, i) => [p.id, PLAYER_COLORS[i % PLAYER_COLORS.length]]),
  );

  const currentWeekData = weeks.find((w) => w.week_number === currentWeek);
  const currentTasks = currentWeekData?.wash_tasks
    ?.slice()
    .sort((a, b) => a.task_index - b.task_index) ?? [];

  const currentAssignee = currentWeekData
    ? currentWeekData.player_id
      ? playerMap.get(currentWeekData.player_id) ?? "Ukjent"
      : "Ferie 🏖️"
    : null;

  // Next week preview
  const nextWeek = currentWeek < 52 ? currentWeek + 1 : 1;
  const nextWeekData = weeks.find((w) => w.week_number === nextWeek);
  const nextAssignee = nextWeekData
    ? nextWeekData.player_id
      ? playerMap.get(nextWeekData.player_id) ?? "Ukjent"
      : "Ferie 🏖️"
    : null;
  const nextWeekColor = nextWeekData?.player_id
    ? playerColorMap.get(nextWeekData.player_id) ?? null
    : null;

  // Auto-scroll to current week on load
  useEffect(() => {
    if (!loading && currentWeekRef.current) {
      currentWeekRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading]);

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

      {/* Next week preview */}
      {nextAssignee && (
        <section className="rounded-xl bg-gray-900 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Neste uke — Uke {nextWeek}
            </span>
            <span className="flex items-center gap-2">
              {nextWeekColor && (
                <span className={`h-2.5 w-2.5 rounded-full ${nextWeekColor.dot}`} />
              )}
              <span className={`text-sm font-bold ${nextWeekColor?.text ?? "text-gray-400"}`}>
                {nextAssignee}
              </span>
            </span>
          </div>
        </section>
      )}

      {/* Full year calendar grid */}
      <section className="rounded-xl bg-gray-900 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          Årsplan {year}
        </h2>

        {/* Color legend */}
        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
          {sortedPlayers.map((p) => {
            const color = playerColorMap.get(p.id);
            if (!color) return null;
            return (
              <span key={p.id} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                <span className={`text-xs ${color.text}`}>{p.name}</span>
              </span>
            );
          })}
        </div>

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
              const playerId = weekData?.player_id ?? null;
              const initials = playerId
                ? getInitials(playerMap.get(playerId) ?? "?")
                : weekData
                  ? "🏖️"
                  : null;
              const colorClasses = playerId
                ? playerColorMap.get(playerId) ?? null
                : null;
              const isCurrent = wn === currentWeek;
              const progressStatus = getProgressStatus(weekData, currentWeek, wn);

              return (
                <WeekCell
                  key={wn}
                  weekNumber={wn}
                  isCurrent={isCurrent}
                  initials={initials}
                  colorClasses={colorClasses}
                  progressStatus={progressStatus}
                  onClick={() => setSelectedWeek(wn)}
                  cellRef={isCurrent ? currentWeekRef : undefined}
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
          playerColorMap={playerColorMap}
          onAssign={(wn, pid) => {
            assignWeek(wn, pid);
          }}
          onClose={() => setSelectedWeek(null)}
        />
      )}
    </div>
  );
}
