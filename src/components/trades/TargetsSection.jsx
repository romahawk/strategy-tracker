import { Target } from "lucide-react";

export default function TargetsSection({ form, onChange }) {
  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-100">Targets</h3>
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-4">
        {/* LEFT COLUMN */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-300 mb-1 block">
              TP status
            </label>
            <select
              name="tpsHit"
              value={form.tpsHit}
              onChange={onChange}
              className="w-full h-8 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <option value="OPEN">Not closed yet</option>
              <option value="SL">SL</option>
              <option value="1">TP1</option>
              <option value="2">TP2</option>
              <option value="3">TP3</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-300 mb-1 block">
              SL %: $
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="slPercent"
                value={form.slPercent || ""}
                onChange={onChange}
                placeholder="SL %"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
              <input
                name="slDollar"
                value={form.slDollar || ""}
                onChange={onChange}
                placeholder="SL $"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-3">
          {/* TP1 row */}
          <div>
            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">
              TP1
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                name="tp1"
                value={form.tp1 || ""}
                onChange={onChange}
                placeholder="TP1"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
              <input
                name="tp1Percent"
                value={form.tp1Percent || ""}
                onChange={onChange}
                placeholder="%"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
              <input
                name="tp1Dollar"
                value={form.tp1Dollar || ""}
                onChange={onChange}
                placeholder="$"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
            </div>
          </div>

          {/* TP2 row */}
          <div>
            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">
              TP2
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                name="tp2"
                value={form.tp2 || ""}
                onChange={onChange}
                placeholder="TP2"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
              <input
                name="tp2Percent"
                value={form.tp2Percent || ""}
                onChange={onChange}
                placeholder="%"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
              <input
                name="tp2Dollar"
                value={form.tp2Dollar || ""}
                onChange={onChange}
                placeholder="$"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
            </div>
          </div>

          {/* TP3 row */}
          <div>
            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">
              TP3
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                name="tp3"
                value={form.tp3 || ""}
                onChange={onChange}
                placeholder="TP3"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
              <input
                name="tp3Percent"
                value={form.tp3Percent || ""}
                onChange={onChange}
                placeholder="%"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
              <input
                name="tp3Dollar"
                value={form.tp3Dollar || ""}
                onChange={onChange}
                placeholder="$"
                className="h-9 rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
