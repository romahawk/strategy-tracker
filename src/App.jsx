// src/App.jsx
import { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { toast, ToastContainer } from "react-toastify";
import { useParams } from "react-router-dom";

import "./index.css";
import "react-tabs/style/react-tabs.css";

import TradeForm from "./components/TradeForm";
import TradeTable from "./components/TradeTable";
import FilterBar from "./components/FilterBar";
import Metrics from "./components/Metrics";
import EquityCurveChart from "./components/EquityCurveChart";
import AccountNav from "./components/AccountNav";
import StrategyNav from "./components/StrategyNav";
import WeeklyCompounding from "./components/WeeklyCompounding";

import {
  BarChart3,
  Trash2,
  PlusCircle,
  Search,
  User,
  Bell,
  Globe2,
  SunMedium,
  TrendingUp,
  HandCoins,
} from "lucide-react";

export default function App() {
  const { strategyId: sidParam, accountId: aidParam } = useParams();
  const strategyId = Number(sidParam || 1);
  const accountId = Number(aidParam || 1);
  const KEY = (suffix) => `strategy:${strategyId}:account:${accountId}:${suffix}`;

  const LIVE_STORAGE_KEY = KEY("live-trades");
  const BACKTEST_STORAGE_KEY = KEY("backtest-trades");
  const HISTORY_STORAGE_KEY = KEY("history-trades");

  const [trades, setTrades] = useState([]);
  const [backtestTrades, setBacktestTrades] = useState([]);
  const [historyTrades, setHistoryTrades] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [filters, setFilters] = useState({
    result: "",
    startDate: "",
    endDate: "",
    pair: "",
    mode: "live",
  });

  // which main tab: live / backtest / history
  const [tabIndex, setTabIndex] = useState(0);

  // NEW: which inner tab is open per main tab
  const [innerTabs, setInnerTabs] = useState({
    live: "trade",
    backtest: "trade",
    history: "trade",
  });

  const [selectedTrade, setSelectedTrade] = useState(null);
  const [initialDeposit, setInitialDeposit] = useState(1000);

  // load LS
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
  }, [strategyId, accountId]);

  // persist
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

  // switch filter mode when top tab changes
  useEffect(() => {
    if (tabIndex === 0) setFilters((prev) => ({ ...prev, mode: "live" }));
    else if (tabIndex === 1) setFilters((prev) => ({ ...prev, mode: "backtest" }));
    else if (tabIndex === 2) setFilters((prev) => ({ ...prev, mode: "history" }));
  }, [tabIndex]);

  // recalc initial deposit from latest filtered trade
  useEffect(() => {
    const currentTradesForTab =
      tabIndex === 0 ? trades : tabIndex === 1 ? backtestTrades : historyTrades;
    const filteredTradesForTab = filteredTrades(currentTradesForTab);
    const latestTrade = [...filteredTradesForTab].sort(
      (a, b) =>
        new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`)
    )[0];
    const newDeposit = latestTrade?.nextDeposit
      ? parseFloat(latestTrade.nextDeposit)
      : 1000;
    setInitialDeposit(newDeposit);
  }, [trades, backtestTrades, historyTrades, tabIndex, filters]);

  const handleAddTrade = (newTrade) => {
    const { mode } = filters;
    let setTradeFunc;

    if (mode === "backtest") {
      setTradeFunc = setBacktestTrades;
    } else if (mode === "history") {
      setTradeFunc = setHistoryTrades;
    } else {
      setTradeFunc = setTrades;
    }

    if (editingTrade) {
      setTradeFunc((prev) =>
        [...prev]
          .map((trade) =>
            trade.id === editingTrade.id
              ? { ...newTrade, id: editingTrade.id }
              : trade
          )
          .sort(
            (a, b) =>
              new Date(`${a.date}T${a.time}`) -
              new Date(`${b.date}T${b.time}`)
          )
      );
      setEditingTrade(null);
      // after edit stay on the same inner tab
    } else {
      setTradeFunc((prev) => {
        const isDuplicate = prev.some((trade) => trade.id === newTrade.id);
        return [...prev, newTrade]
          .filter((trade) => !isDuplicate || trade.id !== newTrade.id)
          .sort(
            (a, b) =>
              new Date(`${a.date}T${a.time}`) -
              new Date(`${b.date}T${b.time}`)
          );
      });
    }
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    // open inner "+ new trade" tab for current main tab
    setInnerTabs((prev) => {
      const key = tabIndex === 0 ? "live" : tabIndex === 1 ? "backtest" : "history";
      return { ...prev, [key]: "trade" };
    });
  };

  const handleDeleteTrade = (id) => {
    const { mode } = filters;
    let setTradeFunc;

    if (mode === "backtest") {
      setTradeFunc = setBacktestTrades;
    } else if (mode === "history") {
      setTradeFunc = setHistoryTrades;
    } else {
      setTradeFunc = setTrades;
    }

    if (confirm("Delete this trade?")) {
      setTradeFunc((prev) =>
        prev
          .filter((trade) => trade.id !== id)
          .sort(
            (a, b) =>
              new Date(`${a.date}T${a.time}`) -
              new Date(`${b.date}T${b.time}`)
          )
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
    let setTradeFunc;

    if (mode === "backtest") {
      setTradeFunc = setBacktestTrades;
    } else if (mode === "history") {
      setTradeFunc = setHistoryTrades;
    } else {
      setTradeFunc = setTrades;
    }

    setTradeFunc(
      [...importedTrades].sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
      )
    );
  };

  const filteredTrades = (tradesToFilter) => {
    return tradesToFilter.filter((trade) => {
      if (filters.result && trade.result !== filters.result) return false;
      if (
        filters.startDate &&
        new Date(`${trade.date}T${trade.time}`) < new Date(filters.startDate)
      )
        return false;
      if (
        filters.endDate &&
        new Date(`${trade.date}T${trade.time}`) > new Date(filters.endDate)
      )
        return false;
      if (
        filters.pair &&
        !trade.pair.toLowerCase().includes(filters.pair.toLowerCase())
      )
        return false;
      return true;
    });
  };

  const currentTrades =
    tabIndex === 0 ? trades : tabIndex === 1 ? backtestTrades : historyTrades;
  const filteredCurrentTrades = filteredTrades(currentTrades);

  const closeModal = () => setSelectedTrade(null);

  // small helper to render inner nav
  const InnerNav = ({ which }) => {
    const active = innerTabs[which];
    const btnBase =
      "px-5 py-2 rounded-full border border-[#f97316]/40 text-sm font-medium transition-all duration-200";
    return (
      <div className="flex gap-4 mb-4 bg-[#0f172a] rounded-xl p-2">
        <button
          onClick={() => setInnerTabs((prev) => ({ ...prev, [which]: "trade" }))}
          className={
            active === "trade"
              ? `${btnBase} bg-[#f97316]/20 text-white`
              : `${btnBase} text-gray-300 hover:bg-[#f97316]/10`
          }
        >
          + new trade
        </button>
        <button
          onClick={() => setInnerTabs((prev) => ({ ...prev, [which]: "all" }))}
          className={
            active === "all"
              ? `${btnBase} bg-[#f97316]/20 text-white`
              : `${btnBase} text-gray-300 hover:bg-[#f97316]/10`
          }
        >
          all trades
        </button>
        <button
          onClick={() => setInnerTabs((prev) => ({ ...prev, [which]: "kpis" }))}
          className={
            active === "kpis"
              ? `${btnBase} bg-[#f97316]/20 text-white`
              : `${btnBase} text-gray-300 hover:bg-[#f97316]/10`
          }
        >
          KPIs
        </button>
        <button
          onClick={() => setInnerTabs((prev) => ({ ...prev, [which]: "equity" }))}
          className={
            active === "equity"
              ? `${btnBase} bg-[#f97316]/20 text-white`
              : `${btnBase} text-gray-300 hover:bg-[#f97316]/10`
          }
        >
          equity curve
        </button>
      </div>
    );
  };

    return (
      <div className="min-h-screen bg-[#0f172a] text-gray-300 flex flex-col">
        <ToastContainer position="top-right" theme="dark" />

        <Tabs selectedIndex={tabIndex} onSelect={(i) => setTabIndex(i)}>
          {/* ===== NAVBAR ===== */}
          <header className="h-14 px-5 bg-[#020617] border-b border-white/5 flex items-center gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2 min-w-fit">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#7f5af0] to-[#00ffa3] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
                Strategy Execution Tracker
              </span>
            </div>

            {/* Main Tabs */}
            <TabList className="flex items-center gap-1 bg-[#0f172a] rounded-full px-1 py-1 ml-2">
              <Tab
                className="px-4 h-8 flex items-center rounded-full text-xs font-medium text-slate-200/80 hover:text-white hover:bg-white/5 transition outline-none"
                selectedClassName="bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(127,90,240,.4)]"
              >
                Live
              </Tab>
              <Tab
                className="px-4 h-8 flex items-center rounded-full text-xs font-medium text-slate-200/80 hover:text-white hover:bg-white/5 transition outline-none"
                selectedClassName="bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(127,90,240,.4)]"
              >
                Backtest
              </Tab>
              <Tab
                className="px-4 h-8 flex items-center rounded-full text-xs font-medium text-slate-200/80 hover:text-white hover:bg-white/5 transition outline-none"
                selectedClassName="bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(127,90,240,.4)]"
              >
                History
              </Tab>
            </TabList>

            {/* Strategy Filters */}
            <div className="flex items-center gap-2 ml-3">
              <StrategyNav />
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* Accounts */}
            <div className="flex items-center gap-2">
              <AccountNav />
              <button className="h-8 w-8 rounded-full border border-white/10 text-white/80 hover:bg-white/5 flex items-center justify-center text-base leading-none">
                +
              </button>
            </div>

            {/* Clear All */}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleClearAll}
                className="h-8 px-4 rounded-full bg-white text-[#020617] text-xs font-semibold hover:brightness-95 transition flex items-center gap-2 shadow-[0_0_18px_rgba(255,255,255,.15)]"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </header>

          {/* ===== MAIN ===== */}
          <main className="p-4 flex-1 overflow-y-auto space-y-6">
            {/* ---------- LIVE ---------- */}
            <TabPanel>
              <InnerNav which="live" />

              {innerTabs.live === "trade" && (
                <div className="bg-[#0f172a] rounded-2xl border border-white/5 shadow-lg p-4">
                  <TradeForm
                    onAddTrade={handleAddTrade}
                    editingTrade={editingTrade}
                    initialDeposit={initialDeposit}
                    strategyId={strategyId}
                    accountId={accountId}
                  />
                </div>
              )}

              {innerTabs.live === "all" && (
                <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4 space-y-4">
                  
                  <FilterBar
                    filters={filters}
                    setFilters={(newFilters) => {
                      setFilters({ ...newFilters, mode: "live" });
                    }}
                  />
                  <TradeTable
                    trades={filteredCurrentTrades}
                    onEdit={handleEditTrade}
                    onDelete={handleDeleteTrade}
                    onViewChart={(trade) => setSelectedTrade(trade)}
                    onUpdateTrades={handleUpdateTrades}
                    strategyId={strategyId}
                    accountId={accountId}
                  />
                </div>
              )}

              {innerTabs.live === "kpis" && (
                <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                  
                  <Metrics trades={filteredCurrentTrades} />
                </div>
              )}

              {innerTabs.live === "equity" && (
                <div className="space-y-4">
                  <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                    
                    <EquityCurveChart trades={filteredCurrentTrades} />
                  </div>

                  <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                    <div className="flex items-center gap-2 mb-3 text-[#00ffa3]">
                      <HandCoins className="w-5 h-5" />
                      <h2 className="text-xl font-semibold">
                        Weekly Compounding
                      </h2>
                    </div>
                    <WeeklyCompounding
                      strategyId={strategyId}
                      accountId={accountId}
                      mode="live"
                      defaultWeeks={0}
                      defaultDeposit={0}
                      defaultPnlPct={10}
                      includeCurrentWeek={true}
                      refreshKey={JSON.stringify(trades)}
                    />
                  </div>
                </div>
              )}
            </TabPanel>

            {/* ---------- BACKTEST ---------- */}
            <TabPanel>
              <InnerNav which="backtest" />

              {innerTabs.backtest === "trade" && (
                <div className="bg-[#0f172a] rounded-2xl border border-white/5 shadow-lg p-4">
                  <TradeForm
                    onAddTrade={handleAddTrade}
                    editingTrade={editingTrade}
                    initialDeposit={initialDeposit}
                    strategyId={strategyId}
                    accountId={accountId}
                  />
                </div>
              )}

              {innerTabs.backtest === "all" && (
                <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4 space-y-4">
                  
                  <FilterBar
                    filters={filters}
                    setFilters={(newFilters) => {
                      setFilters({ ...newFilters, mode: "backtest" });
                    }}
                  />
                  <TradeTable
                    trades={filteredCurrentTrades}
                    onEdit={handleEditTrade}
                    onDelete={handleDeleteTrade}
                    onViewChart={(trade) => setSelectedTrade(trade)}
                    onUpdateTrades={handleUpdateTrades}
                    strategyId={strategyId}
                    accountId={accountId}
                  />
                </div>
              )}

              {innerTabs.backtest === "kpis" && (
                <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                  
                  <Metrics trades={filteredCurrentTrades} />
                </div>
              )}

              {innerTabs.backtest === "equity" && (
                <div className="space-y-4">
                  <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                    
                    <EquityCurveChart trades={filteredCurrentTrades} />
                  </div>

                  <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                    <div className="flex items-center gap-2 mb-3 text-[#00ffa3]">
                      <HandCoins className="w-5 h-5" />
                      <h2 className="text-xl font-semibold">
                        Weekly Compounding
                      </h2>
                    </div>
                    <WeeklyCompounding
                      strategyId={strategyId}
                      accountId={accountId}
                      mode="backtest"
                      includeCurrentWeek={true}
                      refreshKey={JSON.stringify(backtestTrades)}
                    />
                  </div>
                </div>
              )}
            </TabPanel>

            {/* ---------- HISTORY ---------- */}
            <TabPanel>
              <InnerNav which="history" />

              {innerTabs.history === "trade" && (
                <div className="bg-[#0f172a] rounded-2xl border border-white/5 shadow-lg p-4">
                  <TradeForm
                    onAddTrade={handleAddTrade}
                    editingTrade={editingTrade}
                    initialDeposit={initialDeposit}
                    strategyId={strategyId}
                    accountId={accountId}
                    showTitle={false}
                  />
                </div>
              )}

              {innerTabs.history === "all" && (
                <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4 space-y-4">
                  <FilterBar
                    filters={filters}
                    setFilters={(newFilters) => {
                      setFilters({ ...newFilters, mode: "history" });
                    }}
                  />
                  <TradeTable
                    trades={filteredCurrentTrades}
                    onEdit={handleEditTrade}
                    onDelete={handleDeleteTrade}
                    onViewChart={(trade) => setSelectedTrade(trade)}
                    onUpdateTrades={handleUpdateTrades}
                    strategyId={strategyId}
                    accountId={accountId}
                  />
                </div>
              )}

              {innerTabs.history === "kpis" && (
                <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                  <Metrics trades={filteredCurrentTrades} />
                </div>
              )}

              {innerTabs.history === "equity" && (
                <div className="space-y-4">
                  <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                    
                    <EquityCurveChart trades={filteredCurrentTrades} />
                  </div>

                  <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                    <div className="flex items-center gap-2 mb-3 text-[#00ffa3]">
                      <HandCoins className="w-5 h-5" />
                      <h2 className="text-xl font-semibold">
                        Weekly Compounding
                      </h2>
                    </div>
                    <WeeklyCompounding
                      strategyId={strategyId}
                      accountId={accountId}
                      mode="history"
                      includeCurrentWeek={true}
                      refreshKey={JSON.stringify(historyTrades)}
                    />
                  </div>
                </div>
              )}
            </TabPanel>
          </main>
        </Tabs>

        {/* ===== MODAL ===== */}
        {selectedTrade && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1e293b] p-6 rounded-2xl shadow-lg max-w-4xl w-full">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Trade Chart
              </h2>
              <img
                src={
                  selectedTrade.screenshot ||
                  "https://via.placeholder.com/400x200?text=No+Chart"
                }
                alt="Trade Chart"
                className="w-full rounded-lg"
              />
              <button
                onClick={closeModal}
                className="mt-4 bg-[#00ffa3] text-black font-semibold px-6 py-3 rounded-xl hover:brightness-110 focus:ring-2 focus:ring-[#00ffa3]/50 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );


  function findBacktestScreenshot(pair, date, time) {
    const backtestTrade = backtestTrades.find(
      (t) => t.pair === pair && t.date === date && t.time === time && t.screenshot
    );
    return backtestTrade?.screenshot;
  }
}
