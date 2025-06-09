import { useState, useEffect } from "react";
import TradeForm from "./components/TradeForm";
import TradeTable from "./components/TradeTable";
import FilterBar from "./components/FilterBar";
import Metrics from "./components/Metrics";
import EquityCurveChart from './components/EquityCurveChart';

const LOCAL_STORAGE_KEY = "strategy-trades";

function App() {
  const [trades, setTrades] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [filters, setFilters] = useState({ result: "", startDate: "", endDate: "", pair: "" });

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">📈 Strategy Execution Tracker</h1>

      <button
        onClick={handleClearAll}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        🗑️ Clear All Trades
      </button>

      <TradeForm onAddTrade={handleAddTrade} editingTrade={editingTrade} />
      <FilterBar filters={filters} setFilters={setFilters} />
      <Metrics trades={filteredTrades} />
      <EquityCurveChart trades={filteredTrades} />
      <TradeTable trades={filteredTrades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} />
    </div>
  );
}

export default App;
