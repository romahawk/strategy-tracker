// src/components/trades/EntryConditionsSection.jsx
import { Layers } from "lucide-react";

export default function EntryConditionsSection({
  form,
  onChange,
  strategyId,
  invalidFlags,
}) {
  const {
    stInvalid,
    usdtInvalid,
    overlayInvalid,
    ma200Invalid,
    buySell5mInvalid,
    ma2005mInvalid,
  } = invalidFlags;

  return (
    <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
      <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
        <Layers className="w-5 h-5" /> Entry Conditions
      </h3>
      <div className="grid grid-cols-2 gap-1">
        {/* 15m ST */}
        <select
          name="stTrend"
          value={form.stTrend}
          onChange={onChange}
          className={`bg-[#1e293b] p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none ${
            stInvalid ? "border border-red-500 ring-1 ring-red-500" : "border border-gray-600"
          }`}
        >
          <option value="bull">15m ST: Bull</option>
          <option value="bear">15m ST: Bear</option>
        </select>

        {/* 15m USDT.D */}
        <select
          name="usdtTrend"
          value={form.usdtTrend}
          onChange={onChange}
          className={`bg-[#1e293b] p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none ${
            usdtInvalid ? "border border-red-500 ring-1 ring-red-500" : "border border-gray-600"
          }`}
        >
          <option value="bull">15m USDT.D: Bull</option>
          <option value="bear">15m USDT.D: Bear</option>
        </select>

        {/* Overlay */}
        <select
          name="overlay"
          value={form.overlay}
          onChange={onChange}
          className={`bg-[#1e293b] p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none ${
            overlayInvalid ? "border border-red-500 ring-1 ring-red-500" : "border border-gray-600"
          }`}
        >
          <option value="blue">Overlay: Blue</option>
          <option value="red">Overlay: Red</option>
        </select>

        {/* MA200 */}
        <select
          name="ma200"
          value={form.ma200}
          onChange={onChange}
          className={`bg-[#1e293b] p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none ${
            ma200Invalid ? "border border-red-500 ring-1 ring-red-500" : "border border-gray-600"
          }`}
        >
          <option value="above">MA200: Above</option>
          <option value="below">MA200: Below</option>
          <option value="ranging">MA200: Ranging</option>
        </select>

        {strategyId === 1 && (
          <>
            {/* 5m signal */}
            <select
              name="buySell5m"
              value={form.buySell5m}
              onChange={onChange}
              className={`bg-[#1e293b] p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none ${
                buySell5mInvalid
                  ? "border border-red-500 ring-1 ring-red-500"
                  : "border border-gray-600"
              }`}
              title="5m signal: Buy/Sell"
            >
              <option value="buy">5m Signal: Buy</option>
              <option value="sell">5m Signal: Sell</option>
            </select>

            {/* 5m MA200 */}
            <select
              name="ma2005m"
              value={form.ma2005m}
              onChange={onChange}
              className={`bg-[#1e293b] p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none ${
                ma2005mInvalid
                  ? "border border-red-500 ring-1 ring-red-500"
                  : "border border-gray-600"
              }`}
              title="5m MA200 position"
            >
              <option value="above">5m MA200: Above</option>
              <option value="below">5m MA200: Below</option>
              <option value="ranging">5m MA200: Ranging</option>
            </select>
          </>
        )}

        {strategyId === 2 && (
          <>
            <select
              name="chochBos15m"
              value={form.chochBos15m}
              onChange={onChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="">15m CHoCH/BoS</option>
              <option value="bull CHoCH">Bull CHoCH</option>
              <option value="bull BoS">Bull BoS</option>
              <option value="bear CHoCH">Bear CHoCH</option>
              <option value="bear BoS">Bear BoS</option>
            </select>
            <select
              name="overlay1m"
              value={form.overlay1m}
              onChange={onChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="">1m Overlay</option>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
            </select>
            <select
              name="bos1m"
              value={form.bos1m}
              onChange={onChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="">1m BoS</option>
              <option value="bull BoS">Bull BoS</option>
              <option value="bear BoS">Bear BoS</option>
            </select>
            <select
              name="ma2001m"
              value={form.ma2001m}
              onChange={onChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="">1m MA200</option>
              <option value="above">Above</option>
              <option value="below">Below</option>
              <option value="ranging">Ranging</option>
            </select>
          </>
        )}
      </div>
    </div>
  );
}
