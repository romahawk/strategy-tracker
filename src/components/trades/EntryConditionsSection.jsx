// src/components/EntryConditionsSection.jsx
import { useEffect, useMemo, useRef } from "react";
import { Layers } from "lucide-react";
import { entryStore } from "../../storage/entryStore";

const baseSelect =
  "w-full h-8 rounded-lg bg-[#0b1120] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

function selectBorder({ invalid, ranging }) {
  if (invalid) return "border border-rose-400/60";
  if (ranging) return "border border-yellow-400/70 ring-1 ring-yellow-400/30";
  return "border border-white/5";
}

function isEmptyValue(v) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

function makeSyntheticEvent(name, value) {
  return { target: { name, value } };
}

export default function EntryConditionsSection({
  form,
  onChange,
  strategyId,
  invalidFlags = {},
}) {
  const saveTimerRef = useRef(null);
  const sid = Number(strategyId);

  const fieldsForStrategy = useMemo(() => {
    const base = ["stTrend", "usdtTrend", "overlay", "ma200"];

    // Strategy 2 (special) keeps text inputs
    if (sid === 2) {
      return [...base, "chochBos15m", "overlay1m", "bos1m", "ma2001m"];
    }

    // All other strategies (including newly created) use 5m selectors in current UI
    return [...base, "buySell5m", "ma2005m"];
  }, [sid]);

  const show5mFields = fieldsForStrategy.includes("buySell5m") || fieldsForStrategy.includes("ma2005m");
  const showStrategy2Extras = fieldsForStrategy.includes("chochBos15m");

  // On strategy change: ensure entry defaults exist and smart-apply to form (only empty fields).
  useEffect(() => {
    if (!Number.isFinite(sid)) return;

    const def = entryStore.ensureDefaults(sid);
    const legacy = def?.meta?.legacyForm || {};

    fieldsForStrategy.forEach((key) => {
      const current = form?.[key];
      const next = legacy?.[key];

      // Only populate if current form value is empty; do NOT override user-entered values.
      if (isEmptyValue(current) && !isEmptyValue(next)) {
        onChange(makeSyntheticEvent(key, next));
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  // Persist helper: store the UI form fields as meta.legacyForm
  const persistLegacyForm = (nextForm) => {
    if (!Number.isFinite(sid)) return;

    const snapshot = {};
    for (const k of fieldsForStrategy) snapshot[k] = nextForm?.[k] ?? "";

    // Load current def (keeps long/short blocks) and update meta.legacyForm
    const current = entryStore.get(sid);
    const updated = {
      ...current,
      meta: {
        ...(current.meta || {}),
        legacyForm: snapshot,
      },
    };

    entryStore.set(sid, updated);
  };

  const schedulePersist = (nextForm) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistLegacyForm(nextForm);
    }, 200);
  };

  const handleChange = (e) => {
    const name = e?.target?.name;
    const value = e?.target?.value;

    // Update UI state upstream first
    onChange(e);

    // Build a "next" form snapshot for persistence
    const nextForm = { ...(form || {}), [name]: value };
    schedulePersist(nextForm);
  };

  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">Entry Conditions</h3>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 15m ST */}
        <Select
          label="15m ST"
          name="stTrend"
          value={form.stTrend}
          onChange={handleChange}
          className={selectBorder({ invalid: invalidFlags.stInvalid })}
          options={[
            ["bull", "Bull"],
            ["bear", "Bear"],
            ["ranging", "Ranging"],
          ]}
        />

        {/* 15m USDT.D */}
        <Select
          label="15m USDT.D"
          name="usdtTrend"
          value={form.usdtTrend}
          onChange={handleChange}
          className={selectBorder({ invalid: invalidFlags.usdtInvalid })}
          options={[
            ["bull", "Bull"],
            ["bear", "Bear"],
            ["ranging", "Ranging"],
          ]}
        />

        {/* Overlay */}
        <Select
          label="Overlay"
          name="overlay"
          value={form.overlay}
          onChange={handleChange}
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
          onChange={handleChange}
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

        {/* 5m fields for ALL non-2 strategies */}
        {show5mFields && (
          <>
            <Select
              label="5m Signal"
              name="buySell5m"
              value={form.buySell5m}
              onChange={handleChange}
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
              onChange={handleChange}
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

        {/* Strategy 2 extras (text inputs) */}
        {showStrategy2Extras && (
          <>
            <TextInput
              label="15m CHoCH/BoS"
              name="chochBos15m"
              value={form.chochBos15m}
              onChange={handleChange}
            />
            <TextInput
              label="1m Overlay"
              name="overlay1m"
              value={form.overlay1m}
              onChange={handleChange}
            />
            <TextInput
              label="1m BoS"
              name="bos1m"
              value={form.bos1m}
              onChange={handleChange}
            />
            <TextInput
              label="1m MA200"
              name="ma2001m"
              value={form.ma2001m}
              onChange={handleChange}
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
        {options.map(([val, lab]) => (
          <option key={val} value={val}>
            {lab}
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
