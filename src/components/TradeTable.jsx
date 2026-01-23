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

/**
 * Build entryConditions from legacy flat fields for backward compatibility.
 * If trade already has entryConditions[], keep it.
 */
function buildEntryConditionsFromLegacy(trade, sid) {
  const existing = Array.isArray(trade?.entryConditions)
    ? trade.entryConditions
    : [];
  if (existing.length > 0) return existing;

  const out = [];
  const pushIf = (key, raw) => {
    if (raw === undefined || raw === null || raw === "") return;
    out.push({
      key,
      ok: String(raw).toLowerCase() !== "no" && String(raw).toLowerCase() !== "false",
      value: String(raw),
    });
  };

  // Common legacy fields shown in your previous table details
  pushIf("ST", trade.stTrend);
  pushIf("USDT.D", trade.usdtTrend);
  pushIf("Overlay", trade.overlay);
  pushIf("MA200", trade.ma200);

  // TS2 extras
  if (Number(sid) === 2) {
    pushIf("15m CHoCH/BoS", trade.chochBos15m);
    pushIf("1m ST", trade.st1m);
    pushIf("1m Overlay", trade.overlay1m);
    pushIf("1m MA200", trade.ma2001m);
  }

  // TS4 extras
  if (Number(sid) === 4) {
    pushIf("1m BoS", trade.bos1m);
  }

  return out;
}

/**
 * Normalize trade shape so TradeForm receives a consistent object:
 * - direction always present ("Long"/"Short")
 * - entryConditions always present (array) using legacy fallback
 */
