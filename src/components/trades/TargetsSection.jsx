// src/components/trades/trades/TargetsSection.jsx
import { useEffect, useMemo, useState } from "react";
import { Target, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";

const labelBase = "text-[11px] text-slate-300 mb-1 block";
const inputBase =
  "h-8 w-full rounded-lg bg-[#0b1120] border border-white/10 px-3 text-sm text-white " +
  "placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

const CHECKPOINTS = [25, 33, 50, 100];
const SNAP_EPS = 1; // soft snap when within ±1

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function parsePct(v) {
  // IMPORTANT: treat "" as unset, not 0
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? clamp(Math.round(n), 0, 100) : null;
}

function softSnap(val) {
  const v = clamp(Math.round(val), 0, 100);
  for (const c of CHECKPOINTS) {
    if (Math.abs(v - c) <= SNAP_EPS) return c;
  }
  return v;
}

function MoneyField({ value }) {
  const display =
    value === null || value === undefined || value === "" ? "" : String(value);
  return (
    <input
      value={display}
      readOnly
      className={
        inputBase +
        " bg-black/10 border-white/10 text-slate-200 focus:ring-0"
      }
      placeholder="$"
      tabIndex={-1}
    />
  );
}

/**
 * Continuous slider:
 * - Drag sets any value 0..100 (soft-snapped near checkpoints)
 * - Pills set checkpoints exactly (25/33/50/100)
 * - No label overlap (pills instead of on-track labels)
 */
function AllocationSlider({ value, onChange, disabled }) {
  const v = clamp(Number(value ?? 0), 0, 100);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(softSnap(e.target.value))}
          className="w-full accent-emerald-400"
        />

        {/* ticks only */}
        <div className="absolute left-0 right-0 top-[14px] h-0 pointer-events-none">
          {CHECKPOINTS.map((c) => (
            <div
              key={c}
              className="absolute -translate-x-1/2"
              style={{ left: `${c}%` }}
            >
              <div className="w-[2px] h-2 rounded-full bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* checkpoint pills */}
      <div className="mt-1 flex items-center gap-1 flex-wrap">
        {CHECKPOINTS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c)}
            className={`text-[10px] px-2 py-1 rounded-full border transition ${
              v === c
                ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {c}%
          </button>
        ))}

        {/* live value */}
        <span className="ml-auto text-[10px] text-slate-400">
          {v}%
        </span>
      </div>
    </div>
  );
}

export default function TargetsSection({ form, onChange }) {
  const tpsHit = form.tpsHit || "OPEN";
  const isTP2 = tpsHit === "2";
  const isTP3 = tpsHit === "3";

  const [showMore, setShowMore] = useState(isTP2 || isTP3);

  useEffect(() => {
    if (isTP2 || isTP3) setShowMore(true);
  }, [isTP2, isTP3]);

  const emit = (name, value) => onChange({ target: { name, value } });

  // Defaults per TP status (legacy behavior)
  const defaults = useMemo(() => {
    if (tpsHit === "1") return { a1: 100, a2: 0, a3: 0 };
    if (tpsHit === "2") return { a1: 33, a2: 67, a3: 0 };
    if (tpsHit === "3") return { a1: 33, a2: 33, a3: 34 };
    if (tpsHit === "SL") return { a1: 0, a2: 0, a3: 0 };
    // OPEN: keep sensible defaults
    return { a1: 33, a2: 67, a3: 0 };
  }, [tpsHit]);

  // Parse allocations; if unset, use defaults
  const a1 = parsePct(form.tp1AllocPct);
  const a2 = parsePct(form.tp2AllocPct);
  const a3 = parsePct(form.tp3AllocPct);

  const alloc1 = a1 ?? defaults.a1;
  const alloc2 = a2 ?? defaults.a2;
  const alloc3 = a3 ?? defaults.a3;

  // When TP status changes: set initial allocations (so UI never shows 25% due to "")
  useEffect(() => {
    emit("tp1AllocPct", String(defaults.a1));
    emit("tp2AllocPct", String(defaults.a2));
    emit("tp3AllocPct", String(defaults.a3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpsHit]);

  // Allocation sync rules
  const setTP1Alloc = (next) => {
    const v = clamp(next, 0, 100);

    if (tpsHit === "1") {
      emit("tp1AllocPct", "100");
      emit("tp2AllocPct", "0");
      emit("tp3AllocPct", "0");
      return;
    }
    if (tpsHit === "SL") {
      emit("tp1AllocPct", "0");
      emit("tp2AllocPct", "0");
      emit("tp3AllocPct", "0");
      return;
    }
    if (tpsHit === "2") {
      emit("tp1AllocPct", String(v));
      emit("tp2AllocPct", String(100 - v));
      emit("tp3AllocPct", "0");
      return;
    }
    if (tpsHit === "3") {
      // keep TP2 as-is, adjust TP3 remainder
      let tp2 = alloc2;
      let tp3 = 100 - v - tp2;
      if (tp3 < 0) {
        tp2 = 100 - v;
        tp3 = 0;
      }
      emit("tp1AllocPct", String(v));
      emit("tp2AllocPct", String(tp2));
      emit("tp3AllocPct", String(tp3));
      return;
    }
    emit("tp1AllocPct", String(v));
  };

  const setTP2Alloc = (next) => {
    const v = clamp(next, 0, 100);

    if (tpsHit === "2") {
      emit("tp2AllocPct", String(v));
      emit("tp1AllocPct", String(100 - v));
      emit("tp3AllocPct", "0");
      return;
    }
    if (tpsHit === "3") {
      // keep TP1, adjust TP3 remainder
      let tp1 = alloc1;
      let tp3 = 100 - tp1 - v;
      if (tp3 < 0) {
        tp1 = 100 - v;
        tp3 = 0;
      }
      emit("tp1AllocPct", String(tp1));
      emit("tp2AllocPct", String(v));
      emit("tp3AllocPct", String(tp3));
      return;
    }
    emit("tp2AllocPct", String(v));
  };

  const setTP3Alloc = (next) => {
    const v = clamp(next, 0, 100);

    if (tpsHit === "3") {
      // keep TP1, adjust TP2 remainder
      let tp1 = alloc1;
      let tp2 = 100 - tp1 - v;
      if (tp2 < 0) {
        tp1 = 100 - v;
        tp2 = 0;
      }
      emit("tp1AllocPct", String(tp1));
      emit("tp2AllocPct", String(tp2));
      emit("tp3AllocPct", String(v));
      return;
    }
    emit("tp3AllocPct", String(v));
  };

  const tp1Dollar = form.tp1Dollar ?? "";
  const tp2Dollar = form.tp2Dollar ?? "";
  const tp3Dollar = form.tp3Dollar ?? "";

  const disableTP1 = tpsHit === "SL" || tpsHit === "1";
  const disableTP2 = !(tpsHit === "2" || tpsHit === "3");
  const disableTP3 = tpsHit !== "3";

  return (
    <Card variant="secondary" className="p-2">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-slate-100">Targets</h3>
      </div>

      <div className="space-y-2">
        <div>
          <label className={labelBase}>TP status</label>
          <select
            name="tpsHit"
            value={tpsHit}
            onChange={(e) => emit("tpsHit", e.target.value)}
            className={inputBase}
          >
            <option value="OPEN">Not closed yet</option>
            <option value="SL">SL</option>
            <option value="1">TP1</option>
            <option value="2">TP2</option>
            <option value="3">TP3</option>
          </select>
        </div>

        {/* TP1 */}
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <label className={labelBase}>TP1</label>
            <input
              name="tp1"
              value={form.tp1 || ""}
              onChange={onChange}
              placeholder="price"
              className={inputBase}
            />
          </div>
          <div className="w-20">
            <MoneyField value={tp1Dollar} />
          </div>
        </div>
        <AllocationSlider
          value={alloc1}
          onChange={setTP1Alloc}
          disabled={disableTP1}
        />

        {/* TP2/3 toggle */}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
        >
          <div className="flex items-center gap-2">
            {showMore ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-200" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-200" />
            )}
            <span className="text-xs text-slate-100">TP2 / TP3</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {showMore ? "Hide" : "Show"}
          </span>
        </button>

        {showMore && (
          <div className="space-y-2">
            {/* TP2 */}
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <label className={labelBase}>TP2</label>
                <input
                  name="tp2"
                  value={form.tp2 || ""}
                  onChange={onChange}
                  placeholder="price"
                  className={inputBase}
                />
              </div>
              <div className="w-20">
                <MoneyField value={tp2Dollar} />
              </div>
            </div>
            <AllocationSlider
              value={alloc2}
              onChange={setTP2Alloc}
              disabled={disableTP2}
            />

            {/* TP3 */}
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <label className={labelBase}>TP3</label>
                <input
                  name="tp3"
                  value={form.tp3 || ""}
                  onChange={onChange}
                  placeholder="price"
                  className={inputBase}
                />
              </div>
              <div className="w-20">
                <MoneyField value={tp3Dollar} />
              </div>
            </div>
            <AllocationSlider
              value={alloc3}
              onChange={setTP3Alloc}
              disabled={disableTP3}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
