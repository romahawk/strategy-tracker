// src/components/trades/ChartSection.jsx
import { LineChart } from "lucide-react";

export default function ChartSection({ form, onChange }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <LineChart className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Chart</h3>
      </div>

      <input
        name="screenshot"
        type="url"
        placeholder="https://imgsh.net/i/chartid"
        value={form.screenshot || ""}
        onChange={onChange}
        className="bg-[#0f172a] border border-white/5 text-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        pattern="https?://.*"
        title="Enter a valid URL starting with http(s)://"
      />

      {form.screenshot ? (
        <img
          src={form.screenshot}
          alt="Chart"
          className="rounded-lg border border-white/5 max-h-40 object-contain bg-black/20"
        />
      ) : null}
    </div>
  );
}
