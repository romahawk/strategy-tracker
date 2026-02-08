import React from "react";
import {
  BarChart3,
  Trophy,
  Target,
  DollarSign,
} from "lucide-react";

export default function Metrics({ trades }) {
  // basic calcs
  const total = trades.length;
  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const winRate = total ? ((wins / total) * 100).toFixed(1) : "0.0";

  // avg RR from profitable trades
  const rrList = trades
    .map((t) => {
      const pnl = parseFloat(t.pnl);
      const risk = Math.abs(parseFloat(t.riskDollar));
      const rr = pnl > 0 && risk > 0 ? pnl / risk : 0;
      return rr;
    })
    .filter((rr) => rr > 0);
  const avgRR = rrList.length
    ? (rrList.reduce((sum, r) => sum + r, 0) / rrList.length).toFixed(2)
    : "0.00";

  // net pnl
  const netPnL = trades
    .map((t) => parseFloat(t.pnl) || 0)
    .reduce((sum, p) => sum + p, 0)
    .toFixed(2);

  // expectancy (rough): (winRate * avgWin - lossRate * avgLoss)
  const winsPnL = trades
    .filter((t) => t.result === "Win")
    .map((t) => parseFloat(t.pnl) || 0);
  const lossesPnL = trades
    .filter((t) => t.result === "Loss")
    .map((t) => Math.abs(parseFloat(t.pnl) || 0));

  const avgWin = winsPnL.length
    ? (winsPnL.reduce((a, b) => a + b, 0) / winsPnL.length).toFixed(2)
    : "0.00";
  const avgLoss = lossesPnL.length
    ? (lossesPnL.reduce((a, b) => a + b, 0) / lossesPnL.length).toFixed(2)
    : "0.00";

  // display cards
  return (
    <div className="bg-th-raised border border-th-border-dim rounded-2xl p-4 space-y-4">
      {/* header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-emerald-400" />
        <h2 className="text-sm font-semibold text-th-text">KPIs</h2>
        <span className="text-[11px] text-th-text-muted">
          {total} trades analysed
        </span>
      </div>

      {/* cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total trades */}
        <div className="bg-th-inset border border-th-border-dim rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-th-text-muted uppercase tracking-wide">
              Total trades
            </span>
            <BarChart3 className="w-4 h-4 text-th-text-dim" />
          </div>
          <div className="text-2xl font-semibold text-th-text">{total}</div>
          <div className="text-[10px] text-th-text-muted">
            Wins: {wins} • Losses: {losses}
          </div>
        </div>

        {/* Win rate */}
        <div className="bg-th-inset border border-th-border-dim rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-th-text-muted uppercase tracking-wide">
              Win rate
            </span>
            <Trophy className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="text-2xl font-semibold text-emerald-400">
            {winRate}%
          </div>
          <div className="text-[10px] text-th-text-muted">
            {wins} wins / {total || 1} total
          </div>
        </div>

        {/* Avg R:R */}
        <div className="bg-th-inset border border-th-border-dim rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-th-text-muted uppercase tracking-wide">
              Avg R:R
            </span>
            <Target className="w-4 h-4 text-sky-300" />
          </div>
          <div className="text-2xl font-semibold text-th-text">{avgRR}</div>
          <div className="text-[10px] text-th-text-muted">
            From profitable trades only
          </div>
        </div>

        {/* Net PnL */}
        <div className="bg-th-inset border border-th-border-dim rounded-xl p-4 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-th-text-muted uppercase tracking-wide">
              Net PnL
            </span>
            <DollarSign className="w-4 h-4 text-amber-200" />
          </div>
          <div
            className={`text-2xl font-semibold ${
              parseFloat(netPnL) >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {parseFloat(netPnL) >= 0 ? "+" : "-"}$
            {Math.abs(parseFloat(netPnL)).toFixed(2)}
          </div>
          <div className="text-[10px] text-th-text-muted">
            Gross of current dataset
          </div>
        </div>
      </div>

      {/* secondary row (optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-th-surface border border-th-border-dim rounded-xl p-3">
          <div className="text-[11px] text-th-text-muted mb-1">Avg win ($)</div>
          <div className="text-lg text-th-text font-semibold">${avgWin}</div>
        </div>
        <div className="bg-th-surface border border-th-border-dim rounded-xl p-3">
          <div className="text-[11px] text-th-text-muted mb-1">Avg loss ($)</div>
          <div className="text-lg text-rose-300 font-semibold">-${avgLoss}</div>
        </div>
        <div className="bg-th-surface border border-th-border-dim rounded-xl p-3">
          <div className="text-[11px] text-th-text-muted mb-1">
            Profit factor (quick)
          </div>
          <div className="text-lg text-th-text font-semibold">
            {winsPnL.length
              ? (
                  winsPnL.reduce((a, b) => a + b, 0) /
                  (lossesPnL.reduce((a, b) => a + b, 0) || 1)
                ).toFixed(2)
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
