export default function TradeTable({ trades, onEdit, onDelete, onViewChart }) {
  if (!trades.length) return <p className="text-gray-300 italic text-center py-4">No trades yet.</p>;

  return (
    <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg mb-6 overflow-x-auto">
      <div className="bg-[#1e293b] text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
        <table className="table-auto w-full text-sm">
          <thead>
            <tr className="bg-[#0f172a] text-left border-b border-gray-600">
              <th className="p-3 font-semibold text-gray-300">#</th>
              <th className="p-3 font-semibold text-gray-300">Date</th>
              <th className="p-3 font-semibold text-gray-300">Time</th>
              <th className="p-3 font-semibold text-gray-300">Pair</th>
              <th className="p-3 font-semibold text-gray-300">Dir</th>
              <th className="p-3 font-semibold text-gray-300">Depo $</th>
              <th className="p-3 font-semibold text-gray-300">ST</th>
              <th className="p-3 font-semibold text-gray-300">USDT.D</th>
              <th className="p-3 font-semibold text-gray-300">Overlay</th>
              <th className="p-3 font-semibold text-gray-300">MA200</th>
              <th className="p-3 font-semibold text-gray-300">Entry</th>
              <th className="p-3 font-semibold text-gray-300">SL</th>
              <th className="p-3 font-semibold text-gray-300">SL %</th>
              <th className="p-3 font-semibold text-gray-300">SL $</th>
              <th className="p-3 font-semibold text-gray-300">Risk %</th>
              <th className="p-3 font-semibold text-gray-300">Risk $</th>
              <th className="p-3 font-semibold text-gray-300">TP1</th>
              <th className="p-3 font-semibold text-gray-300">TP1 %</th>
              <th className="p-3 font-semibold text-gray-300">TP1 $</th>
              <th className="p-3 font-semibold text-gray-300">TP2</th>
              <th className="p-3 font-semibold text-gray-300">TP2 %</th>
              <th className="p-3 font-semibold text-gray-300">TP2 $</th>
              <th className="p-3 font-semibold text-gray-300">TP3</th>
              <th className="p-3 font-semibold text-gray-300">TP3 %</th>
              <th className="p-3 font-semibold text-gray-300">TP3 $</th>
              <th className="p-3 font-semibold text-gray-300">TPs Hit</th>
              <th className="p-3 font-semibold text-gray-300">Result</th>
              <th className="p-3 font-semibold text-gray-300">Comm $</th>
              <th className="p-3 font-semibold text-gray-300">PnL $</th>
              <th className="p-3 font-semibold text-gray-300">Next Depo $</th>
              <th className="p-3 font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <tr key={trade.id} className="border-b border-gray-600 hover:bg-[#1e293b]/50 transition-all duration-200">
                <td className="p-3 font-semibold text-gray-300">{index + 1}</td>
                <td className="p-3 text-gray-300">{trade.date}</td>
                <td className="p-3 text-gray-300">{trade.time}</td>
                <td className="p-3 text-gray-300">{trade.pair}</td>
                <td className="p-3 text-gray-300">{trade.direction}</td>
                <td className="p-3 text-gray-300">{trade.deposit}</td>
                <td className="p-3 text-gray-300">{trade.stTrend}</td>
                <td className="p-3 text-gray-300">{trade.usdtTrend}</td>
                <td className="p-3 text-gray-300">{trade.overlay}</td>
                <td className="p-3 text-gray-300">{trade.ma200}</td>
                <td className="p-3 text-gray-300">{trade.entry}</td>
                <td className="p-3 text-gray-300">{trade.sl}</td>
                <td className="p-3 text-gray-300">{trade.slPercent}%</td>
                <td className="p-3 text-gray-300">${trade.slDollar}</td>
                <td className="p-3 text-gray-300">{trade.riskPercent}%</td>
                <td className="p-3 text-gray-300">${trade.riskDollar}</td>
                <td className="p-3 text-gray-300">{trade.tp1}</td>
                <td className="p-3 text-gray-300">{trade.tp1Percent}%</td>
                <td className="p-3 text-gray-300">${trade.tp1Dollar}</td>
                <td className="p-3 text-gray-300">{trade.tp2}</td>
                <td className="p-3 text-gray-300">{trade.tp2Percent}%</td>
                <td className="p-3 text-gray-300">${trade.tp2Dollar}</td>
                <td className="p-3 text-gray-300">{trade.tp3}</td>
                <td className="p-3 text-gray-300">{trade.tp3Percent}%</td>
                <td className="p-3 text-gray-300">${trade.tp3Dollar}</td>
                <td className="p-3 text-gray-300">{trade.tpsHit} TP(s)</td>
                <td className="p-3 text-gray-300">{trade.result}</td>
                <td className="p-3 text-gray-300">${trade.commission}</td>
                <td className={`p-3 font-medium ${parseFloat(trade.pnl) >= 0 ? "text-[#00ffa3]" : "text-[#7f5af0]"}`}>
                  ${trade.pnl}
                </td>
                <td className="p-3 text-gray-300">{trade.nextDeposit}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => onEdit(trade)}
                    className="px-2 py-1 bg-yellow-400 text-xs rounded hover:bg-yellow-500 text-black"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => onDelete(trade.id)}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    🗑️ Delete
                  </button>
                  <button
                    onClick={() => onViewChart(trade)}
                    className="px-2 py-1 bg-[#00ffa3] text-xs rounded hover:brightness-110 text-black"
                    title="View Chart"
                  >
                    📈
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}