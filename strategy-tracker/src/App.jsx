import { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import TradeForm from "./components/TradeForm";
import TradeTable from "./components/TradeTable";
import FilterBar from "./components/FilterBar";
import Metrics from "./components/Metrics";
import EquityCurveChart from "./components/EquityCurveChart";
import "react-tabs/style/react-tabs.css"; // Import default styles

const LOCAL_STORAGE_KEY = "strategy-trades";
const BACKTEST_STORAGE_KEY = "backtest-trades";
const LIVE_STORAGE_KEY = "live-trades";
const HISTORY_STORAGE_KEY = "history-trades";

export default function App() {
  const [trades, setTrades] = useState([]); // Live trades
  const [backtestTrades, setBacktestTrades] = useState([]); // Backtest trades
  const [historyTrades, setHistoryTrades] = useState([]); // History trades
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [filters, setFilters] = useState({ result: "", startDate: "", endDate: "", pair: "", mode: "live" });
  const [sections, setSections] = useState({
    tradeForm: true,
    filters: true,
    metrics: true,
    equityCurve: true,
    tradeTable: true,
  });
  const [tabIndex, setTabIndex] = useState(0); // 0 for Live, 1 for Backtest, 2 for History

  useEffect(() => {
    const storedTrades = localStorage.getItem(LOCAL_STORAGE_KEY);
    const storedBacktestTrades = localStorage.getItem(BACKTEST_STORAGE_KEY);
    const storedLiveTrades = localStorage.getItem(LIVE_STORAGE_KEY);
    const storedHistoryTrades = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedTrades) setTrades(JSON.parse(storedTrades));
    if (storedBacktestTrades) setBacktestTrades(JSON.parse(storedBacktestTrades));
    if (storedLiveTrades) setTrades(JSON.parse(storedLiveTrades));
    if (storedHistoryTrades) setHistoryTrades(JSON.parse(storedHistoryTrades));
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
      localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(trades));
    }
  }, [trades, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(BACKTEST_STORAGE_KEY, JSON.stringify(backtestTrades));
    }
  }, [backtestTrades, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyTrades));
    }
  }, [historyTrades, hasLoaded]);

  // Sync filters.mode with tabIndex on tab switch
  useEffect(() => {
    if (tabIndex === 0) setFilters((prev) => ({ ...prev, mode: "live" }));
    else if (tabIndex === 1) setFilters((prev) => ({ ...prev, mode: "backtest" }));
    else if (tabIndex === 2) setFilters((prev) => ({ ...prev, mode: "history" }));
  }, [tabIndex]);

  const handleAddTrade = (newTrade) => {
    const { mode } = filters;
    let setTradeFunc, currentTrades;

    if (mode === "backtest") {
      setTradeFunc = setBacktestTrades;
      currentTrades = backtestTrades;
    } else if (mode === "history") {
      setTradeFunc = setHistoryTrades;
      currentTrades = historyTrades;
    } else {
      setTradeFunc = setTrades;
      currentTrades = trades;
    }

    if (editingTrade) {
      setTradeFunc((prev) =>
        prev.map((trade) =>
          trade.id === editingTrade.id ? { ...newTrade, id: editingTrade.id } : trade
        )
      );
      setEditingTrade(null);
    } else {
      setTradeFunc((prev) => {
        const isDuplicate = prev.some((trade) => trade.id === newTrade.id);
        return isDuplicate ? prev : [...prev, newTrade];
      });
    }
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSections((prev) => ({ ...prev, tradeForm: true }));
  };

  const handleDeleteTrade = (id) => {
    const { mode } = filters;
    let setTradeFunc, currentTrades;

    if (mode === "backtest") {
      setTradeFunc = setBacktestTrades;
      currentTrades = backtestTrades;
    } else if (mode === "history") {
      setTradeFunc = setHistoryTrades;
      currentTrades = historyTrades;
    } else {
      setTradeFunc = setTrades;
      currentTrades = trades;
    }

    if (confirm("Delete this trade?")) {
      setTradeFunc((prev) => prev.filter((trade) => trade.id !== id));
    }
  };

  const handleClearAll = () => {
    if (confirm("Delete ALL trades?")) {
      if (filters.mode === "backtest") {
        setBacktestTrades([]);
        localStorage.removeItem(BACKTEST_STORAGE_KEY);
      } else if (filters.mode === "history") {
        setHistoryTrades([]);
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      } else {
        setTrades([]);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(LIVE_STORAGE_KEY);
      }
    }
  };

  const filteredTrades = (tradesToFilter) => {
    return tradesToFilter.filter((trade) => {
      if (filters.result && trade.result !== filters.result) return false;
      if (filters.startDate && trade.date < filters.startDate) return false;
      if (filters.endDate && trade.date > filters.endDate) return false;
      if (filters.pair && !trade.pair.toLowerCase().includes(filters.pair.toLowerCase())) return false;
      return true;
    });
  };

  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const currentTrades = tabIndex === 0 ? trades : tabIndex === 1 ? backtestTrades : historyTrades;
  const filteredCurrentTrades = filteredTrades(currentTrades);

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
        <Tabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
          <TabList className="flex space-x-4 mb-4 bg-[#1e293b] p-2 rounded-xl">
            <Tab className="cursor-pointer px-4 py-2 rounded-lg bg-[#0f172a] text-white hover:bg-[#00ffa3] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#00ffa3]">
              Live
            </Tab>
            <Tab className="cursor-pointer px-4 py-2 rounded-lg bg-[#0f172a] text-white hover:bg-[#00ffa3] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#00ffa3]">
              Backtest
            </Tab>
            <Tab className="cursor-pointer px-4 py-2 rounded-lg bg-[#0f172a] text-white hover:bg-[#00ffa3] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#00ffa3]">
              History
            </Tab>
          </TabList>

          <TabPanel>
            {/* Live Tab Content */}
            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeForm")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">➕ Add new trade</span>
                <span>{sections.tradeForm ? "▼" : "▲"}</span>
              </div>
              {sections.tradeForm && (
                <TradeForm onAddTrade={handleAddTrade} editingTrade={editingTrade} />
              )}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("filters")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">🔍 Filter trades</span>
                <span>{sections.filters ? "▼" : "▲"}</span>
              </div>
              {sections.filters && (
                <FilterBar
                  filters={filters}
                  setFilters={(newFilters) => {
                    setFilters({ ...newFilters, mode: "live" });
                  }}
                />
              )}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("metrics")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📊 KPIs</span>
                <span>{sections.metrics ? "▼" : "▲"}</span>
              </div>
              {sections.metrics && <Metrics trades={filteredCurrentTrades} />}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("equityCurve")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📈 Equity curve</span>
                <span>{sections.equityCurve ? "▼" : "▲"}</span>
              </div>
              {sections.equityCurve && <EquityCurveChart trades={filteredCurrentTrades} />}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeTable")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📋 All trades</span>
                <span>{sections.tradeTable ? "▼" : "▲"}</span>
              </div>
              {sections.tradeTable && (
                <TradeTable
                  trades={filteredCurrentTrades}
                  onEdit={handleEditTrade}
                  onDelete={handleDeleteTrade}
                />
              )}
            </section>
          </TabPanel>

          <TabPanel>
            {/* Backtest Tab Content */}
            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeForm")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">➕ Add new trade</span>
                <span>{sections.tradeForm ? "▼" : "▲"}</span>
              </div>
              {sections.tradeForm && (
                <TradeForm onAddTrade={handleAddTrade} editingTrade={editingTrade} />
              )}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("filters")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">🔍 Filter trades</span>
                <span>{sections.filters ? "▼" : "▲"}</span>
              </div>
              {sections.filters && (
                <FilterBar
                  filters={filters}
                  setFilters={(newFilters) => {
                    setFilters({ ...newFilters, mode: "backtest" });
                  }}
                />
              )}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("metrics")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📊 KPIs</span>
                <span>{sections.metrics ? "▼" : "▲"}</span>
              </div>
              {sections.metrics && <Metrics trades={filteredCurrentTrades} />}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("equityCurve")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📈 Equity curve</span>
                <span>{sections.equityCurve ? "▼" : "▲"}</span>
              </div>
              {sections.equityCurve && <EquityCurveChart trades={filteredCurrentTrades} />}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeTable")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📋 All trades</span>
                <span>{sections.tradeTable ? "▼" : "▲"}</span>
              </div>
              {sections.tradeTable && (
                <TradeTable
                  trades={filteredCurrentTrades}
                  onEdit={handleEditTrade}
                  onDelete={handleDeleteTrade}
                />
              )}
            </section>
          </TabPanel>

          <TabPanel>
            {/* History Tab Content */}
            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeForm")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">➕ Add new trade</span>
                <span>{sections.tradeForm ? "▼" : "▲"}</span>
              </div>
              {sections.tradeForm && (
                <TradeForm onAddTrade={handleAddTrade} editingTrade={editingTrade} />
              )}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("filters")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">🔍 Filter trades</span>
                <span>{sections.filters ? "▼" : "▲"}</span>
              </div>
              {sections.filters && (
                <FilterBar
                  filters={filters}
                  setFilters={(newFilters) => {
                    setFilters({ ...newFilters, mode: "history" });
                  }}
                />
              )}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("metrics")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📊 KPIs</span>
                <span>{sections.metrics ? "▼" : "▲"}</span>
              </div>
              {sections.metrics && <Metrics trades={filteredCurrentTrades} />}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("equityCurve")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📈 Equity curve</span>
                <span>{sections.equityCurve ? "▼" : "▲"}</span>
              </div>
              {sections.equityCurve && <EquityCurveChart trades={filteredCurrentTrades} />}
            </section>

            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeTable")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">📋 All trades</span>
                <span>{sections.tradeTable ? "▼" : "▲"}</span>
              </div>
              {sections.tradeTable && (
                <TradeTable
                  trades={filteredCurrentTrades}
                  onEdit={handleEditTrade}
                  onDelete={handleDeleteTrade}
                />
              )}
            </section>
          </TabPanel>
        </Tabs>
      </main>
    </div>
  );
}