import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Calendar,
  PiggyBank,
  BadgePercent,
  DollarSign,
  Table as TableIcon,
} from "lucide-react";

/** LocalStorage keys */
const LS_TRADES_KEY = (sid, aid, mode) =>
  `strategy:${sid}:account:${aid}:${mode}-trades`;
const LS_ACCOUNTS_KEY = (sid) => `strategy:${sid}:accounts`;

/* ---------------- ISO week helpers ---------------- */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
function getISOWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}
function isoWeekStartDate(year, week) {
  const approx = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = approx.getUTCDay() || 7;
  if (dow <= 4) approx.setUTCDate(approx.getUTCDate() - dow + 1);
  else approx.setUTCDate(approx.getUTCDate() + (8 - dow));
  return approx;
}
/* -------------------------------------------------- */

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/** reference table (manual, % compounding) */
function buildReferenceDynamic({ weeks, deposit, pnlPct }) {
  const rows = [];
  const w = Math.max(1, Math.min(99, Number(weeks) || 1));
  let current = Math.max(1, Math.floor(Number(deposit) || 1));
  const pct = Math.max(0, Number(pnlPct) || 0);

  for (let i = 1; i <= w; i++) {
    const pnl$ = current * (pct / 100);
    rows.push({
      week: i,
      deposit: round2(current),
      pnlDollar: round2(pnl$),
      pnlPct: round2(pct),
    });
    current = current + pnl$;
  }
  return rows;
}

/** real data: group trades by ISO week */
function aggregateByWeek(trades) {
  const map = new Map();
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(`${a.date}T${a.time || "00:00"}`) -
      new Date(`${b.date}T${b.time || "00:00"}`),
  );

  for (const t of sorted) {
    const dt = new Date(`${t.date}T${t.time || "00:00"}`);
    const wy = getISOWeekYear(dt);
    const wk = getISOWeek(dt);
    const key = `${wy}-${wk}`;

    if (!map.has(key)) {
      map.set(key, {
        wy,
        wk,
        depositAtStart: Number(t.deposit || 0),
        pnlSum: 0,
        lastNextDeposit: Number(t.nextDeposit || 0),
      });
    }

    const rec = map.get(key);
    rec.pnlSum += Number(t.pnl || 0);
    rec.lastNextDeposit = Number(t.nextDeposit ?? rec.lastNextDeposit);
  }

  const list = Array.from(map.values()).sort((a, b) => a.wy - b.wy || a.wk - b.wk);
  list.forEach((r, i) => (r.tradingWeek = i + 1));
  return list;
}

