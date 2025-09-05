import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const LS_KEY = "strategy:names"; // stores { "1": "Strategy 1", "2": "Strategy 2", ... }

export default function StrategyNav() {
  const { strategyId, accountId } = useParams();
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();

  const [names, setNames] = useState({});

  // Load (or bootstrap) strategy names
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
    } catch {}
    const def = { "1": "Strategy 1", "2": "Strategy 2" };
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
    if (proposed === null) return; // cancelled
    const trimmed = proposed.trim();
    if (!trimmed || trimmed === current) return;

    const confirmed = window.confirm(`Rename strategy to "${trimmed}"?`);
    if (!confirmed) return;

    const next = { ...names, [id]: trimmed };
    persist(next);

    // keep current account, stay on same route but with new label (no nav change needed)
    navigate(`/strategy/${id}/account/${aid}`, { replace: true });
  };

  const linkCls = ({ isActive }) =>
    `px-4 py-1.5 rounded-full border text-sm transition cursor-pointer ${
      isActive
        ? "border-purple-400 text-white"
        : "border-slate-600 text-gray-300 hover:border-purple-300"
    }`;

  // If you have more than 2 strategies later, extend this array.
  const strategyIds = [1, 2];

  return (
    <div className="flex items-center gap-2">
      {strategyIds.map((id) => (
        <NavLink
          key={id}
          to={`/strategy/${id}/account/${aid}`}
          className={linkCls}
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
  );
}
