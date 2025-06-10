import { useState, useEffect } from "react";

export default function TradeForm({ onAddTrade, editingTrade, initialDeposit }) {
  const [form, setForm] = useState({
    date: "",
    time: "",
    pair: "",
    direction: "Long",
    deposit: "",
    stTrend: "bull",
    usdtTrend: "bear",
    overlay: "blue",
    ma200: "ranging",
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
  });

  useEffect(() => {
    if (editingTrade) {
      setForm({ ...editingTrade });
    } else {
      setForm((prev) => ({
        ...prev,
        deposit: initialDeposit ? initialDeposit.toString() : "",
      }));
    }
  }, [editingTrade, initialDeposit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    });
  };

  useEffect(() => {
    const { entry, sl, deposit, direction } = form;
    if (!entry || !sl || !deposit) return;

    const e = parseFloat(entry);
    const s = parseFloat(sl);
    const d = parseFloat(deposit);
    const lev = (d / 4) * 10;

    let slP = 0;
    if (direction === "Long") {
      slP = ((s / e - 1) * 100);
    } else {
      slP = ((1 - s / e) * 100);
    }

    const slDollar = lev * (slP / 100);
    const riskD = slDollar;
    const riskP = (riskD / d) * 100;

    setForm((prev) => ({
      ...prev,
      leverageAmount: lev.toFixed(2),
      slPercent: slP.toFixed(2),
      slDollar: slDollar.toFixed(2),
      riskDollar: riskD.toFixed(2),
      riskPercent: riskP.toFixed(2),
    }));
  }, [form.entry, form.sl, form.deposit, form.direction]);

  useEffect(() => {
    const { entry, tp1, tp2, tp3, direction, leverageAmount, tpsHit } = form;
    const e = parseFloat(entry);
    const l = parseFloat(leverageAmount);
    if (!e || !l) return;

    const calc = (tp, factor) => {
      if (!tp) return { percent: "", dollar: "" };
      const t = parseFloat(tp);
      const tpPct = direction === "Long" ? ((t / e - 1) * 100) : ((1 - t / e) * 100);
      const tpDol = l * (tpPct / 100) * factor;
      return {
        percent: tpPct.toFixed(2),
        dollar: tpDol.toFixed(2),
      };
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
    }

    setForm((prev) => ({
      ...prev,
      tp1Percent: tp1Data.percent,
      tp1Dollar: tp1Data.dollar,
      tp2Percent: tp2Data.percent,
      tp2Dollar: tp2Data.dollar,
      tp3Percent: tp3Data.percent,
      tp3Dollar: tp3Data.dollar,
    }));
  }, [form.tp1, form.tp2, form.tp3, form.direction, form.entry, form.leverageAmount, form.tpsHit]);

  useEffect(() => {
    const { direction, tp1Dollar, tp2Dollar, tp3Dollar, slDollar, leverageAmount, result, deposit } = form;
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
    const pnl = result === "Win" ? tpSum - commission : -sl - commission;
    const nextDeposit = d + pnl;

    setForm((prev) => ({
      ...prev,
      commission: commission.toFixed(2),
      tpTotal: tpSum.toFixed(2),
      pnl: pnl.toFixed(2),
      nextDeposit: nextDeposit.toFixed(2),
    }));
  }, [form.tp1Dollar, form.tp2Dollar, form.tp3Dollar, form.slDollar, form.leverageAmount, form.result, form.direction, form.deposit]);

  return (
    <form onSubmit={handleSubmit} className="bg-[#0f172a] p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">
        {editingTrade ? "✏️" : "➕"}
      </h2>

      {/* Trade Info Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-[#00ffa3] mb-4">📅 Trade Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
          <input
            name="time"
            type="time"
            value={form.time}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
          <input
            name="pair"
            placeholder="Pair (e.g. AVAX-USDT)"
            value={form.pair}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
          <select
            name="direction"
            value={form.direction}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          >
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
          <input
            name="deposit"
            type="number"
            placeholder="Deposit $"
            value={form.deposit}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
        </div>
      </div>

      {/* Entry Conditions Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-[#00ffa3] mb-4">📥 Entry Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="stTrend"
            value={form.stTrend}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          >
            <option value="bull">15m ST: Bull</option>
            <option value="bear">15m ST: Bear</option>
          </select>
          <select
            name="usdtTrend"
            value={form.usdtTrend}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          >
            <option value="bull">15m USDT.D: Bull</option>
            <option value="bear">15m USDT.D: Bear</option>
          </select>
          <select
            name="overlay"
            value={form.overlay}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          >
            <option value="blue">Overlay: Blue</option>
            <option value="red">Overlay: Red</option>
          </select>
          <select
            name="ma200"
            value={form.ma200}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          >
            <option value="above">MA200: Above</option>
            <option value="below">MA200: Below</option>
            <option value="ranging">MA200: Ranging</option>
          </select>
        </div>
      </div>

      {/* Risk Setup Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-[#00ffa3] mb-4">💰 Risk Setup</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="entry"
            type="number"
            placeholder="Entry Price"
            value={form.entry}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
          <input
            name="sl"
            type="number"
            placeholder="SL Price"
            value={form.sl}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
          <input
            disabled
            value={`Leverage: $${form.leverageAmount}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`SL %: ${form.slPercent}%`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`SL $: $${form.slDollar}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`Risk %: ${form.riskPercent}%`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
        </div>
      </div>

      {/* Targets Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-[#00ffa3] mb-4">🎯 Targets (TP/SL)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="tpsHit"
            value={form.tpsHit}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          >
            <option value="3">🎯 3 TPs Hit</option>
            <option value="2">🎯 2 TPs Hit</option>
            <option value="SL">💥 SL Hit</option>
          </select>
          <input
            disabled
            value={`SL %: ${form.slPercent}%`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`SL $: $${form.slDollar}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            name="tp1"
            type="number"
            placeholder="TP1 Price"
            value={form.tp1}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
          <input
            disabled
            value={`TP1 %: ${form.tp1Percent}%`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`TP1 $: $${form.tp1Dollar}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            name="tp2"
            type="number"
            placeholder="TP2 Price"
            value={form.tp2}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
          <input
            disabled
            value={`TP2 %: ${form.tp2Percent}%`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`TP2 $: $${form.tp2Dollar}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            name="tp3"
            type="number"
            placeholder="TP3 Price"
            value={form.tp3}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          />
          <input
            disabled
            value={`TP3 %: ${form.tp3Percent}%`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`TP3 $: $${form.tp3Dollar}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
        </div>
      </div>

      {/* Result Card */}
      <div className="bg-[#1e293b] text-white rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-xl font-semibold text-[#00ffa3] mb-4">📊 Result</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="result"
            value={form.result}
            onChange={handleChange}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
          >
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
            <option value="Break Even">Break Even</option>
          </select>
          <input
            disabled
            value={`Commission: $${form.commission}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`TP Total: $${form.tpTotal}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`PnL: $${form.pnl}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
          <input
            disabled
            value={`Next Deposit: $${form.nextDeposit}`}
            className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg opacity-70"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="bg-[#00ffa3] text-black font-semibold px-6 py-3 rounded-xl hover:brightness-110 focus:ring-2 focus:ring-[#00ffa3]/50 transition-all duration-300 shadow-[0_0_10px_#00ffa3] hover:shadow-[0_0_15px_#00ffa3]"
      >
        {editingTrade ? "Update Trade" : "Save Trade"}
      </button>
    </form>
  );
}