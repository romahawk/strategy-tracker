import { useState, useMemo } from "react";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";

const baseSelect =
  "w-full h-8 rounded-lg bg-[#0b1120] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

function selectBorder({ invalid, ranging }) {
  if (invalid) return "border border-rose-400/60";
  if (ranging) return "border border-yellow-400/70 ring-1 ring-yellow-400/30";
  return "border border-white/5";
}

function alertWrapClass(violated) {
  return violated
    ? "rounded-xl p-2 bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-transparent border border-rose-500/25"
    : "";
}

/**
 * Direction-aware confluence violations.
 * Flags clear opposites as "violated".
 * Neutral / ranging values are not hard violations.
 *
 * UPDATED per your rules:
 * - USDT.D: Long => Bear, Short => Bull
 * - 5m Signal: Long => Buy, Short => Sell
 * - 5m MA200: Long => Above, Short => Below
 */
function getViolationFlags(form) {
  const dir = String(form?.direction || "Long"); // "Long" | "Short"
  const isLong = dir === "Long";

  const overlay = form?.overlay; // blue/red/neutral
  const ma200 = form?.ma200; // above/below/ranging
  const usdt = form?.usdtTrend; // bull/bear/ranging
  const st15m = form?.stTrend; // bull/bear

  const sig5m = form?.buySell5m; // buy/sell
  const ma2005m = form?.ma2005m; // above/below/ranging

  // Overlay: Long wants blue; Short wants red
  const overlayViolated =
    overlay === "neutral" || !overlay
      ? false
      : isLong
      ? overlay === "red"
      : overlay === "blue";

  // MA200: Long wants above; Short wants below
  const ma200Violated =
    ma200 === "ranging" || !ma200
      ? false
      : isLong
      ? ma200 === "below"
      : ma200 === "above";

  // USDT.D UPDATED: Long wants BEAR; Short wants BULL
  const usdtViolated =
    usdt === "ranging" || !usdt
      ? false
      : isLong
      ? usdt === "bull"
      : usdt === "bear";

  // 15m ST: Long wants bull; Short wants bear
  const st15mViolated = !st15m
    ? false
    : isLong
    ? st15m === "bear"
    : st15m === "bull";

  // 5m Signal UPDATED: Long wants buy; Short wants sell
  const sig5mViolated = !sig5m
    ? false
    : isLong
    ? sig5m === "sell"
    : sig5m === "buy";

  // 5m MA200 UPDATED: Long wants above; Short wants below
  const ma2005mViolated =
    ma2005m === "ranging" || !ma2005m
      ? false
      : isLong
      ? ma2005m === "below"
      : ma2005m === "above";

  return {
    overlayViolated,
    ma200Violated,
    usdtViolated,
    st15mViolated,
    sig5mViolated,
    ma2005mViolated,
  };
}

export default function EntryConditionsSection({
  form,
  onChange,
  strategyId,
  invalidFlags = {},
}) {
  const isFxLike = strategyId === 3 || strategyId === 4;
  const [showExtras, setShowExtras] = useState(false);

  const v = useMemo(() => getViolationFlags(form), [form]);

  return (
    <Card variant="secondary" className="p-2">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">
          Entry Conditions
        </h3>
      </div>

      {/* Primary conditions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 15m ST field for 15m ST strategy (assumed strategyId === 1) */}
        {strategyId === 1 && (
          <div className={alertWrapClass(v.st15mViolated)}>
            <Select
              label="15m ST"
              name="stTrend"
              value={form.stTrend}
              onChange={onChange}
              className={selectBorder({ invalid: v.st15mViolated })}
              options={[
                ["bull", "Bull"],
                ["bear", "Bear"],
              ]}
            />
          </div>
        )}

        <div className={alertWrapClass(v.overlayViolated)}>
          <Select
            label="Overlay"
            name="overlay"
            value={form.overlay}
            onChange={onChange}
            className={selectBorder({
              invalid: invalidFlags.overlayInvalid || v.overlayViolated,
            })}
            options={[
              ["blue", "Blue"],
              ["red", "Red"],
              ["neutral", "Neutral"],
            ]}
          />
        </div>

        <div className={alertWrapClass(v.ma200Violated)}>
          <Select
            label="MA200"
            name="ma200"
            value={form.ma200}
            onChange={onChange}
            className={selectBorder({
              invalid: invalidFlags.ma200Invalid || v.ma200Violated,
              ranging: form.ma200 === "ranging",
            })}
            options={[
              ["above", "Above"],
              ["below", "Below"],
              ["ranging", "Ranging"],
            ]}
          />
        </div>

        <div className={alertWrapClass(v.usdtViolated)}>
          <Select
            label="15m USDT.D"
            name="usdtTrend"
            value={form.usdtTrend}
            onChange={onChange}
            className={selectBorder({
              invalid: invalidFlags.usdtInvalid || v.usdtViolated,
              ranging: form.usdtTrend === "ranging",
            })}
            options={[
              ["bull", "Bull"],
              ["bear", "Bear"],
              ["ranging", "Ranging"],
            ]}
          />
        </div>

        {(strategyId === 1 || isFxLike) && (
          <>
            <div className={alertWrapClass(v.sig5mViolated)}>
              <Select
                label="5m Signal"
                name="buySell5m"
                value={form.buySell5m}
                onChange={onChange}
                className={selectBorder({
                  invalid: invalidFlags.buySell5mInvalid || v.sig5mViolated,
                })}
                options={[
                  ["buy", "Buy"],
                  ["sell", "Sell"],
                ]}
              />
            </div>

            <div className={alertWrapClass(v.ma2005mViolated)}>
              <Select
                label="5m MA200"
                name="ma2005m"
                value={form.ma2005m}
                onChange={onChange}
                className={selectBorder({
                  invalid: invalidFlags.ma2005mInvalid || v.ma2005mViolated,
                  ranging: form.ma2005m === "ranging",
                })}
                options={[
                  ["above", "Above"],
                  ["below", "Below"],
                  ["ranging", "Ranging"],
                ]}
              />
            </div>
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
              className={selectBorder({
                invalid: invalidFlags.st1mInvalid,
              })}
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
    </Card>
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