export default function WeeklyCompounding({
  strategyId,
  accountId,
  mode = "live",
  // we still accept these props but we'll only use deposit/pct for initial reference;
  // weeks will start from 1 regardless
  defaultWeeks = 50,
  defaultDeposit = 250,
  defaultPnlPct = 10,
  includeCurrentWeek = true,
  refreshKey = 0,
}) {
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;

  // Reference controls — ALWAYS start with 1 week
  const [refWeeks, setRefWeeks] = useState(1);
  const [refDeposit, setRefDeposit] = useState(defaultDeposit);
  const [refPct, setRefPct] = useState(defaultPnlPct);

  useEffect(() => {
    // normalize just in case
    setRefWeeks(1);
    setRefDeposit((v) => Math.max(1, Math.floor(Number(v) || 1)));
    setRefPct((v) => Math.max(0, Number(v) || 0));
  }, []);

  const [accounts, setAccounts] = useState([]);
  const [lsNonce, setLsNonce] = useState(0);

  // watch for storage / focus to refresh
  useEffect(() => {
    const bump = () => setLsNonce((n) => n + 1);

    const onTradesChanged = () => bump();
    window.addEventListener("trades-changed", onTradesChanged);

    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key.startsWith(`strategy:${sid}:`)) bump();
    };
    window.addEventListener("storage", onStorage);

    const onFocus = () => bump();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("trades-changed", onTradesChanged);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [sid]);

  // load accounts once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ACCOUNTS_KEY(sid));
      const parsed = raw ? JSON.parse(raw) : [{ id: 1, name: "Account 1" }];
      setAccounts(
        Array.isArray(parsed) && parsed.length
          ? parsed
          : [{ id: 1, name: "Account 1" }],
      );
    } catch {
      setAccounts([{ id: 1, name: "Account 1" }]);
    }
  }, [sid]);

  // load weekly data for every account
  const accountWeekly = useMemo(() => {
    const out = {};
    for (const a of accounts) {
      const key = LS_TRADES_KEY(sid, a.id, mode);
      let trades = [];
      try {
        const raw = localStorage.getItem(key);
        trades = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(trades)) trades = [];
      } catch {
        trades = [];
      }
      out[a.id] = { account: a, weeks: aggregateByWeek(trades) };
    }
    return out;
  }, [accounts, sid, mode, refreshKey, lsNonce]);

  // find earliest ISO week across all accounts (or selected)
  const calendarSeed = useMemo(() => {
    const selWeeks = accountWeekly[aid]?.weeks || [];
    if (selWeeks.length) return { wy: selWeeks[0].wy, wk: selWeeks[0].wk };

    let minY = Infinity,
      minW = Infinity;
    Object.values(accountWeekly).forEach(({ weeks }) => {
      if (weeks.length) {
        const { wy, wk } = weeks[0];
        if (wy < minY || (wy === minY && wk < minW)) {
          minY = wy;
          minW = wk;
        }
      }
    });
    if (isFinite(minY)) return { wy: minY, wk: minW };

    const now = new Date();
    return { wy: getISOWeekYear(now), wk: getISOWeek(now) };
  }, [accountWeekly, aid]);

  // REAL rows: independent, from seed -> current ISO week
  const realRows = useMemo(() => {
    const now = new Date();
    const nowWY = getISOWeekYear(now);
    const nowWK = getISOWeek(now);
    const seedStart = isoWeekStartDate(calendarSeed.wy, calendarSeed.wk);
    const nowStart = isoWeekStartDate(nowWY, nowWK);

    // number of weeks between seed and now
    let diff = Math.floor((nowStart - seedStart) / (7 * 24 * 3600 * 1000));
    if (includeCurrentWeek) diff += 1;
    const rowCount = Math.max(0, diff);

    const rows = [];
    for (let i = 0; i < rowCount; i++) {
      const labelDate = new Date(seedStart.getTime() + i * 7 * 24 * 3600 * 1000);
      const labelWY = getISOWeekYear(labelDate);
      const labelWK = getISOWeek(labelDate);

      rows.push({
        calendar: `${labelWY}-${String(labelWK).padStart(2, "0")}`,
        tradingWeek: i + 1,
        accounts: accounts.map((a) => {
          const aw = accountWeekly[a.id]?.weeks || [];
          const found = aw.find((w) => w.wy === labelWY && w.wk === labelWK);
          if (!found) {
            return {
              id: a.id,
              name: a.name,
              deposit: "",
              pnlDollar: "",
              pnlPct: "",
            };
          }
          const dep = round2(found.depositAtStart);
          const pnl$ = round2(found.pnlSum);
          const pnlPct = dep > 0 ? `${round2((pnl$ / dep) * 100)}%` : "–";
          return {
            id: a.id,
            name: a.name,
            deposit: dep,
            pnlDollar: pnl$,
            pnlPct,
          };
        }),
      });
    }
    return rows;
  }, [accounts, accountWeekly, calendarSeed, includeCurrentWeek]);

  // REFERENCE rows: manual, independent, start with 1 week
  const reference = useMemo(
    () =>
      buildReferenceDynamic({
        weeks: refWeeks,
        deposit: refDeposit,
        pnlPct: Number(refPct) || 0,
      }),
    [refWeeks, refDeposit, refPct],
  );

  const outerCard =
    "bg-gradient-to-b from-[#0b1120] to-[#020617] border border-white/10 rounded-2xl p-5 space-y-8 shadow-[0_0_0_1px_rgba(127,90,240,.15),0_20px_60px_rgba(0,0,0,.6)]";

  const sectionBar =
    "flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10";

  const thBase =
    "p-2 text-left text-[11px] font-semibold tracking-wide text-slate-200/80";
  const tdBase = "p-2 text-[12px] text-slate-100/90";

  return (
    <div className={outerCard}>
      {/* ===== REAL FIRST ===== */}
      <div className="space-y-3">
        <div className={sectionBar}>
          <TableIcon className="w-4 h-4 text-[#00ffa3]" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-100">
              Real Accounts
            </span>
            <span className="text-[10px] text-slate-400">
              grouped by ISO calendar week
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="table-auto w-full text-xs">
            <thead className="bg-[#0f172a] text-gray-300">
              <tr>
                <th className={thBase}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#00ffa3]" />
                    Calendar week
                  </div>
                </th>
                <th className={thBase}>
                  <div className="flex items-center gap-1">
                    <LineChart className="w-3.5 h-3.5 text-[#00ffa3]" />
                    Trading week
                  </div>
                </th>

                {accounts.map((a) => (
                  <th key={`d-${a.id}`} className={thBase}>
                    <div className="flex items-center gap-1">
                      <PiggyBank className="w-3.5 h-3.5 text-[#00ffa3]" />
                      {a.name} Deposit
                    </div>
                  </th>
                ))}

                {accounts.map((a) => (
                  <th key={`p-${a.id}`} className={thBase}>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#00ffa3]" />
                      {a.name} PnL $
                    </div>
                  </th>
                ))}

                {accounts.map((a) => (
                  <th key={`pp-${a.id}`} className={thBase}>
                    <div className="flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5 text-[#00ffa3]" />
                      {a.name} PnL %
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {realRows.map((r) => (
                <tr
                  key={r.tradingWeek}
                  className={`${
                    r.tradingWeek % 2 ? "bg-[#0f172a]/40" : "bg-[#0f172a]/20"
                  } hover:bg-white/5 transition`}
                >
                  <td className={tdBase}>{r.calendar}</td>
                  <td className={tdBase}>Week {r.tradingWeek}</td>

                  {r.accounts.map((a) => (
                    <td key={`rd-${r.tradingWeek}-${a.id}`} className={tdBase}>
                      {a.deposit === ""
                        ? ""
                        : a.deposit.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                    </td>
                  ))}

                  {r.accounts.map((a) => (
                    <td
                      key={`rp-${r.tradingWeek}-${a.id}`}
                      className={`p-2 text-[12px] ${
                        a.pnlDollar === ""
                          ? "text-slate-400"
                          : Number(a.pnlDollar) >= 0
                          ? "text-[#00ffa3] font-medium"
                          : "text-rose-400 font-medium"
                      }`}
                    >
                      {a.pnlDollar === ""
                        ? ""
                        : a.pnlDollar.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                    </td>
                  ))}

                  {r.accounts.map((a) => (
                    <td key={`rpp-${r.tradingWeek}-${a.id}`} className={tdBase}>
                      {a.pnlPct}
                    </td>
                  ))}
                </tr>
              ))}

              {realRows.length === 0 && (
                <tr className="bg-[#0f172a]/30">
                  <td className="p-3 text-slate-400 text-xs" colSpan={2 + accounts.length * 3}>
                    No weekly data yet. Add trades to populate ISO-week rows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-500">
          Real rows are generated from trades in localStorage and grouped per ISO week per account.
        </p>
      </div>

      <div className="h-px bg-white/10" />

      {/* ===== REFERENCE LAST ===== */}
      <div className="space-y-4">
        <div className={sectionBar}>
          <LineChart className="w-4 h-4 text-[#7f5af0]" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-100">
              Reference Projection
            </span>
            <span className="text-[10px] text-slate-400">
              manual compounding, starts at Week 1
            </span>
          </div>
        </div>

        {/* controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#7f5af0]" />
              Weeks (1–99)
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={refWeeks}
              onChange={(e) =>
                setRefWeeks(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
              }
              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/50"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-300 mb-1 flex items-center gap-1">
              <PiggyBank className="w-3.5 h-3.5 text-[#7f5af0]" />
              Deposit
            </label>
            <input
              type="number"
              min={1}
              step="1"
              value={refDeposit}
              onChange={(e) =>
                setRefDeposit(Math.max(1, Math.floor(Number(e.target.value) || 1)))
              }
              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/50"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-300 mb-1 flex items-center gap-1">
              <BadgePercent className="w-3.5 h-3.5 text-[#7f5af0]" />
              PnL % per week
            </label>
            <input
              type="number"
              min={0}
              max={500}
              step="0.1"
              value={refPct}
              onChange={(e) => setRefPct(Math.max(0, Number(e.target.value) || 0))}
              className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="table-auto w-full text-xs">
            <thead className="bg-[#0f172a] text-gray-300">
              <tr>
                <th className={thBase}>Week</th>
                <th className={thBase}>Deposit</th>
                <th className={thBase}>PnL %</th>
                <th className={thBase}>PnL $</th>
              </tr>
            </thead>

            <tbody>
              {reference.map((r) => (
                <tr
                  key={`ref-${r.week}`}
                  className={`${
                    r.week % 2 ? "bg-[#0f172a]/40" : "bg-[#0f172a]/20"
                  } hover:bg-white/5 transition`}
                >
                  <td className={tdBase}>Week {r.week}</td>
                  <td className={tdBase}>
                    {r.deposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={tdBase}>{r.pnlPct.toFixed(2)}%</td>
                  <td className={tdBase}>
                    {r.pnlDollar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-500">
          This projection is independent of real trades. Use it as a discipline target, not a report.
        </p>
      </div>
    </div>
  );
}
