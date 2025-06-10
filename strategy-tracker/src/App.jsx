import { useState, useEffect } from "react";
import TradeForm from "./components/TradeForm";
import TradeTable from "./components/TradeTable";
import FilterBar from "./components/FilterBar";
import Metrics from "./components/Metrics";
import EquityCurveChart from "./components/EquityCurveChart";

const LOCAL_STORAGE_KEY = "strategy-trades";

export default function App() {
  const [trades, setTrades] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [filters, setFilters] = useState({ result: "", startDate: "", endDate: "", pair: "" });
  const [sections, setSections] = useState({
    tradeForm: true,
    filters: true,
    metrics: true,
    equityCurve: true,
    tradeTable: true,
  });

  useEffect(() => {
    const storedTrades = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTrades) {
      setTrades(JSON.parse(storedTrades));
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
    }
  }, [trades, hasLoaded]);

  const handleAddTrade = (newTrade) => {
    if (editingTrade) {
      setTrades((prev) =>
        prev.map((trade) =>
          trade.id === editingTrade.id ? { ...newTrade, id: editingTrade.id } : trade
        )
      );
      setEditingTrade(null);
    } else {
      setTrades((prev) => {
        const isDuplicate = prev.some((trade) => trade.id === newTrade.id);
        return isDuplicate ? prev : [...prev, newTrade];
      });
    }
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSections((prev) => ({ ...prev, tradeForm: true })); // Open TradeForm when editing
  };

  const handleDeleteTrade = (id) => {
    if (confirm("Delete this trade?")) {
      setTrades((prev) => prev.filter((trade) => trade.id !== id));
    }
  };

  const handleClearAll = () => {
    if (confirm("Delete ALL trades?")) {
      setTrades([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    if (filters.result && trade.result !== filters.result) return false;
    if (filters.startDate && trade.date < filters.startDate) return false;
    if (filters.endDate && trade.date > filters.endDate) return false;
    if (filters.pair && !trade.pair.toLowerCase().includes(filters.pair.toLowerCase())) return false;
    return true;
  });

  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 flex flex-col">
      <header className="px-6 py-4 shadow bg-[#1e293b] flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">📈 Strategy Execution Tracker</h1>
        <button
          onClick={handleClearAll}
          className="bg-[#7f5af0] text-white px-4 py-2 rounded-xl hover:brightness-110 focus:ring-2 focus:ring-[#7f5af0]/50 transition-all duration-300 shadow-[0_0_10px_#7f5af0] hover:shadow-[0_0_15px_#7f5af0]"
        >
          🗑️ Clear All
        </button>
      </header>

      <main className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* TradeForm Section */}
        <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
          <div
            className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
            onClick={() => toggleSection("tradeForm")}
          >
            <h2 className="text-xl font-semibold text-[#00ffa3]">➕ Trade Form</h2>
            <span>{sections.tradeForm ? "▼" : "▲"}</span>
          </div>
          {sections.tradeForm && <TradeForm onAddTrade={handleAddTrade} editingTrade={editingTrade} />}
        </section>

        {/* FilterBar Section */}
        <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
          <div
            className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
            onClick={() => toggleSection("filters")}
          >
            <h2 className="text-xl font-semibold text-[#00ffa3]">🔍 Filters</h2>
            <span>{sections.filters ? "▼" : "▲"}</span>
          </div>
          {sections.filters && <FilterBar filters={filters} setFilters={setFilters} />}
        </section>

        {/* Metrics Section */}
        <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
          <div
            className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
            onClick={() => toggleSection("metrics")}
          >
            <h2 className="text-xl font-semibold text-[#00ffa3]">📊 Metrics</h2>
            <span>{sections.metrics ? "▼" : "▲"}</span>
          </div>
          {sections.metrics && <Metrics trades={filteredTrades} />}
        </section>

        {/* EquityCurveChart Section */}
        <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
          <div
            className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
            onClick={() => toggleSection("equityCurve")}
          >
            <h2 className="text-xl font-semibold text-[#00ffa3]">📈 Equity Curve</h2>
            <span>{sections.equityCurve ? "▼" : "▲"}</span>
          </div>
          {sections.equityCurve && <EquityCurveChart trades={filteredTrades} />}
        </section>

        {/* TradeTable Section */}
        <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
          <div
            className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
            onClick={() => toggleSection("tradeTable")}
          >
            <h2 className="text-xl font-semibold text-[#00ffa3]">📋 Trade Table</h2>
            <span>{sections.tradeTable ? "▼" : "▲"}</span>
          </div>
          {sections.tradeTable && <TradeTable trades={filteredTrades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} />}
        </section>
      </main>
    </div>
  );
}