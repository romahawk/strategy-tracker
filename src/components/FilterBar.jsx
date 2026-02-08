import { Filter, X } from "lucide-react";

export default function FilterBar({ filters, setFilters }) {
  const clearFilters = () => {
    setFilters({ result: "", startDate: "", endDate: "", pair: "", mode: filters.mode });
  };

  return (
    <div className="bg-th-raised border border-th-border-dim rounded-2xl px-4 py-3 mb-4">
      {/* header */}
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-th-text">Filters</h3>
        {(filters.result || filters.startDate || filters.endDate || filters.pair) && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-200">
            active
          </span>
        )}
      </div>

      {/* controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Result */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-th-text-dim">Result</label>
          <select
            name="result"
            value={filters.result}
            onChange={(e) => setFilters({ ...filters, result: e.target.value })}
            className="h-8 bg-th-raised border border-th-border-dim rounded-lg px-3 text-xs text-th-text focus:outline-none focus:ring-2 focus:ring-th-accent/30"
          >
            <option value="">All</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
            <option value="Break Even">Break Even</option>
          </select>
        </div>

        {/* From */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-th-text-dim">From</label>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="h-8 bg-th-raised border border-th-border-dim rounded-lg px-3 text-xs text-th-text focus:outline-none focus:ring-2 focus:ring-th-accent/30"
          />
        </div>

        {/* To */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-th-text-dim">To</label>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="h-8 bg-th-raised border border-th-border-dim rounded-lg px-3 text-xs text-th-text focus:outline-none focus:ring-2 focus:ring-th-accent/30"
          />
        </div>

        {/* Pair */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-[11px] text-th-text-dim">Pair</label>
          <input
            type="text"
            placeholder="e.g. BTCUSDT"
            value={filters.pair || ""}
            onChange={(e) => setFilters({ ...filters, pair: e.target.value })}
            className="h-8 bg-th-raised border border-th-border-dim rounded-lg px-3 text-xs text-th-text placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-th-accent/30"
          />
        </div>

        {/* Clear */}
        <button
          type="button"
          onClick={clearFilters}
          className="ml-auto h-8 px-3 rounded-full bg-th-overlay text-th-text text-xs flex items-center gap-1 hover:bg-th-raised transition"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>
    </div>
  );
}
