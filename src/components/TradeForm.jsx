import { useState, useEffect } from "react";
import { debounce } from "lodash";
import {
  PlusCircle,
  CalendarDays,
  Layers,
  LineChart,
  Shield,
  Target as TargetIcon,
  BarChart3,
  Check,
} from "lucide-react";

// ---- FX helpers ----
const SUPPORTED_FX = new Set([
  "EURUSD",
  "GBPUSD",
  "AUDUSD",
  "NZDUSD",
  "USDJPY",
  "USDCHF",
  "USDCAD",
]);

function pipSize(pair) {
  return pair?.toUpperCase().endsWith("JPY") ? 0.01 : 0.0001;
}
function pipValuePerLot(pair, entry) {
  const p = pair?.toUpperCase();
  if (!p || !SUPPORTED_FX.has(p)) return null;
  if (["EURUSD", "GBPUSD", "AUDUSD", "NZDUSD"].includes(p)) return 10.0;
  if (p === "USDJPY") {
    if (!entry) return null;
    return 1000.0 / parseFloat(entry);
  }
  if (p === "USDCHF" || p === "USDCAD") {
    if (!entry) return null;
    return 10.0 / parseFloat(entry);
  }
  return null;
}

// ------------------------
function parseDateTimeToEpoch(dateStr, timeStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const s = dateStr.replace(/\//g, "-").trim();

  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [_, y, mo, d] = m;
    const [HH="0", MM="0", SS="0"] = (timeStr || "").split(":");
    return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
  }
  // DD-MM-YYYY
  m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    const [_, d, mo, y] = m;
    const [HH="0", MM="0", SS="0"] = (timeStr || "").split(":");
    return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
  }
  // DD-MM-YY -> 20YY
  m = s.match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if (m) {
    const [_, d, mo, yy] = m;
    const y = 2000 + +yy;
    const [HH="0", MM="0", SS="0"] = (timeStr || "").split(":");
    return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
  }
  return null;
}


