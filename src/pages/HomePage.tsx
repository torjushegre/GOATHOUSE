import { Link } from "react-router-dom";
import { usePlayers } from "../hooks/usePlayers";
import { useIceEvents } from "../hooks/useIceEvents";
import { useIceScores } from "../hooks/useIceScores";
import { useShoppingList } from "../hooks/useShoppingList";
import { useWashSchedule, getCurrentWeek } from "../hooks/useWashSchedule";

const cards = [
  {
    to: "/ice",
    icon: "🧊",
    title: "Smirnoff ICE",
    description: "Hvem icer hvem? Følg med på poengtavlen!",
    gradient: "from-cyan-600/20 to-blue-600/20 border-cyan-700/50",
  },
  {
    to: "/bingo",
    icon: "🎯",
    title: "Alicante Bingo",
    description: "Fullfør Alicante-utfordringene på brettet ditt!",
    gradient: "from-amber-600/20 to-orange-600/20 border-amber-700/50",
  },
  {
    to: "/handleliste",
    icon: "🛒",
    title: "Handleliste",
    description: "Felles handleliste for huset",
    gradient: "from-green-600/20 to-emerald-600/20 border-green-700/50",
  },
  {
    to: "/vask",
    icon: "🧹",
    title: "Vaskeliste",
    description: "Ukentlig vaskeplan og oppgaver",
    gradient: "from-teal-600/20 to-cyan-600/20 border-teal-700/50",
  },
  {
    to: "/players",
    icon: "👥",
    title: "Gutta",
    description: "Administrer gutta og bingo-deltakere",
    gradient: "from-purple-600/20 to-fuchsia-600/20 border-purple-700/50",
  },
] as const;

function DashboardWidgets() {
  const { players } = usePlayers();
  const { events } = useIceEvents();
  const scores = useIceScores(players, events);
  const { items } = useShoppingList();
  const { week, year } = getCurrentWeek();
  const { weeks } = useWashSchedule(year);

  const leader = scores[0];
  const uncheckedCount = items.filter((i) => !i.checked).length;
  const currentWashWeek = weeks.find((w) => w.week_number === week);
  const washPlayer = currentWashWeek
    ? players.find((p) => p.id === currentWashWeek.player_id)
    : undefined;

  return (
    <div className="grid w-full grid-cols-3 gap-3">
      <Link
        to="/ice"
        className="flex flex-col items-center gap-1 rounded-xl border border-cyan-700/40 bg-cyan-600/10 px-2 py-3 transition-transform active:scale-95"
      >
        <span className="text-lg">🥇</span>
        <span className="text-sm font-bold text-gray-100 truncate max-w-full">
          {leader ? leader.player.name : "—"}
        </span>
        <span className="text-[10px] text-gray-500">
          {leader ? `${leader.score > 0 ? "+" : ""}${leader.score} poeng` : "Ingen data"}
        </span>
      </Link>

      <Link
        to="/handleliste"
        className="flex flex-col items-center gap-1 rounded-xl border border-green-700/40 bg-green-600/10 px-2 py-3 transition-transform active:scale-95"
      >
        <span className="text-lg">🛒</span>
        <span className="text-sm font-bold text-gray-100">
          {uncheckedCount}
        </span>
        <span className="text-[10px] text-gray-500">
          {uncheckedCount === 1 ? "vare igjen" : "varer igjen"}
        </span>
      </Link>

      <Link
        to="/vask"
        className="flex flex-col items-center gap-1 rounded-xl border border-teal-700/40 bg-teal-600/10 px-2 py-3 transition-transform active:scale-95"
      >
        <span className="text-lg">🧹</span>
        <span className="text-sm font-bold text-gray-100 truncate max-w-full">
          {washPlayer ? washPlayer.name : "Ingen"}
        </span>
        <span className="text-[10px] text-gray-500">vasker uke {week}</span>
      </Link>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-amber-400">
        GOATHOUSE
      </h1>
      <p className="text-sm text-gray-500">Hva skjer i huset?</p>

      <DashboardWidgets />

      <div className="flex w-full flex-col gap-4">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className={`flex items-center gap-4 rounded-2xl border bg-gradient-to-br p-5 transition-transform active:scale-[0.98] ${card.gradient}`}
          >
            <span className="text-4xl">{card.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-100">{card.title}</h2>
              <p className="text-sm text-gray-400">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
