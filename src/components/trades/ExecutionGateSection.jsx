// src/components/trades/trades/ExecutionGateSection.jsx
import { useEffect, useState } from "react";
import { Shield, Lock, AlertTriangle, CheckCircle2, Bug, Clock, List } from "lucide-react";

import { Card } from "../ui/Card";
import {
  DEV_MODE,
  isCooldownActive,
  cooldownRemainingMs,
  formatCooldown,
  violationLabel,
  violationDescription,
  lastViolation,
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
  const isArmed = execState === "ARMED";
  const isEntered = execState === "ENTERED";
  const isArmedOrMore = isArmed || isEntered;

  const minRR = config?.minRRByStrategy?.[sid] ?? 1;

  const checks = [
    { label: "Entry", ok: !!form.entry },
    { label: "Stop Loss", ok: !!form.sl },
    { label: "TP1", ok: !!form.tp1 },
    { label: "Risk %", ok: !!form.riskPercent },
    { label: `RR ≥ ${minRR}`, ok: true }, // computed upstream
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

  const armDisabled = !canArmResolved || !allOk || isArmedOrMore;

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
          <div key={c.label} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/15 border border-white/10">
            <StatusDot ok={c.ok} />
            <span className="text-xs text-slate-100">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-100">
          <input type="checkbox" checked={acceptedLoss} onChange={(e) => setAcceptedLoss(e.target.checked)} />
          I accept the loss
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-100">
          <input type="checkbox" checked={replanMode} onChange={(e) => setReplanMode(e.target.checked)} />
          Re-plan mode (violation)
        </label>

        {DEV_MODE && (
          <label className="flex items-center gap-2 text-xs text-amber-200">
            <Bug className="w-3 h-3" />
            <input
              type="checkbox"
              checked={!discipline.cooldownDisabled}
              onChange={() => {
                // NOTE: discipline persistence is handled in the discipline store flow;
                // this UI toggle is for quick testing.
                discipline.cooldownDisabled = !discipline.cooldownDisabled;
              }}
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

        {/* ENTERED */}
        <button
          type="button"
          onClick={onEnter}
          disabled={!isArmed || isEntered}
          className={`h-9 px-4 rounded-full text-sm font-semibold transition border ${
            isEntered
              ? "bg-indigo-300/10 text-indigo-100 border-indigo-300/20"
              : !isArmed
              ? "bg-white/5 text-slate-400 border-white/10 cursor-not-allowed"
              : "bg-indigo-300/15 text-indigo-50 border-indigo-300/30 hover:bg-indigo-300/20"
          }`}
        >
          {isEntered ? "ENTERED" : "ENTERED"}
        </button>

        {/* cooldown countdown + tooltip */}
        {cooldownActive && (
          <div
            className="ml-auto flex items-center gap-1 text-xs text-amber-200 cursor-help"
            title={
              lastV ? `${violationLabel(lastV.type)} — ${violationDescription(lastV.type)}` : "Cooldown active"
            }
          >
            <Clock className="w-3 h-3" />
            {formatCooldown(remaining)}
          </div>
        )}

        <button type="button" onClick={() => setShowHistory(true)} className="ml-2 text-slate-300 hover:text-white">
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* drawer */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 z-50">
          <div className="absolute right-0 top-0 h-full w-[320px] bg-[#020617] border-l border-white/10 p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Violation history (24h)</h4>

            <div className="space-y-2">
              {(discipline.violations || []).length === 0 && (
                <div className="text-xs text-slate-400">No violations</div>
              )}

              {(discipline.violations || []).map((v, i) => (
                <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white">{violationLabel(v.type)}</div>
                  <div className="text-[11px] text-slate-400">{new Date(v.ts).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <button
              className="mt-4 w-full text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10"
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
