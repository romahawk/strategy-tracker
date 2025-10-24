import React, { useState, useEffect, useMemo } from "react";
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

  // ---------- bulletproof parser ----------
  const parseDateTimeToEpoch = (dateStr, timeStr) => {
    if (!dateStr || typeof dateStr !== "string") return 0;
    const s = dateStr.replace(/\//g, "-").trim();

    // YYYY-MM-DD
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [_, y, mo, d] = m;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    // DD-MM-YYYY
    m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m) {
      const [_, d, mo, y] = m;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    // DD-MM-YY -> 20YY
    m = s.match(/^(\d{2})-(\d{2})-(\d{2})$/);
    if (m) {
      const [_, d, mo, yy] = m;
      const y = 2000 + +yy;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    return 0;
  };

  const safeOpenedAtMs = (t) => {
    // Prefer stored canonical epoch
    if (typeof t?.openedAtMs === "number" && t.openedAtMs > 0) return t.openedAtMs;
    // Backfill from date/time (supports legacy formats)
    const ms = parseDateTimeToEpoch(t?.date, t?.time);
    if (ms > 0) return ms;
    // Last resort: createdAtMs/id
    if (typeof t?.createdAtMs === "number" && t.createdAtMs > 0) return t.createdAtMs;
    return 0;
  };

  // ---------- ALWAYS sort BEFORE using trades ----------
  const sortedTrades = useMemo(() => {
    const copy = Array.isArray(trades) ? [...trades] : [];
    copy.sort((a, b) => {
      const A = safeOpenedAtMs(a);
      const B = safeOpenedAtMs(b);
      if (A !== B) return A - B;

      // tie-breakers for deterministic order
      const ca = typeof a.createdAtMs === "number" ? a.createdAtMs : 0;
      const cb = typeof b.createdAtMs === "number" ? b.createdAtMs : 0;
      if (ca !== cb) return ca - cb;

      const idA = typeof a.id === "number" ? a.id : Number(a.id) || 0;
      const idB = typeof b.id === "number" ? b.id : Number(b.id) || 0;
      if (idA !== idB) return idA - idB;

      const sa = `${a?.pair ?? ""}${a?.direction ?? ""}`;
      const sb = `${b?.pair ?? ""}${b?.direction ?? ""}`;
      return sa.localeCompare(sb);
    });
    return copy;
  }, [trades]);

  const totalPages = Math.ceil(sortedTrades.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTrades = sortedTrades.slice(startIndex, endIndex);

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

  // ---- display helpers / normalization ----
  const n = (v, d = 0) => Number(v ?? d);
  const fx = (v, d = 2) => Number(n(v).toFixed(d));

  const normalizeTrade = (trade) => {
    const deposit = n(trade.deposit);
    const commission = Math.abs(n(trade.commission));
    let riskDollar =
      trade.riskDollar !== undefined
        ? n(trade.riskDollar)
        : -(deposit * n(trade.riskPercent) / 100);
    if (riskDollar > 0) riskDollar = -Math.abs(riskDollar);

    let slDollar = trade.slDollar !== undefined ? n(trade.slDollar) : riskDollar;
    if (slDollar > 0) slDollar = -Math.abs(slDollar);

    let slPercent = trade.slPercent !== undefined ? n(trade.slPercent) : undefined;
    if (slPercent !== undefined && slPercent > 0) {
      slPercent = -Math.abs(slPercent);
    }

    let pnl = n(trade.pnl);
    if (String(trade.result).toLowerCase() === "loss") {
      const expected = riskDollar - commission;
      if (pnl >= 0 || Math.abs(pnl - expected) > 0.01) {
        pnl = expected;
      }
    }

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

  const totalCols = 26;
  const basicInfoColspan = 5;

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const s = dateString.replace(/\//g, "-");
    if (/^\d{2}-\d{2}-\d{2,4}$/.test(s)) return s;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [_, y, mo, d] = m;
      return `${d}-${mo}-${String(y).slice(-2)}`;
    }
    return s;
  };

  // ---- light local backup of the *sorted* list ----
  useEffect(() => {
    if (sortedTrades.length > 0) {
      try {
        const backups = JSON.parse(localStorage.getItem("tradeBackups") || "[]");
        backups.push({ trades: sortedTrades, timestamp: new Date().toISOString() });
        if (backups.length > 10) backups.shift();
        localStorage.setItem("tradeBackups", JSON.stringify(backups));
      } catch {
        /* ignore backup errors */
      }
    }
  }, [sortedTrades]);

  const exportBackup = () => {
    try {
      const dataStr = JSON.stringify(sortedTrades, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trades_strategy${sid}_account${aid}_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Failed to download backup");
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
          throw new Error("Backup must contain an array of trades");
        }
        for (const [index, t] of importedTrades.entries()) {
          if (!t.id) throw new Error(`Trade #${index} missing 'id'`);
          if (!t.date) throw new Error(`Trade #${index} missing 'date'`);
          // ensure canonical timestamps exist
          const ms = parseDateTimeToEpoch(t.date, t.time);
          if (ms > 0) t.openedAtMs = ms;
          if (typeof t.createdAtMs !== "number") t.createdAtMs = Date.now();
        }
        onUpdateTrades(importedTrades);
        toast.success("Backup imported");
      } catch (err) {
        toast.error(`Import failed: ${err.message}`);
      }
    };
    reader.onerror = () => toast.error("Error reading backup file");
    reader.readAsText(file);
  };

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl shadow-md mb-6 w-full">
      {sortedTrades.length === 0 ? (
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
                <th colSpan={basicInfoColspan} className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#3b82f6]">
                  Basic Info
                </th>
                <th colSpan={6} className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#ef4444]">
                  Risk
                </th>
                <th colSpan={10} className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#10b981]">
                  Take Profit
                </th>
                <th colSpan={4} className="p-2 font-semibold text-gray-300 bg-gradient-to-r from-[#1e293b] to-[#7f5af0]">
                  Results
                </th>
              </tr>
              <tr>
                <th className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-11" style={{ minWidth: "40px", width: "40px" }} />
                {/* Basic info */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "100px", width: "100px" }}>Date</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Time</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "140px", width: "140px" }}>Pair</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "50px", width: "50px" }}>Dir</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Depo $</th>

                {/* Risk */}
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>Entry</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "45px", width: "45px" }}>SL</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px", width: "60px" }}>SL %</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "60px", width: "60px" }}>SL $</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Risk %</th>
                <th className="p-2 font-semibold text-gray-300" style={{ minWidth: "70px", width: "70px" }}>Risk $</th>

                {/* TPs */}
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
              </tr>
            </thead>

            <tbody className="max-h-[60vh] overflow-y-auto">
              {paginatedTrades.map((trade, index) => {
                const t = normalizeTrade(trade);
                return (
                  <React.Fragment key={t.id}>
                    {/* MAIN ROW */}
                    <tr
                      className={`border-b border-gray-600 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-[#1e293b]/50" : "bg-[#0f172a]/50"
                      }`}
                    >
                      <td className="p-2 font-semibold text-gray-300 sticky left-0 bg-inherit z-10" style={{ minWidth: "40px", width: "40px" }}>
                        {startIndex + index + 1}
                      </td>

                      {/* Basic info */}
                      <td className="p-2 text-gray-300" style={{ minWidth: "100px", width: "100px" }}>
                        {formatDate(t.date)}
                      </td>
                      <td className="p-2 text-gray-300" style={{ minWidth: "70px", width: "70px" }}>
                        {t.time}
                      </td>
                      <td className="p-2 text-gray-300 truncate" style={{ minWidth: "140px", width: "140px" }} title={t.pair}>
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
                        {t.tpsHit === "OPEN" ? "Not closed yet" : `${t.tpsHit} TP(s)`}
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
                        className={`p-2 font-medium ${parseFloat(t.pnl) >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}
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
