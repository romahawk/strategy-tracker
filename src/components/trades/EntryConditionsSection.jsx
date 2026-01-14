import { Layers } from "lucide-react";

const baseSelect =
  "w-full h-8 rounded-lg bg-[#0b1120] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

function selectBorder({ invalid, ranging }) {
  if (invalid) return "border border-rose-400/60";
  if (ranging) return "border border-yellow-400/70 ring-1 ring-yellow-400/30";
  return "border border-white/5";
}

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
        {/* 15m Overlay */}
        <Select
          label="Overlay"
          name="overlay"
          value={form.overlay}
          onChange={onChange}
          className={selectBorder({ invalid: invalidFlags.overlayInvalid })}
          options={[
            ["blue", "Blue"],
            ["red", "Red"],
            ["neutral", "Neutral"],
          ]}
        />

        {/* 15m MA200 */}
        <Select
          label="MA200"
          name="ma200"
          value={form.ma200}
          onChange={onChange}
          className={selectBorder({
            invalid: invalidFlags.ma200Invalid,
            ranging: form.ma200 === "ranging",
          })}
          options={[
            ["above", "Above"],
            ["below", "Below"],
            ["ranging", "Ranging"],
          ]}
        />

        {/* 15m USDT.D */}
        <Select
          label="15m USDT.D"
          name="usdtTrend"
          value={form.usdtTrend}
          onChange={onChange}
          className={selectBorder({ invalid: invalidFlags.usdtInvalid })}
          options={[
            ["bull", "Bull"],
            ["bear", "Bear"],
            ["ranging", "Ranging"],
          ]}
        />

        {(strategyId === 1 || strategyId === 3) && (
          <>
            {/* 5m Signal */}
            <Select
              label="5m Signal"
              name="buySell5m"
              value={form.buySell5m}
              onChange={onChange}
              className={selectBorder({
                invalid: invalidFlags.buySell5mInvalid,
              })}
              options={[
                ["buy", "Buy"],
                ["sell", "Sell"],
              ]}
            />

            {/* 5m MA200 */}
            <Select
              label="5m MA200"
              name="ma2005m"
              value={form.ma2005m}
              onChange={onChange}
              className={selectBorder({
                invalid: invalidFlags.ma2005mInvalid,
                ranging: form.ma2005m === "ranging",
              })}
              options={[
                ["above", "Above"],
                ["below", "Below"],
                ["ranging", "Ranging"],
              ]}
            />
          </>
        )}

        {/* Strategy 2 extras — updated */}
        {strategyId === 2 && (
          <>
            {/* 15m CHoCH/BoS */}
            <Select
              label="15m CHoCH/BoS"
              name="chochBos15m"
              value={form.chochBos15m}
              onChange={onChange}
              className={selectBorder({ invalid: invalidFlags.chochBos15mInvalid })}
              options={[
                ["bull", "Bull CHoCH"],
                ["bull", "Bull BoS"],
                ["bear", "Bear CHoCH"],
                ["bear", "Bear BoS"],
              ]}
            />

            {/* 1m ST */}
            <Select
              label="1m ST"
              name="st1m"
              value={form.st1m}
              onChange={onChange}
              className={selectBorder({ invalid: invalidFlags.st1mInvalid })}
              options={[
                ["bull", "Bull"],
                ["bear", "Bear"],
              ]}
            />

            {/* 1m MA200 */}
            <Select
              label="1m MA200"
              name="ma2001m"
              value={form.ma2001m}
              onChange={onChange}
              className={selectBorder({
                invalid: invalidFlags.ma2001mInvalid,
                ranging: form.ma2001m === "ranging",
              })}
              options={[
                ["above", "Above"],
                ["below", "Below"],
                ["ranging", "Ranging"],
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Small helpers ---------- */

function Select({ label, name, value, onChange, options, className }) {
  return (
    <div>
      <label className="text-[11px] text-slate-300 mb-1 block">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`${baseSelect} ${className}`}
      >
        {options.map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextInput({ label, name, value, onChange }) {
  return (
    <div>
      <label className="text-[11px] text-slate-300 mb-1 block">{label}</label>
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`${baseSelect} border border-white/5`}
      />
    </div>
  );
}
