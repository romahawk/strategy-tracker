// src/components/StrategyNav.jsx
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { strategyStore } from "../storage/strategyStore";

const ACCOUNTS_KEY = (sid) => `strategy:${sid}:accounts`;

function safeParseJSON(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ensureDefaultAccounts(sid) {
  const key = ACCOUNTS_KEY(sid);
  const parsed = safeParseJSON(localStorage.getItem(key));
  if (Array.isArray(parsed) && parsed.length) return parsed;
  const def = [{ id: 1, name: "Account 1" }];
  localStorage.setItem(key, JSON.stringify(def));
  return def;
}

function getFirstAccountId(sid) {
  const accounts = ensureDefaultAccounts(sid);
  const first = Array.isArray(accounts) && accounts.length ? accounts[0] : null;
  const aid = Number(first?.id) || 1;
  return aid;
}

export default function StrategyNav() {
  const { strategyId, accountId } = useParams();
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();

  const [strategies, setStrategies] = useState([]);
  const [editStrategy, setEditStrategy] = useState(null);
  const [editName, setEditName] = useState("");

  // load strategies
  useEffect(() => {
    const list = strategyStore.ensureDefaults();
    setStrategies(list);

    // Ensure current strategy exists; if not, route to first valid.
    const exists = list.some((s) => s.id === sid);
    if (!exists && list.length) {
      const nextSid = list[0].id;
      const nextAid = getFirstAccountId(nextSid);
      navigate(`/strategy/${nextSid}/account/${nextAid}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  const persist = (nextList) => {
    setStrategies(nextList);
  };

  const addStrategy = () => {
    const { list, created } = strategyStore.create();
    persist(list);

    const nextSid = created.id;
    const nextAid = getFirstAccountId(nextSid);
    navigate(`/strategy/${nextSid}/account/${nextAid}`);
  };

  const openEdit = (id) => {
    const s = strategies.find((x) => x.id === id);
    if (!s) return;
    setEditStrategy(s);
    setEditName(s.name);
  };

  const closeEdit = () => {
    setEditStrategy(null);
    setEditName("");
  };

  const handleRename = () => {
    const trimmed = editName.trim();
    if (!trimmed || !editStrategy) return;

    const next = strategyStore.rename(editStrategy.id, trimmed);
    persist(next);

    // keep route stable
    if (editStrategy.id === sid) {
      navigate(`/strategy/${sid}/account/${aid}`, { replace: true });
    }
    closeEdit();
  };

  const handleDelete = () => {
    if (!editStrategy) return;

    if (strategies.length <= 1) {
      closeEdit();
      return;
    }

    const deletingId = editStrategy.id;
    const next = strategyStore.remove(deletingId);
    persist(next);

    // If current strategy deleted, navigate to first remaining valid (strategy + its first account)
    if (deletingId === sid) {
      const nextSid = next[0]?.id || 1;
      const nextAid = getFirstAccountId(nextSid);
      navigate(`/strategy/${nextSid}/account/${nextAid}`, { replace: true });
    }

    closeEdit();
  };

  const pillClasses = ({ isActive }) =>
    [
      "px-4 h-7 flex items-center rounded-full text-xs font-medium transition",
      isActive
        ? "bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(127,90,240,.4)]"
        : "text-slate-200/80 hover:text-white hover:bg-white/5",
    ].join(" ");

  return (
    <div className="relative flex items-center">
      {/* strategy pills */}
      <div className="flex items-center gap-1 bg-[#101726] rounded-full px-1 py-1 border border-white/5 h-8">
        {strategies.map((s) => (
          <NavLink
            key={s.id}
            to={`/strategy/${s.id}/account/${aid}`}
            className={pillClasses}
            title="Double-click to edit"
            onClick={(e) => {
              if (e.detail === 2) {
                e.preventDefault();
                openEdit(s.id);
              }
            }}
          >
            {s.name || `Strategy ${s.id}`}
          </NavLink>
        ))}

        <button
          onClick={addStrategy}
          className="h-7 w-7 rounded-full border border-white/5 text-white/80 hover:bg-white/5 flex items-center justify-center text-sm"
          title="Add strategy"
        >
          +
        </button>
      </div>

      {/* label */}
      <span className="absolute left-1/2 -bottom-4 -translate-x-1/2 text-[9px] uppercase tracking-wide text-slate-300/80 pointer-events-none">
        Strategies
      </span>

      {/* edit popup */}
      {editStrategy && (
        <div className="absolute top-10 right-0 z-40 w-56 rounded-2xl bg-[#020617] border border-white/10 shadow-xl p-3 space-y-3">
          {/* header */}
          <div className="flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5 text-slate-100" />
            <span className="text-[11px] font-medium text-slate-100">
              Edit strategy
            </span>
          </div>

          {/* input */}
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#7f5af0]/40"
            placeholder="Strategy name"
          />

          {/* actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRename}
              className="flex-1 h-7 rounded-full bg-[#7f5af0]/15 border border-[#7f5af0]/40 text-[11px] text-white font-semibold hover:bg-[#7f5af0]/35 transition flex items-center justify-center"
            >
              Save
            </button>
            <button
              onClick={closeEdit}
              className="h-7 px-3 rounded-full bg-white/0 border border-white/10 text-[11px] text-slate-200 hover:bg-white/5 transition flex items-center justify-center"
            >
              Cancel
            </button>
          </div>

          {/* delete */}
          {strategies.length > 1 && (
            <button
              onClick={handleDelete}
              className="w-full h-7 rounded-full bg-gradient-to-r from-[#3d1019] to-[#1a070c] text-[11px] text-rose-100 border border-rose-400/10 hover:from-[#5a1320] hover:to-[#270a10] transition flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete strategy
            </button>
          )}
        </div>
      )}
    </div>
  );
}
