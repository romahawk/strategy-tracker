// src/components/trades/trades/RiskSetupSection.jsx
import { ShieldCheck } from "lucide-react";

export default function RiskSetupSection({
  form,
  onChange,
  strategyId,
  riskTooHigh,
}) {
  const isFTMO = strategyId === 3 || strategyId === 4;

  // ----- Leverage checkpoints (S1/S2 only) -----
  const MIN_LEV = 1;
  const MAX_LEV = 50;
  const CHECKPOINTS = [
    { value: 5, label: "5x" },
    { value: 10, label: "10x" },
    { value: 15, label: "15x" },
    { value: 20, label: "20x" },
    { value: 25, label: "25x" },
    { value: 30, label: "30x" },
    { value: 35, label: "35x" },
    { value: 40, label: "40x" },
    { value: 45, label: "45x" },
    { value: 50, label: "50x" },
  ];
  const SNAP_TOLERANCE = 1; // ±1

  const currentLev = Number(form.leverageX || 1);

  const leftPct = (value) => {
    const pct = ((value - MIN_LEV) / (MAX_LEV - MIN_LEV)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const isNear = (value, x = currentLev) => Math.abs(Number(x) - value) <= SNAP_TOLERANCE;

  const clampLev = (x) => Math.min(MAX_LEV, Math.max(MIN_LEV, Number(x) || MIN_LEV));

  const snapLeverage = (raw) => {
    const v = clampLev(raw);
    // snap to the nearest checkpoint within tolerance
    let best = null;
    for (const cp of CHECKPOINTS) {
      const dist = Math.abs(v - cp.value);
      if (dist <= SNAP_TOLERANCE) {
        if (!best || dist < best.dist) best = { value: cp.value, dist };
      }
    }
    return best ? best.value : v;
  };

  const setLeverage = (v) => {
    onChange({ target: { name: "leverageX", value: String(clampLev(v)) } });
  };

  // number input: exact (no snap)
  const handleLeverageNumberChange = (value) => {
    setLeverage(value);
  };

  // slider: snap when near checkpoints
  const handleLeverageSliderChange = (value) => {
    setLeverage(snapLeverage(value));
  };

  const handleRiskFtmoChange = (value) => {
    let v = parseFloat(value);
    if (!v || Number.isNaN(v)) v = 0.5;
    if (v < 0.25) v = 0.25;
    if (v > 2) v = 2;
    onChange({
      target: { name: "riskPercent", value: v.toFixed(2) },
    });
  };

  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Risk Setup</h3>
      </div>

      {/* Entry + SL */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">Entry</label>
          <input
            type="number"
            name="entry"
            value={form.entry || ""}
            onChange={onChange}
            className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">SL (price)</label>
          <input
            type="number"
            name="sl"
            value={form.sl || ""}
            onChange={onChange}
            className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>
      </div>

      {!isFTMO ? (
        // ---------- Strategies 1 & 2 ----------
        <div className="grid grid-cols-2 gap-3">
          {/* Leverage */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300 flex justify-between">
              <span>Leverage</span>
              <span className="text-[10px] text-slate-400">
                {MIN_LEV} – {MAX_LEV}×
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={MIN_LEV}
                max={MAX_LEV}
                value={form.leverageX || "10"}
                onChange={(e) => handleLeverageNumberChange(e.target.value)}
                className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white w-24 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              />
              <span className="text-xs text-slate-300">×</span>
            </div>

            {/* Slider + tick marks overlay */}
            <div className="relative">
              <input
                type="range"
                min={MIN_LEV}
                max={MAX_LEV}
                step={1}
                value={Number(form.leverageX || 10)}
                onChange={(e) => handleLeverageSliderChange(e.target.value)}
                className="w-full accent-emerald-400 cursor-pointer"
              />

              {/* ✅ vertical tick marks aligned to scale */}
              <div className="pointer-events-none absolute left-0 right-0 top-[9px] h-3">
                {CHECKPOINTS.map((cp) => {
                  const near = isNear(cp.value);
                  return (
                    <span
                      key={cp.value}
                      className={`absolute w-px ${
                        near ? "bg-emerald-300" : "bg-white/20"
                      }`}
                      style={{
                        left: `${leftPct(cp.value)}%`,
                        height: near ? "10px" : "8px",
                        transform: "translateX(-0.5px)",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* ✅ labels aligned to scale + bold highlight when near (±1) */}
            <div className="relative h-4 mt-1">
              {CHECKPOINTS.map((cp) => {
                const near = isNear(cp.value);
                return (
                  <span
                    key={cp.value}
                    className={`absolute -translate-x-1/2 text-[10px] ${
                      near
                        ? "text-emerald-200 font-semibold"
                        : "text-slate-500 font-normal"
                    }`}
                    style={{ left: `${leftPct(cp.value)}%` }}
                  >
                    {cp.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* SL % / SL $ + Risk % (manual) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">SL % / $</label>
            <div className="grid grid-cols-2 gap-2 mb-1">
              <input
                type="number"
                name="slPercent"
                value={form.slPercent || ""}
                onChange={onChange}
                placeholder="SL %"
                className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              />
              <input
                type="number"
                name="slDollar"
                value={form.slDollar || ""}
                onChange={onChange}
                placeholder="SL $"
                className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>
            <input
              type="number"
              name="riskPercent"
              value={form.riskPercent || ""}
              onChange={onChange}
              placeholder="Risk %"
              className={`bg-[#0f172a] border rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${
                riskTooHigh
                  ? "border-red-500/70 focus:ring-2 focus:ring-red-500/50"
                  : "border-white/5 focus:ring-2 focus:ring-emerald-400/50"
              }`}
            />
          </div>
        </div>
      ) : (
        // ---------- Strategy 3 & 4 (FTMO / funded) ----------
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Risk per trade % */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300 flex justify-between">
                <span>Risk per trade %</span>
                <span className="text-[10px] text-slate-400">
                  0.25% – 2.00%
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.25}
                  max={2}
                  step={0.25}
                  value={form.riskPercent || "0.50"}
                  onChange={(e) => handleRiskFtmoChange(e.target.value)}
                  className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white w-24 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                />
                <span className="text-xs text-slate-300">%</span>
              </div>
              <input
                type="range"
                min={0.25}
                max={2}
                step={0.25}
                value={Number(form.riskPercent || 0.5)}
                onChange={(e) => handleRiskFtmoChange(e.target.value)}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Leverage: <span className="font-semibold">1×</span> (fixed for
                funded / spot).
              </p>
            </div>

            {/* SL % / $ (calculated) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300">SL % / $</label>
              <div className="grid grid-cols-2 gap-2 mb-1">
                <input
                  type="number"
                  name="slPercent"
                  value={form.slPercent || ""}
                  readOnly
                  className="bg-[#020617] border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
                <input
                  type="number"
                  name="slDollar"
                  value={form.slDollar || ""}
                  readOnly
                  className="bg-[#020617] border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <input
                type="text"
                readOnly
                value={
                  form.usedDepositPercent
                    ? `Lot size: ${Number(form.usedDepositPercent).toFixed(2)}%`
                    : "Lot size: –"
                }
                className="bg-[#020617] border border-white/5 rounded-lg px-3 py-2 text-[11px] text-slate-300"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
