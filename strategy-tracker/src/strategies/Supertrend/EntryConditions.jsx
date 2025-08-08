export default function EntryConditions({ form, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      <select
        name="stTrend"
        value={form.stTrend}
        onChange={onChange}
        className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
      >
        <option value="bull">15m ST Bull</option>
        <option value="bear">15m ST Bear</option>
      </select>
      <select
        name="usdtTrend"
        value={form.usdtTrend}
        onChange={onChange}
        className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
      >
        <option value="bull">15m USDT.D ST Bull</option>
        <option value="bear">15m USDT.D ST Bear</option>
      </select>
      <select
        name="overlay"
        value={form.overlay}
        onChange={onChange}
        className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
      >
        <option value="blue">15m Overlay Blue</option>
        <option value="red">15m Overlay Red</option>
      </select>
      <select
        name="ma200"
        value={form.ma200}
        onChange={onChange}
        className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
      >
        <option value="above">15m MA 200 Above</option>
        <option value="below">15m MA 200 Below</option>
      </select>
    </div>
  );
}