import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/", label: "Hjem", icon: "🏠" },
  { to: "/ice", label: "ICE", icon: "🧊" },
  { to: "/bingo", label: "Bingo", icon: "🎯" },
  { to: "/players", label: "Spillere", icon: "👥" },
] as const;

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-gray-950 text-gray-100">
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-gray-800 bg-gray-950/95 backdrop-blur">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive ? "text-amber-400" : "text-gray-500"
              }`
            }
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
