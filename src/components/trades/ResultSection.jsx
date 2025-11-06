// src/components/trades/ResultSection.jsx
import { BarChart3 } from "lucide-react";

export default function ResultSection({ form, onChange }) {
  return (
    <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
      <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Result
      </h3>
      <div className="grid grid-cols-2 gap-1">
        <select
          name="result"
          value={form.result}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
        >
          <option value="Open">Open (result unknown)</option>
          <option value="Win">Win</option>
          <option value="Loss">Loss</option>
          <option value="Break Even">Break Even</option>
        </select>
        <input
          disabled
          value={`Comm: ${form.commission ? `$${form.commission}` : ""}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
        <input
          disabled
          value={`TP Tot: ${form.tpTotal ? `$${form.tpTotal}` : ""}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
        <input
          disabled
          value={`PnL: ${form.pnl ? `$${form.pnl}` : ""}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
        <input
          disabled
          value={`Next Dep: ${form.nextDeposit ? `$${form.nextDeposit}` : ""}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
      </div>
    </div>
  );
}
