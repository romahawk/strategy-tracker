import { useState } from "react";
import { Target, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";

const inputBase =
  "h-8 w-full rounded-lg bg-[#0b1120] border border-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

export default function TargetsSection({ form, onChange }) {
  const [showMore, setShowMore] = useState(form.tpsHit === "2" || form.tpsHit === "3");

  return (
    <Card variant="secondary" className="p-2">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-slate-100">Targets</h3>
      </div>

      <div className="grid lg:grid-cols-[260px,1fr] gap-2">
        <div className="space-y-2">
          <label className="text-[11px] text-slate-300 mb-1 block">TP status</label>
          <select name="tpsHit" value={form.tpsHit} onChange={onChange} className={inputBase}>
            <option value="OPEN">Not closed yet</option>
            <option value="SL">SL</option>
            <option value="1">TP1</option>
            <option value="2">TP2</option>
            <option value="3">TP3</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] text-slate-300 mb-1 block">TP1</label>
          <input name="tp1" value={form.tp1 || ""} onChange={onChange} placeholder="TP1" className={inputBase} />

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
          >
            <div className="flex items-center gap-2">
              {showMore ? (
                <ChevronDown className="w-4 h-4 text-slate-200" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-200" />
              )}
              <span className="text-sm text-slate-100">TP2 / TP3</span>
              <span className="text-[11px] text-slate-400">(optional)</span>
            </div>
            <span className="text-[11px] text-slate-400">{showMore ? "Hide" : "Show"}</span>
          </button>

          {showMore && (
            <div className="grid md:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-300 mb-1 block">TP2</label>
                <input name="tp2" value={form.tp2 || ""} onChange={onChange} placeholder="TP2" className={inputBase} />
              </div>
              <div>
                <label className="text-[11px] text-slate-300 mb-1 block">TP3</label>
                <input name="tp3" value={form.tp3 || ""} onChange={onChange} placeholder="TP3" className={inputBase} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