// ------------------------

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
    // Trade info
    date: "",
    time: "",
    pair: "",
    direction: "Long",
    deposit: "",

    // Position sizing (S1/S2)
    usedDepositPercent: "25",
    leverageX: "5",

    // Entry conditions (shared)
    stTrend: "bull",
    usdtTrend: "bear",
    overlay: "blue",
    ma200: "ranging",

    // Strategy 1 specific
    buySell5m: "buy",
    ma2005m: "above",

    // Strategy 2 extras
    chochBos15m: "",
    overlay1m: "",
    bos1m: "",
    ma2001m: "",

    // Risk
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

    // Targets
    tp1: "",
    tp2: "",
    tp3: "",
    tpsHit: "OPEN", // NEW default: not closed yet
    tp1Percent: "",
    tp2Percent: "",
    tp3Percent: "",
    tp1Dollar: "",
    tp2Dollar: "",
    tp3Dollar: "",

    // Result
    result: "Open", // NEW default: result unknown
    commission: "",
    tpTotal: "",
    pnl: "",
    nextDeposit: "",

    // Chart
    screenshot: "",
  });

  useEffect(() => {
  // robust parser: supports YYYY-MM-DD, DD-MM-YYYY, DD-MM-YY and "/" separators
  const parseDateTimeToEpoch = (dateStr, timeStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const s = dateStr.replace(/\//g, "-").trim();

    // YYYY-MM-DD
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [_, y, mo, d] = m;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    // DD-MM-YYYY
    m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (m) {
      const [_, d, mo, y] = m;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    // DD-MM-YY -> 20YY
    m = s.match(/^(\d{2})-(\d{2})-(\d{2})$/);
    if (m) {
      const [_, d, mo, yy] = m;
      const y = 2000 + +yy;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    return null;
  };

  if (editingTrade) {
    // Ensure both timestamps exist and are correct when editing
    const openedAtMs =
      typeof editingTrade.openedAtMs === "number" && editingTrade.openedAtMs > 0
        ? editingTrade.openedAtMs
        : parseDateTimeToEpoch(editingTrade.date, editingTrade.time);

    const createdAtMs =
      typeof editingTrade.createdAtMs === "number" && editingTrade.createdAtMs > 0
        ? editingTrade.createdAtMs
        : Date.now();

    setForm({ ...editingTrade, openedAtMs, createdAtMs });
  } else {
    // Seed new form with deposit + canonical timestamps
    setForm((prev) => ({
      ...prev,
      deposit: initialDeposit ? String(initialDeposit) : (prev.deposit ?? ""),
      screenshot: "",
      openedAtMs:
        parseDateTimeToEpoch(prev.date, prev.time) ??
        (typeof prev.openedAtMs === "number" ? prev.openedAtMs : null),
      createdAtMs:
        typeof prev.createdAtMs === "number" ? prev.createdAtMs : Date.now(),
    }));
  }
}, [editingTrade, initialDeposit]);

  // ------------------------
  // COMPUTATIONS
  // ------------------------

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
    const riskPabs = Math.abs(riskD) / d * 100;

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

  const debouncedUpdateRisk_S3 = debounce((newForm) => {
    const { pair, entry, sl, deposit, direction, riskTargetPercent } = newForm;
    if (!pair || !entry || !sl || !deposit || !riskTargetPercent) return;

    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const d = parseFloat(deposit);
    const rTarget = parseFloat(riskTargetPercent);
    if ([e, s, d, rTarget].some((v) => isNaN(v)) || d <= 0 || rTarget <= 0) return;

    const slP = direction === "Long" ? (s / e - 1) * 100 : (1 - s / e) * 100;

    const ps = pipSize(pair);
    const slDistance = Math.abs(s - e);
    const slPips = slDistance / ps;

    const pv = pipValuePerLot(pair, e);
    if (!pv) return;

    const riskUSD = d * (rTarget / 100);
    const lots = riskUSD / (slPips * pv);

    const updatedRisk = {
      ...newForm,
      leverageAmount: "",
      slPercent: slP.toFixed(2),
      slDollar: riskUSD.toFixed(2),
      riskDollar: riskUSD.toFixed(2),
      riskPercent: rTarget.toFixed(2),
      lots: lots.toFixed(2),
      pipValue: pv.toFixed(4),
    };

    setForm((prev) => ({ ...prev, ...updatedRisk }));
    debouncedUpdateTP(updatedRisk);
  }, 200);

  const debouncedUpdateTP = debounce((newForm) => {
    const { entry, tp1, tp2, tp3, direction, tpsHit, result } = newForm;
    const e = parseFloat(entry);
    if (!e) return;

    // Skip computing realized TPs for open trades
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

    if (sid === 1 || sid === 2) {
      const posSize = parseFloat(newForm.leverageAmount);
      if (!posSize) return;

      const calc = (tp, factor) => {
        if (!tp) return { percent: "", dollar: "" };
        const t = parseFloat(tp);
        const tpPct = direction === "Long" ? (t / e - 1) * 100 : (1 - t / e) * 100;
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
        tp1Data = calc(tp1, 1.0);
        tp2Data = { percent: "", dollar: "0.00" };
        tp3Data = { percent: "", dollar: "0.00" };
      }

      // Only auto-set result if user hasn't explicitly chosen Open
      let autoResult = result;
      if (result !== "Open") {
        if (tpsHit === "SL") autoResult = "Loss";
        else if (tpsHit === "1" || tpsHit === "2" || tpsHit === "3") autoResult = "Win";
      }

      const tpSum =
        (parseFloat(tp1Data.dollar || 0) || 0) +
        (parseFloat(tp2Data.dollar || 0) || 0) +
        (parseFloat(tp3Data.dollar || 0) || 0);

      if (!autoResult || autoResult === "") autoResult = tpSum > 0 ? "Win" : "Break Even";

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
      return;
    }

    // Strategy 3 (FX)
    const pair = newForm.pair;
    const lots = parseFloat(newForm.lots);
    const pv = parseFloat(newForm.pipValue);
    if (!pair || !lots || !pv) return;
    const ps = pipSize(pair);

    const calcFX = (tp, factor) => {
      if (!tp) return { percent: "", dollar: "" };
      const t = parseFloat(tp);
      const tpPct = direction === "Long" ? (t / e - 1) * 100 : (1 - t / e) * 100;
      const pips = Math.abs(t - e) / ps;
      const tpDol = lots * pv * pips * factor;
      return { percent: tpPct.toFixed(2), dollar: tpDol.toFixed(2) };
    };

    let tp1Data, tp2Data, tp3Data;
    if (tpsHit === "3") {
      tp1Data = calcFX(tp1, 1 / 3);
      tp2Data = calcFX(tp2, 1 / 3);
      tp3Data = calcFX(tp3, 1 / 3);
    } else if (tpsHit === "2") {
      tp1Data = calcFX(tp1, 1 / 3);
      tp2Data = calcFX(tp2, 0.67);
      tp3Data = { percent: "", dollar: "0.00" };
    } else if (tpsHit === "SL") {
      tp1Data = { percent: "", dollar: "0.00" };
      tp2Data = { percent: "", dollar: "0.00" };
      tp3Data = { percent: "", dollar: "0.00" };
    } else {
      tp1Data = calcFX(tp1, 1.0);
      tp2Data = { percent: "", dollar: "0.00" };
      tp3Data = { percent: "", dollar: "0.00" };
    }

    let autoResult = newForm.result;
    if (autoResult !== "Open") {
      if (tpsHit === "SL") autoResult = "Loss";
      else if (tpsHit === "1" || tpsHit === "2" || tpsHit === "3") autoResult = "Win";
    }

    const tpSum =
      (parseFloat(tp1Data.dollar || 0) || 0) +
      (parseFloat(tp2Data.dollar || 0) || 0) +
      (parseFloat(tp3Data.dollar || 0) || 0);

    if (!autoResult || autoResult === "") autoResult = tpSum > 0 ? "Win" : "Break Even";

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

  const debouncedUpdateResult = debounce((newForm) => {
    const { deposit, tpsHit, result } = newForm;
    const d = parseFloat(deposit);
    if (!d) return;

    // If trade is open, keep realized metrics empty
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

    // Commission (if you want it when closed; keep simple model)
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

    const slAtRisk = Math.abs(parseFloat(newForm.riskDollar) || 0);

    let res = newForm.result;
    if (!res || res === "Open") {
      if (tpsHit === "SL") res = "Loss";
      else if (tpsHit === "1" || tpsHit === "2" || tpsHit === "3") res = "Win";
      else res = tpSum > 0 ? "Win" : slAtRisk > 0 ? "Loss" : "Break Even";
    }

    let pnl;
    if (res === "Win") pnl = tpSum - commission;
    else if (res === "Break Even") pnl = -commission;
    else pnl = -slAtRisk - commission;

    const nextDeposit = d + pnl;

    setForm((prev) => ({
      ...prev,
      commission: commission.toFixed(2),
      tpTotal: tpSum.toFixed(2),
      pnl: pnl.toFixed(2),
      nextDeposit: nextDeposit.toFixed(2),
    }));
  }, 200);

  // ------------------------
  // HANDLERS
  // ------------------------

  // --- inside TradeForm.jsx ---

const handleChange = (e) => {
  const { name, value } = e.target;

  // robust local parser (supports YYYY-MM-DD, DD-MM-YYYY, DD-MM-YY and "/" separators)
  const parseDateTimeToEpoch = (dateStr, timeStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const s = dateStr.replace(/\//g, "-").trim();

    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); // YYYY-MM-DD
    if (m) {
      const [_, y, mo, d] = m;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/); // DD-MM-YYYY
    if (m) {
      const [_, d, mo, y] = m;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    m = s.match(/^(\d{2})-(\d{2})-(\d{2})$/); // DD-MM-YY -> 20YY
    if (m) {
      const [_, d, mo, yy] = m;
      const y = 2000 + +yy;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    return null;
  };

  // keep openedAtMs in sync if date or time changes
  const patch = { [name]: value };
  if (name === "date" || name === "time") {
    const newDate = name === "date" ? value : form.date;
    const newTime = name === "time" ? value : form.time;
    patch.openedAtMs = parseDateTimeToEpoch(newDate, newTime);
  }

  const newForm = { ...form, ...patch };
  setForm(newForm);

  // risk recompute triggers
  if (
    name === "entry" ||
    name === "sl" ||
    name === "deposit" ||
    name === "direction" ||
    name === "pair" ||
    name === "riskTargetPercent" ||
    name === "usedDepositPercent" ||
    name === "leverageX"
  ) {
    if (sid === 3) debouncedUpdateRisk_S3(newForm);
    else debouncedUpdateRisk_S1_S2(newForm);
  }

  // TP / result recompute triggers
  if (
    name === "tp1" ||
    name === "tp2" ||
    name === "tp3" ||
    name === "direction" ||
    name === "tpsHit" ||
    name === "entry" ||
    name === "lots" ||
    name === "result"
  ) {
    debouncedUpdateTP(newForm);
    debouncedUpdateResult(newForm);
  }
};

const handleSubmit = (e) => {
  e.preventDefault();

  // robust local parser (same as in handleChange)
  const parseDateTimeToEpoch = (dateStr, timeStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const s = dateStr.replace(/\//g, "-").trim();

    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); // YYYY-MM-DD
    if (m) {
      const [_, y, mo, d] = m;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/); // DD-MM-YYYY
    if (m) {
      const [_, d, mo, y] = m;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    m = s.match(/^(\d{2})-(\d{2})-(\d{2})$/); // DD-MM-YY -> 20YY
    if (m) {
      const [_, d, mo, yy] = m;
      const y = 2000 + +yy;
      const [HH = "0", MM = "0", SS = "0"] = (timeStr || "").split(":");
      return Date.UTC(+y, +mo - 1, +d, +HH, +MM, +SS);
    }
    return null;
  };

  const id = editingTrade?.id ?? Date.now();

  // preserve createdAtMs on edit; set if new
  const createdAtMs = typeof form.createdAtMs === "number"
    ? form.createdAtMs
    : (editingTrade?.createdAtMs ?? Date.now());

  // always compute openedAtMs from current date/time
  const openedAtMs =
    parseDateTimeToEpoch(form.date, form.time) ??
    editingTrade?.openedAtMs ??
    Date.now();

  onAddTrade({
    ...form,
    id,
    accountId: aid,
    createdAtMs,
    openedAtMs,
  });

  const carryOverDeposit =
    form?.nextDeposit && !Number.isNaN(Number(form.nextDeposit))
      ? String(Number(form.nextDeposit))
      : initialDeposit
      ? String(initialDeposit)
      : "";

  // reset state for the next entry (keep defaults you use)
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
    tp1Dollar: "",
    tp2Percent: "",
    tp2Dollar: "",
    tp3Percent: "",
    tp3Dollar: "",

    result: "Open",
    commission: "",
    tpTotal: "",
    pnl: "",
    nextDeposit: "",

    screenshot: "",

    // seed timestamps for the next trade
    openedAtMs: null,
    createdAtMs: Date.now(),
  });
};


  // ------------------------
  // RENDER
  // ------------------------

  const riskTooHigh = Number(form.riskPercent) > 10;

  return (
    <form onSubmit={handleSubmit} className="bg-[#0f172a] p-3 rounded-xl shadow-md">
      {showTitle && (
        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-[#00ffa3]" />
          {editingTrade ? "Edit trade" : "Add new trade"}
        </h2>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Trade Info */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
            <CalendarDays className="w-5 h-5" /> Trade Info
          </h3>
          <div className="grid grid-cols-2 gap-1">
            <input name="date" type="date" value={form.date} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" required />
            <input name="time" type="time" value={form.time} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" required />
            <input name="pair" placeholder="Pair (e.g. EURUSD)" value={form.pair} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" required />
            <select name="direction" value={form.direction} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>

            <input name="deposit" type="number" placeholder="Depo $" value={form.deposit} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" min="0" step="0.01" required />

            {(sid === 1 || sid === 2) ? (
              <select
                name="usedDepositPercent"
                value={form.usedDepositPercent}
                onChange={handleChange}
                className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
                title="% of deposit used for position size"
              >
                {[10, 15, 20, 25, 33, 50, 75, 100].map((p) => (
                  <option key={p} value={p}>{p}% of deposit</option>
                ))}
              </select>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
        </div>

        {/* Entry Conditions */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
            <Layers className="w-5 h-5" /> Entry Conditions
          </h3>
          <div className="grid grid-cols-2 gap-1">
            <select name="stTrend" value={form.stTrend} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
              <option value="bull">15m ST: Bull</option>
              <option value="bear">15m ST: Bear</option>
            </select>
            <select name="usdtTrend" value={form.usdtTrend} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
              <option value="bull">15m USDT.D: Bull</option>
              <option value="bear">15m USDT.D: Bear</option>
            </select>
            <select name="overlay" value={form.overlay} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
              <option value="blue">Overlay: Blue</option>
              <option value="red">Overlay: Red</option>
            </select>
            <select name="ma200" value={form.ma200} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
              <option value="above">MA200: Above</option>
              <option value="below">MA200: Below</option>
              <option value="ranging">MA200: Ranging</option>
            </select>

            {sid === 1 && (
              <>
                <select
                  name="buySell5m"
                  value={form.buySell5m}
                  onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
                  title="5m signal: Buy/Sell"
                >
                  <option value="buy">5m Signal: Buy</option>
                  <option value="sell">5m Signal: Sell</option>
                </select>
                <select
                  name="ma2005m"
                  value={form.ma2005m}
                  onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
                  title="5m MA200 position"
                >
                  <option value="above">5m MA200: Above</option>
                  <option value="below">5m MA200: Below</option>
                </select>
              </>
            )}

            {sid === 2 && (
              <>
                <select name="chochBos15m" value={form.chochBos15m} onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
                  <option value="">15m CHoCH/BoS</option>
                  <option value="bull CHoCH">Bull CHoCH</option>
                  <option value="bull BoS">Bull BoS</option>
                  <option value="bear CHoCH">Bear CHoCH</option>
                  <option value="bear BoS">Bear BoS</option>
                </select>
                <select name="overlay1m" value={form.overlay1m} onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
                  <option value="">1m Overlay</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                </select>
                <select name="bos1m" value={form.bos1m} onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
                  <option value="">1m BoS</option>
                  <option value="bull BoS">Bull BoS</option>
                  <option value="bear BoS">Bear BoS</option>
                </select>
                <select name="ma2001m" value={form.ma2001m} onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
                  <option value="">1m MA200</option>
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                  <option value="ranging">Ranging</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Risk Setup */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Risk Setup
          </h3>
          <div className="grid grid-cols-2 gap-1">
            <input name="entry" type="number" placeholder="Entry" value={form.entry} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" min="0" step="0.00001" required />
            <input name="sl" type="number" placeholder="SL (price)" value={form.sl} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" min="0" step="0.00001" required />

            {(sid === 1 || sid === 2) ? (
              <>
                <select
                  name="leverageX"
                  value={form.leverageX}
                  onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
                  title="Leverage multiplier"
                >
                  {[1, 2, 3, 5, 10, 15, 20].map((x) => (
                    <option key={x} value={x}>Leverage ×{x}</option>
                  ))}
                </select>
                <input
                  disabled
                  value={`Lev $: ${form.leverageAmount || "-"}`}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
                />
              </>
            ) : (
              <>
                <input
                  disabled
                  value={`Lots: ${form.lots || "-"}`}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
                />
                <input
                  disabled
                  value={`Pip $/lot: ${form.pipValue || "-"}`}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
                />
              </>
            )}

            <input disabled value={`SL %: ${form.slPercent}%`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
            <input disabled value={`SL $: $${form.slDollar}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />

            {/* Risk % with conditional red highlight when > 10% */}
            <input
              disabled
              value={`Risk %: ${form.riskPercent}%`}
              className={`bg-[#1e293b] p-1 rounded opacity-70 focus:outline-none ${
                Number(form.riskPercent) > 10
                  ? "border border-red-500 ring-1 ring-red-500 text-red-300"
                  : "border border-gray-600 text-white"
              }`}
              title={Number(form.riskPercent) > 10 ? "Risk per trade exceeds 10% of deposit" : ""}
            />
          </div>
        </div>

        {/* Targets */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
            <TargetIcon className="w-5 h-5" /> Targets
          </h3>
          <div className="grid grid-cols-2 gap-1">
            <select name="tpsHit" value={form.tpsHit} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
              <option value="OPEN">Not closed yet</option>
              <option value="3">3 TPs</option>
              <option value="2">2 TPs</option>
              <option value="SL">SL</option>
            </select>
            <input disabled value={`SL %: ${form.slPercent}%`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
            <input disabled value={`SL $: $${form.slDollar}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />

            <input name="tp1" type="number" placeholder="TP1" value={form.tp1} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" min="0" step="0.00001" />
            <input disabled value={`TP1 %: ${form.tp1Percent}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
            <input disabled value={`TP1 $: ${form.tp1Dollar ? `$${form.tp1Dollar}` : ""}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />

            <input name="tp2" type="number" placeholder="TP2" value={form.tp2} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" min="0" step="0.00001" />
            <input disabled value={`TP2 %: ${form.tp2Percent}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
            <input disabled value={`TP2 $: ${form.tp2Dollar ? `$${form.tp2Dollar}` : ""}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />

            <input name="tp3" type="number" placeholder="TP3" value={form.tp3} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" min="0" step="0.00001" />
            <input disabled value={`TP3 %: ${form.tp3Percent}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
            <input disabled value={`TP3 $: ${form.tp3Dollar ? `$${form.tp3Dollar}` : ""}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
          </div>
        </div>

        {/* Chart (URL) */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
            <LineChart className="w-5 h-5" /> Chart
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <input name="screenshot" type="url" placeholder="https://imgsh.net/i/dcc85420eb" value={form.screenshot} onChange={handleChange}
              className="bg-[#0f172a] border border-gray-600 text-white p-2 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none" pattern="https?://.*" title="Enter a valid URL starting with http(s)://" />
            {form.screenshot && (
              <img src={form.screenshot} alt="Chart" className="mt-1 rounded max-h-32 object-contain" />
            )}
          </div>
        </div>

        {/* Result */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Result
          </h3>
          <div className="grid grid-cols-2 gap-1">
            <select name="result" value={form.result} onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none">
              <option value="Open">Open (result unknown)</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="Break Even">Break Even</option>
            </select>
            <input disabled value={`Comm: ${form.commission ? `$${form.commission}` : ""}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
            <input disabled value={`TP Tot: ${form.tpTotal ? `$${form.tpTotal}` : ""}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
            <input disabled value={`PnL: ${form.pnl ? `$${form.pnl}` : ""}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
            <input disabled value={`Next Dep: ${form.nextDeposit ? `$${form.nextDeposit}` : ""}`} className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70" />
          </div>
        </div>
      </div>

      <div className="mt-3 text-center">
        <button
          type="submit"
          className="bg-[#00ffa3] text-black font-semibold px-3 py-1 rounded hover:brightness-110 focus:ring-1 focus:ring-[#00ffa3]/50 transition-all duration-300 shadow-[0_0_5px_#00ffa3] hover:shadow-[0_0_10px_#00ffa3] inline-flex items-center gap-2"
        >
        <Check className="w-4 h-4" />
          {editingTrade ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
}
