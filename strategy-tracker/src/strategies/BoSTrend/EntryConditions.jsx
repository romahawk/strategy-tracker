export default function EntryConditions({ form, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      <select
        name="bosTrend"
        value={form.bosTrend || ""}
        onChange={onChange}
        className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
      >
        <option value="">Select 15m BoS/CHoCH</option>
        <option value="bull">15m BoS Bull, CHoCH Bull</option>
        <option value="bear">15m BoS Bear, CHoCH Bear</option>
      </select>
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
        name="ma200"
        value={form.ma200}
        onChange={onChange}
        className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
      >
        <option value="above">15m MA 200 Above</option>
        <option value="below">15m MA 200 Below</option>
      </select>
      <select
        name="peakType"
        value={form.peakType || ""}
        onChange={onChange}
        className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
      >
        <option value="">Select 15m Peak</option>
        <option value="HL">15m Peak HL</option>
        <option value="LH">15m Peak LH</option>
        <option value="HH">15m Peak HH</option>
        <option value="LL">15m Peak LL</option>
      </select>
      <select
        name="bos1mTrend"
        value={form.bos1mTrend || ""}
        onChange={onChange}
        className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
      >
        <option value="">Select 1m BoS</option>
        <option value="bull">1m BoS Bull</option>
        <option value="bear">1m BoS Bear</option>
      </select>
    </div>
  );
}