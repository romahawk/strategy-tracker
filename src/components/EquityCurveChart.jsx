import { useMemo, useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { TrendingUp } from "lucide-react";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

// yyyy-mm-dd helper (safe for <input type="date">)
function toISODate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// inclusive day-range compare (ignores time)
function dayStamp(dateStr) {
  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) return null;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
}

function isOpenTrade(t) {
  const r = String(t?.result ?? "").trim().toLowerCase();
  const th = String(t?.tpsHit ?? "").trim().toLowerCase();
  return r === "open" || th === "open";
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sortKey(t) {
  const d = t?.date ? String(t.date) : "";
  const tm = t?.time ? String(t.time) : "00:00";
  return `${d} ${tm}`;
}

export default function EquityCurveChart({ trades = [] }) {
  // ✅ toggle drawdown on/off
  const [showDrawdown, setShowDrawdown] = useState(true);

  // Count open trades (for UI hint)
  const openCount = useMemo(() => {
    return (trades || []).filter(isOpenTrade).length;
  }, [trades]);

  /**
   * Retro-safe equity source:
   * - prefer computed equityAfter/equityBefore (from computeTimeline)
   * - fallback to legacy nextDeposit/deposit if app hasn't been wired yet
   */
  const getEquityAfter = (t) => {
    if (Number.isFinite(Number(t?.equityAfter))) return Number(t.equityAfter);
    if (Number.isFinite(Number(t?.nextDeposit))) return Number(t.nextDeposit);
    return null;
  };

  const getEquityBefore = (t) => {
    if (Number.isFinite(Number(t?.equityBefore))) return Number(t.equityBefore);
    if (Number.isFinite(Number(t?.deposit))) return Number(t.deposit);
    return null;
  };

  // Base list for equity curve:
  // - has date
  // - NOT open
  // - equityAfter (computed) must be numeric (fallback to legacy nextDeposit if present)
  const sortedAll = useMemo(() => {
    return [...(trades || [])]
      .filter((t) => t?.date)
      .filter((t) => !isOpenTrade(t))
      .filter((t) => getEquityAfter(t) !== null)
      .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  }, [trades]);

  // min/max dates available (from realized trades only)
  const { minDate, maxDate } = useMemo(() => {
    if (!sortedAll.length) return { minDate: "", maxDate: "" };
    return {
      minDate: toISODate(sortedAll[0].date),
      maxDate: toISODate(sortedAll[sortedAll.length - 1].date),
    };
  }, [sortedAll]);

  // Local filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Initialize defaults whenever dataset changes
  useEffect(() => {
    setFromDate(minDate);
    setToDate(maxDate);
  }, [minDate, maxDate]);

  // Apply date filter (inclusive) on realized trades
  const filtered = useMemo(() => {
    if (!sortedAll.length) return [];

    const from = fromDate ? dayStamp(fromDate) : null;
    const to = toDate ? dayStamp(toDate) : null;

    // invalid range -> no data
    if (from !== null && to !== null && from > to) return [];

    return sortedAll.filter((t) => {
      const ts = dayStamp(t.date);
      if (ts === null) return false;
      if (from !== null && ts < from) return false;
      if (to !== null && ts > to) return false;
      return true;
    });
  }, [sortedAll, fromDate, toDate]);

  // Build labels & equity values from FILTERED trades
  const labels = filtered.map((t) =>
    t.date ? new Date(t.date).toLocaleDateString() : ""
  );

  const values = filtered.map((t) => toNumber(getEquityAfter(t), 0));

  // Start point inside selected range:
  // use equityBefore of the first trade in range (balance at range start)
  const initialEquity = toNumber(getEquityBefore(filtered[0]), 0);

  if (filtered.length) {
    labels.unshift("Start");
    values.unshift(initialEquity);
  }

  // Drawdown calc on filtered range
  let runningPeak = values.length ? values[0] : 0;
  const drawdowns = values.map((v) => {
    if (v > runningPeak) runningPeak = v;
    return runningPeak - v;
  });

  const maxDrawdownDollar = drawdowns.length ? Math.max(...drawdowns) : 0;
  const maxEquity = values.length ? Math.max(...values) : 0;
  const maxDrawdownPercent =
    maxEquity > 0 ? (maxDrawdownDollar / maxEquity) * 100 : 0;

  const formatMoney = (num) =>
    Number(num || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  // ✅ Build datasets conditionally
  const equityDataset = {
    label: "Equity Curve ($)",
    data: values,
    borderColor: "#00ffa3",
    pointBackgroundColor: "#00ffa3",
    pointBorderColor: "#020617",
    pointRadius: 3,
    pointHoverRadius: 5,
    borderWidth: 2,
    tension: 0.35,
    yAxisID: "y",
  };

  const drawdownDataset = {
    label: "Drawdown ($)",
    data: drawdowns,
    borderColor: "#f97373",
    backgroundColor: "rgba(248,113,113,0.12)",
    pointRadius: 0,
    borderWidth: 1.5,
    tension: 0.35,
    fill: true,
    yAxisID: "y1",
  };

  const chartData = {
    labels,
    datasets: showDrawdown ? [equityDataset, drawdownDataset] : [equityDataset],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#020617",
        titleColor: "#ffffff",
        bodyColor: "#e2e8f0",
        borderColor: "#00ffa3",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const label = ctx.dataset.label || "";
            const value = ctx.parsed.y;
            return `${label}: $${formatMoney(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#94a3b8",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: { color: "rgba(148,163,184,0.08)" },
      },
      y: {
        position: "left",
        ticks: { color: "#94a3b8", callback: (val) => `$${val}` },
        grid: { color: "rgba(148,163,184,0.05)" },
      },
      // ✅ Only show y1 axis when drawdown is enabled
      ...(showDrawdown
        ? {
            y1: {
              position: "right",
              ticks: {
                color: "#fca5a5",
                callback: (val) => `$${val}`,
                font: { size: 9 },
              },
              grid: { drawOnChartArea: false },
            },
          }
        : {}),
    },
  };

  const hasData = filtered.length > 0;
  const hasRealizedTrades = sortedAll.length > 0;

  return (
    <div className="bg-[#0b1120] border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Equity curve</h2>
            <p className="text-[10px] text-slate-400">
              Balance over time (recalculated equity)
            </p>
            {openCount > 0 && (
              <p className="text-[10px] text-slate-500">
                {openCount} open trade(s) excluded (equity is realized-only).
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* ✅ Drawdown toggle */}
          <label className="flex items-center gap-2 bg-[#0f172a] border border-white/5 rounded-xl px-3 py-2">
            <input
              type="checkbox"
              checked={showDrawdown}
              onChange={(e) => setShowDrawdown(e.target.checked)}
              className="accent-emerald-400"
            />
            <span className="text-xs text-slate-200">Drawdown</span>
          </label>

          {/* Date filter controls */}
          <div className="flex items-center gap-2 bg-[#0f172a] border border-white/5 rounded-xl px-3 py-2">
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400">From</label>
              <input
                type="date"
                value={fromDate}
                min={minDate}
                max={toDate || maxDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
                disabled={!hasRealizedTrades}
              />
            </div>

            <div className="w-px h-8 bg-white/5" />

            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400">To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate || minDate}
                max={maxDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
                disabled={!hasRealizedTrades}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setFromDate(minDate);
                setToDate(maxDate);
              }}
              className="ml-2 text-[11px] px-2 py-1 rounded-lg bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-40"
              title="Reset range"
              disabled={!hasRealizedTrades}
            >
              Reset
            </button>
          </div>

          <div className="px-2 py-1 rounded-full bg-emerald-500/10 text-[10px] text-emerald-300">
            Max equity: ${formatMoney(maxEquity)}
          </div>

          {/* ✅ Hide DD badge when DD is off */}
          {showDrawdown && (
            <div className="px-2 py-1 rounded-full bg-rose-500/10 text-[10px] text-rose-300">
              Max DD: -${formatMoney(maxDrawdownDollar)} (
              {maxDrawdownPercent.toFixed(2)}%)
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-xl h-72 p-3">
        {hasData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">
            {hasRealizedTrades
              ? "No trades in selected date range"
              : "No closed trades to plot yet"}
          </div>
        )}
      </div>
    </div>
  );
}
