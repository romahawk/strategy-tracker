import { BarChart3 } from "lucide-react";

export default function ResultSection({ form, onChange }) {
  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">Result</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">
            Result
          </label>
          <select
            name="result"
            value={form.result}
            onChange={onChange}
            className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <option value="Open">Open (result unknown)</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
            <option value="Break Even">Break Even</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">
            Comm:
          </label>
          <input
            name="commission"
            value={form.commission || ""}
            onChange={onChange}
            className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
            placeholder="$"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">
            TP Tot:
          </label>
          <input
            name="tpTotal"
            value={form.tpTotal || ""}
            onChange={onChange}
            className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
          />
        </div>

        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">
            PnL:
          </label>
          <input
            name="pnl"
            value={form.pnl || ""}
            onChange={onChange}
            className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] text-slate-300 mb-1 block">
            Next Dep:
          </label>
          <input
            name="nextDeposit"
            value={form.nextDeposit || ""}
            onChange={onChange}
            className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
          />
        </div>
      </div>
    </div>
  );
}
