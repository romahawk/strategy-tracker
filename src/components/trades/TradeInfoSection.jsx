import { Calendar, Clock } from "lucide-react";

export default function TradeInfoSection({ form, onChange }) {
  const handlePercentChange = (value) => {
    // clamp 1..100
    const v = Math.min(100, Math.max(1, Number(value) || 1));
    onChange({ target: { name: "usedDepositPercent", value: String(v) } });
  };

  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Trade Info</h3>
      </div>

      {/* date + time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">Date</label>
          <input
            type="date"
            name="date"
            value={form.date || ""}
            onChange={onChange}
            className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time
          </label>
          <input
            type="time"
            name="time"
            value={form.time || ""}
            onChange={onChange}
            className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>
      </div>

      {/* pair + direction */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">Pair (e.g. EURUSD)</label>
          <input
            type="text"
            name="pair"
            value={form.pair || ""}
            onChange={onChange}
            placeholder="EURUSD / BTCUSDT"
            className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">Direction</label>
          <select
            name="direction"
            value={form.direction || "Long"}
            onChange={onChange}
            className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          >
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        </div>
      </div>

      {/* deposit + % of deposit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">Deposit ($)</label>
          <input
            type="number"
            name="deposit"
            value={form.deposit || ""}
            onChange={onChange}
            min={0}
            step="0.01"
            className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300">% of deposit</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              max={100}
              value={form.usedDepositPercent || "25"}
              onChange={(e) => handlePercentChange(e.target.value)}
              className="bg-[#0f172a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white w-20 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
            <span className="text-slate-300 text-xs">%</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={Number(form.usedDepositPercent || 25)}
            onChange={(e) => handlePercentChange(e.target.value)}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
