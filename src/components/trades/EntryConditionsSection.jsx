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

  const baseSelect =
    "bg-[#0f172a] border border-white/5 text-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/50";

  const errorSelect =
    "bg-[#0f172a] border border-red-500/70 text-white px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50";

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Entry Conditions</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 15m ST */}
        <select
          name="stTrend"
          value={form.stTrend}
          onChange={onChange}
          className={stInvalid ? errorSelect : baseSelect}
        >
          <option value="bull">15m ST: Bull</option>
          <option value="bear">15m ST: Bear</option>
        </select>

        {/* 15m USDT.D */}
        <select
          name="usdtTrend"
          value={form.usdtTrend}
          onChange={onChange}
          className={usdtInvalid ? errorSelect : baseSelect}
        >
          <option value="bull">15m USDT.D: Bull</option>
          <option value="bear">15m USDT.D: Bear</option>
        </select>

        {/* Overlay */}
        <select
          name="overlay"
          value={form.overlay}
          onChange={onChange}
          className={overlayInvalid ? errorSelect : baseSelect}
        >
          <option value="blue">Overlay: Blue</option>
          <option value="red">Overlay: Red</option>
        </select>

        {/* MA200 */}
        <select
          name="ma200"
          value={form.ma200}
          onChange={onChange}
          className={ma200Invalid ? errorSelect : baseSelect}
        >
          <option value="above">MA200: Above</option>
          <option value="below">MA200: Below</option>
          <option value="ranging">MA200: Ranging</option>
        </select>

        {/* Strategy-specific */}
        {strategyId === 1 && (
          <>
            <select
              name="buySell5m"
              value={form.buySell5m}
              onChange={onChange}
              className={buySell5mInvalid ? errorSelect : baseSelect}
              title="5m signal: Buy/Sell"
            >
              <option value="buy">5m Signal: Buy</option>
              <option value="sell">5m Signal: Sell</option>
            </select>

            <select
              name="ma2005m"
              value={form.ma2005m}
              onChange={onChange}
              className={ma2005mInvalid ? errorSelect : baseSelect}
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
              className={baseSelect}
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
              className={baseSelect}
            >
              <option value="">1m Overlay</option>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
            </select>
            <select
              name="bos1m"
              value={form.bos1m}
              onChange={onChange}
              className={baseSelect}
            >
              <option value="">1m BoS</option>
              <option value="bull BoS">Bull BoS</option>
              <option value="bear BoS">Bear BoS</option>
            </select>
            <select
              name="ma2001m"
              value={form.ma2001m}
              onChange={onChange}
              className={baseSelect}
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
