// src/components/trades/trades/ExecutionGateSection.jsx
import { useMemo } from "react";
import { Shield, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";

function num(x) {
  const v = Number(x);
  return Number.isFinite(v) ? v : NaN;
}

function rrFrom({ entry, sl, tp1, direction }) {
  const e = num(entry);
  const s = num(sl);
  const t = num(tp1);
  if (![e, s, t].every(Number.isFinite)) return NaN;

  const isLong = String(direction || "Long") === "Long";
  const risk = isLong ? (e - s) : (s - e);
  const reward = isLong ? (t - e) : (e - t);

  if (risk <= 0 || reward <= 0) return NaN;
  return reward / risk;
}

export default function ExecutionGateSection({
  form,
  strategyId,
  discipline,
  config,
  acceptedLoss,
  setAcceptedLoss,
  replanMode,
  setReplanMode,
  canArm,
  armDisabledReason,
  onArm,
  onArmOverride,
  onEnter,
  onEnterOverride,
}) {
  const sid = Number(strategyId || 1);
  const rr = useMemo(() => rrFrom(form), [form]);

  const slPctAbs = useMemo(() => {
    const v = num(form.slPercent);
    return Number.isFinite(v) ? Math.abs(v) : NaN;
  }, [form.slPercent]);

  const execState = form.execState || "REVIEWING";
  const isArmedOrMore = execState === "ARMED" || execState === "ENTERED";

  const minRR = config?.minRRByStrategy?.[sid] ?? 1;
  const maxSlPct = config?.maxSLPercentByStrategy?.[sid];

  const rrOk = Number.isFinite(rr) ? rr >= minRR : false;
  const slPctOk =
    typeof maxSlPct === "number"
      ? Number.isFinite(slPctAbs) && slPctAbs <= maxSlPct
      : true;

  const checks = [
    { label: "Entry filled", ok: !!form.entry },
    { label: "SL filled", ok: !!form.sl },
    { label: "TP1 filled", ok: !!form.tp1 },
    { label: "Risk % filled", ok: !!form.riskPercent },
    { label: `RR ≥ ${minRR.toFixed(1)}`, ok: rrOk },
    ...(typeof maxSlPct === "number"
      ? [{ label: `SL% ≤ ${maxSlPct.toFixed(2)}%`, ok: slPctOk }]
      : []),
    { label: "I accept the loss", ok: !!acceptedLoss },
  ];

  const allOk = checks.every((c) => c.ok);

  const badge = (ok) =>
    ok ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-amber-300" />
    );

  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Execution Gate</h3>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`text-[11px] px-2 py-1 rounded-full border ${
              execState === "REVIEWING"
                ? "border-white/10 text-slate-300 bg-white/5"
                : execState === "ARMED"
                ? "border-emerald-400/30 text-emerald-200 bg-emerald-400/10"
                : "border-indigo-400/30 text-indigo-200 bg-indigo-400/10"
            }`}
          >
            {execState}
          </span>

          {isArmedOrMore && (
            <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 text-slate-300 bg-white/5 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              SL locked
            </span>
          )}
        </div>
      </div>

      {/* checks */}
      <div className="grid md:grid-cols-2 gap-2">
        {checks.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/10 border border-white/10"
          >
            {badge(c.ok)}
            <span className="text-xs text-slate-200">{c.label}</span>
            <span className="ml-auto text-[11px] text-slate-400">
              {c.ok ? "OK" : "NO"}
            </span>
          </div>
        ))}
      </div>

      {/* accept loss + replan */}
      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-200">
          <input
            type="checkbox"
            checked={!!acceptedLoss}
            onChange={(e) => setAcceptedLoss(e.target.checked)}
          />
          I accept the loss (one-click)
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-200">
          <input
            type="checkbox"
            checked={!!replanMode}
            onChange={(e) => setReplanMode(e.target.checked)}
          />
          Re-plan mode (allows widening SL, counts as violation)
        </label>

        <div className="text-[11px] text-slate-400">
          RR:{" "}
          <span className="text-slate-200 font-semibold">
            {Number.isFinite(rr) ? rr.toFixed(2) : "—"}
          </span>
          {typeof maxSlPct === "number" && (
            <>
              {" "}
              • SL%:{" "}
              <span className="text-slate-200 font-semibold">
                {Number.isFinite(slPctAbs) ? slPctAbs.toFixed(2) : "—"}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={onArm}
          disabled={!canArm || !allOk}
          className={`h-9 px-4 rounded-full text-sm font-semibold transition border ${
            !canArm || !allOk
              ? "bg-white/5 text-slate-500 border-white/10 cursor-not-allowed"
              : "bg-[#00ffa3] text-[#020617] border-[#00ffa3]/30 hover:brightness-110"
          }`}
          title={armDisabledReason || ""}
        >
          ARM TRADE
        </button>

        {!canArm && (
          <button
            type="button"
            onClick={onArmOverride}
            className="h-9 px-4 rounded-full text-sm font-semibold transition border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15"
            title="Override cooldown (records violation)"
          >
            Override & Arm (Violation)
          </button>
        )}

        <button
          type="button"
          onClick={onEnter}
          disabled={!(execState === "ARMED") || !form.sl}
          className={`h-9 px-4 rounded-full text-sm font-semibold transition border ${
            !(execState === "ARMED") || !form.sl
              ? "bg-white/5 text-slate-500 border-white/10 cursor-not-allowed"
              : "bg-indigo-400/15 text-indigo-100 border-indigo-400/30 hover:bg-indigo-400/20"
          }`}
          title={!form.sl ? "SL required" : ""}
        >
          ENTERED
        </button>

        {execState === "ARMED" && !form.sl && (
          <button
            type="button"
            onClick={onEnterOverride}
            className="h-9 px-4 rounded-full text-sm font-semibold transition border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15"
            title="Override enter without SL (records violation) — not recommended"
          >
            Override Enter (Violation)
          </button>
        )}

        <div className="ml-auto text-[11px] text-slate-400">
          Cooldown:{" "}
          <span className="text-slate-200 font-semibold">
            {discipline?.cooldownUntil ? new Date(discipline.cooldownUntil).toLocaleString() : "—"}
          </span>
        </div>
      </div>

      {!allOk && (
        <p className="mt-2 text-[11px] text-slate-400">
          Gate is strict: no SL, no ARM; low RR / high SL% blocks ARM.
        </p>
      )}
    </div>
  );
}
