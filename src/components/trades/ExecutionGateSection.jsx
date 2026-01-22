// src/components/trades/trades/ExecutionGateSection.jsx
import { Shield, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "../ui/Card";

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
  const risk = isLong ? e - s : s - e;
  const reward = isLong ? t - e : e - t;

  if (risk <= 0 || reward <= 0) return NaN;
  return reward / risk;
}

function StatusDot({ ok }) {
  return ok ? (
    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
  ) : (
    <AlertTriangle className="w-4 h-4 text-amber-300" />
  );
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

  const execState = form.execState || "REVIEWING";
  const isArmedOrMore = execState === "ARMED" || execState === "ENTERED";

  const minRR = config?.minRRByStrategy?.[sid] ?? 1;
  const maxSlPct = config?.maxSLPercentByStrategy?.[sid];

  const rr = rrFrom(form);

  const slPctAbs = (() => {
    const v = num(form.slPercent);
    return Number.isFinite(v) ? Math.abs(v) : NaN;
  })();

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
    { label: `RR ≥ ${Number(minRR).toFixed(1)}`, ok: rrOk },
    ...(typeof maxSlPct === "number"
      ? [{ label: `SL% ≤ ${Number(maxSlPct).toFixed(2)}%`, ok: slPctOk }]
      : []),
    { label: "I accept the loss", ok: !!acceptedLoss },
  ];

  const allOk = checks.every((c) => c.ok);

  return (
    <Card variant="primary" className="p-3">
      {/* header */}
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-white">Execution Gate</h3>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`text-[11px] px-2 py-1 rounded-full border ${
              execState === "REVIEWING"
                ? "border-white/10 text-slate-200 bg-white/5"
                : execState === "ARMED"
                ? "border-emerald-300/30 text-emerald-100 bg-emerald-300/10"
                : "border-indigo-300/30 text-indigo-100 bg-indigo-300/10"
            }`}
          >
            {execState}
          </span>

          {isArmedOrMore && (
            <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 text-slate-200 bg-white/5 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              SL locked
            </span>
          )}
        </div>
      </div>

      {/* optional polish: subtle divider glow */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#7f5af0]/35 to-transparent my-2" />

      {/* checks */}
      <div className="grid md:grid-cols-2 gap-2">
        {checks.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/15 border border-white/10"
          >
            <StatusDot ok={c.ok} />
            <span className="text-xs text-slate-100">{c.label}</span>
            <span className="ml-auto text-[11px] text-slate-400">
              {c.ok ? "OK" : "NO"}
            </span>
          </div>
        ))}
      </div>

      {/* toggles + summary */}
      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-100">
          <input
            type="checkbox"
            checked={!!acceptedLoss}
            onChange={(e) => setAcceptedLoss(e.target.checked)}
          />
          I accept the loss (one-click)
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-100">
          <input
            type="checkbox"
            checked={!!replanMode}
            onChange={(e) => setReplanMode(e.target.checked)}
          />
          Re-plan mode (allows widening SL, counts as violation)
        </label>

        <div className="text-[11px] text-slate-300">
          RR:{" "}
          <span className="text-white font-semibold">
            {Number.isFinite(rr) ? rr.toFixed(2) : "—"}
          </span>
          {typeof maxSlPct === "number" && (
            <>
              {" "}
              • SL%:{" "}
              <span className="text-white font-semibold">
                {Number.isFinite(slPctAbs) ? slPctAbs.toFixed(2) : "—"}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={onArm}
          disabled={!canArm || !allOk}
          className={`h-9 px-4 rounded-full text-sm font-semibold transition border ${
            !canArm || !allOk
              ? "bg-white/5 text-slate-400 border-white/10 cursor-not-allowed"
              : "bg-gradient-to-r from-[#00ffa3] to-[#7f5af0] text-[#020617] border-white/10 hover:brightness-110 shadow-[0_0_18px_rgba(127,90,240,.20)]"
          }`}
          title={armDisabledReason || ""}
        >
          ARM TRADE
        </button>

        {!canArm && (
          <button
            type="button"
            onClick={onArmOverride}
            className="h-9 px-4 rounded-full text-sm font-semibold transition border border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15"
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
              ? "bg-white/5 text-slate-400 border-white/10 cursor-not-allowed"
              : "bg-indigo-300/15 text-indigo-50 border-indigo-300/30 hover:bg-indigo-300/20"
          }`}
          title={!form.sl ? "SL required" : ""}
        >
          ENTERED
        </button>

        {execState === "ARMED" && !form.sl && (
          <button
            type="button"
            onClick={onEnterOverride}
            className="h-9 px-4 rounded-full text-sm font-semibold transition border border-rose-300/30 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15"
            title="Override enter without SL (records violation) — not recommended"
          >
            Override Enter (Violation)
          </button>
        )}

        <div className="ml-auto text-[11px] text-slate-300">
          Cooldown:{" "}
          <span className="text-white font-semibold">
            {discipline?.cooldownUntil
              ? new Date(discipline.cooldownUntil).toLocaleString()
              : "—"}
          </span>
        </div>
      </div>

      {!allOk && (
        <p className="mt-2 text-[11px] text-slate-300">
          Gate is strict: no SL, no ARM; low RR / high SL% blocks ARM.
        </p>
      )}
    </Card>
  );
}
