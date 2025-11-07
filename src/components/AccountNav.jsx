import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Edit3, X, Trash2 } from "lucide-react";

const LS_KEY = (sid) => `strategy:${sid}:accounts`;

export default function AccountNav() {
  const { strategyId, accountId } = useParams();
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [editAccount, setEditAccount] = useState(null);
  const [editName, setEditName] = useState("");

  // load accounts for current strategy
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

  const openEdit = (id) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;
    setEditAccount(acc);
    setEditName(acc.name);
  };

  const closeEdit = () => {
    setEditAccount(null);
    setEditName("");
  };

  const handleRename = () => {
    const trimmed = editName.trim();
    if (!trimmed || !editAccount) return;
    const next = accounts.map((a) =>
      a.id === editAccount.id ? { ...a, name: trimmed } : a
    );
    persist(next);
    if (editAccount.id === aid) {
      navigate(`/strategy/${sid}/account/${editAccount.id}`, { replace: true });
    }
    closeEdit();
  };

  const handleDelete = () => {
    if (!editAccount) return;
    if (accounts.length <= 1) {
      closeEdit();
      return;
    }
    const next = accounts.filter((a) => a.id !== editAccount.id);
    persist(next);
    if (editAccount.id === aid) {
      const first = next[0];
      navigate(`/strategy/${sid}/account/${first.id}`, { replace: true });
    }
    closeEdit();
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
      {/* account pills */}
      <div className="flex items-center gap-1 bg-[#0e1422] rounded-full px-1 py-1 border border-white/5 h-8">
        {accounts.map((a) => (
          <NavLink
            key={a.id}
            to={`/strategy/${sid}/account/${a.id}`}
            className={pillClasses}
            title="Double-click to edit"
            onClick={(e) => {
              if (e.detail === 2) {
                e.preventDefault();
                openEdit(a.id);
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

      {/* label */}
      <span className="absolute left-1/2 -bottom-4 -translate-x-1/2 text-[9px] uppercase tracking-wide text-slate-300/80 pointer-events-none">
        Accounts
      </span>

      {/* edit popup */}
      {editAccount && (
        <div className="absolute top-10 right-0 z-40 w-56 rounded-2xl bg-[#020617] border border-white/10 shadow-xl p-3 space-y-3">
          {/* header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-slate-100" />
              <span className="text-[11px] font-medium text-slate-100">
                Edit account
              </span>
            </div>
          </div>

          {/* input */}
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/40"
            placeholder="Account name"
          />

          {/* actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRename}
              className="flex-1 h-7 rounded-full bg-[#00ffa3]/15 border border-[#00ffa3]/40 text-[11px] text-white font-semibold hover:bg-[#00ffa3]/35 transition flex items-center justify-center"
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
          {accounts.length > 1 && (
            <button
              onClick={handleDelete}
              className="w-full h-7 rounded-full bg-gradient-to-r from-[#3d1019] to-[#1a070c] text-[11px] text-rose-100 border border-rose-400/10 hover:from-[#5a1320] hover:to-[#270a10] transition flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete account
            </button>
          )}
        </div>
      )}
    </div>
  );
}
