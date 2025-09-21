export default function FilterBar({ filters, setFilters }) {
  const clearFilters = () => {
    setFilters({ result: "", startDate: "", endDate: "", pair: "" });
  };

  return (
    <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg mb-6">
      <div className="bg-[#1e293b] text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Result Filter */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-300">Result:</label>
            <select
              name="result"
              value={filters.result}
              onChange={(e) => setFilters({ ...filters, result: e.target.value })}
              className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
            >
              <option value="">All Results</option>
              <option value="Win">✅ Win</option>
              <option value="Loss">❌ Loss</option>
              <option value="Break Even">➖ Break Even</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-300">From Date:</label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-300">To Date:</label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
            />
          </div>

          {/* Pair Name */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-300">Pair:</label>
            <input
              type="text"
              placeholder="e.g. AVAX-USDT"
              value={filters.pair || ""}
              onChange={(e) => setFilters({ ...filters, pair: e.target.value })}
              className="bg-[#1e293b] border border-gray-600 text-white p-2 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-[#00ffa3] focus:outline-none"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex flex-col gap-2 justify-end">
            <label className="invisible">Clear</label>
            <button
              type="button"
              onClick={clearFilters}
              className="bg-[#00ffa3] text-black font-semibold px-4 py-2 rounded-xl hover:brightness-110 focus:ring-2 focus:ring-[#00ffa3]/50 transition-all duration-300 shadow-[0_0_10px_#00ffa3] hover:shadow-[0_0_15px_#00ffa3]"
            >
              🔄 Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}