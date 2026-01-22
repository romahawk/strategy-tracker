// src/components/trades/TradeForm.jsx
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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

/* ---------- helpers ---------- */
function num(x) {
  const v = Number(x);
  return Number.isFinite(v) ? v : NaN;
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

function nearlyEqual(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

function Collapsible({ title, open, setOpen, children, hint }) {
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-300" />
          )}
          <span className="text-sm font-semibold text-slate-100">{title}</span>
          {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
        </div>
        <span className="text-[11px] text-slate-400">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="p-2 pt-0">{children}</div>}
    </div>
  );
}

/* ---------- form ---------- */
export default function TradeForm({
  onAddTrade,
  editingTrade,
  initialDeposit,
  strategyId,
  accountId,
}) {
  const sid = Number(strategyId) || 1;
  const aid = Number(accountId) || 1;

  const CONFIG = useMemo(
    () => ({
      minRRByStrategy: { 1: 2, 2: 1, 3: 1, 4: 1 },
      maxSLPercentByStrategy: { 2: 1 }, // TS2: <= 1% SL
      cooldownMinutesByStrategy: { 1: 1440, 2: 60, 3: 60, 4: 60 },
      baseRiskByStrategy: { 1: 1, 2: 1, 3: 0.5, 4: 0.5 },
    }),
    []
  );

  const [form, setForm] = useState({});
  const [acceptedLoss, setAcceptedLoss] = useState(false);
  const [replanMode, setReplanMode] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const [discipline, setDiscipline] = useState(() => loadDiscipline(sid, aid));

  useEffect(() => {
    setDiscipline(loadDiscipline(sid, aid));
  }, [sid, aid]);

  /* ---------- ✅ Risk / SL auto-calc pipeline ---------- */
  useEffect(() => {
    const isFunded = sid === 3 || sid === 4;

    const e = num(form.entry);
    const s = num(form.sl);
    const d = num(form.deposit);

    // must have entry + SL + deposit to compute
    if (!Number.isFinite(e) || !Number.isFinite(s) || !Number.isFinite(d) || d <= 0) {
      return;
    }

    const direction = form.direction || "Long";
    const isLong = String(direction) === "Long";

    // Signed SL% relative to entry
    const slPctSigned = isLong ? (s / e - 1) * 100 : (1 - s / e) * 100;
    const slPctAbs = Math.abs(slPctSigned);

    let next = {};

    if (!isFunded) {
      // TS1/TS2 sizing: usedDepositPercent + leverageX
      const usedPct = Math.max(0, num(form.usedDepositPercent || 25));
      const levX = Math.max(1, num(form.leverageX || 5));

      const positionSize = d * (usedPct / 100) * levX;
      const slDollar = positionSize * (slPctSigned / 100); // signed
      const riskDollar = slDollar; // signed (usually negative)
      const riskPercentAbs = (Math.abs(riskDollar) / d) * 100;

      next = {
        leverageAmount: Number.isFinite(positionSize) ? positionSize.toFixed(2) : "",
        slPercent: Number.isFinite(slPctSigned) ? slPctSigned.toFixed(2) : "",
        slDollar: Number.isFinite(slDollar) ? slDollar.toFixed(2) : "",
        riskDollar: Number.isFinite(riskDollar) ? riskDollar.toFixed(2) : "",
        riskPercent: Number.isFinite(riskPercentAbs) ? riskPercentAbs.toFixed(2) : "",
      };
    } else {
      // Funded sizing (TS3/TS4): target risk% determines position size (lot% in usedDepositPercent)
      let targetRisk = num(form.riskPercent || 0.5);
      if (!Number.isFinite(targetRisk) || targetRisk <= 0) targetRisk = 0.5;
      targetRisk = Math.min(2, Math.max(0.25, targetRisk));

      if (!Number.isFinite(slPctAbs) || slPctAbs <= 0) return;

      // lotPct = (targetRisk% * 100) / absSl%
      let lotPct = (targetRisk * 100) / slPctAbs;
      if (lotPct > 100) lotPct = 100;

      const positionSize = d * (lotPct / 100);
      const riskUsdAbs = positionSize * (slPctAbs / 100);
      const riskActualPct = (riskUsdAbs / d) * 100;

      // signed risk is negative
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

    // Apply only if something actually changed (prevents loops)
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
    // only compute when these inputs change:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sid,
    form.entry,
    form.sl,
    form.deposit,
    form.direction,
    form.usedDepositPercent,
    form.leverageX,
    form.riskPercent,
  ]);

  /* ---------- calculations ---------- */
  const rr = rrFrom(form);
  const rrOk = Number.isFinite(rr) && rr >= (CONFIG.minRRByStrategy[sid] ?? 1);

  const slPctAbs = Math.abs(num(form.slPercent));
  const slPctOk =
    CONFIG.maxSLPercentByStrategy[sid] == null ||
    (Number.isFinite(slPctAbs) && slPctAbs <= CONFIG.maxSLPercentByStrategy[sid]);

  const cooldownActive = isCooldownActive(discipline);
  const maxRiskNow =
    (CONFIG.baseRiskByStrategy[sid] ?? 1) * riskCapMultiplier(discipline);

  const gateReady =
    form.entry &&
    form.sl &&
    form.tp1 &&
    form.riskPercent &&
    acceptedLoss &&
    rrOk &&
    slPctOk &&
    !cooldownActive;

  /* ---------- ✅ Entry condition confluence highlighting ---------- */
  const isLong = (form.direction || "Long") === "Long";
  const stInvalid = isLong ? form.stTrend !== "bull" : form.stTrend !== "bear";
  const usdtInvalid = isLong ? form.usdtTrend !== "bear" : form.usdtTrend !== "bull";
  const overlayInvalid = isLong ? form.overlay !== "blue" : form.overlay !== "red";
  const ma200Invalid =
    form.ma200 === "ranging"
      ? false
      : isLong
      ? form.ma200 !== "above"
      : form.ma200 !== "below";

  // For TS1 & FX-like strategies: 5m confluence
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

  const invalidFlags = {
    stInvalid,
    usdtInvalid,
    overlayInvalid,
    ma200Invalid,
    buySell5mInvalid,
    ma2005mInvalid,
  };

  /* ---------- actions ---------- */
  const onArm = () => {
    if (!gateReady) return;
    setForm((prev) => ({
      ...prev,
      execState: "ARMED",
      armedAt: new Date().toISOString(),
      armedSl: prev.sl,
    }));
  };

  const onEnter = () => {
    if (form.execState !== "ARMED") return;
    setForm((prev) => ({
      ...prev,
      execState: "ENTERED",
      enteredAt: new Date().toISOString(),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.execState !== "ARMED" && form.execState !== "ENTERED") {
      const next = applyViolation({
        discipline,
        type: "OVERRIDE_SAVE",
        cooldownMinutes: CONFIG.cooldownMinutesByStrategy[sid],
      });
      saveDiscipline(sid, aid, next);
    } else {
      saveDiscipline(sid, aid, applyCleanTrade(discipline));
    }

    onAddTrade({ ...form, acceptedLoss, accountId: aid });
  };

  /* ---------- render ---------- */
  return (
    <form onSubmit={handleSubmit} className="space-y-2 pb-20">
      <div className="grid gap-2 lg:grid-cols-2">
        {/* LEFT (desktop) / LOWER (mobile) */}
        <div className="space-y-2 order-2 lg:order-1">
          <TradeInfoSection
            form={form}
            onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
          />

          <RiskSetupSection
            form={form}
            onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
            strategyId={sid}
          />

          <TargetsSection
            form={form}
            onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
          />
        </div>

        {/* RIGHT (desktop) / TOP (mobile) */}
        <div className="space-y-2 order-1 lg:order-2">
          <EntryConditionsSection
            form={form}
            onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
            strategyId={sid}
            invalidFlags={invalidFlags}
          />

          <ExecutionGateSection
            form={form}
            strategyId={sid}
            discipline={discipline}
            acceptedLoss={acceptedLoss}
            setAcceptedLoss={setAcceptedLoss}
            replanMode={replanMode}
            setReplanMode={setReplanMode}
            rr={rr}
            rrOk={rrOk}
            slPctOk={slPctOk}
            maxRiskNow={maxRiskNow}
            cooldownActive={cooldownActive}
            onArm={onArm}
            onEnter={onEnter}
          />

          <Collapsible title="Result" open={showResult} setOpen={setShowResult} hint="post-trade">
            <ResultSection
              form={form}
              onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
            />
          </Collapsible>

          <Collapsible title="Chart" open={showChart} setOpen={setShowChart} hint="optional">
            <ChartSection
              form={form}
              onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
            />
          </Collapsible>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#020617]/90 backdrop-blur border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            className={`h-9 px-5 rounded-full text-sm font-semibold ${
              gateReady
                ? "bg-[#00ffa3] text-[#020617] shadow-[0_0_16px_rgba(0,255,163,.35)]"
                : "bg-white/5 text-slate-500 border border-white/10"
            }`}
          >
            {editingTrade ? "Update trade" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
