import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Pencil,
  Trash2,
  LineChart,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function TradeTable({
  trades,
  onEdit,
  onDelete,
  onViewChart,
  onUpdateTrades,
  strategyId,
  accountId,
}) {
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});

  const rowsPerPage = 10;
  const totalPages = Math.ceil(trades.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTrades = trades.slice(startIndex, endIndex);

  // ---- helpers for chart links ----
  const isDataImage = (src) => /^data:image\//i.test(src || "");
  const isDirectImageUrl = (src) =>
    /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(src || "");
  const isHttpUrl = (src) => /^https?:\/\//i.test(src || "");

  const handleViewChart = (trade) => {
    const src = trade?.screenshot;
    if (!src) {
      toast.info("No chart attached.");
      return;
    }
    if (isDataImage(src) || isDirectImageUrl(src)) {
      onViewChart(trade);
    } else if (isHttpUrl(src)) {
      window.open(src, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Invalid chart URL.");
    }
  };

  // ---- FIX: normalize money/signs per row before rendering ----
  const n = (v, d = 0) => Number(v ?? d);
  const fx = (v, d = 2) => Number(n(v).toFixed(d));

  const normalizeTrade = (trade) => {
    const deposit = n(trade.deposit);
    const commission = Math.abs(n(trade.commission)); // cost, shown positive

    // Risk $ should be a negative cost
    let riskDollar =
      trade.riskDollar !== undefined
        ? n(trade.riskDollar)
        : -(deposit * n(trade.riskPercent) / 100);

    if (riskDollar > 0) riskDollar = -Math.abs(riskDollar);

    // SL $ should mirror risk side (negative cost if expressed in $)
    let slDollar =
      trade.slDollar !== undefined ? n(trade.slDollar) : riskDollar;
    if (slDollar > 0) slDollar = -Math.abs(slDollar);

    // SL % should be negative for a stop-loss distance (optional)
    let slPercent =
      trade.slPercent !== undefined ? n(trade.slPercent) : undefined;
    if (slPercent !== undefined && slPercent > 0) {
      slPercent = -Math.abs(slPercent);
    }

    // PnL recompute for losses if needed
    let pnl = n(trade.pnl);
    if (String(trade.result).toLowerCase() === "loss") {
      const expected = riskDollar - commission; // negative
      // if stored pnl looks wrong (>=0 or far from expected), fix it
      if (pnl >= 0 || Math.abs(pnl - expected) > 0.01) {
        pnl = expected;
      }
    }

    // Next deposit consistency
    let nextDeposit =
      trade.nextDeposit !== undefined ? n(trade.nextDeposit) : deposit + pnl;
    if (Math.abs(nextDeposit - (deposit + pnl)) > 0.01) {
      nextDeposit = deposit + pnl;
    }

    return {
      ...trade,
      commission: fx(commission),
      riskDollar: fx(riskDollar),
      slDollar: fx(slDollar),
      slPercent: slPercent !== undefined ? fx(slPercent) : trade.slPercent,
      pnl: fx(pnl),
      nextDeposit: fx(nextDeposit),
    };
  };

  // ---- dynamic table layout helpers ----
  const baseCols = 26;
  const totalCols = baseCols;

  const basicInfoBase = 5;
  const basicInfoColspan = basicInfoBase;

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

  // ---- light local backup ----
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
      link.download = `trades_strategy${sid}_account${aid}_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
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
    if (!file) return;

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
          if (trade.pair === undefined)
            throw new Error(`Trade at index ${index} missing 'pair' field`);
          if (typeof trade.id !== "string" && typeof trade.id !== "number") {
            throw new Error(
              `Trade at index ${index} has invalid 'id' type: ${typeof trade.id}`
            );
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
              className="px-2 py-1 bg-[#10b981] text-white text-sm rounded hover:brightness-110 flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> Download Backup
            </button>
            <label className="px-2 py-1 bg-[#1e293b] text-white text-sm rounded hover:bg-[#00ffa3] hover:text-black cursor-pointer flex items-center gap-1">
              <Upload className="w-4 h-4" /> Import Backup
              <input type="file" accept=".json" onChange={importBackup} className="hidden" />
            </label>
          </div>
        </div>
      ) : (
        <div className="relative bg-[#1e293b] rounded-xl shadow-lg w-full">
          <table className="table-auto w-full text-xs" style={{ tableLayout: "fixed" }}>
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
                  colSpan={6}
                  className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#ef4444]"
                >
                  Risk
                </th>
                <th
                  colSpan={10}
                  className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#10b981]"
                >
                  Take Profit
                </th>
                <th
                  colSpan={4}
                  className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#7f5af0]"
                >
                  Results
                </th>
              </tr>
              <tr>
                <th
                  className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-11"
                  style={{ minWidth: "40px", width: "40px" }}
                />
                {/* Basic info (base 5) */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "100px", width: "100px" }}>
                  Date
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                  Time
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "140px", width: "140px" }}>
                  Pair
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "50px", width: "50px" }}>
                  Dir
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                  Depo $
                </th>

                {/* Risk */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  Entry
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  SL
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px", width: "60px" }}>
                  SL %
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px", width: "60px" }}>
                  SL $
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                  Risk %
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                  Risk $
                </th>

                {/* Take Profits */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TPs Hit
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP1
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP1 %
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP1 $
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP2
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP2 %
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP2 $
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP3
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP3 %
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                  TP3 $
                </th>

                {/* Results */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                  Result
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                  Comm $
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                  PnL $
                </th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "90px", width: "90px" }}>
                  Next Depo $
                </th>
              </tr>
            </thead>

            <tbody className="max-h-[60vh] overflow-y-auto">
              {paginatedTrades.map((trade, index) => {
                const t = normalizeTrade(trade); // <<< use normalized values
                return (
                  <React.Fragment key={t.id}>
                    {/* MAIN ROW */}
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
                        {formatDate(t.date)}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                        {t.time}
                      </td>
                      <td
                        className="p-2 text-gray-300 truncate"
                        style={{ minWidth: "140px", width: "140px" }}
                        title={t.pair}
                      >
                        {t.pair}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "50px", width: "50px" }}>
                        {t.direction}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                        {t.deposit}
                      </td>

                      {/* Risk */}
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.entry}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.sl}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "60px", width: "60px" }}>
                        {t.slPercent}%
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "60px", width: "60px" }}>
                        ${t.slDollar}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                        {t.riskPercent}%
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                        ${t.riskDollar}
                      </td>

                      {/* TPs */}
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.tpsHit} TP(s)
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.tp1}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.tp1Percent}%
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        ${t.tp1Dollar}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.tp2}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.tp2Percent}%
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        ${t.tp2Dollar}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.tp3}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        {t.tp3Percent}%
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "45px", width: "45px" }}>
                        ${t.tp3Dollar}
                      </td>

                      {/* Results */}
                      <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                        {t.result}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                        ${t.commission}
                      </td>
                      <td
                        className={`p-2 font-medium ${
                          parseFloat(t.pnl) >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
                        }`}
                        style={{ minWidth: "70px", width: "70px" }}
                      >
                        ${t.pnl}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "90px", width: "90px" }}>
                        {t.nextDeposit}
                      </td>
                    </tr>

                    {/* EXPANDED ROW */}
                    {expandedRows[t.id] && (
                      <tr className="bg-[#0f172a]/70">
                        <td colSpan={totalCols} className="p-2 text-gray-300">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                              <span>ST: {t.stTrend}</span>
                              <span>USDT.D: {t.usdtTrend}</span>
                              <span>Overlay: {t.overlay}</span>
                              <span>MA200: {t.ma200}</span>
                              {sid === 2 && (
                                <>
                                  <span>15m CHoCH/BoS: {t.chochBos15m || "-"}</span>
                                  <span>1m Overlay: {t.overlay1m || "-"}</span>
                                  <span>1m BoS: {t.bos1m || "-"}</span>
                                  <span>1m MA200: {t.ma2001m || "-"}</span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onEdit(t)}
                                className="px-2 py-1 bg-yellow-400 text-black text-xs rounded hover:bg-yellow-500 flex items-center justify-center"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDelete(t.id)}
                                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 flex items-center justify-center"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleViewChart(t)}
                                className="px-2 py-1 border border-[#00ffa3] text-[#00ffa3] text-xs rounded hover:bg-[#00ffa3] hover:text-black flex items-center justify-center"
                                title="View Chart"
                              >
                                <LineChart className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* TOGGLE ROW */}
                    <tr>
                      <td colSpan={totalCols} className="p-1">
                        <button
                          onClick={() => toggleRow(t.id)}
                          className="w-full text-center text-gray-300 hover:text-[#00ffa3] text-xs flex items-center justify-center gap-1"
                        >
                          {expandedRows[t.id] ? (
                            <>
                              <ChevronUp className="w-4 h-4" /> Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" /> Show More
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Pagination & backup controls */}
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
                  className="px-2 py-1 bg-[#10b981] text-white text-sm rounded hover:brightness-110 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" /> Download Backup
                </button>
                <label className="px-2 py-1 bg-[#1e293b] text-white text-sm rounded hover:bg-[#00ffa3] hover:text-black cursor-pointer flex items-center gap-1">
                  <Upload className="w-4 h-4" /> Import Backup
                  <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
