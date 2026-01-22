// src/components/trades/TradeForm.jsx
import { useState, useEffect, useMemo } from "react";
import { debounce } from "lodash";

import TradeInfoSection from "./trades/TradeInfoSection";
import EntryConditionsSection from "./trades/EntryConditionsSection";
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

function buildDefaultForm(sid) {
  const isTS1 = sid === 1;
  const isTS2 = sid === 2;

  return {
    date: "",
    time: "",
    pair: "",
    direction: "Long",

    deposit: "",

    usedDepositPercent: isTS2 ? "100" : "25",
    leverageX: isTS1 || isTS2 ? "10" : "5",

    stTrend: "bull",
    usdtTrend: "bear",
    overlay: "blue",
    ma200: "ranging",
    buySell5m: "buy",
    ma2005m: "above",

    chochBos15m: "bull_choch",
    st1m: "bull",
    overlay1m: "",
    ma2001m: "ranging",

    bos1m: "bull",

    // ---- Extra confluences (optional) ----
    session: "ny",
    structure: "na",
    liquiditySweep: "na",
    oteRetest: "na",
    newsRisk: "none",

    entry: "",
    sl: "",
    leverageAmount: "",
    slPercent: "",
    slDollar: "",
    riskDollar: "",
    riskPercent: "",
    riskTargetPercent: "",
    lots: "",
    pipValue: "",
    tp1: "",
    tp2: "",
    tp3: "",
    tpsHit: "OPEN",
    tp1Percent: "",
    tp2Percent: "",
    tp3Percent: "",
    tp1Dollar: "",
    tp2Dollar: "",
    tp3Dollar: "",
    result: "Open",
    commission: "",
    tpTotal: "",
    pnl: "",
    nextDeposit: "",
    screenshot: "",

    // ---- Execution Gate (MVP) ----
    execState: "REVIEWING", // REVIEWING | ARMED | ENTERED
    acceptedLoss: false,
    armedAt: "",
    enteredAt: "",
    violations: [], // {ts,type}
    armedSl: "", // numeric snapshot for widening detection
  };
}

