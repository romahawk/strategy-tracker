// src/components/AccountNav.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit3, Trash2, Plus } from "lucide-react";

const LS_KEY = (sid) => `strategy:${sid}:accounts`;

const selectBase =
  "h-8 rounded-full bg-[#0b1120] border border-white/10 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/40";

const iconBtn =
  "group h-8 w-8 rounded-full bg-[#0b1120] border border-white/20 flex items-center justify-center transition hover:border-white/40 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(255,255,255,0.08)]";

export default function AccountNav() {
  const { strategyId, accountId } = useParams();
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [editAccount, setEditAccount] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(sid));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setAccounts(parsed);
          const exists = parsed.some((a) => Number(a.id) === aid);
          if (!exists) {
            const first = parsed[0];
            navigate(`/strategy/${sid}/account/${first.id}`, { replace: true });
          }
          return;
        }
      }
    } catch (_) {}

    const def = [{ id: 1, name: "Account 1" }];
    localStorage.setItem(LS_KEY(sid), JSON.stringify(def));
    setAccounts(def);

    if (aid !== 1) navigate(`/strategy/${sid}/account/1`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  const accountById = useMemo(() => {
    const m = new Map();
    for (const a of accounts) m.set(Number(a.id), a);
    return m;
  }, [accounts]);

  const persist = (next) => {
    setAccounts(next);
    localStorage.setItem(LS_KEY(sid), JSON.stringify(next));
  };

  const addAccount = () => {
    const nextId = accounts.length
      ? Math.max(...accounts.map((a) => Number(a.id))) + 1
      : 1;
    const next = [...accounts, { id: nextId, name: `Account ${nextId}` }];
    persist(next);
    navigate(`/strategy/${sid}/account/${nextId}`);
  };

  const openEdit = (id) => {
    const acc = accountById.get(Number(id));
    if (!acc) return;
    setEditAccount(acc);
    setEditName(acc.name || `Account ${acc.id}`);
  };

  const closeEdit = () => {
    setEditAccount(null);
    setEditName("");
  };

  const handleRename = () => {
    const trimmed = editName.trim();
    if (!trimmed || !editAccount) return;
    const next = accounts.map((a) =>
      Number(a.id) === Number(editAccount.id) ? { ...a, name: trimmed } : a
    );
    persist(next);
    if (Number(editAccount.id) === aid) {
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
    const deletingId = Number(editAccount.id);
    const next = accounts.filter((a) => Number(a.id) !== deletingId);
    persist(next);

    if (deletingId === aid) {
      const first = next[0];
      navigate(`/strategy/${sid}/account/${first.id}`, { replace: true });
    }
    closeEdit();
  };

  const handleSelect = (value) => {
    const nextAid = Number(value) || 1;
    const exists = accounts.some((a) => Number(a.id) === nextAid);
    if (!exists) return;
    navigate(`/strategy/${sid}/account/${nextAid}`);
  };

  return (
    <div className="relative flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-wide text-slate-300/80">
        Accounts
      </span>

      <select
        value={aid}
        onChange={(e) => handleSelect(e.target.value)}
        className={`${selectBase} min-w-[140px]`}
        title="Select account"
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name || `Account ${a.id}`}
          </option>
        ))}
      </select>

      {/* ✅ FORCE icon visibility via color prop */}
      <button
        type="button"
        onClick={() => openEdit(aid)}
        className={iconBtn}
        title="Edit current account"
      >
        <Edit3
          size={16}
          color="rgba(255,255,255,0.9)"
          className="opacity-90 group-hover:opacity-100"
        />
      </button>

      <button
        type="button"
        onClick={addAccount}
        className={iconBtn}
        title="Add account"
      >
        <Plus
          size={16}
          color="rgba(255,255,255,0.9)"
          className="opacity-90 group-hover:opacity-100"
        />
      </button>

      {editAccount && (
        <div className="absolute top-10 right-0 z-40 w-60 rounded-2xl bg-[#020617] border border-white/10 shadow-xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Edit3 size={14} color="rgba(255,255,255,0.95)" />
            <span className="text-[11px] font-medium text-slate-100">
              Edit account
            </span>
          </div>

          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/40"
            placeholder="Account name"
          />

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

          {accounts.length > 1 && (
            <button
              onClick={handleDelete}
              className="w-full h-7 rounded-full bg-gradient-to-r from-[#3d1019] to-[#1a070c] text-[11px] text-rose-100 border border-rose-400/10 hover:from-[#5a1320] hover:to-[#270a10] transition flex items-center justify-center gap-1"
              title="Delete current account"
            >
              <Trash2 size={14} color="rgba(255,255,255,0.9)" />
              Delete account
            </button>
          )}
        </div>
      )}
    </div>
  );
}
