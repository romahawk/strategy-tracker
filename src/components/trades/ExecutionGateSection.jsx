// src/components/trades/trades/ExecutionGateSection.jsx
import { useEffect, useState } from "react";
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Clock,
  List,
  Trash2,
  RotateCcw,
} from "lucide-react";

import { Card } from "../ui/Card";
import {
  DEV_MODE,
  isCooldownActive,
  cooldownRemainingMs,
  formatCooldown,
  violationLabel,
  violationDescription,
  lastViolation,
  saveDiscipline,
  clearCooldown,
  clearViolations,
  resetDisciplineState,
} from "../../utils/discipline";

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
  accountId = 1,
  onDisciplineChanged,
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

  // ✅ RR inputs from TradeForm
  rr,
  rrOk,
}) {
  const sid = Number(strategyId || 1);
  const aid = Number(accountId || 1);

  const execState = form.execState || "REVIEWING";
  const isArmed = execState === "ARMED";
  const isEntered = execState === "ENTERED";
  const isArmedOrMore = isArmed || isEntered;

    const minRR = config?.minRRByStrategy?.[sid] ?? 1;

  // Local RR compute from form values (no parent dependency)
  const entry = Number(form.entry);
  const sl = Number(form.sl);
  const tp1 = Number(form.tp1);

  const hasRRInputs =
    Number.isFinite(entry) && Number.isFinite(sl) && Number.isFinite(tp1) && entry !== sl;

  // Reward/Risk (works for both long and short because we use abs deltas)
  const rrLocal = hasRRInputs ? Math.abs(tp1 - entry) / Math.abs(entry - sl) : NaN;
  const rrOkLocal = Number.isFinite(rrLocal) && rrLocal >= minRR;

  const rrLabel = Number.isFinite(rrLocal)
    ? `RR ≥ ${minRR} (${rrLocal.toFixed(2)})`
    : `RR ≥ ${minRR}`;


  const checks = [
    { label: "Entry", ok: !!form.entry },
    { label: "Stop Loss", ok: !!form.sl },
    { label: "TP1", ok: !!form.tp1 },
    { label: "Risk %", ok: !!form.riskPercent },

    // ✅ use resolved RR ok
    { label: rrLabel, ok: rrOkLocal },

    { label: "Accept loss", ok: !!acceptedLoss },
  ];

  const allOk = checks.every((c) => c.ok);
  const canArmResolved = canArm !== false;

  /* countdown */
  const [remaining, setRemaining] = useState(cooldownRemainingMs(discipline));
  useEffect(() => {
    const id = setInterval(() => setRemaining(cooldownRemainingMs(discipline)), 1000);
    return () => clearInterval(id);
  }, [discipline]);

  const cooldownActive = isCooldownActive(discipline);
  const lastV = lastViolation(discipline);

  /* drawer */
  const [showHistory, setShowHistory] = useState(false);

  // ARM disabled if: cooldown blocks OR not all checks OR already armed/entered
  const armDisabled = !canArmResolved || !allOk || isArmedOrMore;

  const persistDiscipline = (next) => {
    saveDiscipline(sid, aid, next);
    if (typeof onDisciplineChanged === "function") {
      onDisciplineChanged(next);
    } else {
      window.location.reload();
    }
  };

  const toggleCooldownEnforcement = () => {
    const next = { ...discipline, cooldownDisabled: !discipline.cooldownDisabled };
    persistDiscipline(next);
  };

  const handleClearCooldown = () => persistDiscipline(clearCooldown(discipline));
  const handleClearViolations = () => persistDiscipline(clearViolations(discipline));
  const handleResetDiscipline = () => persistDiscipline(resetDisciplineState(discipline));

    return (
    <Card variant="primary" className="p-3 relative">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-white">Execution Gate</h3>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10">
            {execState}
          </span>

          {isArmedOrMore && (
            <span className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              SL locked
            </span>
          )}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#7f5af0]/35 to-transparent my-2" />

      <div className="grid md:grid-cols-2 gap-2">
        {checks.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/15 border border-white/10"
          >
            <StatusDot ok={c.ok} />
            <span className="text-xs text-slate-100">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-100">
          <input
            type="checkbox"
            checked={acceptedLoss}
            onChange={(e) => setAcceptedLoss(e.target.checked)}
          />
          I accept the loss
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-100">
          <input
            type="checkbox"
            checked={replanMode}
            onChange={(e) => setReplanMode(e.target.checked)}
          />
          Re-plan mode (violation)
        </label>

        {DEV_MODE && (
          <label className="flex items-center gap-2 text-xs text-amber-200">
            <Bug className="w-3 h-3" />
            <input
              type="checkbox"
              checked={!discipline.cooldownDisabled}
              onChange={toggleCooldownEnforcement}
            />
            Enforce cooldown (DEV)
          </label>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {/* ARM */}
        <button
          type="button"
          onClick={onArm}
          disabled={armDisabled}
          className={`h-9 px-4 rounded-full text-sm font-semibold transition ${
            isArmed
              ? "bg-emerald-300/15 text-emerald-50 border border-emerald-300/30"
              : armDisabled
              ? "bg-white/5 text-slate-400 border border-white/10 cursor-not-allowed"
              : "bg-gradient-to-r from-[#00ffa3] to-[#7f5af0] text-[#020617] hover:brightness-110 shadow-[0_0_18px_rgba(127,90,240,.20)]"
          }`}
          title={isArmed ? "Trade is ARMED" : armDisabledReason || ""}
        >
          {isArmed ? "ARMED" : "ARM TRADE"}
        </button>

        {/* Override */}
        {!canArmResolved && !isArmedOrMore && (
          <button
            type="button"
            onClick={onArmOverride}
            className="h-9 px-4 rounded-full text-sm font-semibold bg-amber-300/10 border border-amber-300/30 text-amber-100"
          >
            Override
          </button>
        )}

        {/* ENTERED (highlighted when ARMED) */}
        <button
          type="button"
          onClick={onEnter}
          disabled={!isArmed || isEntered}
          className={`h-9 px-4 rounded-full text-sm font-semibold transition border ${
            isEntered
              ? "bg-indigo-300/10 text-indigo-100 border-indigo-300/20"
              : !isArmed
              ? "bg-white/5 text-slate-400 border-white/10 cursor-not-allowed"
              : "bg-gradient-to-r from-[#7f5af0] to-[#00ffa3] text-[#020617] hover:brightness-110 shadow-[0_0_18px_rgba(0,255,163,.12)] border-white/10"
          }`}
          title={!isArmed ? "Arm trade first" : ""}
        >
          ENTERED
        </button>

        {/* cooldown countdown */}
        {cooldownActive && (
          <div
            className="ml-auto flex items-center gap-1 text-xs text-amber-200 cursor-help"
            title={
              lastV
                ? `${violationLabel(lastV.type)} — ${violationDescription(lastV.type)}`
                : "Cooldown active"
            }
          >
            <Clock className="w-3 h-3" />
            {formatCooldown(remaining)}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="ml-2 text-slate-300 hover:text-white"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* drawer */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 z-50">
          <div className="absolute right-0 top-0 h-full w-[340px] bg-[#020617] border-l border-white/10 p-4">
            <h4 className="text-sm font-semibold text-white mb-2">
              Violation history (24h)
            </h4>

            {DEV_MODE && (
              <div className="flex flex-col gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleClearCooldown}
                  className="w-full h-9 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 hover:bg-white/10 inline-flex items-center justify-center gap-2"
                  title="Sets cooldownUntil = 0"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear active cooldown
                </button>

                <button
                  type="button"
                  onClick={handleClearViolations}
                  className="w-full h-9 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 hover:bg-white/10 inline-flex items-center justify-center gap-2"
                  title="Clears violations[] and cleanStreak"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear violation history
                </button>

                <button
                  type="button"
                  onClick={handleResetDiscipline}
                  className="w-full h-9 rounded-lg bg-amber-300/10 border border-amber-300/25 text-sm text-amber-100 hover:bg-amber-300/15 inline-flex items-center justify-center gap-2"
                  title="Resets discipline state (keeps cooldownDisabled)"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset discipline (DEV)
                </button>
              </div>
            )}

            <div className="space-y-2">
              {(discipline.violations || []).length === 0 && (
                <div className="text-xs text-slate-400">No violations</div>
              )}

              {(discipline.violations || []).map((v, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="text-xs text-white">{violationLabel(v.type)}</div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(v.ts).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="mt-4 w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
