import { useState } from "react";
import TradeForm from "./components/TradeForm";
import TradeTable from "./components/TradeTable";
import Metrics from "./components/Metrics";

export default function App() {
  const [trades, setTrades] = useState([]);

  const addTrade = (trade) => {
    setTrades([...trades, trade]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Strategy Execution Tracker</h1>
      <TradeForm onAddTrade={addTrade} />
      <Metrics trades={trades} />
      <TradeTable trades={trades} />
    </div>
  );
}