export default function TradeForm({
  onAddTrade,
  editingTrade,
  initialDeposit,
  strategyId,
  accountId,
  showTitle = true,
}) {
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;

  const CONFIG = useMemo(
    () => ({
      baseRiskByStrategy: {
        1: 1.0,
        2: 1.0,
        3: 0.5,
        4: 0.5,
      },
      minRRByStrategy: {
        1: 2.0,
        2: 1.0,
        3: 1.0,
        4: 1.0,
      },
      maxSLPercentByStrategy: {
        2: 1.0, // TS2 scalps: <= 1%
      },
      cooldownMinutesByStrategy: {
        1: 24 * 60, // TS1: 24h
        2: 60, // TS2: 60m
        3: 60,
        4: 60,
      },
    }),
    []
  );

  const [form, setForm] = useState(() => buildDefaultForm(sid));

  // gate UI states (local UI)
  const [acceptedLoss, setAcceptedLoss] = useState(false);
  const [replanMode, setReplanMode] = useState(false);

  // discipline
  const [discipline, setDiscipline] = useState(() =>
    loadDiscipline(sid, aid)
  );

  useEffect(() => {
    setDiscipline(loadDiscipline(sid, aid));
  }, [sid, aid]);

  // init / edit
  useEffect(() => {
    if (editingTrade) {
      const merged = { ...buildDefaultForm(sid), ...editingTrade };
      setForm(merged);
      setAcceptedLoss(!!merged.acceptedLoss);
    } else {
      setForm((prev) => ({
        ...buildDefaultForm(sid),
        direction: prev.direction || "Long",
        screenshot: "",
      }));
      setAcceptedLoss(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTrade, initialDeposit, sid, aid]);

  // TS2 always defaults to 100%
  useEffect(() => {
    if (sid === 2 && String(form.usedDepositPercent) !== "100") {
      setForm((prev) => ({ ...prev, usedDepositPercent: "100" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  // ---------- TP CALC ----------
  const debouncedUpdateTP = debounce((newForm) => {
    const { entry, tp1, tp2, tp3, direction, tpsHit, result } = newForm;
    const e = parseFloat(entry);
    if (!e) return;

    if (tpsHit === "OPEN" || result === "Open") {
      const updated = {
        ...newForm,
        tp1Percent: "",
        tp1Dollar: "",
        tp2Percent: "",
        tp2Dollar: "",
        tp3Percent: "",
        tp3Dollar: "",
      };
      setForm(updated);
      return;
    }

    const posSize = parseFloat(newForm.leverageAmount);
    if (!posSize) return;

    const calc = (tp, factor) => {
      if (!tp) return { percent: "", dollar: "" };
      const t = parseFloat(tp);
      const tpPct =
        direction === "Long" ? (t / e - 1) * 100 : (1 - t / e) * 100;
      const tpDol = posSize * (tpPct / 100) * factor;
      return { percent: tpPct.toFixed(2), dollar: tpDol.toFixed(2) };
    };

    let tp1Data, tp2Data, tp3Data;

    if (tpsHit === "3") {
      tp1Data = calc(tp1, 1 / 3);
      tp2Data = calc(tp2, 1 / 3);
      tp3Data = calc(tp3, 1 / 3);
    } else if (tpsHit === "2") {
      tp1Data = calc(tp1, 1 / 3);
      tp2Data = calc(tp2, 0.67);
      tp3Data = { percent: "", dollar: "0.00" };
    } else if (tpsHit === "SL") {
      tp1Data = { percent: "", dollar: "0.00" };
      tp2Data = { percent: "", dollar: "0.00" };
      tp3Data = { percent: "", dollar: "0.00" };
    } else {
      tp1Data = calc(tp1, 1);
      tp2Data = { percent: "", dollar: "0.00" };
      tp3Data = { percent: "", dollar: "0.00" };
    }

    let autoResult = newForm.result;
    if (autoResult !== "Open") {
      if (tpsHit === "SL") {
        const slVal = parseFloat(newForm.riskDollar) || 0;
        autoResult = slVal >= 0 ? "Win" : "Loss";
      } else if (tpsHit === "1" || tpsHit === "2" || tpsHit === "3") {
        autoResult = "Win";
      }
    }

    const tpSum =
      (parseFloat(tp1Data.dollar || 0) || 0) +
      (parseFloat(tp2Data.dollar || 0) || 0) +
      (parseFloat(tp3Data.dollar || 0) || 0);

    if (!autoResult || autoResult === "")
      autoResult = tpSum > 0 ? "Win" : "Break Even";

    const updated = {
      ...newForm,
      tp1Percent: tp1Data.percent,
      tp1Dollar: tp1Data.dollar,
      tp2Percent: tp2Data.percent,
      tp2Dollar: tp2Data.dollar,
      tp3Percent: tp3Data.percent,
      tp3Dollar: tp3Data.dollar,
      result: autoResult,
    };
    setForm(updated);
    debouncedUpdateResult(updated);
  }, 200);

  // ---------- RISK: S1/S2 ----------
  const debouncedUpdateRisk_S1_S2 = debounce((newForm) => {
    const { entry, sl, deposit, direction } = newForm;
    if (!entry || !sl || !deposit) return;

    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const d = parseFloat(deposit);
    if (isNaN(e) || isNaN(s) || isNaN(d) || d <= 0) return;

    const usedPct = Math.max(0, parseFloat(newForm.usedDepositPercent || "25"));
    const levX = Math.max(1, parseFloat(newForm.leverageX || "5"));

    const positionSize = d * (usedPct / 100) * levX;

    const slP = direction === "Long" ? (s / e - 1) * 100 : (1 - s / e) * 100;
    const slDollar = positionSize * (slP / 100);

    const riskD = slDollar;
    const riskPabs = (Math.abs(riskD) / d) * 100;

    const updatedRisk = {
      ...newForm,
      leverageAmount: positionSize.toFixed(2),
      slPercent: slP.toFixed(2),
      slDollar: slDollar.toFixed(2),
      riskDollar: riskD.toFixed(2),
      riskPercent: riskPabs.toFixed(2),
      lots: "",
      pipValue: "",
    };

    setForm((prev) => ({ ...prev, ...updatedRisk }));
    debouncedUpdateTP(updatedRisk);
  }, 200);

  // ---------- RISK: S3/S4 (funded) ----------
  const debouncedUpdateRisk_S3 = debounce((newForm) => {
    const { entry, sl, deposit, direction } = newForm;
    if (!entry || !sl || !deposit) return;

    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const d = parseFloat(deposit);
    if ([e, s, d].some((v) => Number.isNaN(v)) || d <= 0) return;

    let targetRisk = parseFloat(newForm.riskPercent || "0.5");
    if (Number.isNaN(targetRisk) || targetRisk <= 0) targetRisk = 0.5;
    if (targetRisk < 0.25) targetRisk = 0.25;
    if (targetRisk > 2) targetRisk = 2;

    const slP = direction === "Long" ? (s / e - 1) * 100 : (1 - s / e) * 100;
    const absSl = Math.abs(slP);

    if (!absSl) {
      setForm((prev) => ({
        ...prev,
        slPercent: slP.toFixed(2),
        slDollar: "",
        riskDollar: "",
        riskPercent: targetRisk.toFixed(2),
      }));
      return;
    }

    let lotPct = (targetRisk * 100) / absSl;
    if (lotPct > 100) lotPct = 100;

    const positionSize = d * (lotPct / 100);
    const riskUsdAbs = positionSize * (absSl / 100);
    const riskActualPct = (riskUsdAbs / d) * 100;

    const riskUsdSigned = -riskUsdAbs;
    const lots = positionSize / 100000;

    const updatedRisk = {
      ...newForm,
      usedDepositPercent: lotPct.toFixed(2),
      leverageAmount: positionSize.toFixed(2),
      slPercent: slP.toFixed(2),
      slDollar: riskUsdSigned.toFixed(2),
      riskDollar: riskUsdSigned.toFixed(2),
      riskPercent: riskActualPct.toFixed(2),
      lots: lots.toFixed(2),
      pipValue: "",
    };

    setForm((prev) => ({ ...prev, ...updatedRisk }));
    debouncedUpdateTP(updatedRisk);
  }, 200);

  // ---------- RESULT / PnL ----------
  const debouncedUpdateResult = debounce((newForm) => {
    const { deposit, tpsHit, result } = newForm;
    const d = parseFloat(deposit);
    if (!d) return;

    if (result === "Open" || tpsHit === "OPEN") {
      setForm((prev) => ({
        ...prev,
        commission: "",
        tpTotal: "",
        pnl: "",
        nextDeposit: "",
      }));
      return;
    }

    let commission = 0;
    if (sid === 1 || sid === 2) {
      const posSize = parseFloat(newForm.leverageAmount);
      if (posSize) {
        const cRate = 0.0004;
        commission = posSize * cRate;
      }
    }

    const tp1 = parseFloat(newForm.tp1Dollar) || 0;
    const tp2 = parseFloat(newForm.tp2Dollar) || 0;
    const tp3 = parseFloat(newForm.tp3Dollar) || 0;
    const tpSum = tp1 + tp2 + tp3;

    const slSigned = parseFloat(newForm.riskDollar) || 0;

    let res = newForm.result;
    if (!res || res === "Open") {
      if (tpsHit === "SL") {
        res = slSigned >= 0 ? "Win" : "Loss";
      } else if (tpsHit === "1" || tpsHit === "2" || tpsHit === "3") {
        res = "Win";
      } else {
        res = tpSum > 0 ? "Win" : "Break Even";
      }
    }

    let pnl;
    if (tpsHit === "SL") pnl = slSigned - commission;
    else if (res === "Win") pnl = tpSum - commission;
    else if (res === "Break Even") pnl = -commission;
    else pnl = -Math.abs(slSigned) - commission;

    const nextDeposit = d + pnl;

    setForm((prev) => ({
      ...prev,
      commission: commission.toFixed(2),
      tpTotal: tpSum.toFixed(2),
      pnl: pnl.toFixed(2),
      nextDeposit: nextDeposit.toFixed(2),
    }));
  }, 200);

  // ---------- discipline helpers ----------
  const writeDiscipline = (next) => {
    setDiscipline(next);
    saveDiscipline(sid, aid, next);
  };

  const addViolationToForm = (type) => {
    setForm((prev) => ({
      ...prev,
      violations: [...(prev.violations || []), { ts: Date.now(), type }],
    }));
  };

  const cooldownMinutes = CONFIG.cooldownMinutesByStrategy[sid] ?? 60;

  const triggerViolation = (type) => {
    addViolationToForm(type);
    const next = applyViolation({
      discipline,
      type,
      cooldownMinutes,
    });
    writeDiscipline(next);
  };

  // ---------- SL lock logic ----------
  const enforceSlLock = (prev, next) => {
    const state = next.execState || "REVIEWING";
    if (!(state === "ARMED" || state === "ENTERED")) return next;

    // cannot remove
    if (!next.sl) {
      triggerViolation("NO_SL");
      return { ...next, sl: prev.sl };
    }

    const prevSl = num(prev.sl || prev.armedSl);
    const newSl = num(next.sl);
    const entry = num(next.entry);
    if (![prevSl, newSl, entry].every(Number.isFinite)) return next;

    const isLong = String(next.direction || "Long") === "Long";

    // tightening vs widening:
    // Long: tighter = SL moves up (closer to entry) -> larger SL price
    // Short: tighter = SL moves down -> smaller SL price
    const widening = isLong ? newSl < prevSl : newSl > prevSl;

    if (widening && !replanMode) {
      triggerViolation("MOVING_SL_WIDER");
      return { ...next, sl: prev.sl };
    }

    if (widening && replanMode) {
      triggerViolation("MOVING_SL_WIDER");
      // allow widening, but keep it logged
      return next;
    }

    return next;
  };

  // ---------- MAIN CHANGE HANDLER ----------
  const handleChange = (e) => {
    const rawNext = { ...form, [e.target.name]: e.target.value };

    // enforce SL lock rules on every change that touches SL or state
    const next = e.target.name === "sl" ? enforceSlLock(form, rawNext) : rawNext;

    setForm(next);

    if (
      e.target.name === "entry" ||
      e.target.name === "sl" ||
      e.target.name === "deposit" ||
      e.target.name === "direction" ||
      e.target.name === "pair" ||
      e.target.name === "riskTargetPercent" ||
      e.target.name === "usedDepositPercent" ||
      e.target.name === "leverageX" ||
      e.target.name === "riskPercent"
    ) {
      if (sid === 3 || sid === 4) debouncedUpdateRisk_S3(next);
      else debouncedUpdateRisk_S1_S2(next);
    }

    if (
      e.target.name === "tp1" ||
      e.target.name === "tp2" ||
      e.target.name === "tp3" ||
      e.target.name === "direction" ||
      e.target.name === "tpsHit" ||
      e.target.name === "entry" ||
      e.target.name === "lots" ||
      e.target.name === "result"
    ) {
      debouncedUpdateTP(next);
      debouncedUpdateResult(next);
    }
  };

  // ---------- Entry Condition Flags ----------
  const isLong = form.direction === "Long";
  const stInvalid = isLong ? form.stTrend !== "bull" : form.stTrend !== "bear";
  const usdtInvalid = isLong ? form.usdtTrend !== "bear" : form.usdtTrend !== "bull";
  const overlayInvalid = isLong ? form.overlay !== "blue" : form.overlay !== "red";
  const ma200Invalid =
    form.ma200 === "ranging"
      ? false
      : isLong
      ? form.ma200 !== "above"
      : form.ma200 !== "below";

  const isFxLike = sid === 3 || sid === 4;

  const buySell5mInvalid =
    sid === 1 || isFxLike
      ? isLong
        ? form.buySell5m !== "buy"
        : form.buySell5m !== "sell"
      : false;

  const ma2005mInvalid =
    sid === 1 || isFxLike
      ? form.ma2005m === "ranging"
        ? false
        : isLong
        ? form.ma2005m !== "above"
        : form.ma2005m !== "below"
      : false;

  const riskTooHigh = Number(form.riskPercent) > 10;

  const invalidFlags = {
    stInvalid,
    usdtInvalid,
    overlayInvalid,
    ma200Invalid,
    buySell5mInvalid,
    ma2005mInvalid,
  };

  // ---------- Gate computations ----------
  const cooldownActive = isCooldownActive(discipline);
  const baseRisk = CONFIG.baseRiskByStrategy[sid] ?? 1.0;
  const capMult = riskCapMultiplier(discipline);
  const maxRiskNow = baseRisk * capMult;

  const rr = rrFrom(form);
  const minRR = CONFIG.minRRByStrategy[sid] ?? 1.0;
  const rrOk = Number.isFinite(rr) ? rr >= minRR : false;

  const maxSlPct = CONFIG.maxSLPercentByStrategy[sid];
  const slPctAbs = Number.isFinite(num(form.slPercent)) ? Math.abs(num(form.slPercent)) : NaN;
  const slPctOk =
    typeof maxSlPct === "number"
      ? Number.isFinite(slPctAbs) && slPctAbs <= maxSlPct
      : true;

  const canArm = !cooldownActive;
  const armDisabledReason = cooldownActive
    ? `Cooldown active. Max risk now: ${maxRiskNow.toFixed(2)}%`
    : "";

  const gateReady =
    !!form.entry &&
    !!form.sl &&
    !!form.tp1 &&
    !!form.riskPercent &&
    !!acceptedLoss &&
    rrOk &&
    slPctOk;

  const onArm = () => {
    if (cooldownActive) return;

    if (!gateReady) return;

    // enforce risk cap
    const riskPct = num(form.riskPercent);
    if (Number.isFinite(riskPct) && riskPct > maxRiskNow) {
      // cap it automatically (strict)
      setForm((prev) => ({
        ...prev,
        riskPercent: maxRiskNow.toFixed(2),
      }));
      triggerViolation("RISK_CAPPED");
    }

    setForm((prev) => ({
      ...prev,
      execState: "ARMED",
      acceptedLoss: true,
      armedAt: prev.armedAt || new Date().toISOString(),
      armedSl: prev.sl || prev.armedSl,
    }));
    setAcceptedLoss(true);
  };

  const onArmOverride = () => {
    triggerViolation("OVERRIDE_COOLDOWN");
    setForm((prev) => ({
      ...prev,
      execState: "ARMED",
      acceptedLoss: !!acceptedLoss,
      armedAt: prev.armedAt || new Date().toISOString(),
      armedSl: prev.sl || prev.armedSl,
    }));
  };

  const onEnter = () => {
    if (!(form.execState === "ARMED")) return;
    if (!form.sl) {
      triggerViolation("NO_SL");
      return;
    }
    setForm((prev) => ({
      ...prev,
      execState: "ENTERED",
      enteredAt: prev.enteredAt || new Date().toISOString(),
    }));
  };

  const onEnterOverride = () => {
    triggerViolation("OVERRIDE_ENTRY");
    setForm((prev) => ({
      ...prev,
      execState: "ENTERED",
      enteredAt: prev.enteredAt || new Date().toISOString(),
    }));
  };

  // ---------- SUBMIT ----------
  const handleSubmit = (e) => {
    e.preventDefault();

    const isOverrideSave = form.execState !== "ARMED" && form.execState !== "ENTERED";
    if (isOverrideSave) {
      triggerViolation("OVERRIDE_SAVE");
    } else {
      // clean trade (no new violations this action)
      const nextD = applyCleanTrade(discipline);
      writeDiscipline(nextD);
    }

    const id = editingTrade?.id ?? Date.now();
    onAddTrade({ ...form, acceptedLoss: !!acceptedLoss, id, accountId: aid });

    setForm({ ...buildDefaultForm(sid), screenshot: "" });
    setAcceptedLoss(false);
    setReplanMode(false);
  };

  const execState = form.execState || "REVIEWING";
  const saveAllowed = execState === "ARMED" || execState === "ENTERED";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-0">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <TradeInfoSection form={form} onChange={handleChange} strategyId={sid} />
          <RiskSetupSection
            form={form}
            onChange={handleChange}
            strategyId={sid}
            riskTooHigh={riskTooHigh}
          />
          <TargetsSection form={form} onChange={handleChange} />
        </div>

        <div className="space-y-3">
          <EntryConditionsSection
            form={form}
            onChange={handleChange}
            strategyId={sid}
            invalidFlags={invalidFlags}
          />

          <ExecutionGateSection
            form={{ ...form, acceptedLoss }}
            strategyId={sid}
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
          />

          <ResultSection form={form} onChange={handleChange} />
          <ChartSection form={form} onChange={handleChange} />
        </div>
      </div>

      <div className="flex justify-end pt-1 gap-2">
        {!saveAllowed && (
          <button
            type="submit"
            className="h-8 px-4 rounded-full bg-amber-400/10 text-amber-200 text-sm font-semibold border border-amber-400/25 hover:bg-amber-400/15 transition"
            title="Saves without ARMED/ENTERED (records violation)"
          >
            Save anyway (Violation)
          </button>
        )}

        <button
          type="submit"
          disabled={!saveAllowed && !editingTrade}
          className={`h-8 px-5 rounded-full text-sm font-semibold tracking-tight transition inline-flex items-center gap-2 focus:outline-none focus:ring-2 ${
            saveAllowed || editingTrade
              ? "bg-[#00ffa3] text-[#020617] hover:brightness-110 shadow-[0_0_14px_rgba(0,255,163,.3)] focus:ring-[#00ffa3]/40"
              : "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed"
          }`}
          title={!saveAllowed ? "Arm trade first" : ""}
        >
          {editingTrade ? "Update trade" : "Save"}
        </button>
      </div>
    </form>
  );
}
