// ✅ Full App.jsx with Edit & Delete logic

import { useState, useEffect } from "react";
import TradeForm from "./components/TradeForm";
import TradeTable from "./components/TradeTable";

const LOCAL_STORAGE_KEY = "strategy-trades";

function App() {
  const [trades, setTrades] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);

  useEffect(() => {
    const storedTrades = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTrades) {
      console.log("✅ Loaded trades from localStorage:", storedTrades);
      setTrades(JSON.parse(storedTrades));
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      console.log("💾 Saving trades to localStorage:", trades);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
    }
  }, [trades, hasLoaded]);

  const handleAddTrade = (newTrade) => {
    if (editingTrade) {
      // ✅ Update existing
      setTrades((prev) =>
        prev.map((trade) =>
          trade.id === editingTrade.id ? { ...newTrade, id: editingTrade.id } : trade
        )
      );
      setEditingTrade(null);
    } else {
      // ✅ Add new
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
      <TradeTable trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteTrade} />
    </div>
  );
}

export default App;
