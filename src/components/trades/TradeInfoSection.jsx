// src/components/trades/TradeInfoSection.jsx
import { CalendarDays } from "lucide-react";

export default function TradeInfoSection({ form, onChange, strategyId }) {
  return (
    <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
      <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
        <CalendarDays className="w-5 h-5" /> Trade Info
      </h3>
      <div className="grid grid-cols-2 gap-1">
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          required
        />
        <input
          name="time"
          type="time"
          value={form.time}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          required
        />
        <input
          name="pair"
          placeholder="Pair (e.g. EURUSD)"
          value={form.pair}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          required
        />
        <select
          name="direction"
          value={form.direction}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
        >
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>

        <input
          name="deposit"
          type="number"
          placeholder="Depo $"
          value={form.deposit}
          onChange={onChange}
          className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
          min="0"
          step="0.01"
          required
        />

        {(strategyId === 1 || strategyId === 2) ? (
          <select
            name="usedDepositPercent"
            value={form.usedDepositPercent}
            onChange={onChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            title="% of deposit used for position size"
          >
            {[10, 15, 20, 25, 33, 50, 75, 100].map((p) => (
              <option key={p} value={p}>
                {p}% of deposit
              </option>
            ))}
          </select>
        ) : (
          <div className="hidden md:block" />
        )}
      </div>
    </div>
  );
}
