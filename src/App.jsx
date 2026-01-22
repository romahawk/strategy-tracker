// src/App.jsx
import { useState, useEffect, useMemo } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { toast, ToastContainer } from "react-toastify";
import { useParams } from "react-router-dom";

import "./index.css";
import "react-tabs/style/react-tabs.css";

// ✅ UPDATED: TradeForm moved under /components/trades
import TradeForm from "./components/TradeForm";

import TradeTable from "./components/TradeTable";
import FilterBar from "./components/FilterBar";
import Metrics from "./components/Metrics";
import EquityCurveChart from "./components/EquityCurveChart";
import AccountNav from "./components/AccountNav";
import StrategyNav from "./components/StrategyNav";
import WeeklyCompounding from "./components/WeeklyCompounding";

import { computeTimeline } from "./utils/computeTimeline";

import { BarChart3, Trash2, HandCoins } from "lucide-react";

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

  // main tab: live/backtest/history
  const [tabIndex, setTabIndex] = useState(0);

  // inner tabs
  const [innerTabs, setInnerTabs] = useState({
    live: "trade",
    backtest: "trade",
    history: "trade",
  });

  const [selectedTrade, setSelectedTrade] = useState(null);

  // UI hint only (TradeForm no longer auto-fills)
  const [initialDeposit, setInitialDeposit] = useState(1000);

  // ------------------------
  // Load scoped storage
  // ------------------------
  useEffect(() => {
    const storedLiveTrades = localStorage.getItem(LIVE_STORAGE_KEY);
    const storedBacktestTrades = localStorage.getItem(BACKTEST_STORAGE_KEY);
    const storedHistoryTrades = localStorage.getItem(HISTORY_STORAGE_KEY);

    setTrades(storedLiveTrades ? JSON.parse(storedLiveTrades) : []);
    setBacktestTrades(storedBacktestTrades ? JSON.parse(storedBacktestTrades) : []);
    setHistoryTrades(storedHistoryTrades ? JSON.parse(storedHistoryTrades) : []);

    setHasLoaded(true);
  }, [strategyId, accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist scoped storage
  useEffect(() => {
    if (hasLoaded) localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(trades));
  }, [trades, hasLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasLoaded) localStorage.setItem(BACKTEST_STORAGE_KEY, JSON.stringify(backtestTrades));
  }, [backtestTrades, hasLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasLoaded) localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyTrades));
  }, [historyTrades, hasLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep filters.mode aligned with main tab
  useEffect(() => {
    if (tabIndex === 0) setFilters((prev) => ({ ...prev, mode: "live" }));
    else if (tabIndex === 1) setFilters((prev) => ({ ...prev, mode: "backtest" }));
    else if (tabIndex === 2) setFilters((prev) => ({ ...prev, mode: "history" }));
  }, [tabIndex]);

  // ------------------------
  // Filter helpers
  // ------------------------
  const filteredTrades = (tradesToFilter) => {
    const list = Array.isArray(tradesToFilter) ? tradesToFilter : [];

    return list.filter((trade) => {
      if (filters.result && trade.result !== filters.result) return false;

      if (filters.startDate) {
        const dt = new Date(`${trade.date}T${trade.time || "00:00"}`);
        if (dt < new Date(filters.startDate)) return false;
      }

      if (filters.endDate) {
        const dt = new Date(`${trade.date}T${trade.time || "00:00"}`);
        if (dt > new Date(filters.endDate)) return false;
      }

      if (filters.pair) {
        const p = String(trade.pair || "").toLowerCase();
        if (!p.includes(String(filters.pair).toLowerCase())) return false;
      }

      return true;
    });
  };

  const currentTrades =
    tabIndex === 0 ? trades : tabIndex === 1 ? backtestTrades : historyTrades;

  const filteredCurrentTradesRaw = useMemo(() => {
    return filteredTrades(currentTrades);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrades, filters]);

  // ------------------------
  // Retro-safe equity replay
  // ------------------------
  const startingEquity = useMemo(() => {
    const list = [...(filteredCurrentTradesRaw || [])].sort((a, b) => {
      const ak = `${a?.date || ""} ${a?.time || "00:00"}`;
      const bk = `${b?.date || ""} ${b?.time || "00:00"}`;
      return ak.localeCompare(bk);
    });

    const first = list[0];
    const d = Number(first?.deposit);
    return Number.isFinite(d) ? d : 0;
  }, [filteredCurrentTradesRaw]);

  const timeline = useMemo(() => {
    return computeTimeline(filteredCurrentTradesRaw, {
      startingEquity,
      treatDepositAsCashflow: false,
      treatNextDepositAsCashflow: false,
    });
  }, [filteredCurrentTradesRaw, startingEquity]);

  const filteredCurrentTrades = timeline.enriched;

  useEffect(() => {
    const endEq = Number(timeline.endingEquity);
    setInitialDeposit(Number.isFinite(endEq) ? endEq : 1000);
  }, [timeline.endingEquity]);

  // ------------------------
  // CRUD
  // ------------------------
  const handleAddTrade = (newTrade) => {
    const { mode } = filters;
    let setTradeFunc;

    if (mode === "backtest") setTradeFunc = setBacktestTrades;
    else if (mode === "history") setTradeFunc = setHistoryTrades;
    else setTradeFunc = setTrades;

    if (editingTrade) {
      setTradeFunc((prev) =>
        [...prev]
          .map((trade) =>
            trade.id === editingTrade.id ? { ...newTrade, id: editingTrade.id } : trade
          )
          .sort(
            (a, b) =>
              new Date(`${a.date}T${a.time || "00:00"}`) -
              new Date(`${b.date}T${b.time || "00:00"}`)
          )
      );
      setEditingTrade(null);
    } else {
      setTradeFunc((prev) => {
        const isDuplicate = prev.some((trade) => trade.id === newTrade.id);
        return [...prev, newTrade]
          .filter((trade) => !isDuplicate || trade.id !== newTrade.id)
          .sort(
            (a, b) =>
              new Date(`${a.date}T${a.time || "00:00"}`) -
              new Date(`${b.date}T${b.time || "00:00"}`)
          );
      });
    }
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setInnerTabs((prev) => {
      const key = tabIndex === 0 ? "live" : tabIndex === 1 ? "backtest" : "history";
      return { ...prev, [key]: "trade" };
    });
  };

  const handleDeleteTrade = (id) => {
    const { mode } = filters;
    let setTradeFunc;

    if (mode === "backtest") setTradeFunc = setBacktestTrades;
    else if (mode === "history") setTradeFunc = setHistoryTrades;
    else setTradeFunc = setTrades;

    if (confirm("Delete this trade?")) {
      setTradeFunc((prev) =>
        prev
          .filter((trade) => trade.id !== id)
          .sort(
            (a, b) =>
              new Date(`${a.date}T${a.time || "00:00"}`) -
              new Date(`${b.date}T${b.time || "00:00"}`)
          )
      );
    }
  };

  const handleUpdateTrades = (importedTrades) => {
    const { mode } = filters;
    let setTradeFunc;

    if (mode === "backtest") setTradeFunc = setBacktestTrades;
    else if (mode === "history") setTradeFunc = setHistoryTrades;
    else setTradeFunc = setTrades;

    setTradeFunc(
      [...(importedTrades || [])].sort(
        (a, b) =>
          new Date(`${a.date}T${a.time || "00:00"}`) -
          new Date(`${b.date}T${b.time || "00:00"}`)
      )
    );
  };

  // ------------------------
  // ✅ Scoped clear: only current tab + current strategy + current account
  // ------------------------
  const clearCurrentScope = () => {
    const tabName = tabIndex === 0 ? "Live" : tabIndex === 1 ? "Backtest" : "History";
    const msg = `Clear ${tabName} trades for Strategy ${strategyId} / Account ${accountId}?\n\nThis will NOT affect other tabs, strategies, or accounts.`;

    if (!confirm(msg)) return;

    if (tabIndex === 0) {
      setTrades([]);
      localStorage.removeItem(LIVE_STORAGE_KEY);
    } else if (tabIndex === 1) {
      setBacktestTrades([]);
      localStorage.removeItem(BACKTEST_STORAGE_KEY);
    } else {
      setHistoryTrades([]);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }

    setEditingTrade(null);

    toast.success(`${tabName} trades cleared for current strategy/account`, {
      autoClose: 2000,
    });
  };

  const closeModal = () => setSelectedTrade(null);

  // ------------------------
  // UI: inner nav
  // ------------------------
  const InnerNav = ({ which }) => {
    const active = innerTabs[which];
    const btnBase =
      "px-5 py-2 rounded-full border border-[#f97316]/40 text-sm font-medium transition-all duration-200";

    return (
      <div className="flex items-center justify-between gap-3 mb-4 bg-[#0f172a] rounded-xl p-2">
        <div className="flex gap-4">
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

        <button
          onClick={clearCurrentScope}
          className="h-9 px-4 rounded-full bg-white/5 text-slate-200 text-sm font-semibold hover:bg-white/10 transition flex items-center gap-2 border border-white/10"
          title="Clears only current tab + current strategy + current account"
        >
          <Trash2 className="w-4 h-4" />
          Clear this tab
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 flex flex-col">
      <ToastContainer position="top-right" theme="dark" />

      <Tabs selectedIndex={tabIndex} onSelect={(i) => setTabIndex(i)}>
        {/* ✅ UPDATED NAVBAR */}
        <header className="sticky top-0 z-50 h-16 px-5 bg-[#020617]/90 backdrop-blur border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-fit shrink-0">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#7f5af0] to-[#00ffa3] flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              AlphaRhythm
            </span>
          </div>

          <TabList className="flex items-center gap-1 bg-[#0f172a]/80 rounded-full px-1 py-1 ml-2 h-9 shrink-0">
            <Tab
              className="px-4 h-7 flex items-center rounded-full text-xs font-medium text-slate-200/80 hover:text-white hover:bg-white/5 transition outline-none"
              selectedClassName="bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(127,90,240,.4)]"
            >
              Live
            </Tab>
            <Tab
              className="px-4 h-7 flex items-center rounded-full text-xs font-medium text-slate-200/80 hover:text-white hover:bg-white/5 transition outline-none"
              selectedClassName="bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(127,90,240,.4)]"
            >
              Backtest
            </Tab>
            <Tab
              className="px-4 h-7 flex items-center rounded-full text-xs font-medium text-slate-200/80 hover:text-white hover:bg-white/5 transition outline-none"
              selectedClassName="bg-[#0b1120] text-white border border-white/10 shadow-[0_0_0_1px_rgba(127,90,240,.4)]"
            >
              History
            </Tab>
          </TabList>

          <div className="h-7 w-px bg-white/10 mx-2 shrink-0" />

          {/* ✅ isolate nav controls to prevent overlay/focus weirdness */}
          <div className="relative z-10 flex items-center gap-3 text-white shrink-0">
            <StrategyNav />
          </div>

          <div className="h-7 w-px bg-white/10 mx-1 shrink-0" />

          <div className="relative z-10 flex items-center gap-3 text-white shrink-0">
            <AccountNav />
          </div>

          <div className="ml-auto" />
        </header>

        {/* ===== MAIN ===== */}
        <main className="p-4 pt-6 flex-1 overflow-y-auto space-y-6">
          <TabPanel className="mt-4">
            <InnerNav which="live" />
            {innerTabs.live === "trade" && (
              <TradeForm
                onAddTrade={handleAddTrade}
                editingTrade={editingTrade}
                initialDeposit={initialDeposit}
                strategyId={strategyId}
                accountId={accountId}
              />
            )}
            {innerTabs.live === "all" && (
              <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4 space-y-4">
                <FilterBar
                  filters={filters}
                  setFilters={(newFilters) =>
                    setFilters({ ...newFilters, mode: "live" })
                  }
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
                    includeCurrentWeek={true}
                    refreshKey={JSON.stringify(trades)}
                  />
                </div>
              </div>
            )}
          </TabPanel>

          <TabPanel className="mt-4">
            <InnerNav which="backtest" />

            {innerTabs.backtest === "trade" && (
              <TradeForm
                onAddTrade={handleAddTrade}
                editingTrade={editingTrade}
                initialDeposit={initialDeposit}
                strategyId={strategyId}
                accountId={accountId}
              />
            )}

            {innerTabs.backtest === "all" && (
              <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4 space-y-4">
                <FilterBar
                  filters={filters}
                  setFilters={(f) => setFilters({ ...f, mode: "backtest" })}
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
              <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                <EquityCurveChart trades={filteredCurrentTrades} />
              </div>
            )}
          </TabPanel>

          <TabPanel className="mt-4">
            <InnerNav which="history" />

            {innerTabs.history === "trade" && (
              <TradeForm
                onAddTrade={handleAddTrade}
                editingTrade={editingTrade}
                initialDeposit={initialDeposit}
                strategyId={strategyId}
                accountId={accountId}
              />
            )}

            {innerTabs.history === "all" && (
              <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4 space-y-4">
                <FilterBar
                  filters={filters}
                  setFilters={(f) => setFilters({ ...f, mode: "history" })}
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
              <div className="bg-[#1e293b] rounded-2xl shadow-lg p-4">
                <EquityCurveChart trades={filteredCurrentTrades} />
              </div>
            )}
          </TabPanel>
        </main>
      </Tabs>

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
}
