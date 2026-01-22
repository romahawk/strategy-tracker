import { useState } from "react";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";

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
  const isFxLike = strategyId === 3 || strategyId === 4;
  const [showExtras, setShowExtras] = useState(false);

  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">
          Entry Conditions
        </h3>
      </div>

      {/* Primary conditions (existing) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
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

        {(strategyId === 1 || isFxLike) && (
          <>
            <Select
              label="5m Signal"
              name="buySell5m"
              value={form.buySell5m}
              onChange={onChange}
              className={selectBorder({ invalid: invalidFlags.buySell5mInvalid })}
              options={[
                ["buy", "Buy"],
                ["sell", "Sell"],
              ]}
            />

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

        {strategyId === 2 && (
          <>
            <Select
              label="15m CHoCH/BoS"
              name="chochBos15m"
              value={form.chochBos15m}
              onChange={onChange}
              className={selectBorder({
                invalid: invalidFlags.chochBos15mInvalid,
              })}
              options={[
                ["bull_choch", "Bull CHoCH"],
                ["bull_bos", "Bull BoS"],
                ["bear_choch", "Bear CHoCH"],
                ["bear_bos", "Bear BoS"],
              ]}
            />

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

        {strategyId === 4 && (
          <Select
            label="1m BoS"
            name="bos1m"
            value={form.bos1m}
            onChange={onChange}
            className={selectBorder({ invalid: invalidFlags.bos1mInvalid })}
            options={[
              ["bull", "Bull BoS"],
              ["bear", "Bear BoS"],
            ]}
          />
        )}
      </div>

      {/* Extras toggle */}
      <button
        type="button"
        onClick={() => setShowExtras((v) => !v)}
        className="mt-4 w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 transition"
      >
        <div className="flex items-center gap-2">
          {showExtras ? (
            <ChevronDown className="w-4 h-4 text-slate-200" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-200" />
          )}
          <span className="text-sm font-medium text-slate-100">
            Extra Confluences
          </span>
          <span className="text-[11px] text-slate-400">(optional)</span>
        </div>

        <span className="text-[11px] text-slate-400">
          {showExtras ? "Hide" : "Show"}
        </span>
      </button>

      {/* Extras */}
      {showExtras && (
        <div className="mt-3 border border-white/10 rounded-xl p-3 bg-black/10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select
              label="Session"
              name="session"
              value={form.session || "ny"}
              onChange={onChange}
              className={selectBorder({ invalid: invalidFlags.sessionInvalid })}
              options={[
                ["asia", "Asia"],
                ["london", "London"],
                ["ny", "NY"],
                ["off", "Off-hours"],
              ]}
            />

            <Select
              label="Structure"
              name="structure"
              value={form.structure || "na"}
              onChange={onChange}
              className={selectBorder({
                invalid: invalidFlags.structureInvalid,
              })}
              options={[
                ["bullish", "Bullish"],
                ["bearish", "Bearish"],
                ["mixed", "Mixed / unclear"],
                ["na", "N/A"],
              ]}
            />

            <Select
              label="Liquidity sweep"
              name="liquiditySweep"
              value={form.liquiditySweep || "na"}
              onChange={onChange}
              className={selectBorder({
                invalid: invalidFlags.liquiditySweepInvalid,
              })}
              options={[
                ["yes", "Yes"],
                ["no", "No"],
                ["na", "N/A"],
              ]}
            />

            <Select
              label="Retest / OTE"
              name="oteRetest"
              value={form.oteRetest || "na"}
              onChange={onChange}
              className={selectBorder({
                invalid: invalidFlags.oteRetestInvalid,
              })}
              options={[
                ["yes", "Yes"],
                ["no", "No"],
                ["na", "N/A"],
              ]}
            />

            <Select
              label="News risk"
              name="newsRisk"
              value={form.newsRisk || "none"}
              onChange={onChange}
              className={selectBorder({ invalid: invalidFlags.newsRiskInvalid })}
              options={[
                ["none", "None"],
                ["medium", "Medium"],
                ["high", "High"],
              ]}
            />
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Extras are optional for now. Later we can mark some as required per
            strategy and feed them into the Execution Gate.
          </p>
        </div>
      )}
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
        {options.map(([val, lbl]) => (
          <option key={val} value={val}>
            {lbl}
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
