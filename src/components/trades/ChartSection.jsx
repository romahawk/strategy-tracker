// src/components/trades/ChartSection.jsx
import { LineChart } from "lucide-react";

export default function ChartSection({ form, onChange }) {
  return (
    <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
      <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
        <LineChart className="w-5 h-5" /> Chart
      </h3>
      <div className="grid grid-cols-1 gap-2">
        <input
          name="screenshot"
          type="url"
          placeholder="https://imgsh.net/i/dcc85420eb"
          value={form.screenshot}
          onChange={onChange}
          className="bg-[#0f172a] border border-gray-600 text-white p-2 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          pattern="https?://.*"
          title="Enter a valid URL starting with http(s)://"
        />
        {form.screenshot && (
          <img
            src={form.screenshot}
            alt="Chart"
            className="mt-1 rounded max-h-32 object-contain"
          />
        )}
      </div>
    </div>
  );
}
