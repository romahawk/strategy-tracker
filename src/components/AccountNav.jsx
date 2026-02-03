// src/components/AccountNav.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit3, Trash2, Plus, Settings } from "lucide-react";
import { accountStore } from "../storage/accountStore";

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
    const list = accountStore.list(sid);
    setAccounts(list);

    const exists = list.some((a) => Number(a.id) === aid);
    if (!exists) {
      const first = list[0];
      navigate(`/strategy/${sid}/account/${first?.id || 1}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  const accountById = useMemo(() => {
    const m = new Map();
    for (const a of accounts) m.set(Number(a.id), a);
    return m;
  }, [accounts]);

  const refresh = () => setAccounts(accountStore.list(sid));

  const addAccount = () => {
    const { created } = accountStore.create(sid, {
      name: `Account ${accounts.length + 1}`,
      accountType: "personal",
      venue: "CEX",
      broker: "CEX",
      baseCurrency: "USDT",
      status: "active",
    });

    refresh();
    navigate(`/strategy/${sid}/account/${created.id}`);
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

    accountStore.update(sid, editAccount.id, { name: trimmed });
    refresh();

    if (Number(editAccount.id) === aid) {
      navigate(`/strategy/${sid}/account/${editAccount.id}`, { replace: true });
    }
    closeEdit();
  };

  const handleDelete = () => {
    if (!editAccount) return;

    const list = accountStore.list(sid);
    if (list.length <= 1) {
      closeEdit();
      return;
    }

    const deletingId = Number(editAccount.id);
    accountStore.remove(sid, deletingId);
    const next = accountStore.list(sid);
    setAccounts(next);

    if (deletingId === aid) {
      const first = next[0];
      navigate(`/strategy/${sid}/account/${first?.id || 1}`, { replace: true });
    }
    closeEdit();
  };

  const handleSelect = (value) => {
    const nextAid = Number(value) || 1;
    const exists = accounts.some((a) => Number(a.id) === nextAid);
    if (!exists) return;
    navigate(`/strategy/${sid}/account/${nextAid}`);
  };

  const goManage = () => {
    navigate(`/strategy/${sid}/account/${aid}/accounts`);
  };

  return (
    <div className="relative flex items-center gap-2">
      <span className="text-[9px] uppercase tracking-wide text-slate-300/80">
        Accounts
      </span>

      <select
        value={aid}
        onChange={(e) => handleSelect(e.target.value)}
        className={`${selectBase} min-w-[160px]`}
        title="Select account"
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name || `Account ${a.id}`}
          </option>
        ))}
      </select>

      <button type="button" onClick={goManage} className={iconBtn} title="Manage accounts">
        <Settings size={16} color="rgba(255,255,255,0.9)" className="opacity-90 group-hover:opacity-100" />
      </button>

      <button type="button" onClick={() => openEdit(aid)} className={iconBtn} title="Rename account">
        <Edit3 size={16} color="rgba(255,255,255,0.9)" className="opacity-90 group-hover:opacity-100" />
      </button>

      <button type="button" onClick={addAccount} className={iconBtn} title="Add account">
        <Plus size={16} color="rgba(255,255,255,0.9)" className="opacity-90 group-hover:opacity-100" />
      </button>

      {editAccount && (
        <div className="absolute top-10 right-0 z-40 w-60 rounded-2xl bg-[#020617] border border-white/10 shadow-xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Edit3 size={14} color="rgba(255,255,255,0.95)" />
            <span className="text-[11px] font-medium text-slate-100">
              Rename account
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
