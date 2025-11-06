// src/components/trades/ResultSection.jsx
import { BarChart3 } from "lucide-react";

export default function ResultSection({ form, onChange }) {
  const baseInput =
    "bg-[#0f172a] border border-white/5 text-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50";
  const disabledInput =
    "bg-[#0f172a] border border-white/5 text-white/70 px-3 py-2 text-sm rounded-lg opacity-70";

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Result</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select
          name="result"
          value={form.result}
          onChange={onChange}
          className={baseInput}
        >
          <option value="Open">Open (result unknown)</option>
          <option value="Win">Win</option>
          <option value="Loss">Loss</option>
          <option value="Break Even">Break Even</option>
        </select>

        <input
          name="commission"
          type="number"
          step="0.01"
          value={form.commission || ""}
          onChange={onChange}
          placeholder="Comm: $"
          className={baseInput}
        />

        <input
          name="tpTotal"
          type="number"
          step="0.01"
          value={form.tpTotal || ""}
          onChange={onChange}
          placeholder="TP Tot: $"
          className={baseInput}
        />

        <input
          name="pnl"
          type="number"
          step="0.01"
          value={form.pnl || ""}
          onChange={onChange}
          placeholder="PnL: $"
          className={baseInput}
        />

        <input
          name="nextDeposit"
          type="number"
          step="0.01"
          value={form.nextDeposit || ""}
          onChange={onChange}
          placeholder="Next Dep: $"
          className={baseInput}
        />

        {/* optional notes / status could go here */}
        <input
          name="notes"
          type="text"
          value={form.notes || ""}
          onChange={onChange}
          placeholder="Notes / comment"
          className="col-span-2 bg-[#0f172a] border border-white/5 text-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        />
      </div>
    </div>
  );
}
