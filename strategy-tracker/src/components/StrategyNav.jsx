import { NavLink } from "react-router-dom";

export default function StrategyNav() {
  const items = [
    { id: 1, name: "Strategy 1" },
    { id: 2, name: "Strategy 2" },
  ];
  return (
    <div className="flex gap-2">
      {items.map(s => (
        <NavLink
          key={s.id}
          to={`/strategy/${s.id}`}
          className={({ isActive }) =>
            `px-4 py-1 rounded-full border ${
              isActive ? "border-purple-400" : "border-slate-600"
            }`
          }
        >
          {s.name}
        </NavLink>
      ))}
    </div>
  );
}
