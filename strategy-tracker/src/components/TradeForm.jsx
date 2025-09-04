import { useState, useEffect } from "react";
import { debounce } from "lodash"; // npm i lodash

// Pass strategyId from App.jsx: <TradeForm strategyId={strategyId} ... />
export default function TradeForm({ onAddTrade, editingTrade, initialDeposit, strategyId }) {
  const sid = Number(strategyId) || 1; // normalize once and use everywhere

  const [form, setForm] = useState({
    // Trade info
    date: "",
    time: "",
    pair: "",
    direction: "Long",
    deposit: "",

    // Entry conditions (shared)
    stTrend: "bull",
    usdtTrend: "bear",
    overlay: "blue",
    ma200: "ranging",

    // Strategy 2 – extra entry conditions
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

    // Targets
    tp1: "",
    tp2: "",
    tp3: "",
    tpsHit: "3",
    tp1Percent: "",
    tp2Percent: "",
    tp3Percent: "",
    tp1Dollar: "",
    tp2Dollar: "",
    tp3Dollar: "",

    // Result
    result: "Win",
    commission: "",
    tpTotal: "",
    pnl: "",
    nextDeposit: "",

    // Chart
    screenshot: "",
  });

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

  // ------------------------
  // COMPUTATIONS
  // ------------------------

  // Risk block: computes leverage, SL%, SL$, risk$, risk%
  const debouncedUpdateRisk = debounce((newForm) => {
    const { entry, sl, deposit, direction } = newForm;
    if (!entry || !sl || !deposit) return;

    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const d = parseFloat(deposit);
    if (isNaN(e) || isNaN(s) || isNaN(d) || d <= 0) return;

    // Strategy-specific leverage:
    // Strategy 1 (default): (d / 4) * 10
    // Strategy 2         : (d / 2) * 10
    const lev = (sid === 2 ? (d / 2) * 10 : (d / 4) * 10);

    const slP = direction === "Long" ? ((s / e - 1) * 100) : ((1 - s / e) * 100);
    const slDollar = lev * (slP / 100);
    const riskD = slDollar;
    const riskP = (riskD / d) * 100;

    const updatedRisk = {
      ...newForm,
      leverageAmount: lev.toFixed(2),
      slPercent: slP.toFixed(2),
      slDollar: slDollar.toFixed(2),
      riskDollar: riskD.toFixed(2),
      riskPercent: riskP.toFixed(2),
    };

    setForm((prev) => ({ ...prev, ...updatedRisk }));
    // Risk changes affect TPs & PnL → recompute
    debouncedUpdateTP(updatedRisk);
  }, 300);

  // TP block: computes TP% / TP$ and sets an auto result for immediate feedback
  const debouncedUpdateTP = debounce((newForm) => {
    const { entry, tp1, tp2, tp3, direction, leverageAmount, tpsHit } = newForm;
    const e = parseFloat(entry);
    const l = parseFloat(leverageAmount);
    if (!e || !l) return;

    const calc = (tp, factor) => {
      if (!tp) return { percent: "", dollar: "" };
      const t = parseFloat(tp);
      const tpPct = direction === "Long" ? ((t / e - 1) * 100) : ((1 - t / e) * 100);
      const tpDol = l * (tpPct / 100) * factor;
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
      // treat as only TP1 considered if unspecified/“1”
      tp1Data = calc(tp1, 1.0);
      tp2Data = { percent: "", dollar: "0.00" };
      tp3Data = { percent: "", dollar: "0.00" };
    }

    // Auto-derive result
    let autoResult = newForm.result || "";
    if (tpsHit === "SL") autoResult = "Loss";
    else if (tpsHit === "1" || tpsHit === "2" || tpsHit === "3") autoResult = "Win";

    const tpSum =
      (parseFloat(tp1Data.dollar || 0) || 0) +
      (parseFloat(tp2Data.dollar || 0) || 0) +
      (parseFloat(tp3Data.dollar || 0) || 0);

    if (!autoResult) autoResult = tpSum > 0 ? "Win" : "Break Even";

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
  }, 300);

  // Result block: commission, TP total, PnL, next deposit
  const debouncedUpdateResult = debounce((newForm) => {
    const {
      direction,
      tp1Dollar,
      tp2Dollar,
      tp3Dollar,
      slDollar,
      leverageAmount,
      result,
      deposit,
      tpsHit,
    } = newForm;

    const lev = parseFloat(leverageAmount);
    const d = parseFloat(deposit);
    if (!lev || !d) return;

    const cRate = direction === "Long" ? 0.0002 : 0.0006;
    const commission = lev * cRate;

    const tp1 = parseFloat(tp1Dollar) || 0;
    const tp2 = parseFloat(tp2Dollar) || 0;
    const tp3 = parseFloat(tp3Dollar) || 0;
    const tpSum = tp1 + tp2 + tp3;

    const sl = Math.abs(parseFloat(slDollar)) || 0;

    // Infer result if missing
    let res = result;
    if (!res) {
      if (tpsHit === "SL") res = "Loss";
      else if (tpsHit === "1" || tpsHit === "2" || tpsHit === "3") res = "Win";
      else res = tpSum > 0 ? "Win" : (sl > 0 ? "Loss" : "Break Even");
    }

    const pnl =
      res === "Win"
        ? tpSum - commission
        : res === "Break Even"
        ? -commission
        : -sl - commission;

    const nextDeposit = d + pnl;

    setForm((prev) => ({
      ...prev,
      commission: commission.toFixed(2),
      tpTotal: tpSum.toFixed(2),
      pnl: pnl.toFixed(2),
      nextDeposit: nextDeposit.toFixed(2),
    }));
  }, 300);

  // ------------------------
  // HANDLERS
  // ------------------------

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);

    // Risk depends on entry/sl/deposit/direction
    if (
      e.target.name === "entry" ||
      e.target.name === "sl" ||
      e.target.name === "deposit" ||
      e.target.name === "direction"
    ) {
      debouncedUpdateRisk(newForm);
    }

    // TP math depends on entry/leverage, direction, TPs, tpsHit
    if (
      e.target.name === "tp1" ||
      e.target.name === "tp2" ||
      e.target.name === "tp3" ||
      e.target.name === "direction" ||
      e.target.name === "tpsHit" ||
      e.target.name === "entry"
    ) {
      debouncedUpdateTP(newForm);
    }

    // Manual result change → re-calc PnL
    if (e.target.name === "result") {
      debouncedUpdateResult(newForm);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, screenshot: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = editingTrade?.id ?? Date.now();
    onAddTrade({ ...form, id });
    setForm({
      date: "",
      time: "",
      pair: "",
      direction: "Long",
      deposit: initialDeposit ? initialDeposit.toString() : "",
      stTrend: "bull",
      usdtTrend: "bear",
      overlay: "blue",
      ma200: "ranging",
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
      tp1: "",
      tp2: "",
      tp3: "",
      tpsHit: "3",
      tp1Percent: "",
      tp2Percent: "",
      tp3Percent: "",
      tp1Dollar: "",
      tp2Dollar: "",
      tp3Dollar: "",
      result: "Win",
      commission: "",
      tpTotal: "",
      pnl: "",
      nextDeposit: "",
      screenshot: "",
    });
  };

  // ------------------------
  // RENDER
  // ------------------------

  return (
    <form onSubmit={handleSubmit} className="bg-[#0f172a] p-3 rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-white mb-3">
        {editingTrade ? "✏️" : "➕"}
      </h2>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Trade Info */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2">📅 Trade Info</h3>
          <div className="grid grid-cols-2 gap-1">
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              required
            />
            <input
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              required
            />
            <input
              name="pair"
              placeholder="Pair"
              value={form.pair}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              required
            />
            <select
              name="direction"
              value={form.direction}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
            <input
              name="deposit"
              type="number"
              placeholder="Depo $"
              value={form.deposit}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Entry Conditions (shared + Strategy 2 extras) */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2">📥 Entry Conditions</h3>
          <div className="grid grid-cols-2 gap-1">
            <select
              name="stTrend"
              value={form.stTrend}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="bull">15m ST: Bull</option>
              <option value="bear">15m ST: Bear</option>
            </select>
            <select
              name="usdtTrend"
              value={form.usdtTrend}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="bull">15m USDT.D: Bull</option>
              <option value="bear">15m USDT.D: Bear</option>
            </select>
            <select
              name="overlay"
              value={form.overlay}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="blue">Overlay: Blue</option>
              <option value="red">Overlay: Red</option>
            </select>
            <select
              name="ma200"
              value={form.ma200}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="above">MA200: Above</option>
              <option value="below">MA200: Below</option>
              <option value="ranging">MA200: Ranging</option>
            </select>

            {sid === 2 && (
              <>
                <select
                  name="chochBos15m"
                  value={form.chochBos15m}
                  onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
                >
                  <option value="">15m CHoCH/BoS</option>
                  <option value="bull CHoCH">Bull CHoCH</option>
                  <option value="bull BoS">Bull BoS</option>
                  <option value="bear CHoCH">Bear CHoCH</option>
                  <option value="bear BoS">Bear BoS</option>
                </select>

                <select
                  name="overlay1m"
                  value={form.overlay1m}
                  onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
                >
                  <option value="">1m Overlay</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                </select>

                <select
                  name="bos1m"
                  value={form.bos1m}
                  onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
                >
                  <option value="">1m BoS</option>
                  <option value="bull BoS">Bull BoS</option>
                  <option value="bear BoS">Bear BoS</option>
                </select>

                <select
                  name="ma2001m"
                  value={form.ma2001m}
                  onChange={handleChange}
                  className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
                >
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
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2">💰 Risk Setup</h3>
          <div className="grid grid-cols-2 gap-1">
            <input
              name="entry"
              type="number"
              placeholder="Entry"
              value={form.entry}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              min="0"
              step="0.01"
              required
            />
            <input
              name="sl"
              type="number"
              placeholder="SL"
              value={form.sl}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              min="0"
              step="0.01"
              required
            />
            <input
              disabled
              value={`Lev: $${form.leverageAmount}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`SL %: ${form.slPercent}%`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`SL $: $${form.slDollar}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`Risk %: ${form.riskPercent}%`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
          </div>
        </div>

        {/* Targets */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2">🎯 Targets</h3>
          <div className="grid grid-cols-2 gap-1">
            <select
              name="tpsHit"
              value={form.tpsHit}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="3">3 TPs</option>
              <option value="2">2 TPs</option>
              <option value="SL">SL</option>
            </select>
            <input
              disabled
              value={`SL %: ${form.slPercent}%`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`SL $: $${form.slDollar}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              name="tp1"
              type="number"
              placeholder="TP1"
              value={form.tp1}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              min="0"
              step="0.01"
            />
            <input
              disabled
              value={`TP1 %: ${form.tp1Percent}%`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`TP1 $: $${form.tp1Dollar}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              name="tp2"
              type="number"
              placeholder="TP2"
              value={form.tp2}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              min="0"
              step="0.01"
            />
            <input
              disabled
              value={`TP2 %: ${form.tp2Percent}%`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`TP2 $: $${form.tp2Dollar}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              name="tp3"
              type="number"
              placeholder="TP3"
              value={form.tp3}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
              min="0"
              step="0.01"
            />
            <input
              disabled
              value={`TP3 %: ${form.tp3Percent}%`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`TP3 $: $${form.tp3Dollar}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2">📸 Chart</h3>
          <div className="grid grid-cols-1 gap-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="bg-[#0f172a] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            />
            {form.screenshot && (
              <img src={form.screenshot} alt="Chart" className="mt-1 rounded max-h-24" />
            )}
          </div>
        </div>

        {/* Result */}
        <div className="bg-[#1e293b] text-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-[#00ffa3] mb-2">📊 Result</h3>
          <div className="grid grid-cols-2 gap-1">
            <select
              name="result"
              value={form.result}
              onChange={handleChange}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded focus:ring-1 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="Break Even">Break Even</option>
            </select>
            <input
              disabled
              value={`Comm: $${form.commission}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`TP Tot: $${form.tpTotal}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`PnL: $${form.pnl}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
            <input
              disabled
              value={`Next Dep: $${form.nextDeposit}`}
              className="bg-[#1e293b] border border-gray-600 text-white p-1 rounded opacity-70"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-3 text-center">
        <button
          type="submit"
          className="bg-[#00ffa3] text-black font-semibold px-3 py-1 rounded hover:brightness-110 focus:ring-1 focus:ring-[#00ffa3]/50 transition-all duration-300 shadow-[0_0_5px_#00ffa3] hover:shadow-[0_0_10px_#00ffa3]"
        >
          {editingTrade ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
}
