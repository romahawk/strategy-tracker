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

/* ---------------- Confluence normalization + evaluation ---------------- */

const norm = (v) => String(v ?? "").trim().toLowerCase();

function expectedOkForKey({ key, value, direction }) {
  const dir = String(direction || "Long");
  const isLong = dir === "Long";
  const k = String(key || "").trim().toLowerCase();
  const v = norm(value);

  // USDT.D: Long => Bear, Short => Bull
  if (k === "usdt.d") return isLong ? v === "bear" : v === "bull";

  // Overlay: Long => Blue, Short => Red
  if (k === "overlay") return isLong ? v === "blue" : v === "red";

  // MA200: Long => Above, Short => Below
  if (k === "ma200") return isLong ? v === "above" : v === "below";

  // 15m ST / ST: Long => Bull, Short => Bear
  if (k === "15m st" || k === "st") return isLong ? v === "bull" : v === "bear";

  // 5m Signal: Long => Buy, Short => Sell
  if (k === "5m signal") return isLong ? v === "buy" : v === "sell";

  // 5m MA200: Long => Above, Short => Below
  if (k === "5m ma200") return isLong ? v === "above" : v === "below";

  // Everything else: treat as informational (not evaluated)
  return true;
}

/**
 * Build a full confluence list from BOTH:
 * - entryConditions[] (if present)
 * - legacy scalar fields (overlay, ma200, usdtTrend, stTrend, buySell5m, ma2005m, TS2/TS4 extras)
 *
 * Output items: { key, value, ok }
 */
function buildConfluences(trade) {
  const direction = trade?.direction || "Long";

  const outMap = new Map();

  const put = (key, value) => {
    if (!key) return;
    const raw = value ?? "";
    if (raw === "" || raw === null || raw === undefined) return;

    const item = {
      key,
      value: String(raw),
      ok: expectedOkForKey({ key, value: raw, direction }),
    };
    outMap.set(String(key), item);
  };

  // 1) existing entryConditions
  if (Array.isArray(trade?.entryConditions)) {
    for (const c of trade.entryConditions) {
      if (!c?.key) continue;
      const value = c.value ?? c.label ?? c.val ?? c.state ?? "";
      // If existing condition has no value, keep as empty string (will be filtered out by put)
      put(c.key, value);
    }
  }

  // 2) legacy common fields (always consider)
  put("USDT.D", trade.usdtTrend);
  put("Overlay", trade.overlay);
  put("MA200", trade.ma200);
  put("15m ST", trade.stTrend); // show as 15m ST label in table

  // 3) legacy 5m fields (TS1 / funded style)
  put("5m Signal", trade.buySell5m);
  put("5m MA200", trade.ma2005m);

  // 4) TS2 extras (only if present on trade — independent of current selected sid)
  put("15m CHoCH/BoS", trade.chochBos15m);
  put("1m ST", trade.st1m);
  put("1m Overlay", trade.overlay1m);
  put("1m MA200", trade.ma2001m);

  // 5) TS4 extras
  put("1m BoS", trade.bos1m);

  // 6) New Entry Rule Builder results (ruleResults)
  if (Array.isArray(trade?.ruleResults)) {
    for (const r of trade.ruleResults) {
      if (!r?.label) continue;
      const key = r.label;
      // Only add if not already covered by legacy fields
      if (!outMap.has(key)) {
        outMap.set(key, { key, value: r.satisfied ? "Yes" : "No", ok: !!r.satisfied });
      }
    }
  }

  // Return list
  return Array.from(outMap.values());
}

function normalizeTrade(trade) {
  return {
    ...trade,
    direction: trade?.direction || "Long",
    entryConditions: Array.isArray(trade?.entryConditions) ? trade.entryConditions : [],
  };
}

