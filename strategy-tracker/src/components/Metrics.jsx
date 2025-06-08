export default function Metrics({ trades }) {
  if (!trades.length) return null;

  const total = trades.length;
  const wins = trades.filter((t) => t.result === "Win").length;
  const avgRR = (
    trades.reduce((sum, t) => sum + parseFloat(t.rr || 0), 0) / total
  ).toFixed(2);
  const winRate = ((wins / total) * 100).toFixed(1);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Stats</h2>
      <p>📊 Total Trades: {total}</p>
      <p>✅ Win Rate: {winRate}%</p>
      <p>⚖️ Avg. RR: {avgRR}</p>
    </div>
  );
}
