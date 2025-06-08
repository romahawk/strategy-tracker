export default function TradeTable({ trades }) {
  if (!trades.length) return <p className="text-gray-500 italic">No trades yet.</p>;

  return (
    <div className="overflow-x-auto mt-6">
      <table className="table-auto w-full text-sm bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            {/* Trade Info */}
            <th className="p-2">#</th>
            <th className="p-2">Date</th>
            <th className="p-2">Time</th>
            <th className="p-2">Pair</th>
            <th className="p-2">Dir</th>
            <th className="p-2">Depo $</th>

            {/* Entry Conditions */}
            <th className="p-2">ST</th>
            <th className="p-2">USDT.D</th>
            <th className="p-2">Overlay</th>
            <th className="p-2">MA200</th>

            {/* Entry/Risk */}
            <th className="p-2">Entry</th>
            <th className="p-2">SL</th>
            <th className="p-2">SL %</th>
            <th className="p-2">SL $</th>
            <th className="p-2">Risk %</th>
            <th className="p-2">Risk $</th>

            {/* TP1–TP3 */}
            <th className="p-2">TP1</th>
            <th className="p-2">TP1 %</th>
            <th className="p-2">TP1 $</th>

            <th className="p-2">TP2</th>
            <th className="p-2">TP2 %</th>
            <th className="p-2">TP2 $</th>

            <th className="p-2">TP3</th>
            <th className="p-2">TP3 %</th>
            <th className="p-2">TP3 $</th>

            {/* Result */}
            <th className="p-2">TPs Hit</th>
            <th className="p-2">Result</th>
            <th className="p-2">Comm $</th>
            <th className="p-2">PnL $</th>
            <th className="p-2">Next Depo $</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={trade.id} className="border-t">
              {/* Trade Info */}
              <td className="p-2 font-semibold">{index + 1}</td>
              <td className="p-2">{trade.date}</td>
              <td className="p-2">{trade.time}</td>
              <td className="p-2">{trade.pair}</td>
              <td className="p-2">{trade.direction}</td>
              <td className="p-2">{trade.deposit}</td>

              {/* Entry Conditions */}
              <td className="p-2">{trade.stTrend}</td>
              <td className="p-2">{trade.usdtTrend}</td>
              <td className="p-2">{trade.overlay}</td>
              <td className="p-2">{trade.ma200}</td>

              {/* Entry/Risk */}
              <td className="p-2">{trade.entry}</td>
              <td className="p-2">{trade.sl}</td>
              <td className="p-2">{trade.slPercent}%</td>
              <td className="p-2">${trade.slDollar}</td>
              <td className="p-2">{trade.riskPercent}%</td>
              <td className="p-2">${trade.riskDollar}</td>

              {/* TP1 */}
              <td className="p-2">{trade.tp1}</td>
              <td className="p-2">{trade.tp1Percent}%</td>
              <td className="p-2">${trade.tp1Dollar}</td>

              {/* TP2 */}
              <td className="p-2">{trade.tp2}</td>
              <td className="p-2">{trade.tp2Percent}%</td>
              <td className="p-2">${trade.tp2Dollar}</td>

              {/* TP3 */}
              <td className="p-2">{trade.tp3}</td>
              <td className="p-2">{trade.tp3Percent}%</td>
              <td className="p-2">${trade.tp3Dollar}</td>

              {/* Result */}
              <td className="p-2">{trade.tpsHit} TP(s)</td>
              <td className="p-2">{trade.result}</td>
              <td className="p-2">${trade.commission}</td>
              <td className="p-2 font-medium text-green-600">{trade.pnl}</td>
              <td className="p-2">{trade.nextDeposit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
