import { useEffect, useMemo, useState } from "react";
import { Layers, Pencil } from "lucide-react";
import { Card } from "../../../components/ui/Card";

import { loadEntryConfig } from "../storage";
import { CONDITION_TEMPLATES } from "../templates";
import EntryConditionsBuilderModal from "./EntryConditionsBuilderModal";

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

// Keeps your existing “decision enforcement” semantics:
// Long vs Short mismatch → violation highlight.
function getViolationFlags(form) {
  const dir = String(form?.direction || "Long");
  const isLong = dir === "Long";

  const overlay = form?.overlay;
  const ma200 = form?.ma200;
  const usdt = form?.usdtTrend;
  const st15m = form?.stTrend;

  const sig5m = form?.buySell5m;
  const ma2005m = form?.ma2005m;

  const overlayViolated =
    overlay === "neutral" || !overlay
      ? false
      : isLong
      ? overlay === "red"
      : overlay === "blue";

  const ma200Violated =
    ma200 === "ranging" || !ma200
      ? false
      : isLong
      ? ma200 === "below"
      : ma200 === "above";

  // USDT.D: Long => Bear, Short => Bull
  const usdtViolated =
    usdt === "ranging" || !usdt
      ? false
      : isLong
      ? usdt === "bull"
      : usdt === "bear";

  // 15m ST: Long => Bull, Short => Bear
  const st15mViolated = !st15m
    ? false
    : isLong
    ? st15m === "bear"
    : st15m === "bull";

  // 5m Signal: Long => Buy, Short => Sell
  const sig5mViolated = !sig5m
    ? false
    : isLong
    ? sig5m === "sell"
    : sig5m === "buy";

  // 5m MA200: Long => Above, Short => Below
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

export default function EntryConditionsSection({
  form,
  onChange,
  strategyId,
  invalidFlags = {},
}) {
  const sid = Number(strategyId) || 1;

  const [config, setConfig] = useState(() => loadEntryConfig(sid));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setConfig(loadEntryConfig(sid));
  }, [sid]);

  const v = useMemo(() => getViolationFlags(form), [form]);

  const entryBlock = config?.blocks?.find((b) => b.id === "entry");

  // IMPORTANT: keep condition instance "c" so we can read labelOverride.
  const enabledConditions = (entryBlock?.enabled ? entryBlock.conditions : [])
    .filter((c) => c.enabled)
    .map((c) => {
      const tpl = CONDITION_TEMPLATES[c.templateKey];
      if (!tpl) return null;
      return { c, tpl };
    })
    .filter(Boolean);

  return (
    <>
      <Card variant="secondary" className="p-2">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Entry Conditions
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 transition"
            title="Edit Entry Conditions for this Trading System"
          >
            <Pencil className="w-4 h-4 text-slate-200" />
            <span className="text-[11px] text-slate-200">Edit</span>
          </button>
        </div>

        {!entryBlock?.enabled ? (
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-[11px] text-slate-400">
              Entry conditions are disabled for this Trading System.
            </p>
          </div>
        ) : enabledConditions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-[11px] text-slate-400">
              No enabled entry conditions. Use Edit to enable at least one.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {enabledConditions.map(({ c, tpl }) => {
              const name = tpl.formField;
              const value = form?.[name] ?? "";
              const violated = tpl.violationKey ? !!v?.[tpl.violationKey] : false;

              const invalid = !!invalidFlags?.[`${name}Invalid`] || violated;
              const ranging = tpl.rangingValue ? value === tpl.rangingValue : false;

              const displayLabel = (c.labelOverride || "").trim() || tpl.label;

              return (
                <div key={c.id} className={alertWrapClass(violated)}>
                  <Select
                    label={displayLabel}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={selectBorder({ invalid, ranging })}
                    options={tpl.options}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {isEditing && (
        <EntryConditionsBuilderModal
          strategyId={sid}
          initialConfig={config}
          onClose={() => setIsEditing(false)}
          onSaved={(next) => setConfig(next)}
        />
      )}
    </>
  );
}
