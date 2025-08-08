import { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { toast, ToastContainer } from "react-toastify";
import Dexie from 'dexie';
import TradeForm from "./components/TradeForm.jsx";
import TradeTable from "./components/TradeTable.jsx";
import FilterBar from "./components/FilterBar.jsx";
import Metrics from "./components/Metrics.jsx";
import EquityCurveChart from "./components/EquityCurveChart.jsx";
import "./index.css";
import "react-tabs/style/react-tabs.css";

// Error Boundary Component
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <div className="text-red-500 text-center p-4">Something went wrong. Please refresh the page.</div>;
  }

  return children;
}

// Initialize IndexedDB with Dexie
const db = new Dexie('TradeHistoryDB');
db.version(1).stores({
  trades: '++id, strategy, mode',
});

const LIVE_STORAGE_KEY = "live-trades";
const BACKTEST_STORAGE_KEY = "backtest-trades";
const HISTORY_STORAGE_KEY = "history-trades";

export default function App() {
  const [trades, setTrades] = useState({ Supertrend: [], "1 BoS Trend": [] });
  const [backtestTrades, setBacktestTrades] = useState({ Supertrend: [], "1 BoS Trend": [] });
  const [historyTrades, setHistoryTrades] = useState({ Supertrend: [], "1 BoS Trend": [] });
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
  const [currentStrategy, setCurrentStrategy] = useState("Supertrend");

  // Add trade based on current mode
  const addTrade = (trade) => {
    const mode = tabIndex === 0 ? "live" : tabIndex === 1 ? "backtest" : "history";
    trade.mode = mode;
    trade.strategy = currentStrategy;

    if (mode === "live") {
      setTrades((prev) => ({
        ...prev,
        [currentStrategy]: [...prev[currentStrategy], trade],
      }));
    } else if (mode === "backtest") {
      setBacktestTrades((prev) => ({
        ...prev,
        [currentStrategy]: [...prev[currentStrategy], trade],
      }));
    } else if (mode === "history") {
      db.trades.put(trade).then(() => {
        setHistoryTrades((prev) => ({
          ...prev,
          [currentStrategy]: [...prev[currentStrategy], trade],
        }));
      }).catch((e) => console.error("Error saving to IndexedDB:", e));
    }
    toast.success(`Trade added to ${mode} mode!`);
    setEditingTrade(null);
  };

  // Handle edit trade
  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
  };

  // Handle delete trade
  const handleDeleteTrade = (tradeId) => {
    const mode = tabIndex === 0 ? "live" : tabIndex === 1 ? "backtest" : "history";
    if (mode === "history") {
      db.trades.where("id").equals(tradeId).delete().then(() => {
        setHistoryTrades((prev) => ({
          ...prev,
          [currentStrategy]: prev[currentStrategy].filter((t) => t.id !== tradeId),
        }));
      });
    } else if (mode === "live") {
      setTrades((prev) => ({
        ...prev,
        [currentStrategy]: prev[currentStrategy].filter((t) => t.id !== tradeId),
      }));
    } else if (mode === "backtest") {
      setBacktestTrades((prev) => ({
        ...prev,
        [currentStrategy]: prev[currentStrategy].filter((t) => t.id !== tradeId),
      }));
    }
    toast.success("Trade deleted!");
  };

  // Handle update trades (e.g., after edit)
  const handleUpdateTrades = (updatedTrade) => {
    const mode = tabIndex === 0 ? "live" : tabIndex === 1 ? "backtest" : "history";
    updatedTrade.mode = mode;
    updatedTrade.strategy = currentStrategy;

    if (mode === "history") {
      db.trades.put(updatedTrade).then(() => {
        setHistoryTrades((prev) => ({
          ...prev,
          [currentStrategy]: prev[currentStrategy].map((t) => (t.id === updatedTrade.id ? updatedTrade : t)),
        }));
      });
    } else if (mode === "live") {
      setTrades((prev) => ({
        ...prev,
        [currentStrategy]: prev[currentStrategy].map((t) => (t.id === updatedTrade.id ? updatedTrade : t)),
      }));
    } else if (mode === "backtest") {
      setBacktestTrades((prev) => ({
        ...prev,
        [currentStrategy]: prev[currentStrategy].map((t) => (t.id === updatedTrade.id ? updatedTrade : t)),
      }));
    }
    setEditingTrade(null);
    toast.success("Trade updated!");
  };

  // Toggle section visibility
  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Close modal
  const closeModal = () => setSelectedTrade(null);

  // Find backtest screenshot (placeholder logic)
  const findBacktestScreenshot = (pair, date, time) => {
    const backtestTrade = backtestTrades[currentStrategy].find(
      (t) => t.pair === pair && t.date === date && t.time === time
    );
    return backtestTrade?.screenshot || null;
  };

  // Load initial data
  useEffect(() => {
    const storedLiveTrades = localStorage.getItem(LIVE_STORAGE_KEY);
    const storedBacktestTrades = localStorage.getItem(BACKTEST_STORAGE_KEY);
    const strategies = ["Supertrend", "1 BoS Trend"];

    if (storedLiveTrades) {
      const parsedTrades = JSON.parse(storedLiveTrades);
      setTrades(
        strategies.reduce((acc, strategy) => ({
          ...acc,
          [strategy]: parsedTrades.filter((trade) => trade.strategy === strategy || !trade.strategy),
        }), { Supertrend: [], "1 BoS Trend": [] })
      );
    }
    if (storedBacktestTrades) {
      const parsedTrades = JSON.parse(storedBacktestTrades);
      setBacktestTrades(
        strategies.reduce((acc, strategy) => ({
          ...acc,
          [strategy]: parsedTrades.filter((trade) => trade.strategy === strategy || !trade.strategy),
        }), { Supertrend: [], "1 BoS Trend": [] })
      );
    }
    db.trades.where({ mode: "history" }).toArray().then((trades) => {
      setHistoryTrades(
        strategies.reduce((acc, strategy) => ({
          ...acc,
          [strategy]: trades.filter((trade) => trade.strategy === strategy || !trade.strategy),
        }), { Supertrend: [], "1 BoS Trend": [] })
      );
      setHasLoaded(true);
    }).catch((e) => {
      console.error("Error loading history trades from IndexedDB:", e);
      setHasLoaded(true);
    });
  }, []);

  // Sync live and backtest trades to localStorage
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(Object.values(trades).flat()));
    }
  }, [trades, hasLoaded]);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(BACKTEST_STORAGE_KEY, JSON.stringify(Object.values(backtestTrades).flat()));
    }
  }, [backtestTrades, hasLoaded]);

  // Get current trades based on tab
  const getCurrentTrades = () => {
    return tabIndex === 0 ? trades[currentStrategy] : tabIndex === 1 ? backtestTrades[currentStrategy] : historyTrades[currentStrategy];
  };

  // Apply filters
  const filteredCurrentTrades = getCurrentTrades().filter((trade) => {
    const resultMatch = !filters.result || trade.result === filters.result;
    const pairMatch = !filters.pair || trade.pair === filters.pair;
    const startDateMatch = !filters.startDate || new Date(trade.date) >= new Date(filters.startDate);
    const endDateMatch = !filters.endDate || new Date(trade.date) <= new Date(filters.endDate);
    return resultMatch && pairMatch && startDateMatch && endDateMatch;
  });

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Strategy Tracker</h1>
      <div className="mb-4">
        <select
          value={currentStrategy}
          onChange={(e) => setCurrentStrategy(e.target.value)}
          className="p-2 bg-gray-800 border border-gray-600 rounded text-white"
        >
          <option value="Supertrend">Supertrend</option>
          <option value="1 BoS Trend">1 BoS Trend</option>
        </select>
      </div>
      <Tabs selectedIndex={tabIndex} onSelect={(index) => setTabIndex(index)}>
        <TabList className="flex space-x-4 mb-4">
          <Tab className="cursor-pointer p-2 bg-gray-800 rounded-t-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00ffa3]">
            Live
          </Tab>
          <Tab className="cursor-pointer p-2 bg-gray-800 rounded-t-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00ffa3]">
            Backtest
          </Tab>
          <Tab className="cursor-pointer p-2 bg-gray-800 rounded-t-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00ffa3]">
            History
          </Tab>
        </TabList>

        <TabPanel>
          <ErrorBoundary>
            <TradeForm
              onAddTrade={addTrade}
              editingTrade={editingTrade}
              initialDeposit={initialDeposit}
              currentStrategy={currentStrategy}
            />
          </ErrorBoundary>
          {sections.tradeForm && sections.filters && <FilterBar filters={filters} setFilters={setFilters} />}
          {sections.metrics && <Metrics trades={filteredCurrentTrades} />}
          {sections.equityCurve && <EquityCurveChart trades={filteredCurrentTrades} />}
          {sections.tradeTable && (
            <TradeTable
              trades={filteredCurrentTrades}
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
              onViewChart={(trade) => setSelectedTrade(trade)}
              onUpdateTrades={handleUpdateTrades}
            />
          )}
        </TabPanel>
        <TabPanel>
          <ErrorBoundary>
            <TradeForm
              onAddTrade={addTrade}
              editingTrade={editingTrade}
              initialDeposit={initialDeposit}
              currentStrategy={currentStrategy}
            />
          </ErrorBoundary>
          {sections.tradeForm && sections.filters && <FilterBar filters={filters} setFilters={setFilters} />}
          {sections.metrics && <Metrics trades={filteredCurrentTrades} />}
          {sections.equityCurve && <EquityCurveChart trades={filteredCurrentTrades} />}
          {sections.tradeTable && (
            <TradeTable
              trades={filteredCurrentTrades}
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
              onViewChart={(trade) => setSelectedTrade(trade)}
              onUpdateTrades={handleUpdateTrades}
            />
          )}
        </TabPanel>
        <TabPanel>
          <ErrorBoundary>
            <TradeForm
              onAddTrade={addTrade}
              editingTrade={editingTrade}
              initialDeposit={initialDeposit}
              currentStrategy={currentStrategy}
            />
          </ErrorBoundary>
          {sections.tradeForm && sections.filters && <FilterBar filters={filters} setFilters={setFilters} />}
          {sections.metrics && <Metrics trades={filteredCurrentTrades} />}
          {sections.equityCurve && <EquityCurveChart trades={filteredCurrentTrades} />}
          {sections.tradeTable && (
            <TradeTable
              trades={filteredCurrentTrades}
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
              onViewChart={(trade) => setSelectedTrade(trade)}
              onUpdateTrades={handleUpdateTrades}
            />
          )}
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
      <ToastContainer />
    </div>
  );
}