// src/components/trades/TargetsSection.jsx
import { Target as TargetIcon } from "lucide-react";

export default function TargetsSection({ form, onChange }) {
  const baseInput =
    "bg-[#0f172a] border border-white/5 text-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50";
  const disabledInput =
    "bg-[#0f172a] border border-white/5 text-white/70 px-3 py-2 text-sm rounded-lg opacity-70";

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <TargetIcon className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Targets</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <select
          name="tpsHit"
          value={form.tpsHit}
          onChange={onChange}
          className={baseInput}
        >
          <option value="OPEN">Not closed yet</option>
          <option value="3">3 TPs</option>
          <option value="2">2 TPs</option>
          <option value="SL">SL</option>
        </select>

        <input
          disabled
          value={`SL %: ${form.slPercent ?? ""}`}
          className={disabledInput}
        />
        <input
          disabled
          value={`SL $: ${form.slDollar ? `$${form.slDollar}` : ""}`}
          className={disabledInput}
        />

        {/* TP1 */}
        <input
          name="tp1"
          type="number"
          placeholder="TP1"
          value={form.tp1}
          onChange={onChange}
          className={baseInput}
          min="0"
          step="0.00001"
        />
        <input
          disabled
          value={`TP1 %: ${form.tp1Percent ?? ""}`}
          className={disabledInput}
        />
        <input
          disabled
          value={`TP1 $: ${form.tp1Dollar ? `$${form.tp1Dollar}` : ""}`}
          className={disabledInput}
        />

        {/* TP2 */}
        <input
          name="tp2"
          type="number"
          placeholder="TP2"
          value={form.tp2}
          onChange={onChange}
          className={baseInput}
          min="0"
          step="0.00001"
        />
        <input
          disabled
          value={`TP2 %: ${form.tp2Percent ?? ""}`}
          className={disabledInput}
        />
        <input
          disabled
          value={`TP2 $: ${form.tp2Dollar ? `$${form.tp2Dollar}` : ""}`}
          className={disabledInput}
        />

        {/* TP3 */}
        <input
          name="tp3"
          type="number"
          placeholder="TP3"
          value={form.tp3}
          onChange={onChange}
          className={baseInput}
          min="0"
          step="0.00001"
        />
        <input
          disabled
          value={`TP3 %: ${form.tp3Percent ?? ""}`}
          className={disabledInput}
        />
        <input
          disabled
          value={`TP3 $: ${form.tp3Dollar ? `$${form.tp3Dollar}` : ""}`}
          className={disabledInput}
        />
      </div>
    </div>
  );
}
