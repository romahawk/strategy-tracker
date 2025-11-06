// src/components/trades/RiskSetupSection.jsx
import { Shield } from "lucide-react";

export default function RiskSetupSection({
  form,
  onChange,
  strategyId,
  riskTooHigh,
}) {
  return (
    <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
      <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
        <Shield className="w-5 h-5" /> Risk Setup
      </h3>
      <div className="grid grid-cols-2 gap-1">
        <input
          name="entry"
          type="number"
          placeholder="Entry"
          value={form.entry}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          min="0"
          step="0.00001"
          required
        />
        <input
          name="sl"
          type="number"
          placeholder="SL (price)"
          value={form.sl}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          min="0"
          step="0.00001"
          required
        />

        {(strategyId === 1 || strategyId === 2) ? (
          <>
            <select
              name="leverageX"
              value={form.leverageX}
              onChange={onChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              title="Leverage multiplier"
            >
              {[1, 2, 3, 5, 10, 15, 20].map((x) => (
                <option key={x} value={x}>
                  Leverage ×{x}
                </option>
              ))}
            </select>
            <input
              disabled
              value={`Lev $: ${form.leverageAmount || "-"}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
          </>
        ) : (
          <>
            <input
              name="riskTargetPercent"
              type="number"
              placeholder="Risk %"
              value={form.riskTargetPercent}
              onChange={onChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              min="0"
              step="0.1"
            />
            <input
              disabled
              value={`Lots: ${form.lots || "-"}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`Pip $/lot: ${form.pipValue || "-"}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
          </>
        )}

        <input
          disabled
          value={`SL %: ${form.slPercent}%`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
        <input
          disabled
          value={`SL $: $${form.slDollar}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
        <input
          disabled
          value={`Risk %: ${form.riskPercent}%`}
          className={`bg-[#1e293b] p-1 rounded opacity-70 focus:outline-none ${
            riskTooHigh
              ? "border border-red-500 ring-1 ring-red-500 text-red-300"
              : "border border-gray-600 text-white"
          }`}
          title={riskTooHigh ? "Risk per trade exceeds 10% of deposit" : ""}
        />
      </div>
    </div>
  );
}
