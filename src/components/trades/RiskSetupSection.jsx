// src/components/trades/trades/RiskSetupSection.jsx
import { ShieldCheck } from "lucide-react";

export default function RiskSetupSection({ form, onChange, riskTooHigh }) {
  const handleLeverageChange = (value) => {
    const v = Math.min(50, Math.max(1, Number(value) || 1));
    onChange({ target: { name: "leverageX", value: String(v) } });
  };

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 space-y-3">
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

        {/* SL % / SL $ / Risk % etc – keep yours */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">SL % / $</label>
          {/* you can keep your existing fields here */}
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
    </div>
  );
}
