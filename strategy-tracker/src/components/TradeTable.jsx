import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function TradeTable({
  trades,
  onEdit,
  onDelete,
  onViewChart,
  onUpdateTrades,
  strategyId, // <-- pass from App.jsx
  accountId
}) {
  const sid = Number(strategyId) || 1; // normalize once
  const aid = Number(accountId) || 1;
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});

  const rowsPerPage = 10;
  const totalPages = Math.ceil(trades.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedTrades = trades.slice(startIndex, endIndex);

  // ---- dynamic table layout helpers ----
  const baseCols = 27; // columns with Strategy 1 (default)
  const extraS2Cols = sid === 2 ? 4 : 0; // Strategy 2 extra columns
  const totalCols = baseCols + extraS2Cols;

  const basicInfoBase = 5; // Date, Time, Pair, Dir, Depo
  const basicInfoColspan = basicInfoBase + extraS2Cols;

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    if (trades.length > 0) {
      try {
        const backups = JSON.parse(localStorage.getItem("tradeBackups") || "[]");
        backups.push({ trades, timestamp: new Date().toISOString() });
        if (backups.length > 10) backups.shift();
        localStorage.setItem("tradeBackups", JSON.stringify(backups));
        toast.success("Backup saved to local storage", { autoClose: 2000 });
      } catch (error) {
        console.error("Backup save error:", error);
        toast.error("Failed to save backup to local storage", { autoClose: 3000 });
      }
    }
  }, [trades]);

  const exportBackup = () => {
    try {
      const dataStr = JSON.stringify(trades, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      llink.download = `trades_strategy${sid}_account${aid}_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded successfully", { autoClose: 2000 });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to download backup", { autoClose: 3000 });
    }
  };

  const importBackup = (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log("No file selected for import");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTrades = JSON.parse(e.target.result);

        if (!Array.isArray(importedTrades)) {
          throw new Error("Backup file must contain an array of trades");
        }

        for (const [index, trade] of importedTrades.entries()) {
          if (!trade.id) throw new Error(`Trade at index ${index} missing 'id' field`);
          if (!trade.date) throw new Error(`Trade at index ${index} missing 'date' field`);
          if (trade.pair === undefined) throw new Error(`Trade at index ${index} missing 'pair' field`);
          if (typeof trade.id !== "string" && typeof trade.id !== "number") {
            throw new Error(`Trade at index ${index} has invalid 'id' type: ${typeof trade.id}`);
          }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(trade.date)) {
            throw new Error(`Trade at index ${index} has invalid 'date' format: ${trade.date}`);
          }
        }

        onUpdateTrades(importedTrades);
        toast.success("Backup imported successfully", { autoClose: 2000 });
      } catch (error) {
        console.error("Import error:", error.message, error.stack);
        toast.error(`Failed to import backup: ${error.message}`, { autoClose: 5000 });
      }
    };
    reader.onerror = () => {
      console.error("File reading error");
      toast.error("Error reading backup file", { autoClose: 5000 });
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl shadow-md mb-6 w-full">
      {trades.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-300 italic mb-4">No trades yet.</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={exportBackup}
              className="px-2 py-1 bg-[#10b981] text-white text-sm rounded hover:brightness-110"
            >
              Download Backup
            </button>
            <label className="px-2 py-1 bg-[#1e293b] text-white text-sm rounded hover:bg-[#00ffa3] hover:text-black cursor-pointer">
              Import Backup
              <input
                type="file"
                accept=".json"
                onChange={importBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="relative bg-[#1e293b] rounded-xl shadow-lg w-full">
          <table
            className="table-auto w-full text-xs"
            style={{ tableLayout: "fixed" }}
            key={new Date().getTime()}
          >
            <thead className="sticky top-0 bg-[#0f172a] text-left border-b border-gray-600 z-10">
              <tr>
                <th
                  className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-11"
                  style={{ minWidth: "40px", width: "40px" }}
                >
                  #
                </th>
                <th
                  colSpan={basicInfoColspan}
                  className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#3b82f6]"
                >
                  Basic Info
                </th>
                <th
                  colSpan="6"
                  className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#ef4444]"
                >
                  Risk
                </th>
                <th
                  colSpan="10"
                  className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#10b981]"
                >
                  Take Profit
                </th>
                <th
                  colSpan="5"
                  className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#7f5af0]"
                >
                  Results
                </th>
              </tr>
              <tr>
                <th
                  className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-11"
                  style={{ minWidth: "40px", width: "40px" }}
                ></th>
                {/* Basic info (base 5) */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "100px", width: "100px" }}>Date</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Time</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "140px", width: "140px" }}>Pair</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "50px", width: "50px" }}>Dir</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Depo $</th>

                {/* Strategy 2 extra basic info */}
                {sid === 2 && (
                  <>
                    <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "120px", width: "120px" }}>
                      15m CHoCH/BoS
                    </th>
                    <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "90px", width: "90px" }}>
                      1m Overlay
                    </th>
                    <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "110px", width: "110px" }}>
                      1m BoS
                    </th>
                    <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "110px", width: "110px" }}>
                      1m MA200
                    </th>
                  </>
                )}

                {/* Risk */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>Entry</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>SL</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px", width: "60px" }}>SL %</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px", width: "60px" }}>SL $</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Risk %</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Risk $</th>

                {/* Take Profits */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TPs Hit</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP1</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP1 %</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP1 $</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP2</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP2 %</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP2 $</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP3</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP3 %</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>TP3 $</th>

                {/* Results */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Result</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Comm $</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>PnL $</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "90px", width: "90px" }}>Next Depo $</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "100px", width: "100px" }}>Actions</th>
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
                    <td
                      className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-10"
                      style={{ minWidth: "40px", width: "40px" }}
                    >
                      {startIndex + index + 1}
                    </td>

                    {/* Basic info */}
                    <td className="p-2 text-gray-300" style={{ minWidth: "100px", width: "100px" }}>
                      {formatDate(trade.date)}
                    </td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>{trade.time}</td>
                    <td
                      className="p-2 text-gray-300 truncate"
                      style={{ minWidth: "140px", width: "140px" }}
                      title={trade.pair}
                    >
                      {trade.pair}
                    </td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "50px", width: "50px" }}>{trade.direction}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>{trade.deposit}</td>

                    {/* Strategy 2 extra columns */}
                    {sid === 2 && (
                      <>
                        <td className="p-2 text-gray-300" style={{ minWidth: "120px", width: "120px" }}>
                          {trade.chochBos15m || "-"}
                        </td>
                        <td className="p-2 text-gray-300" style={{ minWidth: "90px", width: "90px" }}>
                          {trade.overlay1m || "-"}
                        </td>
                        <td className="p-2 text-gray-300" style={{ minWidth: "110px", width: "110px" }}>
                          {trade.bos1m || "-"}
                        </td>
                        <td className="p-2 text-gray-300" style={{ minWidth: "110px", width: "110px" }}>
                          {trade.ma2001m || "-"}
                        </td>
                      </>
                    )}

                    {/* Risk */}
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.entry}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.sl}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "60px", width: "60px" }}>{trade.slPercent}%</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "60px", width: "60px" }}>${trade.slDollar}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>{trade.riskPercent}%</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>${trade.riskDollar}</td>

                    {/* TPs */}
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.tpsHit} TP(s)</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.tp1}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.tp1Percent}%</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>${trade.tp1Dollar}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.tp2}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.tp2Percent}%</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>${trade.tp2Dollar}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.tp3}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>{trade.tp3Percent}%</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>${trade.tp3Dollar}</td>

                    {/* Results */}
                    <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>{trade.result}</td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>${trade.commission}</td>
                    <td
                      className={`p-2 font-medium ${
                        parseFloat(trade.pnl) >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                      }`}
                      style={{ minWidth: "70px", width: "70px" }}
                    >
                      ${trade.pnl}
                    </td>
                    <td className="p-2 text-gray-300" style={{ minWidth: "90px", width: "90px" }}>{trade.nextDeposit}</td>
                    <td className="p-2 space-x-1 flex">
                      <button
                        onClick={() => onEdit(trade)}
                        className="px-1 py-0.5 bg-yellow-400 text-black text-xs rounded hover:bg-yellow-500"
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
                        className="px-1 py-0.5 bg-[#00ffa3] text-black text-xs rounded hover:brightness-110"
                        title="View Chart"
                      >
                        📈
                      </button>
                    </td>
                  </tr>

                  {expandedRows[trade.id] && (
                    <tr className="bg-[#0f172a]/70">
                      <td colSpan={totalCols} className="p-2 text-gray-300">
                        <div className="flex flex-wrap gap-2">
                          <span>ST: {trade.stTrend}</span>
                          <span>USDT.D: {trade.usdtTrend}</span>
                          <span>Overlay: {trade.overlay}</span>
                          <span>MA200: {trade.ma200}</span>

                          {sid === 2 && (
                            <>
                              <span>15m CHoCH/BoS: {trade.chochBos15m || "-"}</span>
                              <span>1m Overlay: {trade.overlay1m || "-"}</span>
                              <span>1m BoS: {trade.bos1m || "-"}</span>
                              <span>1m MA200: {trade.ma2001m || "-"}</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td colSpan={totalCols} className="p-1">
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

          {totalPages > 0 && (
            <div className="flex justify-between items-center p-2 text-gray-300 w-full">
              <div className="flex space-x-2">
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
              <div className="flex space-x-2">
                <button
                  onClick={exportBackup}
                  className="px-2 py-1 bg-[#10b981] text-white text-sm rounded hover:brightness-110"
                >
                  Download Backup
                </button>
                <label className="px-2 py-1 bg-[#1e293b] text-white text-sm rounded hover:bg-[#00ffa3] hover:text-black cursor-pointer">
                  Import Backup
                  <input
                    type="file"
                    accept=".json"
                    onChange={importBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
