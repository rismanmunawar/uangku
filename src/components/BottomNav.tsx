import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/add", label: "Pay/Transfer", icon: "💸" },
  { to: "/transactions", label: "Activity", icon: "📜" },
  { to: "/settings", label: "Me", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav className="pointer-events-none fixed left-0 right-0 bottom-[calc(var(--safe-area-bottom)+0.5rem)] pb-[var(--safe-area-bottom)] flex justify-center">
      <ul className="pointer-events-auto mx-auto flex max-w-lg flex-1 items-center justify-evenly gap-1 rounded-full bg-white/95 px-3 py-2 shadow-pill ring-1 ring-slate-200">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "group relative flex flex-col items-center justify-center rounded-full px-3 py-2 text-[11px] font-semibold transition",
                  isActive
                    ? "bg-primary text-white shadow-soft"
                    : "text-slate-500 hover:text-slate-800",
                ].join(" ")
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
