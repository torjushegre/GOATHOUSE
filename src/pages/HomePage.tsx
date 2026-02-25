import { Link } from "react-router-dom";

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
    to: "/players",
    icon: "👥",
    title: "Spillere",
    description: "Administrer spillere og bingo-deltakere",
    gradient: "from-purple-600/20 to-fuchsia-600/20 border-purple-700/50",
  },
] as const;

export function HomePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-amber-400">
        GOATHOUSE
      </h1>
      <p className="text-sm text-gray-500">Hva skjer i huset?</p>

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
