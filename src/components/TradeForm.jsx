import { useState, useEffect, useMemo, useRef } from "react";
import { Check } from "lucide-react";
import { toast } from "react-toastify";

import TradeInfoSection from "./trades/TradeInfoSection";
import EntryChecklist from "../features/entryRules/components/EntryChecklist";
import RiskSetupSection from "./trades/RiskSetupSection";
import TargetsSection from "./trades/TargetsSection";
import ChartSection from "./trades/ChartSection";
import ResultSection from "./trades/ResultSection";
import ExecutionGateSection from "./trades/ExecutionGateSection";

import {
  loadDiscipline,
  saveDiscipline,
  applyViolation,
  applyCleanTrade,
  riskCapMultiplier,
  isCooldownActive,
} from "../utils/discipline";

import { strategyStore } from "../storage/strategyStore";
import { accountStore } from "../storage/accountStore";

/* ---------- helpers ---------- */
function num(x) {
  const v = Number(x);
  return Number.isFinite(v) ? v : NaN;
}

function toMoneyStr(v, decimals = 2) {
  const x = Number(v);
  return Number.isFinite(x) ? x.toFixed(decimals) : "";
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function rrFrom({ entry, sl, tp1, direction }) {
  const e = num(entry);
  const s = num(sl);
  const t = num(tp1);
  if (![e, s, t].every(Number.isFinite)) return NaN;

  const isLong = String(direction) === "Long";
  const risk = isLong ? e - s : s - e;
  const reward = isLong ? t - e : e - t;
  if (risk <= 0 || reward <= 0) return NaN;
  return reward / risk;
}

function moneyNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
}

function pctMove({ entry, price, direction }) {
  const e = num(entry);
  const p = num(price);
  if (!Number.isFinite(e) || !Number.isFinite(p) || e === 0) return null;

  const isLong = String(direction || "Long") === "Long";
  const pct = isLong ? (p / e - 1) * 100 : (1 - p / e) * 100;
  return Number.isFinite(pct) ? pct : null;
}


