// src/components/trades/trades/TradeInfoSection.jsx
import { Calendar, Star } from "lucide-react";
import { Card } from "../ui/Card";
import { useEffect, useMemo } from "react";

/* ===== PAIRS ===== */
const PAIRS = {
  crypto: [
    "BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","AVAXUSDT","DOGEUSDT",
    "DOTUSDT","LINKUSDT","MATICUSDT","ATOMUSDT","LTCUSDT","BCHUSDT","INJUSDT",
  ],
  forex: ["EURUSD", "GBPUSD", "USDJPY", "USDCHF"],
};

/* ===== % CHECKPOINTS ===== */
const PCT_MIN = 1;
const PCT_MAX = 100;
const CHECKPOINTS = [25, 50, 75, 100];
const SNAP_TOLERANCE = 1;

/* ===== LOCAL STORAGE ===== */
const LS_FAV = "alpharhythm:favPairs";
const LS_RECENT = "alpharhythm:recentPairs";

/* ===== UI TOKENS (compact) ===== */
const labelCls = "text-[11px] text-slate-300 mb-1";
const inputBase =
  "h-8 bg-[#0f172a] border border-white/5 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40";
const sliderCls = "w-full accent-emerald-400 cursor-pointer";

export default function TradeInfoSection({ form, onChange }) {
  /* ---------- percent helpers ---------- */
  const clamp = (v) => Math.min(PCT_MAX, Math.max(PCT_MIN, Number(v) || PCT_MIN));
  const snap = (v) => {
    const val = clamp(v);
    for (const c of CHECKPOINTS) {
      if (Math.abs(val - c) <= SNAP_TOLERANCE) return c;
    }
    return val;
  };

  const pct = Number(form.usedDepositPercent || 25);
  const pctLeft = (v) => ((v - PCT_MIN) / (PCT_MAX - PCT_MIN)) * 100;

  /* ---------- favorites / recent ---------- */
  const favorites = useMemo(
    () => JSON.parse(localStorage.getItem(LS_FAV) || "[]"),
    []
  );
  const recent = useMemo(
    () => JSON.parse(localStorage.getItem(LS_RECENT) || "[]"),
    []
  );

  const isFav = favorites.includes(form.pair);

  const toggleFavorite = () => {
    if (!form.pair) return;
    const next = isFav
      ? favorites.filter((p) => p !== form.pair)
      : [...favorites, form.pair];
    localStorage.setItem(LS_FAV, JSON.stringify(next));
    window.location.reload();
  };

  useEffect(() => {
    if (!form.pair) return;
    const next = [form.pair, ...recent.filter((p) => p !== form.pair)].slice(0, 5);
    localStorage.setItem(LS_RECENT, JSON.stringify(next));
  }, [form.pair]);

  const market = form.pairMarket || "crypto";
  const allPairs = PAIRS[market] || [];

  return (
    <Card variant="secondary" className="p-2 tradeinfo-scrollbars">
      {/* Component-scoped scrollbar styling */}
      <style>{`
        .tradeinfo-scrollbars select {
          scrollbar-width: thin;              /* Firefox */
          scrollbar-color: rgba(148,163,184,.45) rgba(2,6,23,.85);
        }
        .tradeinfo-scrollbars select::-webkit-scrollbar {
          width: 10px;
        }
        .tradeinfo-scrollbars select::-webkit-scrollbar-track {
          background: rgba(2,6,23,.85);
          border-left: 1px solid rgba(255,255,255,.06);
        }
        .tradeinfo-scrollbars select::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,.35);
          border: 2px solid rgba(2,6,23,.85);
          border-radius: 999px;
        }
        .tradeinfo-scrollbars select::-webkit-scrollbar-thumb:hover {
          background: rgba(148,163,184,.55);
        }
      `}</style>

      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Trade Info</h3>
      </div>

      {/* Date / Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className={labelCls}>Date</label>
          <input
            type="date"
            name="date"
            value={form.date || ""}
            onChange={onChange}
            className={inputBase}
          />
        </div>

        <div className="flex flex-col">
          <label className={labelCls}>Time</label>
          <input
            type="time"
            name="time"
            value={form.time || ""}
            onChange={onChange}
            className={inputBase}
          />
        </div>
      </div>

      {/* Market / Pair / Direction */}
      <div className="grid grid-cols-[120px_1fr_160px] gap-3 mt-2 items-end">
        <div className="flex flex-col">
          <label className={labelCls}>Market</label>
          <select
            name="pairMarket"
            value={market}
            onChange={onChange}
            className={inputBase}
          >
            <option value="crypto">Crypto</option>
            <option value="forex">Forex</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className={labelCls}>Pair</label>
          <div className="relative">
            <select
              name="pair"
              value={form.pair || ""}
              onChange={onChange}
              className={`${inputBase} pr-16 w-full`}   // ✅ more room so star won't overlap native chevron
            >
              <option value="">— Select pair —</option>

              {favorites.length > 0 && (
                <optgroup label="★ Favorites">
                  {favorites.filter((p) => allPairs.includes(p)).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </optgroup>
              )}

              {recent.length > 0 && (
                <optgroup label="Recent">
                  {recent.filter((p) => allPairs.includes(p)).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </optgroup>
              )}

              <optgroup label="All">
                {allPairs.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </optgroup>
            </select>

            <button
              type="button"
              onClick={toggleFavorite}
              className={`absolute right-5 top-1/2 -translate-y-1/2 transition ${
                isFav ? "text-yellow-400" : "text-slate-500"
              } hover:scale-110`}   // ✅ moved left a bit, no overlap
              title={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Star className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <label className={labelCls}>Direction</label>
          <select
            name="direction"
            value={form.direction || "Long"}
            onChange={onChange}
            className={inputBase}
          >
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        </div>
      </div>

      {/* Deposit + % + slider (one line, labeled) */}
      <div className="grid grid-cols-[1fr_90px_1fr] gap-3 mt-3 items-end">
        <div className="flex flex-col">
          <label className={labelCls}>Deposit ($)</label>
          <input
            type="number"
            name="deposit"
            value={form.deposit || ""}
            onChange={onChange}
            className={inputBase}
            min={0}
            step="0.01"
          />
        </div>

        <div className="flex flex-col">
          <label className={labelCls}>% of deposit</label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={100}
              value={pct}
              onChange={(e) =>
                onChange({
                  target: { name: "usedDepositPercent", value: String(snap(e.target.value)) },
                })
              }
              className={`${inputBase} pr-6 w-full text-center`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              %
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <label className={labelCls}>&nbsp;</label>
          <div className="relative overflow-hidden"> {/* ✅ ensures labels never overflow the card */}
            <input
              type="range"
              min={PCT_MIN}
              max={PCT_MAX}
              step={1}
              value={pct}
              onChange={(e) =>
                onChange({
                  target: { name: "usedDepositPercent", value: String(snap(e.target.value)) },
                })
              }
              className={sliderCls}
            />

            {/* ticks */}
            <div className="absolute inset-x-0 top-2 pointer-events-none">
              {CHECKPOINTS.map((c) => (
                <span
                  key={c}
                  className="absolute w-px bg-white/30"
                  style={{ left: `${pctLeft(c)}%`, height: 6 }}
                />
              ))}
            </div>

            {/* labels (edge-safe positioning) */}
            <div className="relative h-4 mt-1">
              {CHECKPOINTS.map((c) => {
                const isFirst = c === CHECKPOINTS[0];
                const isLast = c === CHECKPOINTS[CHECKPOINTS.length - 1];

                if (isFirst) {
                  return (
                    <span
                      key={c}
                      className="absolute left-0 text-[10px] text-slate-500"
                    >
                      {c}%
                    </span>
                  );
                }

                if (isLast) {
                  return (
                    <span
                      key={c}
                      className="absolute right-0 text-[10px] text-slate-500"
                    >
                      {c}%
                    </span>
                  );
                }

                return (
                  <span
                    key={c}
                    className="absolute -translate-x-1/2 text-[10px] text-slate-500"
                    style={{ left: `${pctLeft(c)}%` }}
                  >
                    {c}%
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
