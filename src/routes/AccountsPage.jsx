// src/routes/AccountsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { accountStore } from "../storage/accountStore";

const ACCOUNT_TYPES = [
  { value: "personal", label: "Personal" },
  { value: "funded", label: "Funded" },
];

const VENUES = [
  { value: "CEX", label: "CEX" },
  { value: "DEX", label: "DEX" },
  { value: "prop", label: "Prop" },
];

const CURRENCIES = ["USDT", "USD", "EUR"];

const pageBg =
  "min-h-screen bg-gradient-to-b from-th-raised via-th-surface to-th-base";

const shell =
  "mx-auto w-full max-w-[1400px] px-6 py-6";

const card =
  "rounded-2xl border border-th-border bg-th-hl/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_12px_50px_rgba(0,0,0,0.45)] backdrop-blur";

const input =
  "mt-1 w-full rounded-xl bg-th-raised border border-th-border px-3 py-2 text-sm text-th-text/90 outline-none focus:border-th-border focus:ring-2 focus:ring-th-cta/20";

const select =
  "mt-1 w-full rounded-xl bg-th-raised border border-th-border px-3 py-2 text-sm text-th-text/90 outline-none focus:border-th-border focus:ring-2 focus:ring-th-cta/20";

function itemClass(active) {
  return active
    ? "border-th-cta/25 bg-th-cta/10 text-th-text"
    : "border-th-border bg-th-hl/[0.03] text-th-text/90 hover:bg-th-hl/[0.06]";
}

export default function AccountsPage() {
  const navigate = useNavigate();
  const { strategyId, accountId } = useParams();

  const sid = Number(strategyId) || 1;
  const activeId = Number(accountId) || 1;

  const [accounts, setAccounts] = useState(() => accountStore.list(sid));
  const activeAccount = useMemo(
    () => accounts.find((a) => Number(a.id) === activeId) || null,
    [accounts, activeId]
  );

  const [form, setForm] = useState(null);

  useEffect(() => {
    const list = accountStore.list(sid);
    setAccounts(list);
  }, [sid]);

  useEffect(() => {
    if (activeAccount) setForm(activeAccount);
  }, [activeAccount]);

  const backToDashboard = () => {
    navigate(`/strategy/${sid}/account/${activeId}`, { replace: true });
  };

  const onSelect = (aid) => {
    navigate(`/strategy/${sid}/account/${aid}/accounts`, { replace: true });
  };

  const onCreate = () => {
    const { created, list } = accountStore.create(sid, {
      name: "New Account",
      accountType: "personal",
      venue: "CEX",
      broker: "CEX",
      baseCurrency: "USDT",
      status: "active",
    });
    setAccounts(list);
    navigate(`/strategy/${sid}/account/${created.id}/accounts`, { replace: true });
  };

  const onSave = () => {
    if (!form) return;
    const next = accountStore.update(sid, form.id, form);
    setAccounts(next);
  };

  const onArchive = () => {
    if (!form) return;
    const next = accountStore.update(sid, form.id, { status: "archived" });
    setAccounts(next);
    setForm((f) => ({ ...f, status: "archived" }));
  };

  const onDelete = () => {
    if (!form) return;
    const next = accountStore.remove(sid, form.id);
    setAccounts(next);

    const nextActive = next[0]?.id || 1;
    navigate(`/strategy/${sid}/account/${nextActive}/accounts`, { replace: true });
  };

  if (!activeAccount || !form) {
    return (
      <div className={pageBg}>
        <div className={shell}>
          <div className={`${card} p-6 text-th-text/80`}>Loading accounts…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageBg}>
      <div className={shell}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-th-text">Accounts</div>
            <div className="text-sm text-th-text/60">
              Split personal crypto vs funded prop accounts (FTMO).
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={backToDashboard}
              className="h-9 rounded-full border border-th-border bg-th-hl/[0.03] px-4 text-sm text-th-text/90 hover:bg-th-hl/[0.06]"
            >
              Back
            </button>
            <button
              onClick={onCreate}
              className="h-9 rounded-full border border-th-cta/30 bg-th-cta/15 px-4 text-sm font-semibold text-th-text hover:bg-th-cta/25"
            >
              + New account
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: list */}
          <div className={`${card} p-4`}>
            <div className="text-sm font-medium text-th-text/85">Your accounts</div>

            <div className="mt-3 space-y-2">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onSelect(a.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${itemClass(
                    Number(a.id) === activeId
                  )}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-th-text/60">
                      #{a.id} • {a.status}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-th-text/55">
                    {a.accountType.toUpperCase()} • {a.venue} • {a.broker || "—"} •{" "}
                    {a.baseCurrency}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-xs text-th-text/45">
              Stored per-strategy in localStorage (MVP). Next: global accounts → Firestore.
            </div>
          </div>

          {/* Right: editor */}
          <div className={`${card} p-4`}>
            <div className="text-sm font-medium text-th-text/85">Edit account</div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-th-text/60">Name</label>
                <input
                  className={input}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-th-text/60">Type</label>
                  <select
                    className={select}
                    value={form.accountType}
                    onChange={(e) => {
                      const type = e.target.value;
                      if (type === "funded") {
                        setForm((f) => ({ ...f, accountType: type, venue: "prop", baseCurrency: "USD" }));
                      } else {
                        setForm((f) => ({ ...f, accountType: type, venue: "CEX", baseCurrency: "USDT" }));
                      }
                    }}
                  >
                    {ACCOUNT_TYPES.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-th-text/60">Venue</label>
                  {form.accountType === "funded" ? (
                    <div className={`${select} flex items-center text-th-text/50 cursor-not-allowed`}>
                      Prop
                    </div>
                  ) : (
                    <select
                      className={select}
                      value={form.venue}
                      onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    >
                      {VENUES.filter((x) => x.value !== "prop").map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-th-text/60">Broker/Exchange</label>
                  <input
                    className={input}
                    value={form.broker}
                    onChange={(e) => setForm((f) => ({ ...f, broker: e.target.value }))}
                    placeholder="Binance / Bybit / FTMO"
                  />
                </div>

                <div>
                  <label className="text-xs text-th-text/60">Base currency</label>
                  {form.accountType === "funded" ? (
                    <div className={`${select} flex items-center text-th-text/50 cursor-not-allowed`}>
                      USD
                    </div>
                  ) : (
                    <select
                      className={select}
                      value={form.baseCurrency}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, baseCurrency: e.target.value }))
                      }
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-th-text/45">
                  Updated: {new Date(form.updatedAt).toLocaleString()}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onArchive}
                    className="h-9 rounded-full border border-th-border bg-th-hl/[0.03] px-4 text-sm text-th-text/90 hover:bg-th-hl/[0.06]"
                  >
                    Archive
                  </button>
                  <button
                    onClick={onDelete}
                    className="h-9 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 text-sm text-rose-100 hover:bg-rose-500/15"
                  >
                    Delete
                  </button>
                  <button
                    onClick={onSave}
                    className="h-9 rounded-full bg-th-cta/90 px-4 text-sm font-semibold text-black hover:brightness-110"
                  >
                    Save
                  </button>
                </div>
              </div>

              {form.accountType === "funded" ? (
                <div className="mt-2 rounded-xl border border-th-cta/15 bg-th-cta/[0.06] p-3 text-sm text-th-text/80">
                  Funded account detected. Next: show FTMO constraints panel (daily loss, max loss,
                  target, min days).
                </div>
              ) : (
                <div className="mt-2 rounded-xl border border-th-border bg-th-hl/[0.03] p-3 text-sm text-th-text/70">
                  Personal account. Next: allow CEX/DEX presets and risk defaults.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
