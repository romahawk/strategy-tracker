// src/components/trades/TradeForm.jsx
import { useState, useEffect, useMemo } from "react";
import { debounce } from "lodash";
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

function Collapsible({ title, open, setOpen, children, hint }) {
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-300" />
          )}
          <span className="text-sm font-semibold text-slate-100">
            {title}
          </span>
          {hint && (
            <span className="text-[11px] text-slate-400">{hint}</span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          {open ? "Hide" : "Show"}
        </span>
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
      minRRByStrategy: { 1: 2, 2: 1 },
      maxSLPercentByStrategy: { 2: 1 },
      cooldownMinutesByStrategy: { 1: 1440, 2: 60 },
      baseRiskByStrategy: { 1: 1, 2: 1 },
    }),
    []
  );

  const [form, setForm] = useState({});
  const [acceptedLoss, setAcceptedLoss] = useState(false);
  const [replanMode, setReplanMode] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const [discipline, setDiscipline] = useState(() =>
    loadDiscipline(sid, aid)
  );

  useEffect(() => {
    setDiscipline(loadDiscipline(sid, aid));
  }, [sid, aid]);

  /* ---------- calculations ---------- */
  const rr = rrFrom(form);
  const rrOk = Number.isFinite(rr) && rr >= (CONFIG.minRRByStrategy[sid] ?? 1);
  const slPct = Math.abs(num(form.slPercent));
  const slPctOk =
    CONFIG.maxSLPercentByStrategy[sid] == null ||
    slPct <= CONFIG.maxSLPercentByStrategy[sid];

  const cooldownActive = isCooldownActive(discipline);
  const maxRiskNow =
    (CONFIG.baseRiskByStrategy[sid] ?? 1) *
    riskCapMultiplier(discipline);

  const gateReady =
    form.entry &&
    form.sl &&
    form.tp1 &&
    form.riskPercent &&
    acceptedLoss &&
    rrOk &&
    slPctOk &&
    !cooldownActive;

  /* ---------- actions ---------- */
  const onArm = () => {
    if (!gateReady) return;
    setForm(prev => ({
      ...prev,
      execState: "ARMED",
      armedAt: new Date().toISOString(),
      armedSl: prev.sl,
    }));
  };

  const onEnter = () => {
    if (form.execState !== "ARMED") return;
    setForm(prev => ({
      ...prev,
      execState: "ENTERED",
      enteredAt: new Date().toISOString(),
    }));
  };

  const handleSubmit = e => {
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
        <div className="space-y-2">
          <TradeInfoSection form={form} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })} />
          <RiskSetupSection form={form} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })} strategyId={sid} />
          <TargetsSection form={form} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })} />
        </div>

        <div className="space-y-2">
          <EntryConditionsSection form={form} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })} strategyId={sid} />

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
            <ResultSection form={form} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })} />
          </Collapsible>

          <Collapsible title="Chart" open={showChart} setOpen={setShowChart} hint="optional">
            <ChartSection form={form} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })} />
          </Collapsible>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#020617]/90 backdrop-blur border-t border-white/10 px-4 py-3">
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
