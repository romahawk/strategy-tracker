import React from 'react';

export default function Metrics({ trades }) {
  // Calculate metrics
  const total = trades.length;
  const wins = trades.filter((t) => t.result === "Win").length;
  const winRate = total ? ((wins / total) * 100).toFixed(1) : "0.0";

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

  const netPnL = trades
    .map((t) => parseFloat(t.pnl) || 0)
    .reduce((sum, p) => sum + p, 0)
    .toFixed(2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-[#0f172a] p-6 rounded-2xl shadow-lg">
      {/* Total Trades Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="text-sm text-gray-300">📊 Total Trades</div>
        <div className="text-2xl font-semibold text-[#00ffa3] mt-2">{total}</div>
      </div>

      {/* Win Rate Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="text-sm text-gray-300">✅ Win Rate</div>
        <div className="text-2xl font-semibold text-[#00ffa3] mt-2">{winRate}%</div>
      </div>

      {/* Avg RR Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="text-sm text-gray-300">📈 Avg RR</div>
        <div className="text-2xl font-semibold text-[#00ffa3] mt-2">{avgRR}</div>
      </div>

      {/* Net PnL Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="text-sm text-gray-300">💰 Net PnL</div>
        <div
          className={`text-2xl font-semibold mt-2 ${netPnL >= 0 ? "text-[#00ffa3]" : "text-[#7f5af0]"}`}
        >
          {netPnL >= 0 ? "+" : ""}${netPnL}
        </div>
      </div>
    </div>
  );
}