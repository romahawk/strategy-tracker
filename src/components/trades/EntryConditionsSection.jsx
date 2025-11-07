import { Layers } from "lucide-react";

export default function EntryConditionsSection({
  form,
  onChange,
  strategyId,
  invalidFlags = {},
}) {
  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">
          Entry Conditions
        </h3>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 15m ST */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">
            15m ST
          </label>
          <select
            name="stTrend"
            value={form.stTrend}
            onChange={onChange}
            className={`w-full h-8 rounded-lg bg-[#0b1120] border ${
              invalidFlags.stInvalid ? "border-rose-400/60" : "border-white/5"
            } px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
          >
            <option value="bull">Bull</option>
            <option value="bear">Bear</option>
            <option value="ranging">Ranging</option>
          </select>
        </div>

        {/* 15m USDT.D */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">
            15m USDT.D
          </label>
          <select
            name="usdtTrend"
            value={form.usdtTrend}
            onChange={onChange}
            className={`w-full h-8 rounded-lg bg-[#0b1120] border ${
              invalidFlags.usdtInvalid ? "border-rose-400/60" : "border-white/5"
            } px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
          >
            <option value="bull">Bull</option>
            <option value="bear">Bear</option>
            <option value="ranging">Ranging</option>
          </select>
        </div>

        {/* Overlay */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">
            Overlay
          </label>
          <select
            name="overlay"
            value={form.overlay}
            onChange={onChange}
            className={`w-full h-8 rounded-lg bg-[#0b1120] border ${
              invalidFlags.overlayInvalid
                ? "border-rose-400/60"
                : "border-white/5"
            } px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
          >
            <option value="blue">Blue</option>
            <option value="red">Red</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>

        {/* MA200 */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">
            MA200
          </label>
          <select
            name="ma200"
            value={form.ma200}
            onChange={onChange}
            className={`w-full h-8 rounded-lg bg-[#0b1120] border ${
              invalidFlags.ma200Invalid ? "border-rose-400/60" : "border-white/5"
            } px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
          >
            <option value="above">Above</option>
            <option value="below">Below</option>
            <option value="ranging">Ranging</option>
          </select>
        </div>

        {/* Strategy 1 extras */}
        {strategyId === 1 && (
          <>
            <div>
              <label className="text-[11px] text-slate-300 mb-1 block">
                5m Signal
              </label>
              <select
                name="buySell5m"
                value={form.buySell5m}
                onChange={onChange}
                className={`w-full h-8 rounded-lg bg-[#0b1120] border ${
                  invalidFlags.buySell5mInvalid
                    ? "border-rose-400/60"
                    : "border-white/5"
                } px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-300 mb-1 block">
                5m MA200
              </label>
              <select
                name="ma2005m"
                value={form.ma2005m}
                onChange={onChange}
                className={`w-full h-8 rounded-lg bg-[#0b1120] border ${
                  invalidFlags.ma2005mInvalid
                    ? "border-rose-400/60"
                    : "border-white/5"
                } px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40`}
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
          </>
        )}

        {/* Strategy 2 extras */}
        {strategyId === 2 && (
          <>
            <div>
              <label className="text-[11px] text-slate-300 mb-1 block">
                15m CHoCH/BoS
              </label>
              <input
                type="text"
                name="chochBos15m"
                value={form.chochBos15m || ""}
                onChange={onChange}
                className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                placeholder="e.g. BoS up"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-300 mb-1 block">
                1m Overlay
              </label>
              <input
                type="text"
                name="overlay1m"
                value={form.overlay1m || ""}
                onChange={onChange}
                className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-300 mb-1 block">
                1m BoS
              </label>
              <input
                type="text"
                name="bos1m"
                value={form.bos1m || ""}
                onChange={onChange}
                className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-300 mb-1 block">
                1m MA200
              </label>
              <input
                type="text"
                name="ma2001m"
                value={form.ma2001m || ""}
                onChange={onChange}
                className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
