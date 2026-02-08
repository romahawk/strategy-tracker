// src/components/trades/trades/RiskSetupSection.jsx
import { ShieldCheck } from "lucide-react";
import { Card } from "../ui/Card";

export default function RiskSetupSection({
  form,
  onChange,
  riskTooHigh,
  account,
}) {
  // Account-driven funded/prop detection (no strategy-based fallback)
  const venue = String(account?.venue || "").toLowerCase();
  const accountType = String(account?.accountType || "").toLowerCase();
  const isProp = accountType === "funded" || venue === "prop";

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
  const SNAP_TOLERANCE = 1;

  const currentLev = Number(form.leverageX || 1);
  const leftPct = (value) => {
    const pct = ((value - MIN_LEV) / (MAX_LEV - MIN_LEV)) * 100;
    return Math.max(0, Math.min(100, pct));
  };
  const isNear = (value, x = currentLev) => Math.abs(Number(x) - value) <= SNAP_TOLERANCE;
  const clampLev = (x) => Math.min(MAX_LEV, Math.max(MIN_LEV, Number(x) || MIN_LEV));

  const snapLeverage = (raw) => {
    const v = clampLev(raw);
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

  const handleLeverageNumberChange = (value) => setLeverage(value);
  const handleLeverageSliderChange = (value) => setLeverage(snapLeverage(value));

  const handleRiskPropChange = (value) => {
    let v = parseFloat(value);
    if (!v || Number.isNaN(v)) v = 0.5;
    if (v < 0.25) v = 0.25;
    if (v > 2) v = 2;
    onChange({ target: { name: "riskPercent", value: v.toFixed(2) } });
  };

  const inputBase =
    "h-8 bg-th-raised border border-th-border-dim rounded-lg px-3 text-sm text-th-text focus:outline-none focus:ring-2 focus:ring-th-accent/30";

  return (
    <Card variant="secondary" className="p-2">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-th-text">Risk Setup</h3>

        {/* Optional: small badge showing active mode */}
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border border-th-border text-th-text/60">
          {isProp ? "PROP / FUNDED" : (venue || "cex").toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-th-text-dim mb-0.5 block">Entry</label>
          <input type="number" name="entry" value={form.entry || ""} onChange={onChange} className={inputBase} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-th-text-dim mb-0.5 block">SL (price)</label>
          <input type="number" name="sl" value={form.sl || ""} onChange={onChange} className={inputBase} />
        </div>
      </div>

      {!isProp ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-th-text-dim flex justify-between">
              <span>Leverage</span>
              <span className="text-[10px] text-th-text-muted">
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
                className={`${inputBase} w-24`}
              />
              <span className="text-xs text-th-text-dim">×</span>
            </div>

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

              <div className="pointer-events-none absolute left-0 right-0 top-[9px] h-3">
                {CHECKPOINTS.map((cp) => {
                  const near = isNear(cp.value);
                  return (
                    <span
                      key={cp.value}
                      className={`absolute w-px ${near ? "bg-emerald-300" : "bg-th-hl/20"}`}
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

            <div className="relative h-4 mt-1">
              {CHECKPOINTS.map((cp) => {
                const near = isNear(cp.value);
                return (
                  <span
                    key={cp.value}
                    className={`absolute -translate-x-1/2 text-[10px] ${
                      near ? "text-emerald-200 font-semibold" : "text-th-text-muted"
                    }`}
                    style={{ left: `${leftPct(cp.value)}%` }}
                  >
                    {cp.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-th-text-dim">SL % / $</label>
            <div className="grid grid-cols-2 gap-2 mb-1">
              <input
                type="number"
                name="slPercent"
                value={form.slPercent || ""}
                onChange={onChange}
                placeholder="SL %"
                className={inputBase}
              />
              <input
                type="number"
                name="slDollar"
                value={form.slDollar || ""}
                onChange={onChange}
                placeholder="SL $"
                className={inputBase}
              />
            </div>

            <input
              type="number"
              name="riskPercent"
              value={form.riskPercent || ""}
              onChange={onChange}
              placeholder="Risk %"
              className={`${inputBase} ${
                riskTooHigh
                  ? "!border-red-500/70 !ring-red-500/30"
                  : ""
              }`}
            />
          </div>
        </div>
      ) : (
        // ✅ PROP / FUNDED mode (risk% slider; lots calc lives elsewhere)
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-th-text-dim flex justify-between">
              <span>Risk per trade %</span>
              <span className="text-[10px] text-th-text-muted">0.25% – 2.00%</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0.25}
                max={2}
                step={0.25}
                value={form.riskPercent || "0.50"}
                onChange={(e) => handleRiskPropChange(e.target.value)}
                className={`${inputBase} w-24`}
              />
              <span className="text-xs text-th-text-dim">%</span>
            </div>

            <input
              type="range"
              min={0.25}
              max={2}
              step={0.25}
              value={Number(form.riskPercent || 0.5)}
              onChange={(e) => handleRiskPropChange(e.target.value)}
              className="w-full accent-emerald-400 cursor-pointer"
            />

            <p className="text-[10px] text-th-text-muted mt-1">
              Funded/prop mode: leverage is handled by broker/prop rules; risk is normalized as % of account size.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-th-text-dim">SL % / $</label>
            <div className="grid grid-cols-2 gap-2 mb-1">
              <input
                type="number"
                name="slPercent"
                value={form.slPercent || ""}
                onChange={onChange}
                placeholder="SL %"
                className={inputBase}
              />
              <input
                type="number"
                name="slDollar"
                value={form.slDollar || ""}
                onChange={onChange}
                placeholder="SL $"
                className={inputBase}
              />
            </div>

            {/* Keep Risk% visible for consistency (already controlled by slider/input above) */}
            <input
              type="number"
              name="riskPercent"
              value={form.riskPercent || ""}
              onChange={(e) => handleRiskPropChange(e.target.value)}
              placeholder="Risk %"
              className={inputBase}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
