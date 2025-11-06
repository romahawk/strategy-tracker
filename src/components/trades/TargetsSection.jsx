// src/components/trades/TargetsSection.jsx
import { Target as TargetIcon } from "lucide-react";

export default function TargetsSection({ form, onChange }) {
  return (
    <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
      <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
        <TargetIcon className="w-5 h-5" /> Targets
      </h3>
      <div className="grid grid-cols-2 gap-1">
        <select
          name="tpsHit"
          value={form.tpsHit}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
        >
          <option value="OPEN">Not closed yet</option>
          <option value="3">3 TPs</option>
          <option value="2">2 TPs</option>
          <option value="SL">SL</option>
        </select>
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
          name="tp1"
          type="number"
          placeholder="TP1"
          value={form.tp1}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          min="0"
          step="0.00001"
        />
        <input
          disabled
          value={`TP1 %: ${form.tp1Percent}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
        <input
          disabled
          value={`TP1 $: ${form.tp1Dollar ? `$${form.tp1Dollar}` : ""}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />

        <input
          name="tp2"
          type="number"
          placeholder="TP2"
          value={form.tp2}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          min="0"
          step="0.00001"
        />
        <input
          disabled
          value={`TP2 %: ${form.tp2Percent}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
        <input
          disabled
          value={`TP2 $: ${form.tp2Dollar ? `$${form.tp2Dollar}` : ""}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />

        <input
          name="tp3"
          type="number"
          placeholder="TP3"
          value={form.tp3}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          min="0"
          step="0.00001"
        />
        <input
          disabled
          value={`TP3 %: ${form.tp3Percent}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
        <input
          disabled
          value={`TP3 $: ${form.tp3Dollar ? `$${form.tp3Dollar}` : ""}`}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
        />
      </div>
    </div>
  );
}
