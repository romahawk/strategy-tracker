import React, { useState } from "react";

export default function TradeTable({ trades, onEdit, onDelete, onViewChart }) {
  if (!trades.length) return <p className="text-gray-300 italic text-center py-4">No trades yet.</p>;

  // State for pagination and expanded rows
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});

  const rowsPerPage = 10;
  const totalPages = Math.ceil(trades.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedTrades = trades.slice(startIndex, endIndex);

  // More data toggle per row
  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl shadow-md mb-6 w-full">
      <div className="relative bg-[#1e293b] rounded-xl shadow-lg overflow-x-auto w-full">
        <table className="table-auto w-full text-xs" style={{ tableLayout: "fixed" }}>
          <thead className="sticky top-0 bg-[#0f172a] text-left border-b border-gray-600 z-10">
            {/* Section Headers */}
            <tr>
              <th className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-11" style={{ minWidth: "40px" }}>
                #
              </th>
              <th colSpan="5" className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#3b82f6]">
                Basic Info
              </th>
              <th colSpan="6" className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#ef4444]">
                Risk
              </th>
              <th colSpan="10" className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#10b981]">
                Take Profit
              </th>
              <th colSpan="5" className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#7f5af0]">
                Results
              </th>
            </tr>
            {/* Column Headers */}
            <tr>
              <th className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-11" style={{ minWidth: "40px" }}></th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "80px" }}>Date</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>Time</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "80px" }}>Pair</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "50px" }}>Dir</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>Depo $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>Entry</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>SL</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>SL %</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>SL $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>Risk %</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>Risk $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>TPs Hit</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP1</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP1 %</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP1 $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP2</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP2 %</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP2 $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP3</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP3 %</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px" }}>TP3 $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>Result</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>Comm $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px" }}>PnL $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "90px" }}>Next Depo $</th>
              <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "100px" }}>Actions</th>
            </tr>
          </thead>
          <tbody className="max-h-[60vh] overflow-y-auto">
            {paginatedTrades.map((trade, index) => (
              <React.Fragment key={trade.id}>
                <tr
                  className={`border-b border-gray-600 transition-all duration-200 ${
                    index % 2 === 0 ? "bg-[#1e293b]/50" : "bg-[#0f172a]/50"
                  }`}
                >
                  <td className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-10" style={{ minWidth: "40px" }}>
                    {startIndex + index + 1}
                  </td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "80px" }}>{trade.date}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "70px" }}>{trade.time}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "80px" }}>{trade.pair}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "50px" }}>{trade.direction}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "70px" }}>{trade.deposit}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "70px" }}>{trade.entry}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>{trade.sl}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>{trade.slPercent}%</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>${trade.slDollar}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "70px" }}>{trade.riskPercent}%</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "70px" }}>${trade.riskDollar}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "70px" }}>{trade.tpsHit} TP(s)</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>{trade.tp1}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>{trade.tp1Percent}%</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>${trade.tp1Dollar}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>{trade.tp2}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>{trade.tp2Percent}%</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>${trade.tp2Dollar}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>{trade.tp3}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>{trade.tp3Percent}%</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "60px" }}>${trade.tp3Dollar}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "70px" }}>{trade.result}</td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "70px" }}>${trade.commission}</td>
                  <td
                    className={`p-2 font-medium ${
                      parseFloat(trade.pnl) >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                    }`}
                    style={{ minWidth: "70px" }}
                  >
                    ${trade.pnl}
                  </td>
                  <td className="p-2 text-gray-300" style={{ minWidth: "90px" }}>{trade.nextDeposit}</td>
                  <td className="p-2 space-x-1" style={{ minWidth: "100px" }}>
                    <button
                      onClick={() => onEdit(trade)}
                      className="px-1 py-0.5 bg-yellow-400 text-xs rounded hover:bg-yellow-500 text-black"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(trade.id)}
                      className="px-1 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => onViewChart(trade)}
                      className="px-1 py-0.5 bg-[#00ffa3] text-xs rounded hover:brightness-110 text-black"
                      title="View Chart"
                    >
                      📈
                    </button>
                  </td>
                </tr>
                {expandedRows[trade.id] && (
                  <tr className="bg-[#0f172a]/70">
                    <td colSpan="25" className="p-2 text-gray-300">
                      <div className="flex flex-wrap gap-2">
                        <span>ST: {trade.stTrend}</span>
                        <span>USDT.D: {trade.usdtTrend}</span>
                        <span>Overlay: {trade.overlay}</span>
                        <span>MA200: {trade.ma200}</span>
                      </div>
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan="25" className="p-1">
                    <button
                      onClick={() => toggleRow(trade.id)}
                      className="w-full text-center text-gray-300 hover:text-[#00ffa3] text-xs"
                    >
                      {expandedRows[trade.id] ? "Hide Details" : "Show More"}
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-2 text-gray-300 w-full">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-[#1e293b] rounded text-sm hover:bg-[#00ffa3] hover:text-black disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-[#1e293b] rounded text-sm hover:bg-[#00ffa3] hover:text-black disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}