/* ---------------- Component ---------------- */

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

  const normalizedTrades = useMemo(
    () => (trades || []).map(normalizeTrade),
    [trades]
  );

  const totalPages = Math.ceil((normalizedTrades.length || 0) / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedTrades = normalizedTrades.slice(startIndex, endIndex);

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

  const fmt = (v, digits = 2) => {
    const x = Number(v);
    if (!Number.isFinite(x)) return "-";
    return x.toFixed(digits);
  };

  const fmtPct = (v, digits = 2) => {
    const x = Number(v);
    if (!Number.isFinite(x)) return "-";
    return `${x.toFixed(digits)}%`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Keep a rolling backup of last 10 states
  useEffect(() => {
    if ((normalizedTrades?.length || 0) > 0) {
      try {
        const backups = JSON.parse(localStorage.getItem("tradeBackups") || "[]");
        backups.push({ trades: normalizedTrades, timestamp: new Date().toISOString() });
        if (backups.length > 10) backups.shift();
        localStorage.setItem("tradeBackups", JSON.stringify(backups));
      } catch (error) {
        console.error("Backup save error:", error);
      }
    }
  }, [normalizedTrades]);

  const exportBackup = () => {
    try {
      const dataStr = JSON.stringify(normalizedTrades || [], null, 2);
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
          if (!trade.id)
            throw new Error(`Trade at index ${index} missing 'id' field`);
          if (!trade.date)
            throw new Error(`Trade at index ${index} missing 'date' field`);
          if (trade.pair === undefined)
            throw new Error(`Trade at index ${index} missing 'pair' field`);
          if (typeof trade.id !== "string" && typeof trade.id !== "number") {
            throw new Error(
              `Trade at index ${index} has invalid 'id' type: ${typeof trade.id}`
            );
          }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(trade.date)) {
            throw new Error(
              `Trade at index ${index} has invalid 'date' format: ${trade.date}`
            );
          }
        }
        onUpdateTrades(importedTrades);
        toast.success("Backup imported successfully", { autoClose: 2000 });
      } catch (error) {
        console.error("Import error:", error.message, error.stack);
        toast.error(`Failed to import backup: ${error.message}`, {
          autoClose: 5000,
        });
      }
    };
    reader.onerror = () => {
      console.error("File reading error");
      toast.error("Error reading backup file", { autoClose: 5000 });
    };
    reader.readAsText(file);
  };

  // Clamp page if data shrinks
  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const totalCols = 26;

  return (
    <div className="bg-th-raised border border-th-border-dim p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,.25)] w-full">
      {!normalizedTrades || normalizedTrades.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-th-text-dim italic mb-4">No trades yet.</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={exportBackup}
              className="h-8 px-4 rounded-full bg-emerald-500 text-white text-xs font-medium hover:brightness-110 flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> Download backup
            </button>
            <label className="h-8 px-4 rounded-full bg-th-overlay text-th-text text-xs font-medium hover:bg-th-surface cursor-pointer flex items-center gap-1">
              <Upload className="w-4 h-4" /> Import backup
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
        <div className="relative rounded-xl overflow-hidden border border-th-border-dim">
          <table className="table-auto w-full text-xs" style={{ tableLayout: "fixed" }}>
            <thead className="sticky top-0 z-10">
              <tr className="text-[11px] uppercase tracking-wide text-th-text">
                <th
                  className="p-2 font-semibold sticky left-0 bg-th-surface z-20"
                  style={{ minWidth: "40px", width: "40px" }}
                >
                  #
                </th>
                <th
                  colSpan={5}
                  className="p-2"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0) 100%)",
                  }}
                >
                  Basic Info
                </th>
                <th
                  colSpan={6}
                  className="p-2 border-l border-th-border"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(248,113,113,0.8) 0%, rgba(248,113,113,0) 100%)",
                  }}
                >
                  Risk
                </th>
                <th
                  colSpan={10}
                  className="p-2 border-l border-th-border"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(16,185,129,0.8) 0%, rgba(16,185,129,0) 100%)",
                  }}
                >
                  Take Profit
                </th>
                <th
                  colSpan={4}
                  className="p-2 border-l border-th-border"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(139,92,246,0.8) 0%, rgba(139,92,246,0) 100%)",
                  }}
                >
                  Results
                </th>
              </tr>

              <tr className="text-th-text-dim/90 text-[11px] bg-th-surface border-b border-th-border-dim">
                <th className="p-2 sticky left-0 bg-th-surface z-20" style={{ minWidth: "40px", width: "40px" }} />
                <th className="p-2" style={{ minWidth: "100px", width: "100px" }}>Date</th>
                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>Time</th>
                <th className="p-2" style={{ minWidth: "140px", width: "140px" }}>Pair</th>
                <th className="p-2" style={{ minWidth: "50px", width: "50px" }}>Dir</th>
                <th className="p-2 border-r border-th-border" style={{ minWidth: "90px", width: "90px" }}>Eq. Before</th>

                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>Entry</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>SL</th>
                <th className="p-2" style={{ minWidth: "60px", width: "60px" }}>SL %</th>
                <th className="p-2" style={{ minWidth: "60px", width: "60px" }}>SL $</th>
                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>Risk %</th>
                <th className="p-2 border-r border-th-border" style={{ minWidth: "70px", width: "70px" }}>Risk $</th>

                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TPs Hit</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TP1</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TP1 %</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TP1 $</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TP2</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TP2 %</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TP2 $</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TP3</th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>TP3 %</th>
                <th className="p-2 border-r border-th-border" style={{ minWidth: "45px", width: "45px" }}>TP3 $</th>

                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>Result</th>
                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>Comm $</th>
                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>PnL $</th>
                <th className="p-2" style={{ minWidth: "90px", width: "90px" }}>Eq. After</th>
              </tr>
            </thead>

            <tbody>
              {paginatedTrades.map((t, index) => {
                const equityBefore = Number.isFinite(Number(t?.equityBefore))
                  ? Number(t.equityBefore)
                  : Number.isFinite(Number(t?.deposit))
                  ? Number(t.deposit)
                  : null;

                const equityAfter = Number.isFinite(Number(t?.nextDeposit))
                  ? Number(t.nextDeposit)
                  : Number.isFinite(Number(t?.equityAfter))
                    ? Number(t.equityAfter)
                    : null;


                const pnlValue = Number.isFinite(Number(t?.pnl))
                  ? Number(t.pnl)
                  : Number.isFinite(Number(t?.netPnl))
                  ? Number(t.netPnl)
                  : null;

                const commissionValue = Number.isFinite(Number(t?.commission))
                  ? Number(t.commission)
                  : null;

                const dirShort = t.direction === "Short" ? "S" : "L";

                const confluences = buildConfluences(t);
                const matching = confluences.filter((c) => c.ok);
                const violated = confluences.filter((c) => !c.ok);

                return (
                  <React.Fragment key={t.id}>
                    <tr
                      className={`border-b border-th-border-dim transition ${
                        index % 2 === 0 ? "bg-th-surface" : "bg-th-surface/50"
                      }`}
                    >
                      <td
                        className="p-2 sticky left-0 bg-inherit z-10 font-medium text-th-text-sub"
                        style={{ minWidth: "40px", width: "40px" }}
                      >
                        {startIndex + index + 1}
                      </td>

                      <td className="p-2 text-th-text-sub">{t.date ? formatDate(t.date) : ""}</td>
                      <td className="p-2 text-th-text-sub">{t.time || ""}</td>
                      <td className="p-2 text-th-text-sub truncate" title={t.pair}>{t.pair || ""}</td>
                      <td className="p-2 text-th-text-sub">{dirShort}</td>

                      <td className="p-2 text-th-text-sub border-r border-th-border">
                        {equityBefore === null ? "-" : fmt(equityBefore, 2)}
                      </td>

                      <td className="p-2 text-th-text-sub">{t.entry ?? ""}</td>
                      <td className="p-2 text-th-text-sub">{t.sl ?? ""}</td>
                      <td className="p-2 text-th-text-sub">
                        {t.slPercent !== undefined && t.slPercent !== null ? fmtPct(t.slPercent, 2) : "-"}
                      </td>
                      <td className="p-2 text-th-text-sub">
                        {t.slDollar !== undefined && t.slDollar !== null ? `$${fmt(t.slDollar, 2)}` : "-"}
                      </td>
                      <td className="p-2 text-th-text-sub">
                        {t.riskPercent !== undefined && t.riskPercent !== null ? fmtPct(t.riskPercent, 2) : "-"}
                      </td>
                      <td className="p-2 text-th-text-sub border-r border-th-border">
                        {t.riskDollar !== undefined && t.riskDollar !== null ? `$${fmt(t.riskDollar, 2)}` : "-"}
                      </td>

                      <td className="p-2 text-th-text-sub">{t.tpsHit ?? ""}</td>
                      <td className="p-2 text-th-text-sub">{t.tp1 ?? ""}</td>
                      <td className="p-2 text-th-text-sub">
                        {t.tp1Percent !== undefined && t.tp1Percent !== null ? fmtPct(t.tp1Percent, 2) : "-"}
                      </td>
                      <td className="p-2 text-th-text-sub">
                        {t.tp1Dollar !== undefined && t.tp1Dollar !== null ? `$${fmt(t.tp1Dollar, 2)}` : "-"}
                      </td>

                      <td className="p-2 text-th-text-sub">{t.tp2 ?? ""}</td>
                      <td className="p-2 text-th-text-sub">
                        {t.tp2Percent !== undefined && t.tp2Percent !== null ? fmtPct(t.tp2Percent, 2) : "-"}
                      </td>
                      <td className="p-2 text-th-text-sub">
                        {t.tp2Dollar !== undefined && t.tp2Dollar !== null ? `$${fmt(t.tp2Dollar, 2)}` : "-"}
                      </td>

                      <td className="p-2 text-th-text-sub">{t.tp3 ?? ""}</td>
                      <td className="p-2 text-th-text-sub">
                        {t.tp3Percent !== undefined && t.tp3Percent !== null ? fmtPct(t.tp3Percent, 2) : "-"}
                      </td>
                      <td className="p-2 text-th-text-sub border-r border-th-border">
                        {t.tp3Dollar !== undefined && t.tp3Dollar !== null ? `$${fmt(t.tp3Dollar, 2)}` : "-"}
                      </td>

                      <td className="p-2 text-th-text-sub">{t.result ?? ""}</td>
                      <td className="p-2 text-th-text-sub">
                        {commissionValue === null ? "-" : `$${fmt(commissionValue, 2)}`}
                      </td>
                      <td className={`p-2 font-semibold ${pnlValue !== null && pnlValue >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {pnlValue === null ? "-" : `$${fmt(pnlValue, 2)}`}
                      </td>
                      <td className="p-2 text-th-text-sub">
                        {equityAfter === null ? "-" : fmt(equityAfter, 2)}
                      </td>
                    </tr>

                    {expandedRows[t.id] && (
                      <tr className="bg-th-base/50">
                        <td colSpan={totalCols} className="p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap gap-2 text-xs text-th-text-sub">
                                {matching.length === 0 ? (
                                  <span className="opacity-60">No matching confluences</span>
                                ) : (
                                  matching.map((c) => (
                                    <span
                                      key={`ok-${c.key}`}
                                      className="px-2 py-1 rounded border border-emerald-400 text-emerald-300"
                                      title={c.value}
                                    >
                                      {c.key}
                                    </span>
                                  ))
                                )}
                              </div>

                              {violated.length > 0 && (
                                <div className="flex flex-wrap gap-2 text-xs text-th-text-sub">
                                  {violated.map((c) => (
                                    <span
                                      key={`bad-${c.key}`}
                                      className="px-2 py-1 rounded border border-rose-400 text-rose-300"
                                      title={c.value}
                                    >
                                      {c.key}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onEdit(normalizeTrade(t))}
                                className="h-7 px-3 rounded-full bg-amber-400 text-black text-xs font-medium hover:brightness-110 flex items-center gap-1"
                              >
                                <Pencil className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => onDelete(t.id)}
                                className="h-7 px-3 rounded-full bg-rose-500 text-white text-xs font-medium hover:brightness-110 flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                              <button
                                onClick={() => handleViewChart(t)}
                                className="h-7 px-3 rounded-full border border-emerald-400 text-emerald-200 text-xs font-medium hover:bg-emerald-400 hover:text-black flex items-center gap-1"
                              >
                                <LineChart className="w-4 h-4" /> Chart
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td colSpan={totalCols} className="p-1">
                        <button
                          onClick={() => toggleRow(t.id)}
                          className="w-full text-center text-th-text-muted hover:text-emerald-300 text-xs flex items-center justify-center gap-1 py-1"
                        >
                          {expandedRows[t.id] ? (
                            <>
                              <ChevronUp className="w-4 h-4" /> Hide details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" /> Show more
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

          {totalPages > 0 && (
            <div className="flex flex-wrap justify-between items-center gap-2 p-3 bg-th-surface border-t border-th-border-dim">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-full bg-th-overlay text-th-text text-xs disabled:opacity-40 hover:bg-th-surface"
                  title="First page"
                >
                  First
                </button>

                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-full bg-th-overlay text-th-text text-xs disabled:opacity-40 hover:bg-th-surface"
                >
                  Previous
                </button>

                <span className="text-xs text-th-text-sub">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-full bg-th-overlay text-th-text text-xs disabled:opacity-40 hover:bg-th-surface"
                >
                  Next
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-full bg-th-overlay text-th-text text-xs disabled:opacity-40 hover:bg-th-surface"
                  title="Last page"
                >
                  Last
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportBackup}
                  className="h-8 px-3 rounded-full bg-emerald-500 text-white text-xs flex items-center gap-1 hover:brightness-110"
                >
                  <Download className="w-4 h-4" /> Backup
                </button>
                <label className="h-8 px-3 rounded-full bg-th-overlay text-th-text text-xs flex items-center gap-1 cursor-pointer hover:bg-th-surface">
                  <Upload className="w-4 h-4" /> Import
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
