import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const LS_KEY = (sid) => `strategy:${sid}:accounts`;

export default function AccountNav() {
  const { strategyId, accountId } = useParams();
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(sid));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setAccounts(parsed);
          return;
        }
      }
    } catch (_) {}
    const def = [{ id: 1, name: "Account 1" }];
    localStorage.setItem(LS_KEY(sid), JSON.stringify(def));
    setAccounts(def);
  }, [sid]);

  const persist = (next) => {
    setAccounts(next);
    localStorage.setItem(LS_KEY(sid), JSON.stringify(next));
  };

  const addAccount = () => {
    const nextId = accounts.length
      ? Math.max(...accounts.map((a) => a.id)) + 1
      : 1;
    const next = [...accounts, { id: nextId, name: `Account ${nextId}` }];
    persist(next);
    navigate(`/strategy/${sid}/account/${nextId}`);
  };

  const renameAccount = (id) => {
    const current = accounts.find((a) => a.id === id);
    const initial = current?.name ?? "";
    const proposed = window.prompt("Enter new account name", initial);
    if (proposed === null) return;
    const trimmed = proposed.trim();
    if (!trimmed || trimmed === initial) return;
    if (!window.confirm(`Rename account to "${trimmed}"?`)) return;
    const next = accounts.map((a) =>
      a.id === id ? { ...a, name: trimmed } : a
    );
    persist(next);
    if (id === aid) {
      navigate(`/strategy/${sid}/account/${aid}`, { replace: true });
    }
  };

  const pillClasses = ({ isActive }) =>
    [
      "px-4 h-7 flex items-center rounded-full text-xs font-medium transition",
      isActive
        ? "bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(255,149,89,.35)]"
        : "text-slate-200/80 hover:text-white hover:bg-white/5",
    ].join(" ");

  return (
    <div className="relative flex items-center">
      <div className="flex items-center gap-1 bg-[#0e1422] rounded-full px-1 py-1 border border-white/5 h-8">
        {accounts.map((a) => (
          <NavLink
            key={a.id}
            to={`/strategy/${sid}/account/${a.id}`}
            className={pillClasses}
            title="Double-click to rename"
            onClick={(e) => {
              if (e.detail === 2) {
                e.preventDefault();
                renameAccount(a.id);
              }
            }}
          >
            {a.name}
          </NavLink>
        ))}
        <button
          onClick={addAccount}
          className="h-7 w-7 rounded-full border border-white/5 text-white/80 hover:bg-white/5 flex items-center justify-center text-sm"
          title="Add account"
        >
          +
        </button>
      </div>
      <span className="absolute left-1/2 -bottom-4 -translate-x-1/2 text-[9px] uppercase tracking-wide text-slate-300/80 pointer-events-none">
        Accounts
      </span>
    </div>
  );
}
