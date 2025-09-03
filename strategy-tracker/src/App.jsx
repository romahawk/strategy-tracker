import { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { toast, ToastContainer } from "react-toastify";
import TradeForm from "./components/TradeForm";
import TradeTable from "./components/TradeTable";
import FilterBar from "./components/FilterBar";
import Metrics from "./components/Metrics";
import EquityCurveChart from "./components/EquityCurveChart";
import "./index.css";
import "react-tabs/style/react-tabs.css";
import { useParams } from "react-router-dom";
import StrategyNav from "./components/StrategyNav";



export default function App() {
const { id } = useParams();
const strategyId = Number(id || 1);
const KEY = (suffix) => `strategy:${strategyId}:${suffix}`;

const LIVE_STORAGE_KEY = KEY("live-trades");
const BACKTEST_STORAGE_KEY = KEY("backtest-trades");
const HISTORY_STORAGE_KEY = KEY("history-trades");

  const [trades, setTrades] = useState([]);
  const [backtestTrades, setBacktestTrades] = useState([]);
  const [historyTrades, setHistoryTrades] = useState([]);
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
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [initialDeposit, setInitialDeposit] = useState(1000);

  useEffect(() => {
    const storedLiveTrades = localStorage.getItem(LIVE_STORAGE_KEY);
    const storedBacktestTrades = localStorage.getItem(BACKTEST_STORAGE_KEY);
    const storedHistoryTrades = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (storedLiveTrades) setTrades(JSON.parse(storedLiveTrades));
    else setTrades([]);
    if (storedBacktestTrades) setBacktestTrades(JSON.parse(storedBacktestTrades));
    else setBacktestTrades([]);
    if (storedHistoryTrades) setHistoryTrades(JSON.parse(storedHistoryTrades));
    else setHistoryTrades([]);
    setHasLoaded(true);
    }, [strategyId]);

  useEffect(() => {
    if (hasLoaded) {
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

  useEffect(() => {
    if (tabIndex === 0) setFilters((prev) => ({ ...prev, mode: "live" }));
    else if (tabIndex === 1) setFilters((prev) => ({ ...prev, mode: "backtest" }));
    else if (tabIndex === 2) setFilters((prev) => ({ ...prev, mode: "history" }));
  }, [tabIndex]);

  useEffect(() => {
    const currentTradesForTab = tabIndex === 0 ? trades : tabIndex === 1 ? backtestTrades : historyTrades;
    const filteredTradesForTab = filteredTrades(currentTradesForTab);
    const latestTrade = [...filteredTradesForTab].sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`))[0];
    const newDeposit = latestTrade?.nextDeposit ? parseFloat(latestTrade.nextDeposit) : 1000;
    console.log("Calculating initialDeposit:", { latestTrade, newDeposit });
    setInitialDeposit(newDeposit);
  }, [trades, backtestTrades, historyTrades, tabIndex, filters]);

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
        [...prev]
          .map((trade) =>
            trade.id === editingTrade.id ? { ...newTrade, id: editingTrade.id } : trade
          )
          .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
      );
      setEditingTrade(null);
    } else {
      setTradeFunc((prev) => {
        const isDuplicate = prev.some((trade) => trade.id === newTrade.id);
        return [...prev, newTrade]
          .filter((trade) => !isDuplicate || trade.id !== newTrade.id)
          .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
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
      setTradeFunc((prev) =>
        prev.filter((trade) => trade.id !== id).sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
      );
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
        localStorage.removeItem(LIVE_STORAGE_KEY);
      }
      toast.success("All trades cleared", { autoClose: 2000 });
    }
  };

  const handleUpdateTrades = (importedTrades) => {
    const { mode } = filters;
    console.log("handleUpdateTrades called with:", importedTrades, "mode:", mode);
    let setTradeFunc;

    if (mode === "backtest") {
      setTradeFunc = setBacktestTrades;
    } else if (mode === "history") {
      setTradeFunc = setHistoryTrades;
    } else {
      setTradeFunc = setTrades;
    }

    setTradeFunc([...importedTrades].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)));
  };

  const filteredTrades = (tradesToFilter) => {
    return tradesToFilter.filter((trade) => {
      if (filters.result && trade.result !== filters.result) return false;
      if (filters.startDate && new Date(`${trade.date}T${trade.time}`) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(`${trade.date}T${trade.time}`) > new Date(filters.endDate)) return false;
      if (filters.pair && !trade.pair.toLowerCase().includes(filters.pair.toLowerCase())) return false;
      return true;
    });
  };

  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const currentTrades = tabIndex === 0 ? trades : tabIndex === 1 ? backtestTrades : historyTrades;
  const filteredCurrentTrades = filteredTrades(currentTrades);

  const closeModal = () => setSelectedTrade(null);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 flex flex-col">
      <ToastContainer position="top-right" theme="dark" />
      <header className="px-6 py-4 shadow bg-[#1e293b] flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">📈 Strategy Execution Tracker</h1>
        <StrategyNav />
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
            <Tab
              className="cursor-pointer px-4 py-2 rounded-lg bg-[#0f172a] text-white hover:bg-[#00ffa3] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#00ffa3]"
              selectedClassName="border-b-2 border-white"
            >
              Live
            </Tab>
            <Tab
              className="cursor-pointer px-4 py-2 rounded-lg bg-[#0f172a] text-white hover:bg-[#00ffa3] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#00ffa3]"
              selectedClassName="border-b-2 border-white"
            >
              Backtest
            </Tab>
            <Tab
              className="cursor-pointer px-4 py-2 rounded-lg bg-[#0f172a] text-white hover:bg-[#00ffa3] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#00ffa3]"
              selectedClassName="border-b-2 border-white"
            >
              History
            </Tab>
          </TabList>

          <TabPanel>
            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeForm")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">➕ Add new trade</span>
                <span>{sections.tradeForm ? "▼" : "▲"}</span>
              </div>
              {sections.tradeForm && (
                <TradeForm
                  onAddTrade={handleAddTrade}
                  editingTrade={editingTrade}
                  initialDeposit={initialDeposit}
                />
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
                  onViewChart={(trade) => setSelectedTrade(trade)}
                  onUpdateTrades={handleUpdateTrades}
                />
              )}
            </section>
          </TabPanel>

          <TabPanel>
            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeForm")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">➕ Add new trade</span>
                <span>{sections.tradeForm ? "▼" : "▲"}</span>
              </div>
              {sections.tradeForm && (
                <TradeForm
                  onAddTrade={handleAddTrade}
                  editingTrade={editingTrade}
                  initialDeposit={initialDeposit}
                />
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
                  onViewChart={(trade) => setSelectedTrade(trade)}
                  onUpdateTrades={handleUpdateTrades}
                />
              )}
            </section>
          </TabPanel>

          <TabPanel>
            <section className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
              <div
                className="flex justify-between items-center cursor-pointer p-2 bg-[#0f172a] rounded-t-xl"
                onClick={() => toggleSection("tradeForm")}
              >
                <span className="text-xl font-semibold text-[#00ffa3]">➕ Add new trade</span>
                <span>{sections.tradeForm ? "▼" : "▲"}</span>
              </div>
              {sections.tradeForm && (
                <TradeForm
                  onAddTrade={handleAddTrade}
                  editingTrade={editingTrade}
                  initialDeposit={initialDeposit}
                />
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
                  onViewChart={(trade) => setSelectedTrade(trade)}
                  onUpdateTrades={handleUpdateTrades}
                />
              )}
            </section>
          </TabPanel>
        </Tabs>

        {selectedTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg max-w-4xl w-full">
              <h2 className="text-2xl font-bold text-white mb-4">📊 Trade Chart</h2>
              <div className="mb-4">
                <select
                  className="bg-[#0f172a] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
                  onChange={(e) => {
                    const mode = e.target.value;
                    setSelectedTrade((prev) => ({ ...prev, viewMode: mode }));
                  }}
                  value={selectedTrade.viewMode || "live"}
                >
                  <option value="live">Live</option>
                  <option value="backtest">Backtest</option>
                  <option value="compare">Compare</option>
                </select>
              </div>
              {selectedTrade.viewMode === "compare" ? (
                <div className="flex space-x-4">
                  <img
                    src={selectedTrade.screenshot || "https://via.placeholder.com/400x200?text=No+Live+Chart"}
                    alt="Live Chart"
                    className="w-1/2 rounded-lg"
                  />
                  <img
                    src={findBacktestScreenshot(selectedTrade.pair, selectedTrade.date, selectedTrade.time) || "https://via.placeholder.com/400x200?text=No+Backtest+Chart"}
                    alt="Backtest Chart"
                    className="w-1/2 rounded-lg"
                  />
                </div>
              ) : (
                <img
                  src={selectedTrade.screenshot || "https://via.placeholder.com/400x200?text=No+Chart"}
                  alt="Trade Chart"
                  className="w-full rounded-lg"
                />
              )}
              <button
                onClick={closeModal}
                className="mt-4 bg-[#00ffa3] text-black font-semibold px-6 py-3 rounded-xl hover:brightness-110 focus:ring-2 focus:ring-[#00ffa3]/50 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  function findBacktestScreenshot(pair, date, time) {
    const backtestTrade = backtestTrades.find(
      (t) => t.pair === pair && t.date === date && t.time === time && t.screenshot
    );
    return backtestTrade?.screenshot;
  }
}