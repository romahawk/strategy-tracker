export default function FilterBar({ filters, setFilters }) {
  const clearFilters = () => {
    setFilters({ result: "", startDate: "", endDate: "", pair: "" });
  };

  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
      {/* Result Filter */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Result:</label>
        <select
          name="result"
          value={filters.result}
          onChange={(e) => setFilters({ ...filters, result: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Results</option>
          <option value="Win">✅ Win</option>
          <option value="Loss">❌ Loss</option>
          <option value="Break Even">➖ Break Even</option>
        </select>
      </div>

      {/* Start Date */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">From Date:</label>
        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="border p-2 rounded"
        />
      </div>

      {/* End Date */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">To Date:</label>
        <input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="border p-2 rounded"
        />
      </div>

      {/* Pair Name */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Pair:</label>
        <input
          type="text"
          placeholder="e.g. AVAX-USDT"
          value={filters.pair || ""}
          onChange={(e) => setFilters({ ...filters, pair: e.target.value })}
          className="border p-2 rounded"
        />
      </div>

      {/* Clear Filters Button */}
      <div className="flex flex-col gap-1 justify-end">
        <label className="invisible">Clear</label>
        <button
          type="button"
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
        >
          🔄 Clear Filters
        </button>
      </div>
    </div>
  );
}
