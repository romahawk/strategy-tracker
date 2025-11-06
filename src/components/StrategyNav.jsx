import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const LS_KEY = "strategy:names";

export default function StrategyNav() {
  const { accountId } = useParams();
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();
  const [names, setNames] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setNames(parsed);
          return;
        }
      }
    } catch (_) {}
    const def = { "1": "15m ST", "2": "1m BoS", "3": "Fx" };
    localStorage.setItem(LS_KEY, JSON.stringify(def));
    setNames(def);
  }, []);

  const persist = (next) => {
    setNames(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const renameStrategy = (id) => {
    const current = names?.[id] || `Strategy ${id}`;
    const proposed = window.prompt("Enter new strategy name", current);
    if (proposed === null) return;
    const trimmed = proposed.trim();
    if (!trimmed || trimmed === current) return;
    if (!window.confirm(`Rename strategy to "${trimmed}"?`)) return;
    const next = { ...names, [id]: trimmed };
    persist(next);
    navigate(`/strategy/${id}/account/${aid}`, { replace: true });
  };

  const strategyIds = [1, 2, 3];

  const pillClasses = ({ isActive }) =>
    [
      "px-4 h-7 flex items-center rounded-full text-xs font-medium transition",
      isActive
        ? "bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(127,90,240,.4)]"
        : "text-slate-200/80 hover:text-white hover:bg-white/5",
    ].join(" ");

  return (
    <div className="relative flex items-center">
      <div className="flex items-center gap-1 bg-[#101726] rounded-full px-1 py-1 border border-white/5 h-8">
        {strategyIds.map((id) => (
          <NavLink
            key={id}
            to={`/strategy/${id}/account/${aid}`}
            className={pillClasses}
            title="Double-click to rename"
            onClick={(e) => {
              if (e.detail === 2) {
                e.preventDefault();
                renameStrategy(String(id));
              }
            }}
          >
            {names?.[id] || `Strategy ${id}`}
          </NavLink>
        ))}
      </div>
      {/* label floats lower, doesn’t push pills down */}
      <span className="absolute left-1/2 -bottom-4 -translate-x-1/2 text-[9px] uppercase tracking-wide text-slate-300/80 pointer-events-none">
        Strategies
      </span>
    </div>
  );
}
