// src/components/trades/trades/RiskSetupSection.jsx
import { ShieldCheck } from "lucide-react";

export default function RiskSetupSection({
  form,
  onChange,
  riskTooHigh,
  strategyId, // <-- now received
}) {
  const handleLeverageChange = (value) => {
    const v = Math.min(50, Math.max(1, Number(value) || 1));
    onChange({ target: { name: "leverageX", value: String(v) } });
  };

  const isFX = Number(strategyId) === 3;

  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Risk Setup</h3>
      </div>

      {/* entry + SL */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* leverage + SL/Risk fields */}
      <div className="grid grid-cols-2 gap-3">
        {/* LEVERAGE */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300 flex justify-between">
            <span>Leverage</span>
            <span className="text-[10px] text-slate-400">1 – 50×</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={50}
              value={form.leverageX || "5"}
              onChange={(e) => handleLeverageChange(e.target.value)}
              className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white w-24 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
            <span className="text-xs text-slate-300">×</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={Number(form.leverageX || 5)}
            onChange={(e) => handleLeverageChange(e.target.value)}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        {/* SL % / SL $ / Risk % etc */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">SL % / $</label>
          <div className="grid grid-cols-2 gap-2">
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

      {/* FX-only: Lots (auto from deposit/%/leverage but editable) */}
      {isFX && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Lots (100k = 1.00)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              name="lots"
              value={form.lots || ""}
              onChange={onChange}
              placeholder="e.g. 0.25"
              className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
            <p className="text-[10px] text-slate-400">
              Auto = (Deposit × % × Leverage) / 100000
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Pip $ / lot</label>
            <input
              type="text"
              value={form.pipValue || ""}
              disabled
              className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white/80 opacity-70"
            />
          </div>
        </div>
      )}
    </div>
  );
}
