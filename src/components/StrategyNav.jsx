// src/components/StrategyNav.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit3, Trash2, Plus } from "lucide-react";
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
  return Number(first?.id) || 1;
}

const selectBase =
  "h-8 rounded-full bg-th-raised border border-th-border px-3 text-xs text-th-text focus:outline-none focus:ring-2 focus:ring-th-accent/40";

const iconBtn =
  "group h-8 w-8 rounded-full bg-th-raised border border-th-border flex items-center justify-center transition hover:border-th-border hover:bg-th-hl/5";

export default function StrategyNav() {
  const { strategyId, accountId } = useParams();
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();

  const [strategies, setStrategies] = useState([]);
  const [editStrategy, setEditStrategy] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const list = strategyStore.ensureDefaults();
    setStrategies(list);

    const exists = list.some((s) => s.id === sid);
    if (!exists && list.length) {
      const nextSid = list[0].id;
      const nextAid = getFirstAccountId(nextSid);
      navigate(`/strategy/${nextSid}/account/${nextAid}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  const strategyById = useMemo(() => {
    const m = new Map();
    for (const s of strategies) m.set(Number(s.id), s);
    return m;
  }, [strategies]);

  const persist = (nextList) => setStrategies(nextList);

  const addStrategy = () => {
    const { list, created } = strategyStore.create();
    persist(list);

    const nextSid = created.id;
    const nextAid = getFirstAccountId(nextSid);
    navigate(`/strategy/${nextSid}/account/${nextAid}`);
  };

  const openEdit = (id) => {
    const s = strategyById.get(Number(id));
    if (!s) return;
    setEditStrategy(s);
    setEditName(s.name || `Strategy ${s.id}`);
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

    if (deletingId === sid) {
      const nextSid = next[0]?.id || 1;
      const nextAid = getFirstAccountId(nextSid);
      navigate(`/strategy/${nextSid}/account/${nextAid}`, { replace: true });
    }

    closeEdit();
  };

  const handleSelect = (value) => {
    const nextSid = Number(value) || 1;
    const exists = strategies.some((s) => s.id === nextSid);
    if (!exists) return;
    navigate(`/strategy/${nextSid}/account/${aid}`);
  };

  return (
    <div className="relative flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-wide text-th-text-dim/80">
        Strategies
      </span>

      <select
        value={sid}
        onChange={(e) => handleSelect(e.target.value)}
        className={`${selectBase} min-w-[160px]`}
        title="Select strategy"
      >
        {strategies.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name || `Strategy ${s.id}`}
          </option>
        ))}
      </select>

      {/* ✅ FORCE icon visibility via color prop + Tailwind backup */}
      <button
        type="button"
        onClick={() => openEdit(sid)}
        className={iconBtn}
        title="Edit current strategy"
      >
        <Edit3
          size={16}
          className="text-th-text opacity-90 group-hover:opacity-100"
        />
      </button>

      <button
        type="button"
        onClick={addStrategy}
        className={iconBtn}
        title="Add strategy"
      >
        <Plus
          size={16}
          className="text-th-text opacity-90 group-hover:opacity-100"
        />
      </button>

      {editStrategy && (
        <div className="absolute top-10 right-0 z-40 w-60 rounded-2xl bg-th-base border border-th-border shadow-xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Edit3 size={14} className="text-th-text" />
            <span className="text-[11px] font-medium text-th-text">
              Edit strategy
            </span>
          </div>

          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full h-8 rounded-lg bg-th-raised border border-th-border-dim px-2 text-xs text-th-text focus:outline-none focus:ring-2 focus:ring-th-accent/40"
            placeholder="Strategy name"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleRename}
              className="flex-1 h-7 rounded-full bg-th-accent/15 border border-th-accent/40 text-[11px] text-th-text font-semibold hover:bg-th-accent/35 transition flex items-center justify-center"
            >
              Save
            </button>
            <button
              onClick={closeEdit}
              className="h-7 px-3 rounded-full bg-transparent border border-th-border text-[11px] text-th-text-sub hover:bg-th-hl/5 transition flex items-center justify-center"
            >
              Cancel
            </button>
          </div>

          {strategies.length > 1 && (
            <button
              onClick={handleDelete}
              className="w-full h-7 rounded-full bg-rose-500/10 dark:bg-gradient-to-r dark:from-[#3d1019] dark:to-[#1a070c] text-[11px] text-rose-600 dark:text-rose-100 border border-rose-300/30 dark:border-rose-400/10 hover:bg-rose-500/20 dark:hover:from-[#5a1320] dark:hover:to-[#270a10] transition flex items-center justify-center gap-1"
              title="Delete current strategy"
            >
              <Trash2 size={14} />
              Delete strategy
            </button>
          )}
        </div>
      )}
    </div>
  );
}