function normalizeTrade(trade, sid) {
  const direction = trade?.direction || "Long";
  const entryConditions = buildEntryConditionsFromLegacy(
    { ...trade, direction },
    sid
  );

  return {
    ...trade,
    direction,
    entryConditions,
  };
}

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

  // Normalize trades once per render for stable UI + stable edit payload
  const normalizedTrades = useMemo(() => {
    return (trades || []).map((t) => normalizeTrade(t, sid));
  }, [trades, sid]);

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
        toast.success("Backup saved to local storage", { autoClose: 2000 });
      } catch (error) {
        console.error("Backup save error:", error);
        toast.error("Failed to save backup to local storage", { autoClose: 3000 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Convert current trades to FTMO logic (TS3): 100k start, 1% risk per trade
  // NOTE: App-level computeTimeline() will recompute equity after import.
  const recalcTradesForFtmo = (rawTrades, startDeposit = 100000, riskPercentPerTrade = 1.0) => {
    if (!Array.isArray(rawTrades) || rawTrades.length === 0) return rawTrades;

    // sort by date+time to replay in correct order
    const tradesSorted = [...rawTrades].sort((a, b) => {
      const aKey = `${a.date || ""} ${a.time || ""}`;
      const bKey = `${b.date || ""} ${b.time || ""}`;
      return aKey.localeCompare(bKey);
    });

    let balance = Number(startDeposit);

    const converted = tradesSorted.map((t) => {
      const n = (v) => {
        const x = parseFloat(v);
        return Number.isFinite(x) ? x : 0;
      };

      const entry = n(t.entry);
      const sl = n(t.sl);
      const direction = t.direction || "Long";

      // SL% from price distance
      let slP =
        direction === "Long"
          ? (sl / entry - 1) * 100
          : (1 - sl / entry) * 100;
      if (!Number.isFinite(slP)) slP = 0;
      const absSl = Math.abs(slP);

      let targetRisk = Number(riskPercentPerTrade);
      if (!Number.isFinite(targetRisk) || targetRisk <= 0) targetRisk = 1;
      if (targetRisk < 0.25) targetRisk = 0.25;
      if (targetRisk > 2) targetRisk = 2;

      let lotPct = 0;
      let positionSize = 0;
      let riskUsdAbs = 0;
      let riskActualPct = 0;

      if (absSl > 0) {
        lotPct = (targetRisk * 100) / absSl;
        if (lotPct > 100) lotPct = 100;
        positionSize = balance * (lotPct / 100);
        riskUsdAbs = positionSize * (absSl / 100);
        riskActualPct = (riskUsdAbs / balance) * 100;
      }

      const riskUsdSigned = -riskUsdAbs;
      const lots = positionSize / 100000;

      // TP maths
      const tp1 = n(t.tp1);
      const tp2 = n(t.tp2);
      const tp3 = n(t.tp3);
      const tpsHit = t.tpsHit || "SL";

      const tpPct = (tpPrice) => {
        if (!tpPrice || !entry) return null;
        return direction === "Long"
          ? (tpPrice / entry - 1) * 100
          : (1 - tpPrice / entry) * 100;
      };

      const tp1Pct = tpPct(tp1);
      const tp2Pct = tpPct(tp2);
      const tp3Pct = tpPct(tp3);

      const tpVal = (pct, factor) => {
        if (pct == null) return { pct: null, usd: 0 };
        const usd = positionSize * (pct / 100) * factor;
        return { pct: Number(pct.toFixed(2)), usd };
      };

      let tp1Data, tp2Data, tp3Data;
      if (tpsHit === "3") {
        tp1Data = tpVal(tp1Pct, 1 / 3);
        tp2Data = tpVal(tp2Pct, 1 / 3);
        tp3Data = tpVal(tp3Pct, 1 / 3);
      } else if (tpsHit === "2") {
        tp1Data = tpVal(tp1Pct, 1 / 3);
        tp2Data = tpVal(tp2Pct, 2 / 3);
        tp3Data = { pct: null, usd: 0 };
      } else if (tpsHit === "SL") {
        tp1Data = { pct: null, usd: 0 };
        tp2Data = { pct: null, usd: 0 };
        tp3Data = { pct: null, usd: 0 };
      } else {
        // treat anything else as TP1 full
        tp1Data = tpVal(tp1Pct, 1);
        tp2Data = { pct: null, usd: 0 };
        tp3Data = { pct: null, usd: 0 };
      }

      const tpTotal = tp1Data.usd + tp2Data.usd + tp3Data.usd;

      let pnl;
      let result;
      if (tpsHit === "SL") {
        pnl = riskUsdSigned;
        result = "Loss";
      } else {
        pnl = tpTotal;
        result = pnl > 0 ? "Win" : "Break Even";
      }

      const nextBalance = balance + pnl;

      const updated = {
        ...t,
        // keep entryConditions + direction (normalized later too)
        direction,
        entryConditions: Array.isArray(t.entryConditions) ? t.entryConditions : [],

        strategyId: 3,
        deposit: Number(balance.toFixed(2)),
        riskPercent: Number(riskActualPct.toFixed(2)),
        riskDollar: Number(riskUsdSigned.toFixed(2)),
        usedDepositPercent: Number(lotPct.toFixed(2)),
        leverageX: 1,
        leverageAmount: Number(positionSize.toFixed(2)),
        lots: Number(lots.toFixed(2)),
        slPercent: Number(slP.toFixed(2)),
        slDollar: Number(riskUsdSigned.toFixed(2)),
        tp1Percent: tp1Data.pct,
        tp1Dollar: Number(tp1Data.usd.toFixed(2)),
        tp2Percent: tp2Data.pct,
        tp2Dollar: Number(tp2Data.usd.toFixed(2)),
        tp3Percent: tp3Data.pct,
        tp3Dollar: Number(tp3Data.usd.toFixed(2)),
        tpTotal: Number(tpTotal.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        nextDeposit: Number(nextBalance.toFixed(2)),
        result,
      };

      balance = nextBalance;
      return updated;
    });

    return converted;
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

        // Normalize immediately on import so edit + details work consistently
        const normalizedImported = importedTrades.map((t) => normalizeTrade(t, sid));

        for (const [index, trade] of normalizedImported.entries()) {
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

        onUpdateTrades(normalizedImported);
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

  const recalcAsFtmo = () => {
    try {
      if (!normalizedTrades || normalizedTrades.length === 0) {
        toast.info("No trades to recalculate", { autoClose: 2000 });
        return;
      }

      const START_DEPOSIT = 100000;
      const RISK_PER_TRADE = 1.0;

      const converted = recalcTradesForFtmo(normalizedTrades, START_DEPOSIT, RISK_PER_TRADE)
        .map((t) => normalizeTrade_toggleSafe(t, 3)); // sid=3 in output

      onUpdateTrades(converted);
      toast.success(
        `Recalculated for FTMO ${START_DEPOSIT.toLocaleString()} @ ${RISK_PER_TRADE}% risk`,
        { autoClose: 3000 }
      );
    } catch (err) {
      console.error("FTMO recalculation error:", err);
      toast.error("Failed to recalculate trades for FTMO", { autoClose: 4000 });
    }
  };

  // helper to avoid sid closure confusion in recalcAsFtmo mapping
  function normalizeTrade_toggleSafe(t, sidForNormalize) {
    return normalizeTrade(t, sidForNormalize);
  }

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
    <div className="bg-[#0b1120] border border-white/5 p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,.25)] w-full">
      {!normalizedTrades || normalizedTrades.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-slate-300 italic mb-4">No trades yet.</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={exportBackup}
              className="h-8 px-4 rounded-full bg-emerald-500 text-white text-xs font-medium hover:brightness-110 flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> Download backup
            </button>
            <label className="h-8 px-4 rounded-full bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 cursor-pointer flex items-center gap-1">
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
        <div className="relative rounded-xl overflow-hidden border border-white/5">
          <table className="table-auto w-full text-xs" style={{ tableLayout: "fixed" }}>
            <thead className="sticky top-0 z-10">
              <tr className="text-[11px] uppercase tracking-wide text-white">
                <th
                  className="p-2 font-semibold sticky left-0 bg-[#0f172a] z-20"
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
                  className="p-2 border-l border-white/10"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(248,113,113,0.8) 0%, rgba(248,113,113,0) 100%)",
                  }}
                >
                  Risk
                </th>
                <th
                  colSpan={10}
                  className="p-2 border-l border-white/10"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(16,185,129,0.8) 0%, rgba(16,185,129,0) 100%)",
                  }}
                >
                  Take Profit
                </th>
                <th
                  colSpan={4}
                  className="p-2 border-l border-white/10"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(139,92,246,0.8) 0%, rgba(139,92,246,0) 100%)",
                  }}
                >
                  Results
                </th>
              </tr>

              <tr className="text-slate-300/90 text-[11px] bg-[#0f172a] border-b border-white/5">
                <th
                  className="p-2 sticky left-0 bg-[#0f172a] z-20"
                  style={{ minWidth: "40px", width: "40px" }}
                />
                <th className="p-2" style={{ minWidth: "100px", width: "100px" }}>
                  Date
                </th>
                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>
                  Time
                </th>
                <th className="p-2" style={{ minWidth: "140px", width: "140px" }}>
                  Pair
                </th>
                <th className="p-2" style={{ minWidth: "50px", width: "50px" }}>
                  Dir
                </th>
                <th
                  className="p-2 border-r border-white/10"
                  style={{ minWidth: "90px", width: "90px" }}
                >
                  Eq. Before
                </th>

                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  Entry
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  SL
                </th>
                <th className="p-2" style={{ minWidth: "60px", width: "60px" }}>
                  SL %
                </th>
                <th className="p-2" style={{ minWidth: "60px", width: "60px" }}>
                  SL $
                </th>
                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>
                  Risk %
                </th>
                <th
                  className="p-2 border-r border-white/10"
                  style={{ minWidth: "70px", width: "70px" }}
                >
                  Risk $
                </th>

                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TPs Hit
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TP1
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TP1 %
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TP1 $
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TP2
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TP2 %
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TP2 $
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TP3
                </th>
                <th className="p-2" style={{ minWidth: "45px", width: "45px" }}>
                  TP3 %
                </th>
                <th
                  className="p-2 border-r border-white/10"
                  style={{ minWidth: "45px", width: "45px" }}
                >
                  TP3 $
                </th>

                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>
                  Result
                </th>
                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>
                  Comm $
                </th>
                <th className="p-2" style={{ minWidth: "70px", width: "70px" }}>
                  PnL $
                </th>
                <th className="p-2" style={{ minWidth: "90px", width: "90px" }}>
                  Eq. After
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedTrades.map((t, index) => {
                const equityBefore = Number.isFinite(Number(t?.equityBefore))
                  ? Number(t.equityBefore)
                  : Number.isFinite(Number(t?.deposit))
                  ? Number(t.deposit)
                  : null;

                const equityAfter = Number.isFinite(Number(t?.equityAfter))
                  ? Number(t.equityAfter)
                  : Number.isFinite(Number(t?.nextDeposit))
                  ? Number(t.nextDeposit)
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

                return (
                  <React.Fragment key={t.id}>
                    <tr
                      className={`border-b border-white/5 transition ${
                        index % 2 === 0 ? "bg-[#0f172a]" : "bg-[#0f172a]/50"
                      }`}
                    >
                      <td
                        className="p-2 sticky left-0 bg-inherit z-10 font-medium text-slate-200"
                        style={{ minWidth: "40px", width: "40px" }}
                      >
                        {startIndex + index + 1}
                      </td>

                      <td className="p-2 text-slate-200">
                        {t.date ? formatDate(t.date) : ""}
                      </td>
                      <td className="p-2 text-slate-200">{t.time || ""}</td>
                      <td className="p-2 text-slate-200 truncate" title={t.pair}>
                        {t.pair || ""}
                      </td>
                      <td className="p-2 text-slate-200">{dirShort}</td>

                      <td className="p-2 text-slate-200 border-r border-white/10">
                        {equityBefore === null ? "-" : fmt(equityBefore, 2)}
                      </td>

                      <td className="p-2 text-slate-200">{t.entry ?? ""}</td>
                      <td className="p-2 text-slate-200">{t.sl ?? ""}</td>
                      <td className="p-2 text-slate-200">
                        {t.slPercent !== undefined && t.slPercent !== null
                          ? fmtPct(t.slPercent, 2)
                          : "-"}
                      </td>
                      <td className="p-2 text-slate-200">
                        {t.slDollar !== undefined && t.slDollar !== null
                          ? `$${fmt(t.slDollar, 2)}`
                          : "-"}
                      </td>
                      <td className="p-2 text-slate-200">
                        {t.riskPercent !== undefined && t.riskPercent !== null
                          ? fmtPct(t.riskPercent, 2)
                          : "-"}
                      </td>
                      <td className="p-2 text-slate-200 border-r border-white/10">
                        {t.riskDollar !== undefined && t.riskDollar !== null
                          ? `$${fmt(t.riskDollar, 2)}`
                          : "-"}
                      </td>

                      <td className="p-2 text-slate-200">{t.tpsHit ?? ""}</td>
                      <td className="p-2 text-slate-200">{t.tp1 ?? ""}</td>
                      <td className="p-2 text-slate-200">
                        {t.tp1Percent !== undefined && t.tp1Percent !== null
                          ? fmtPct(t.tp1Percent, 2)
                          : "-"}
                      </td>
                      <td className="p-2 text-slate-200">
                        {t.tp1Dollar !== undefined && t.tp1Dollar !== null
                          ? `$${fmt(t.tp1Dollar, 2)}`
                          : "-"}
                      </td>

                      <td className="p-2 text-slate-200">{t.tp2 ?? ""}</td>
                      <td className="p-2 text-slate-200">
                        {t.tp2Percent !== undefined && t.tp2Percent !== null
                          ? fmtPct(t.tp2Percent, 2)
                          : "-"}
                      </td>
                      <td className="p-2 text-slate-200">
                        {t.tp2Dollar !== undefined && t.tp2Dollar !== null
                          ? `$${fmt(t.tp2Dollar, 2)}`
                          : "-"}
                      </td>

                      <td className="p-2 text-slate-200">{t.tp3 ?? ""}</td>
                      <td className="p-2 text-slate-200">
                        {t.tp3Percent !== undefined && t.tp3Percent !== null
                          ? fmtPct(t.tp3Percent, 2)
                          : "-"}
                      </td>
                      <td className="p-2 text-slate-200 border-r border-white/10">
                        {t.tp3Dollar !== undefined && t.tp3Dollar !== null
                          ? `$${fmt(t.tp3Dollar, 2)}`
                          : "-"}
                      </td>

                      <td className="p-2 text-slate-200">{t.result ?? ""}</td>
                      <td className="p-2 text-slate-200">
                        {commissionValue === null ? "-" : `$${fmt(commissionValue, 2)}`}
                      </td>
                      <td
                        className={`p-2 font-semibold ${
                          pnlValue !== null && pnlValue >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {pnlValue === null ? "-" : `$${fmt(pnlValue, 2)}`}
                      </td>
                      <td className="p-2 text-slate-200">
                        {equityAfter === null ? "-" : fmt(equityAfter, 2)}
                      </td>
                    </tr>

                    {expandedRows[t.id] && (
                      <tr className="bg-[#020617]/50">
                        <td colSpan={totalCols} className="p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                              {(t.entryConditions || []).length === 0 ? (
                                <span className="opacity-60">No entry conditions</span>
                              ) : (
                                t.entryConditions.map((c) => (
                                  <span
                                    key={c.key}
                                    className={`px-2 py-1 rounded border ${
                                      c.ok
                                        ? "border-emerald-400 text-emerald-300"
                                        : "border-rose-400 text-rose-300"
                                    }`}
                                    title={c.value || ""}
                                  >
                                    {c.key}
                                  </span>
                                ))
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onEdit(normalizeTrade(t, sid))}
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
                          className="w-full text-center text-slate-400 hover:text-emerald-300 text-xs flex items-center justify-center gap-1 py-1"
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
            <div className="flex flex-wrap justify-between items-center gap-2 p-3 bg-[#0f172a] border-t border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-full bg-slate-800 text-slate-100 text-xs disabled:opacity-40 hover:bg-slate-700"
                  title="First page"
                >
                  First
                </button>

                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-full bg-slate-800 text-slate-100 text-xs disabled:opacity-40 hover:bg-slate-700"
                >
                  Previous
                </button>

                <span className="text-xs text-slate-200">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-full bg-slate-800 text-slate-100 text-xs disabled:opacity-40 hover:bg-slate-700"
                >
                  Next
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-full bg-slate-800 text-slate-100 text-xs disabled:opacity-40 hover:bg-slate-700"
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
                <label className="h-8 px-3 rounded-full bg-slate-800 text-white text-xs flex items-center gap-1 cursor-pointer hover:bg-slate-700">
                  <Upload className="w-4 h-4" /> Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={importBackup}
                    className="hidden"
                  />
                </label>

                {(sid === 3 || sid === 4) && normalizedTrades.length > 0 && (
                  <button
                    onClick={recalcAsFtmo}
                    className="h-8 px-3 rounded-full bg-indigo-500 text-white text-xs flex items-center gap-1 hover:brightness-110"
                  >
                    <LineChart className="w-4 h-4" />
                    Recalc as FTMO 100k @ 1%
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
