import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Calendar,
  PiggyBank,
  BadgePercent,
  DollarSign,
  Table as TableIcon,
} from "lucide-react";

/** LocalStorage keys (align with App/TradeTable) */
const LS_TRADES_KEY = (sid, aid, mode) =>
  `strategy:${sid}:account:${aid}:${mode}-trades`;
const LS_ACCOUNTS_KEY = (sid) => `strategy:${sid}:accounts`;

/* ---------------- ISO week helpers (no external libs) ---------------- */
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
// Monday 00:00 UTC of ISO week
function isoWeekStartDate(year, week) {
  const approx = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = approx.getUTCDay() || 7;
  if (dow <= 4) approx.setUTCDate(approx.getUTCDate() - dow + 1);
  else approx.setUTCDate(approx.getUTCDate() + (8 - dow));
  return approx;
}
/* -------------------------------------------------------------------- */

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/** Build percent-only reference rows from user inputs */
function buildReferenceDynamic({ weeks, deposit, pnlPct }) {
  const rows = [];
  const w = Math.max(1, Math.min(99, Number(weeks) || 1));
  let current = Math.max(1, Math.floor(Number(deposit) || 1)); // integer ≥ 1
  const pct = Math.max(0, Number(pnlPct) || 0);

  for (let i = 1; i <= w; i++) {
    const pnl$ = current * (pct / 100);
    rows.push({
      week: i,
      deposit: round2(current),
      pnlDollar: round2(pnl$),
      pnlPct: round2(pct),
    });
    current = current + pnl$; // compound
  }
  return rows;
}