export default function TradeForm({
  onAddTrade,
  editingTrade,
  initialDeposit,
  strategyId,
  accountId,
}) {
  const sid = Number(strategyId) || strategyStore.list()[0]?.id || 1;
  const aid = Number(accountId) || accountStore.getFirstAccountId(sid);

  // Account-driven funded/prop detection (replaces hardcoded sid === 3 || sid === 4)
  const account = accountStore.list(sid).find((a) => a.id === aid);
  const isFunded = account?.accountType === "funded" || account?.venue === "prop";

  const CONFIG = useMemo(
    () => ({
      minRRByStrategy: { 1: 2, 2: 1, 3: 1, 4: 1 },
      maxSLPercentByStrategy: { 2: 1 },
      cooldownMinutesByStrategy: { 1: 1440, 2: 60, 3: 60, 4: 60 },
      baseRiskByStrategy: { 1: 1, 2: 1, 3: 0.5, 4: 0.5 },
    }),
    []
  );

  const [form, setForm] = useState({});
  const [acceptedLoss, setAcceptedLoss] = useState(false);
  const [replanMode, setReplanMode] = useState(false);

  const [discipline, setDiscipline] = useState(() => loadDiscipline(sid, aid));
  useEffect(() => setDiscipline(loadDiscipline(sid, aid)), [sid, aid]);

  const formRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savePulse, setSavePulse] = useState(false);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setField(name, value);
  };

  /* =========================================================
     ✅ FIX: Hydrate the form when editingTrade changes
     ========================================================= */
  useEffect(() => {
    if (!editingTrade) return;

    const hydrated = {
      ...editingTrade,
      direction: editingTrade.direction || "Long",

      // normalize money fields so UI never shows float artifacts
      deposit: toMoneyStr(editingTrade.deposit),
      ...(editingTrade.nextDeposit != null && String(editingTrade.nextDeposit) !== ""
        ? { nextDeposit: toMoneyStr(editingTrade.nextDeposit) }
        : {}),
    };

    // Hydrate rule results from saved trade (or keep empty for new)
    if (hydrated.ruleResults) {
      hydrated.ruleResults = hydrated.ruleResults;
      hydrated.ruleSnapshot = hydrated.ruleSnapshot || [];
    }

    setForm((prev) => ({
      ...prev,
      ...hydrated,
    }));

    setAcceptedLoss(!!editingTrade.acceptedLoss);
    // keep replanMode false by default when editing
    setReplanMode(!!editingTrade.replanMode);
  }, [editingTrade, sid]);

  /* =========================================================
     ✅ Seed deposit for NEW trade from last equity (initialDeposit)
     ========================================================= */
  useEffect(() => {
    if (editingTrade) return;

    const cur = form.deposit;
    const hasDeposit = cur != null && String(cur).trim() !== "";
    if (hasDeposit) return;

    if (initialDeposit == null) return;

    setForm((prev) => ({
      ...prev,
      deposit: toMoneyStr(initialDeposit),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDeposit, editingTrade]);

  // Normalize deposit display to 2 decimals only when it contains too many decimals.
  useEffect(() => {
    const d = form.deposit;
    if (d == null || String(d).trim() === "") return;

    const s = String(d).trim();
    if (s.endsWith(".")) return;

    const n = Number(s);
    if (!Number.isFinite(n)) return;

    const parts = s.split(".");
    const decimals = parts.length === 2 ? parts[1].length : 0;
    if (decimals <= 2) return;

    const fixed = toMoneyStr(n, 2);
    if (fixed && fixed !== s) {
      setForm((prev) => ({ ...prev, deposit: fixed }));
    }
  }, [form.deposit]);

  /* ---------- Risk calc ---------- */
  useEffect(() => {
    const e = num(form.entry);
    const s = num(form.sl);
    const d = num(form.deposit);

    if (!Number.isFinite(e) || !Number.isFinite(s) || !Number.isFinite(d) || d <= 0) return;

    const direction = form.direction || "Long";
    const isLong = String(direction) === "Long";

    const slPctSigned = isLong ? (s / e - 1) * 100 : (1 - s / e) * 100;
    const slPctAbs = Math.abs(slPctSigned);

    let next = {};

    if (!isFunded) {
      const usedPct = Math.max(0, num(form.usedDepositPercent || 25));
      const levX = Math.max(1, num(form.leverageX || 10));

      const positionSize = d * (usedPct / 100) * levX;
      const slDollar = positionSize * (slPctSigned / 100); // signed
      const riskDollar = slDollar; // signed
      const riskPercentAbs = (Math.abs(riskDollar) / d) * 100;

      next = {
        leverageAmount: Number.isFinite(positionSize) ? positionSize.toFixed(2) : "",
        slPercent: Number.isFinite(slPctSigned) ? slPctSigned.toFixed(2) : "",
        slDollar: Number.isFinite(slDollar) ? slDollar.toFixed(2) : "",
        riskDollar: Number.isFinite(riskDollar) ? riskDollar.toFixed(2) : "",
        riskPercent: Number.isFinite(riskPercentAbs) ? riskPercentAbs.toFixed(2) : "",
      };
    } else {
      let targetRisk = num(form.riskPercent || 0.5);
      if (!Number.isFinite(targetRisk) || targetRisk <= 0) targetRisk = 0.5;
      targetRisk = Math.min(2, Math.max(0.25, targetRisk));

      if (!Number.isFinite(slPctAbs) || slPctAbs <= 0) return;

      let lotPct = (targetRisk * 100) / slPctAbs;
      if (lotPct > 100) lotPct = 100;

      const positionSize = d * (lotPct / 100);
      const riskUsdAbs = positionSize * (slPctAbs / 100);
      const riskActualPct = (riskUsdAbs / d) * 100;
      const riskUsdSigned = -riskUsdAbs;

      next = {
        usedDepositPercent: lotPct.toFixed(2),
        leverageAmount: Number.isFinite(positionSize) ? positionSize.toFixed(2) : "",
        slPercent: Number.isFinite(slPctSigned) ? slPctSigned.toFixed(2) : "",
        slDollar: Number.isFinite(riskUsdSigned) ? riskUsdSigned.toFixed(2) : "",
        riskDollar: Number.isFinite(riskUsdSigned) ? riskUsdSigned.toFixed(2) : "",
        riskPercent: Number.isFinite(riskActualPct) ? riskActualPct.toFixed(2) : "",
      };
    }

    setForm((prev) => {
      let changed = false;
      const merged = { ...prev };
      for (const k of Object.keys(next)) {
        if (String(prev[k] ?? "") !== String(next[k] ?? "")) {
          merged[k] = next[k];
          changed = true;
        }
      }
      return changed ? merged : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFunded,
    form.entry,
    form.sl,
    form.deposit,
    form.direction,
    form.usedDepositPercent,
    form.leverageX,
    form.riskPercent,
  ]);

  /* ---------- Derived Result ---------- */
  useEffect(() => {
    const entry = num(form.entry);
    const deposit = num(form.deposit);
    const positionSize = num(form.leverageAmount);
    if (!Number.isFinite(entry) || !Number.isFinite(deposit) || !Number.isFinite(positionSize)) return;

    const direction = form.direction || "Long";

    const tpsHit = form.tpsHit || "OPEN";
    let result = form.result || "Open";
    if (tpsHit === "SL") result = "Loss";

    const tp1PctMove = pctMove({ entry, price: form.tp1, direction });
    const tp2PctMove = pctMove({ entry, price: form.tp2, direction });
    const tp3PctMove = pctMove({ entry, price: form.tp3, direction });

    const a1 = clamp(num(form.tp1AllocPct) || 0, 0, 100);
    const a2 = clamp(num(form.tp2AllocPct) || 0, 0, 100);
    const a3 = clamp(num(form.tp3AllocPct) || 0, 0, 100);

    const tpUsd = (pctMoveVal, allocPct) => {
      if (pctMoveVal == null || !Number.isFinite(pctMoveVal)) return 0;
      const usd = positionSize * (pctMoveVal / 100) * (allocPct / 100);
      return Number.isFinite(usd) ? usd : 0;
    };

    const tp1Dollar = tpUsd(tp1PctMove, a1);
    const tp2Dollar = tpUsd(tp2PctMove, a2);
    const tp3Dollar = tpUsd(tp3PctMove, a3);
    const tpTotal = tp1Dollar + tp2Dollar + tp3Dollar;

    const riskDollarSigned = Number.isFinite(num(form.riskDollar)) ? num(form.riskDollar) : 0;

    const makerFee = num(form.makerFeePct);
    const takerFee = num(form.takerFeePct);

    const entryFeeType = form.entryFeeType || "taker";
    const exitFeeType = form.exitFeeType || "taker";

    const feeEntryPct = entryFeeType === "maker" ? makerFee : takerFee;
    const feeExitPct = exitFeeType === "maker" ? makerFee : takerFee;

    const commissionAuto =
      Number.isFinite(feeEntryPct) && Number.isFinite(feeExitPct)
        ? positionSize * ((feeEntryPct + feeExitPct) / 100)
        : 0;

    const commissionManual = num(form.commissionManual);
    const commissionUsed = Number.isFinite(commissionManual) ? commissionManual : commissionAuto;

    let pnl = null;
    if (result === "Win") pnl = tpTotal - commissionUsed;
    else if (result === "Loss") pnl = riskDollarSigned - commissionUsed;
    else if (result === "Break Even") pnl = 0 - commissionUsed;

    const nextDeposit = pnl == null ? null : deposit + pnl;

    setForm((prev) => ({
      ...prev,
      result,
      tp1Percent: tp1PctMove == null ? null : Number(tp1PctMove.toFixed(2)),
      tp2Percent: tp2PctMove == null ? null : Number(tp2PctMove.toFixed(2)),
      tp3Percent: tp3PctMove == null ? null : Number(tp3PctMove.toFixed(2)),
      tp1Dollar: Number(tp1Dollar.toFixed(2)),
      tp2Dollar: Number(tp2Dollar.toFixed(2)),
      tp3Dollar: Number(tp3Dollar.toFixed(2)),
      tpTotal: Number(tpTotal.toFixed(2)),
      commission: Number(commissionUsed.toFixed(2)),
      ...(pnl != null ? { pnl: Number(pnl.toFixed(2)) } : {}),
      ...(nextDeposit != null ? { nextDeposit: toMoneyStr(nextDeposit) } : {}),
    }));
  }, [
    form.entry,
    form.deposit,
    form.leverageAmount,
    form.direction,
    form.tpsHit,
    form.result,
    form.tp1,
    form.tp2,
    form.tp3,
    form.tp1AllocPct,
    form.tp2AllocPct,
    form.tp3AllocPct,
    form.riskDollar,
    form.makerFeePct,
    form.takerFeePct,
    form.entryFeeType,
    form.exitFeeType,
    form.commissionManual,
  ]);

  /* ---------- Gate calc ---------- */
  const rr = rrFrom(form);
  const rrOk = Number.isFinite(rr) && rr >= (CONFIG.minRRByStrategy[sid] ?? 1);

  const slPctAbs = Math.abs(num(form.slPercent));
  const slPctOk =
    CONFIG.maxSLPercentByStrategy[sid] == null ||
    (Number.isFinite(slPctAbs) && slPctAbs <= CONFIG.maxSLPercentByStrategy[sid]);

  const cooldownActive = isCooldownActive(discipline);

  const gateReady =
    !!form.entry &&
    !!form.sl &&
    !!form.tp1 &&
    !!form.riskPercent &&
    !!acceptedLoss &&
    rrOk &&
    slPctOk &&
    !cooldownActive;

  const canArm = !cooldownActive;
  const armDisabledReason = cooldownActive ? "Cooldown active. You can override (Violation)." : "";

  const execState = form.execState || "REVIEWING";
  const isArmedOrEntered = execState === "ARMED" || execState === "ENTERED";

  const saveBasicReady = !!form.deposit && !!form.entry && !!form.sl && !!form.pair && !!form.date;
  const saveEmphasis = isArmedOrEntered || gateReady || saveBasicReady;

  /* ---------- actions ---------- */
  const onArm = () => {
    setForm((prev) => ({
      ...prev,
      execState: "ARMED",
      armedAt: prev.armedAt || new Date().toISOString(),
      armedSl: prev.armedSl || prev.sl,
    }));
  };

  const onEnter = () => {
    if (form.execState !== "ARMED") return;
    setForm((prev) => ({
      ...prev,
      execState: "ENTERED",
      enteredAt: prev.enteredAt || new Date().toISOString(),
    }));
  };

  const onArmOverride = () => {
    setForm((prev) => ({
      ...prev,
      execState: "ARMED",
      armedAt: prev.armedAt || new Date().toISOString(),
      armedSl: prev.armedSl || prev.sl,
    }));
  };

  const onEnterOverride = () => {
    setForm((prev) => ({
      ...prev,
      execState: "ENTERED",
      enteredAt: prev.enteredAt || new Date().toISOString(),
    }));
  };

  const normalizeExecStateForSave = (state) => {
    if (state === "ENTERED") return "ENTERED";
    if (state === "ARMED") return "ARMED";
    return "SAVED";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const id = editingTrade?.id ?? Date.now();
      const normalizedExecState = normalizeExecStateForSave(form.execState);

      const savedAsViolation = !(normalizedExecState === "ARMED" || normalizedExecState === "ENTERED");

      if (savedAsViolation) {
        const next = applyViolation({
          discipline,
          type: "OVERRIDE_SAVE",
          cooldownMinutes: CONFIG.cooldownMinutesByStrategy[sid],
        });
        saveDiscipline(sid, aid, next);
        setDiscipline(next);
      } else {
        const next = applyCleanTrade(discipline);
        saveDiscipline(sid, aid, next);
        setDiscipline(next);
      }

      const eqBefore = moneyNum(form.equityBefore) ?? moneyNum(form.deposit);
      const eqAfter =
        moneyNum(form.equityAfter) ??
        moneyNum(form.nextDeposit) ??
        (eqBefore != null && Number.isFinite(Number(form.pnl))
          ? moneyNum(eqBefore + Number(form.pnl))
          : null);

      onAddTrade({
        ...form,

        // canonical equity fields used by table + seeding
        ...(eqBefore != null ? { equityBefore: eqBefore } : {}),
        ...(eqAfter != null ? { equityAfter: eqAfter } : {}),

        deposit: toMoneyStr(form.deposit),
        ...(form.nextDeposit != null && String(form.nextDeposit) !== ""
          ? { nextDeposit: toMoneyStr(form.nextDeposit) }
          : {}),

        direction: form.direction || "Long",

        // Rule-based entry conditions (snapshot at trade time)
        ruleSnapshot: form.ruleSnapshot || [],
        ruleResults: form.ruleResults || [],

        id,
        strategyId: sid,
        accountId: aid,
        execState: normalizedExecState,
        acceptedLoss: !!acceptedLoss,
      });

      setSavePulse(true);
      setTimeout(() => setSavePulse(false), 650);
      toast.success(savedAsViolation ? "Saved (Violation)" : "Trade saved", { autoClose: 1500 });
    } finally {
      setTimeout(() => setIsSaving(false), 250);
    }
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 h-[calc(100vh-14rem)]"
      >
        {/* Row 1: Entry Checklist (full width) */}
        <div className="shrink-0">
          <EntryChecklist
            strategyId={sid}
            direction={form.direction}
            ruleResults={form.ruleResults || []}
            onResultsChange={(next) => setField("ruleResults", next)}
            onSnapshotChange={(snap) => setField("ruleSnapshot", snap)}
          />
        </div>

        {/* Row 2: Trade Info | Risk Setup | Targets */}
        <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
          <div className="rounded-2xl [&>*]:h-full [&>*]:overflow-y-auto">
            <TradeInfoSection form={form} onChange={handleChange} />
          </div>
          <div className="rounded-2xl [&>*]:h-full [&>*]:overflow-y-auto">
            <RiskSetupSection form={form} onChange={handleChange} account={account} />
          </div>
          <div className="rounded-2xl [&>*]:h-full [&>*]:overflow-y-auto">
            <TargetsSection form={form} onChange={handleChange} />
          </div>
        </div>

        {/* Row 3: Execution Gate | Result | Chart */}
        <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
          <div className="rounded-2xl [&>*]:h-full [&>*]:overflow-y-auto">
            <ExecutionGateSection
              form={form}
              strategyId={sid}
              accountId={aid}
              discipline={discipline}
              config={CONFIG}
              acceptedLoss={acceptedLoss}
              setAcceptedLoss={setAcceptedLoss}
              replanMode={replanMode}
              setReplanMode={setReplanMode}
              canArm={canArm}
              armDisabledReason={armDisabledReason}
              onArm={onArm}
              onArmOverride={onArmOverride}
              onEnter={onEnter}
              onEnterOverride={onEnterOverride}
              rr={rr}
              rrOk={rrOk}
              gateReady={gateReady}
              slPctOk={slPctOk}
            />
          </div>
          <div className="rounded-2xl [&>*]:h-full [&>*]:overflow-y-auto">
            <ResultSection form={form} onChange={handleChange} />
          </div>
          <div className="rounded-2xl">
            <ChartSection form={form} onChange={handleChange} />
          </div>
        </div>

        {/* Row 4: Save (bottom-right) */}
        <div className="flex justify-end shrink-0">
          <button
            type="submit"
            disabled={isSaving}
            className={`h-9 px-5 rounded-full text-sm font-semibold transition active:scale-[0.98] ${
              saveEmphasis
                ? savePulse
                  ? "bg-emerald-400 text-[#020617] shadow-[0_0_22px_rgba(0,255,163,.28)]"
                  : "bg-gradient-to-r from-[#00ffa3] to-[#7f5af0] text-[#020617] shadow-[0_0_18px_rgba(127,90,240,.18)] hover:brightness-110"
                : "bg-white/5 text-slate-500 border border-white/10"
            } ${isSaving ? "opacity-70 cursor-wait" : ""}`}
          >
            {isSaving ? (
              "Saving…"
            ) : savePulse ? (
              <span className="inline-flex items-center gap-2">
                <Check className="w-4 h-4" />
                Saved
              </span>
            ) : editingTrade ? (
              "Update"
            ) : (
              "Save"
            )}
          </button>
        </div>
      </form>

      {/* RuleBuilder modal renders from within EntryChecklist */}
    </>
  );
}
