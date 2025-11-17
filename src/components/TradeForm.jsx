// src/components/trades/TradeForm.jsx
import { useState, useEffect } from "react";
import { debounce } from "lodash";

import TradeInfoSection from "./trades/TradeInfoSection";
import EntryConditionsSection from "./trades/EntryConditionsSection";
import RiskSetupSection from "./trades/RiskSetupSection";
import TargetsSection from "./trades/TargetsSection";
import ChartSection from "./trades/ChartSection";
import ResultSection from "./trades/ResultSection";

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

  const [form, setForm] = useState({
    date: "",
    time: "",
    pair: "",
    direction: "Long",
    deposit: "",
    usedDepositPercent: "25",
    leverageX: "5",
    stTrend: "bull",
    usdtTrend: "bear",
    overlay: "blue",
    ma200: "ranging",
    buySell5m: "buy",
    ma2005m: "above",
    chochBos15m: "",
    overlay1m: "",
    bos1m: "",
    ma2001m: "",
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
  });

  // init / edit
  useEffect(() => {
    if (editingTrade) {
      setForm({ ...editingTrade });
    } else {
      setForm((prev) => ({
        ...prev,
        deposit: initialDeposit ? initialDeposit.toString() : "",
        screenshot: "",
      }));
    }
  }, [editingTrade, initialDeposit]);

  // ---------- TP CALC (all strategies, including funded) ----------
  const debouncedUpdateTP = debounce((newForm) => {
    const { entry, tp1, tp2, tp3, direction, tpsHit, result } = newForm;
    const e = parseFloat(entry);
    if (!e) return;

    // If trade is open → clear TP details
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
      // three partial exits: 1/3 + 1/3 + 1/3
      tp1Data = calc(tp1, 1 / 3);
      tp2Data = calc(tp2, 1 / 3);
      tp3Data = calc(tp3, 1 / 3);
    } else if (tpsHit === "2") {
      // TP1 1/3, TP2 2/3, TP3 = 0
      tp1Data = calc(tp1, 1 / 3);
      tp2Data = calc(tp2, 0.67);
      tp3Data = { percent: "", dollar: "0.00" };
    } else if (tpsHit === "SL") {
      tp1Data = { percent: "", dollar: "0.00" };
      tp2Data = { percent: "", dollar: "0.00" };
      tp3Data = { percent: "", dollar: "0.00" };
    } else {
      // only TP1 hit → full position there
      tp1Data = calc(tp1, 1);
      tp2Data = { percent: "", dollar: "0.00" };
      tp3Data = { percent: "", dollar: "0.00" };
    }

    // auto-result logic (works for all strategies)
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

  // ---------- RISK: Strategies 1 & 2 (margin / futures) ----------
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

  // ---------- RISK: Strategy 3 (funded account, lots from deposit) ----------
  const debouncedUpdateRisk_S3 = debounce((newForm) => {
    const { entry, sl, deposit, direction } = newForm;
    if (!entry || !sl || !deposit) return;

    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const d = parseFloat(deposit);
    if (isNaN(e) || isNaN(s) || isNaN(d) || d <= 0) return;

    const usedPct = Math.max(0, parseFloat(newForm.usedDepositPercent || "25"));
    const levX = Math.max(1, parseFloat(newForm.leverageX || "1"));

    // position size used for PnL / risk
    const positionSize = d * (usedPct / 100) * levX;

    const slP = direction === "Long" ? (s / e - 1) * 100 : (1 - s / e) * 100;
    const slDollar = positionSize * (slP / 100);

    const riskD = slDollar;
    const riskPabs = (Math.abs(riskD) / d) * 100;

    // derived lots: 100k notionals = 1.00 lot
    const lots = positionSize / 100000;

    const updatedRisk = {
      ...newForm,
      leverageAmount: positionSize.toFixed(2),
      slPercent: slP.toFixed(2),
      slDollar: slDollar.toFixed(2),
      riskDollar: riskD.toFixed(2),
      riskPercent: riskPabs.toFixed(2),
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
    if (tpsHit === "SL") {
      pnl = slSigned - commission;
    } else if (res === "Win") {
      pnl = tpSum - commission;
    } else if (res === "Break Even") {
      pnl = -commission;
    } else {
      pnl = -Math.abs(slSigned) - commission;
    }

    const nextDeposit = d + pnl;

    setForm((prev) => ({
      ...prev,
      commission: commission.toFixed(2),
      tpTotal: tpSum.toFixed(2),
      pnl: pnl.toFixed(2),
      nextDeposit: nextDeposit.toFixed(2),
    }));
  }, 200);

  // ---------- MAIN CHANGE HANDLER ----------
  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);

    if (
      e.target.name === "entry" ||
      e.target.name === "sl" ||
      e.target.name === "deposit" ||
      e.target.name === "direction" ||
      e.target.name === "pair" ||
      e.target.name === "riskTargetPercent" ||
      e.target.name === "usedDepositPercent" ||
      e.target.name === "leverageX"
    ) {
      if (sid === 3) debouncedUpdateRisk_S3(newForm);
      else debouncedUpdateRisk_S1_S2(newForm);
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
      debouncedUpdateTP(newForm);
      debouncedUpdateResult(newForm);
    }
  };

  // ---------- SUBMIT ----------
  const handleSubmit = (e) => {
    e.preventDefault();
    const id = editingTrade?.id ?? Date.now();
    onAddTrade({ ...form, id, accountId: aid });

    const carryOverDeposit =
      form?.nextDeposit && !Number.isNaN(Number(form.nextDeposit))
        ? String(Number(form.nextDeposit))
        : initialDeposit
        ? String(initialDeposit)
        : "";

    setForm({
      date: "",
      time: "",
      pair: "",
      direction: "Long",
      deposit: carryOverDeposit,
      usedDepositPercent: "25",
      leverageX: "5",
      stTrend: "bull",
      usdtTrend: "bear",
      overlay: "blue",
      ma200: "ranging",
      buySell5m: "buy",
      ma2005m: "above",
      chochBos15m: "",
      overlay1m: "",
      bos1m: "",
      ma2001m: "",
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
    });
  };

  // ---------- ENTRY CONDITION FLAGS ----------
  const isLong = form.direction === "Long";
  const stInvalid = isLong ? form.stTrend !== "bull" : form.stTrend !== "bear";
  const usdtInvalid = isLong
    ? form.usdtTrend !== "bear"
    : form.usdtTrend !== "bull";
  const overlayInvalid = isLong
    ? form.overlay !== "blue"
    : form.overlay !== "red";
  const ma200Invalid = isLong ? form.ma200 !== "above" : form.ma200 !== "below";

  const buySell5mInvalid =
    sid === 1 || sid === 3
      ? isLong
        ? form.buySell5m !== "buy"
        : form.buySell5m !== "sell"
      : false;

  const ma2005mInvalid =
    sid === 1 || sid === 3
      ? isLong
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

  // ---------- RENDER ----------
  return (
    <form onSubmit={handleSubmit} className="space-y-3 pb-0">
      {/* main grid */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* left column */}
        <div className="space-y-3">
          <TradeInfoSection
            form={form}
            onChange={handleChange}
            strategyId={sid}
          />
          <RiskSetupSection
            form={form}
            onChange={handleChange}
            strategyId={sid}
            riskTooHigh={riskTooHigh}
          />
          <ChartSection form={form} onChange={handleChange} />
        </div>

        {/* right column */}
        <div className="space-y-3">
          <EntryConditionsSection
            form={form}
            onChange={handleChange}
            strategyId={sid}
            invalidFlags={invalidFlags}
          />
          <TargetsSection form={form} onChange={handleChange} />
          <ResultSection form={form} onChange={handleChange} />
        </div>
      </div>

      {/* save row */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          className="h-8 px-5 rounded-full bg-[#00ffa3] text-[#020617] text-sm font-semibold tracking-tight hover:brightness-110 transition inline-flex items-center gap-2 shadow-[0_0_14px_rgba(0,255,163,.3)] focus:outline-none focus:ring-2 focus:ring-[#00ffa3]/40"
        >
          {editingTrade ? "Update trade" : "Save"}
        </button>
      </div>
    </form>
  );
}