/** Group trades by ISO week; sum PnL; take first deposit of the week */
function aggregateByWeek(trades) {
  const map = new Map();
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(`${a.date}T${a.time || "00:00"}`) -
      new Date(`${b.date}T${b.time || "00:00"}`)
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
  accountId, // anchor start on this account's first trade week
  mode = "live", // "live" | "backtest" | "history"
  // Defaults for the dynamic Reference
  defaultWeeks = 50,
  defaultDeposit = 250,
  defaultPnlPct = 10,
  includeCurrentWeek = true, // include ongoing week in real table
  refreshKey = 0, // bump when trades change to re-read localStorage
}) {
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;

  // --- Reference inputs (controlled) ---
  const [refWeeks, setRefWeeks] = useState(defaultWeeks);
  const [refDeposit, setRefDeposit] = useState(defaultDeposit);
  const [refPct, setRefPct] = useState(defaultPnlPct);

  // Normalize on mount
  useEffect(() => {
    setRefWeeks((v) => Math.max(1, Math.min(99, Number(v) || 1)));
    setRefDeposit((v) => Math.max(1, Math.floor(Number(v) || 1)));
    setRefPct((v) => Math.max(0, Number(v) || 0));
  }, []);

  const [accounts, setAccounts] = useState([]);

  // 🔄 internal nonce to force LS re-reads
  const [lsNonce, setLsNonce] = useState(0);

  // Listen for same-tab custom events, cross-tab storage events, and tab focus
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

  // Load accounts list
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ACCOUNTS_KEY(sid));
      const parsed = raw ? JSON.parse(raw) : [{ id: 1, name: "Account 1" }];
      setAccounts(
        Array.isArray(parsed) && parsed.length ? parsed : [{ id: 1, name: "Account 1" }]
      );
    } catch {
      setAccounts([{ id: 1, name: "Account 1" }]);
    }
  }, [sid]);

  // Load trades for each account (reactive to refreshKey + lsNonce)
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

  // Seed = selected account's first trade week (fallbacks)
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

  // Build dynamic reference from inputs (% compounding)
  const reference = useMemo(
    () =>
      buildReferenceDynamic({
        weeks: refWeeks,
        deposit: refDeposit,
        pnlPct: Number(refPct) || 0,
      }),
    [refWeeks, refDeposit, refPct]
  );

  // Build real rows from seed → current week (limited)
  const realRows = useMemo(() => {
    const now = new Date();
    const nowWY = getISOWeekYear(now);
    const nowWK = getISOWeek(now);
    const seedStart = isoWeekStartDate(calendarSeed.wy, calendarSeed.wk);
    const nowStart = isoWeekStartDate(nowWY, nowWK);

    // completed weeks between seed and now
    let diff = Math.floor((nowStart - seedStart) / (7 * 24 * 3600 * 1000));
    if (includeCurrentWeek) diff += 1; // include ongoing week
    const rowCount = Math.max(0, Math.min(refWeeks, diff)); // limit to refWeeks for symmetry

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
          if (!found)
            return { id: a.id, name: a.name, deposit: "", pnlDollar: "", pnlPct: "" };
          const dep = round2(found.depositAtStart);
          const pnl$ = round2(found.pnlSum);
          const pnlPct = dep > 0 ? `${round2((pnl$ / dep) * 100)}%` : "–";
          return { id: a.id, name: a.name, deposit: dep, pnlDollar: pnl$, pnlPct };
        }),
      });
    }
    return rows;
  }, [accounts, accountWeekly, calendarSeed, refWeeks, includeCurrentWeek]);

  return (
    <div className="bg-[#0b1220] border border-[#00ffa3]/20 rounded-2xl shadow-[0_0_30px_rgba(0,255,163,0.08)] p-4">
      {/* Reference controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#7f5af0]" />
            Weeks (1–99)
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={99}
              value={refWeeks}
              onChange={(e) =>
                setRefWeeks(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
              }
              className="w-full bg-[#0f172a] text-gray-200 rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#00ffa3]/60"
              placeholder="50"
            />
            <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex items-center gap-1">
            <PiggyBank className="w-3.5 h-3.5 text-[#7f5af0]" />
            Deposit (≥ 1, integer)
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              step="1"
              value={refDeposit}
              onChange={(e) =>
                setRefDeposit(Math.max(1, Math.floor(Number(e.target.value) || 1)))
              }
              className="w-full bg-[#0f172a] text-gray-200 rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#00ffa3]/60"
              placeholder="250"
            />
            <PiggyBank className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-300 mb-1 flex items-center gap-1">
            <BadgePercent className="w-3.5 h-3.5 text-[#7f5af0]" />
            PnL % (per week)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={500}
              step="0.1"
              value={refPct}
              onChange={(e) => setRefPct(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-[#0f172a] text-gray-200 rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#00ffa3]/60"
              placeholder="10"
            />
            <BadgePercent className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Dynamic Reference table */}
      <div className="overflow-x-auto mb-6">
        <div className="flex items-center gap-2 mb-2 text-gray-300">
          <LineChart className="w-4 h-4 text-[#7f5af0]" />
          <span className="text-sm">Reference (compounded)</span>
        </div>
        <table className="table-auto w-full text-xs">
          <thead className="bg-[#0f172a] text-gray-300">
            <tr>
              <th className="p-2 text-left">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#7f5af0]" />
                  Trading week
                </div>
              </th>
              <th className="p-2 text-left">
                <div className="flex items-center gap-1">
                  <PiggyBank className="w-3.5 h-3.5 text-[#7f5af0]" />
                  Deposit
                </div>
              </th>
              <th className="p-2 text-left">
                <div className="flex items-center gap-1">
                  <BadgePercent className="w-3.5 h-3.5 text-[#7f5af0]" />
                  PnL, %
                </div>
              </th>
              <th className="p-2 text-left">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#7f5af0]" />
                  PnL, $
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {reference.map((r) => (
              <tr
                key={`ref-${r.week}`}
                className={r.week % 2 ? "bg-[#0f172a]/40" : "bg-[#0f172a]/20"}
              >
                <td className="p-2 text-gray-200">Week {r.week}</td>
                <td className="p-2 text-gray-300">
                  {r.deposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2 text-gray-300">{r.pnlPct.toFixed(2)}%</td>
                <td className="p-2 text-gray-300">
                  {r.pnlDollar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Real accounts — seeded from selected account; limited to seed→now */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-2 mb-2 text-gray-300">
          <TableIcon className="w-4 h-4 text-[#00ffa3]" />
          <span className="text-sm">Real Accounts (by ISO calendar week)</span>
        </div>
        <table className="table-auto w-full text-xs">
          <thead className="bg-[#0f172a] text-gray-300">
            <tr>
              <th className="p-2 text-left">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#00ffa3]" />
                  Calendar week
                </div>
              </th>
              <th className="p-2 text-left">
                <div className="flex items-center gap-1">
                  <LineChart className="w-3.5 h-3.5 text-[#00ffa3]" />
                  Trading week
                </div>
              </th>
              {accounts.map((a) => (
                <th key={`h-${a.id}-dep`} className="p-2 text-left">
                  <div className="flex items-center gap-1">
                    <PiggyBank className="w-3.5 h-3.5 text-[#00ffa3]" />
                    {a.name} Deposit
                  </div>
                </th>
              ))}
              {accounts.map((a) => (
                <th key={`h-${a.id}-pnl$`} className="p-2 text-left">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#00ffa3]" />
                    {a.name} PnL, $
                  </div>
                </th>
              ))}
              {accounts.map((a) => (
                <th key={`h-${a.id}-pnl%`} className="p-2 text-left">
                  <div className="flex items-center gap-1">
                    <BadgePercent className="w-3.5 h-3.5 text-[#00ffa3]" />
                    {a.name} PnL, %
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {realRows.map((r) => (
              <tr
                key={r.tradingWeek}
                className={r.tradingWeek % 2 ? "bg-[#0f172a]/40" : "bg-[#0f172a]/20"}
              >
                <td className="p-2 text-gray-200">{r.calendar}</td>
                <td className="p-2 text-gray-200">Week {r.tradingWeek}</td>

                {r.accounts.map((a) => (
                  <td key={`d-${r.tradingWeek}-${a.id}`} className="p-2 text-gray-300">
                    {a.deposit === ""
                      ? ""
                      : a.deposit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                  </td>
                ))}
                {r.accounts.map((a) => (
                  <td
                    key={`p-${r.tradingWeek}-${a.id}`}
                    className={`p-2 ${
                      a.pnlDollar === ""
                        ? "text-gray-300"
                        : Number(a.pnlDollar) >= 0
                        ? "text-[#10b981]"
                        : "text-[#ef4444]"
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
                  <td key={`pp-${r.tradingWeek}-${a.id}`} className="p-2 text-gray-300">
                    {a.pnlPct}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-[11px] text-gray-400 mt-2">
          * Rows appear from the selected account’s first trade week, limited to{" "}
          {includeCurrentWeek ? "the current week inclusive" : "completed weeks only"}. Deposit =
          first trade’s deposit of that ISO week; PnL, $ = sum of that week’s trades; PnL, % =
          PnL / Deposit.
        </p>
      </div>
    </div>
  );
}
