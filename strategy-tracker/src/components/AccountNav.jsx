// src/components/AccountNav.jsx
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const LS_KEY = (strategyId) => `strategy:${strategyId}:accounts`;

export default function AccountNav() {
  const { strategyId, accountId } = useParams();
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY(sid));
    if (raw) setAccounts(JSON.parse(raw));
    else {
      const def = [{ id: 1, name: "Account 1" }];
      localStorage.setItem(LS_KEY(sid), JSON.stringify(def));
      setAccounts(def);
    }
  }, [sid]);

  const addAccount = () => {
    const nextId = accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
    const name = `Account ${nextId}`;
    const next = [...accounts, { id: nextId, name }];
    localStorage.setItem(LS_KEY(sid), JSON.stringify(next));
    setAccounts(next);
    navigate(`/strategy/${sid}/account/${nextId}`);
  };

  const rename = (id) => {
    const curr = accounts.find(a => a.id === id);
    const name = window.prompt("Rename account", curr?.name || "");
    if (!name) return;
    const next = accounts.map(a => a.id === id ? { ...a, name } : a);
    localStorage.setItem(LS_KEY(sid), JSON.stringify(next));
    setAccounts(next);
  };

  return (
    <div className="flex items-center gap-2">
      {accounts.map(a => (
        <NavLink
          key={a.id}
          to={`/strategy/${sid}/account/${a.id}`}
          className={({ isActive }) =>
            `px-3 py-1 rounded-full border text-sm ${
              isActive ? "border-purple-400" : "border-slate-600"
            }`
          }
          onDoubleClick={() => rename(a.id)}
          title="Double-click to rename"
        >
          {a.name}
        </NavLink>
      ))}
      <button
        onClick={addAccount}
        className="px-3 py-1 rounded-full border border-slate-600 text-sm"
      >
        + Account
      </button>
    </div>
  );
}
