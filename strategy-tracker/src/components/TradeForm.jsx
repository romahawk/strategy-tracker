import { useState, useEffect } from "react";

export default function TradeForm({ onAddTrade, editingTrade }) {
  const [form, setForm] = useState({
    // 📅 Trade Info
    date: "",
    time: "",
    pair: "",
    direction: "Long",
    deposit: "",

    // 📥 Entry Conditions
    stTrend: "bull",
    usdtTrend: "bear",
    overlay: "blue",
    ma200: "ranging",

    // 💰 Risk Setup
    entry: "",
    sl: "",
    leverageAmount: "",
    slPercent: "",
    slDollar: "",
    riskDollar: "",
    riskPercent: "",

    // 🎯 TP Calculations
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

    // 📊 Result Block
    result: "Win",
    commission: "",
    tpTotal: "",
    pnl: "",
    nextDeposit: "",
  });

  useEffect(() => {
    if (editingTrade) {
      setForm({ ...editingTrade });
    }
  }, [editingTrade]);

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
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-4">
        {editingTrade ? "✏️ Edit Trade" : "➕ New Trade"}
      </h2>

      {/* Trade Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <input name="date" type="date" value={form.date} onChange={handleChange} className="border p-2 rounded" />
        <input name="time" type="time" value={form.time} onChange={handleChange} className="border p-2 rounded" />
        <input name="pair" placeholder="Pair (e.g. AVAX-USDT)" value={form.pair} onChange={handleChange} className="border p-2 rounded" />
        <select name="direction" value={form.direction} onChange={handleChange} className="border p-2 rounded">
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>
        <input name="deposit" type="number" placeholder="Deposit $" value={form.deposit} onChange={handleChange} className="border p-2 rounded" />
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-2">📥 Entry Conditions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <select name="stTrend" value={form.stTrend} onChange={handleChange} className="border p-2 rounded">
          <option value="bull">15m ST: Bull</option>
          <option value="bear">15m ST: Bear</option>
        </select>
        <select name="usdtTrend" value={form.usdtTrend} onChange={handleChange} className="border p-2 rounded">
          <option value="bull">15m USDT.D: Bull</option>
          <option value="bear">15m USDT.D: Bear</option>
        </select>
        <select name="overlay" value={form.overlay} onChange={handleChange} className="border p-2 rounded">
          <option value="blue">Overlay: Blue</option>
          <option value="red">Overlay: Red</option>
        </select>
        <select name="ma200" value={form.ma200} onChange={handleChange} className="border p-2 rounded">
          <option value="above">MA200: Above</option>
          <option value="below">MA200: Below</option>
          <option value="ranging">MA200: Ranging</option>
        </select>
      </div>

      {/* Risk Setup */}
      <h2 className="text-xl font-semibold mt-6 mb-2">💰 Risk Setup</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <input name="entry" type="number" placeholder="Entry Price" value={form.entry} onChange={handleChange} className="border p-2 rounded" />
        <input name="sl" type="number" placeholder="SL Price" value={form.sl} onChange={handleChange} className="border p-2 rounded" />
        <input disabled value={`Leverage: $${form.leverageAmount}`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`SL %: ${form.slPercent}%`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`SL $: $${form.slDollar}`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`Risk %: ${form.riskPercent}%`} className="bg-gray-100 border p-2 rounded" />
      </div>

      {/* Targets */}
      <h2 className="text-xl font-semibold mt-6 mb-2">🎯 Targets (TP/SL)</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <select name="tpsHit" value={form.tpsHit} onChange={handleChange} className="border p-2 rounded">
          <option value="3">🎯 3 TPs Hit</option>
          <option value="2">🎯 2 TPs Hit</option>
          <option value="SL">💥 SL Hit</option>
        </select>

        <input disabled value={`SL %: ${form.slPercent}%`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`SL $: $${form.slDollar}`} className="bg-gray-100 border p-2 rounded" />

        <input name="tp1" type="number" placeholder="TP1 Price" value={form.tp1} onChange={handleChange} className="border p-2 rounded" />
        <input disabled value={`TP1 %: ${form.tp1Percent}%`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`TP1 $: $${form.tp1Dollar}`} className="bg-gray-100 border p-2 rounded" />

        <input name="tp2" type="number" placeholder="TP2 Price" value={form.tp2} onChange={handleChange} className="border p-2 rounded" />
        <input disabled value={`TP2 %: ${form.tp2Percent}%`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`TP2 $: $${form.tp2Dollar}`} className="bg-gray-100 border p-2 rounded" />

        <input name="tp3" type="number" placeholder="TP3 Price" value={form.tp3} onChange={handleChange} className="border p-2 rounded" />
        <input disabled value={`TP3 %: ${form.tp3Percent}%`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`TP3 $: $${form.tp3Dollar}`} className="bg-gray-100 border p-2 rounded" />
      </div>

      {/* Result */}
      <h2 className="text-xl font-semibold mt-6 mb-2">📊 Result</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <select name="result" value={form.result} onChange={handleChange} className="border p-2 rounded">
          <option value="Win">Win</option>
          <option value="Loss">Loss</option>
          <option value="Break Even">Break Even</option>
        </select>
        <input disabled value={`Commission: $${form.commission}`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`TP Total: $${form.tpTotal}`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`PnL: $${form.pnl}`} className="bg-gray-100 border p-2 rounded" />
        <input disabled value={`Next Deposit: $${form.nextDeposit}`} className="bg-gray-100 border p-2 rounded" />
      </div>

      <button
        type="submit"
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {editingTrade ? "Update Trade" : "Save Trade"}
      </button>
    </form>
  );
}
