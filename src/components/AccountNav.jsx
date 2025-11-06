import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const LS_KEY = (sid) => `strategy:${sid}:accounts`;

export default function AccountNav() {
  const { strategyId, accountId } = useParams();
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);

  // load or bootstrap accounts list for this strategy
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY(sid));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
          return;
        }
      } catch (_) {}
    }
    const def = [{ id: 1, name: "Account 1" }];
    localStorage.setItem(LS_KEY(sid), JSON.stringify(def));
    setAccounts(def);
  }, [sid]);

  const persist = (next) => {
    setAccounts(next);
    localStorage.setItem(LS_KEY(sid), JSON.stringify(next));
  };

  const addAccount = () => {
    const nextId = accounts.length ? Math.max(...accounts.map((a) => a.id)) + 1 : 1;
    const nextName = `Account ${nextId}`;
    const next = [...accounts, { id: nextId, name: nextName }];
    persist(next);
    navigate(`/strategy/${sid}/account/${nextId}`);
  };

  const renameAccount = (id) => {
    const current = accounts.find((a) => a.id === id);
    const initial = current?.name ?? "";
    const proposed = window.prompt("Enter new account name", initial);
    if (proposed === null) return; // cancel
    const trimmed = proposed.trim();
    if (!trimmed || trimmed === initial) return;

    const confirmed = window.confirm(`Rename account to "${trimmed}"?`);
    if (!confirmed) return;

    const next = accounts.map((a) => (a.id === id ? { ...a, name: trimmed } : a));
    persist(next);

    if (id === aid) {
      navigate(`/strategy/${sid}/account/${aid}`, { replace: true });
    }
  };

  const pill = ({ isActive }) =>
    `px-4 py-1.5 rounded-full border text-sm transition cursor-pointer ${
      isActive
        ? "border-orange-500 text-white"
        : "border-slate-600 text-gray-300 hover:border-orange-400"
    }`;

  const addBtnCls =
    "px-4 py-1.5 rounded-full border border-slate-600 text-sm text-gray-300 " +
    "hover:border-orange-400 hover:text-orange-400 transition cursor-pointer";

  return (
    <div className="flex items-center gap-2">
      {accounts.map((a) => (
        <NavLink
          key={a.id}
          to={`/strategy/${sid}/account/${a.id}`}
          className={pill}
          onClick={(e) => {
            if (e.detail === 2) { // double click
              e.preventDefault();
              renameAccount(a.id);
            }
          }}
          title="Double-click to rename"
        >
          {a.name}
        </NavLink>
      ))}

      <button onClick={addAccount} className={addBtnCls}>
        +
      </button>

    </div>
  );
}
