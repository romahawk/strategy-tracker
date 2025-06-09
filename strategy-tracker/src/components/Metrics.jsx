export default function Metrics({ trades }) {
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-100 p-4 rounded shadow mb-6">
      <div>
        <div className="text-sm text-gray-500">📊 Total Trades</div>
        <div className="text-lg font-semibold">{total}</div>
      </div>
      <div>
        <div className="text-sm text-gray-500">✅ Win Rate</div>
        <div className="text-lg font-semibold">{winRate}%</div>
      </div>
      <div>
        <div className="text-sm text-gray-500">📈 Avg RR</div>
        <div className="text-lg font-semibold">{avgRR}</div>
      </div>
      <div>
        <div className="text-sm text-gray-500">💰 Net PnL</div>
        <div className={`text-lg font-semibold ${netPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
          {netPnL >= 0 ? "+" : ""}${netPnL}
        </div>
      </div>
    </div>
  );
}
