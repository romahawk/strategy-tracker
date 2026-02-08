// src/components/trades/TargetsSection.jsx
import { useEffect, useMemo } from "react";
import { Target } from "lucide-react";
import { Card } from "../ui/Card";

const labelBase = "text-[11px] text-th-text-dim mb-0.5 block";
const inputBase =
  "h-8 w-full rounded-lg bg-th-raised border border-th-border-dim px-3 text-sm text-th-text " +
  "placeholder:text-th-text-muted focus:outline-none focus:ring-2 focus:ring-th-accent/30";
const readonlyBase =
  "h-8 w-full rounded-lg bg-th-inset border border-th-border-dim px-3 text-sm text-th-text-sub";

const CHECKPOINTS = [25, 33, 50, 100];
const SNAP_EPS = 1;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function parsePct(v) {
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

/* Compact allocation: inline slider + % + quick-set pills */
function CompactAllocation({ value, onChange, disabled }) {
  const v = clamp(Number(value ?? 0), 0, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={v}
          disabled={disabled}
          onChange={(e) => onChange(softSnap(e.target.value))}
          className="flex-1"
          style={{ accentColor: "rgb(var(--color-accent))" }}
        />
        <span className="text-[10px] text-th-text-muted font-mono w-7 text-right shrink-0">
          {v}%
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {CHECKPOINTS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c)}
            className={`text-[9px] px-1.5 py-0.5 rounded-full border transition ${
              v === c
                ? "border-th-accent/40 bg-th-accent/10 text-th-accent"
                : "border-th-border-dim bg-th-hl/5 text-th-text-dim hover:bg-th-hl/10"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {c}%
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TargetsSection({ form, onChange }) {
  const tpsHit = form.tpsHit || "OPEN";

  const emit = (name, value) => onChange({ target: { name, value } });

  const defaults = useMemo(() => {
    if (tpsHit === "1") return { a1: 100, a2: 0, a3: 0 };
    if (tpsHit === "2") return { a1: 33, a2: 67, a3: 0 };
    if (tpsHit === "3") return { a1: 33, a2: 33, a3: 34 };
    if (tpsHit === "SL") return { a1: 0, a2: 0, a3: 0 };
    return { a1: 33, a2: 67, a3: 0 };
  }, [tpsHit]);

  const a1 = parsePct(form.tp1AllocPct);
  const a2 = parsePct(form.tp2AllocPct);
  const a3 = parsePct(form.tp3AllocPct);

  const alloc1 = a1 ?? defaults.a1;
  const alloc2 = a2 ?? defaults.a2;
  const alloc3 = a3 ?? defaults.a3;

  useEffect(() => {
    emit("tp1AllocPct", String(defaults.a1));
    emit("tp2AllocPct", String(defaults.a2));
    emit("tp3AllocPct", String(defaults.a3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpsHit]);

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

  const tps = [
    { label: "TP1", name: "tp1", dollar: tp1Dollar, alloc: alloc1, setAlloc: setTP1Alloc, disabled: disableTP1 },
    { label: "TP2", name: "tp2", dollar: tp2Dollar, alloc: alloc2, setAlloc: setTP2Alloc, disabled: disableTP2 },
    { label: "TP3", name: "tp3", dollar: tp3Dollar, alloc: alloc3, setAlloc: setTP3Alloc, disabled: disableTP3 },
  ];

  return (
    <Card variant="secondary" className="p-2">
      {/* Header with TP status inline */}
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-emerald-300" />
        <h3 className="text-sm font-semibold text-th-text">Targets</h3>
        <select
          name="tpsHit"
          value={tpsHit}
          onChange={(e) => emit("tpsHit", e.target.value)}
          className="ml-auto h-7 rounded-lg bg-th-raised border border-th-border-dim px-2 text-xs text-th-text focus:outline-none focus:ring-2 focus:ring-th-accent/30"
        >
          <option value="OPEN">Not closed</option>
          <option value="SL">SL</option>
          <option value="1">TP1</option>
          <option value="2">TP2</option>
          <option value="3">TP3</option>
        </select>
      </div>

      {/* 3-column TP grid — all targets visible */}
      <div className="grid grid-cols-3 gap-2">
        {tps.map((tp) => {
          const dollarDisplay =
            tp.dollar === null || tp.dollar === undefined || tp.dollar === ""
              ? ""
              : String(tp.dollar);
          return (
            <div key={tp.name} className="space-y-1">
              <label className={labelBase}>{tp.label}</label>
              <input
                name={tp.name}
                value={form[tp.name] || ""}
                onChange={onChange}
                placeholder="price"
                className={inputBase}
              />
              <input
                value={dollarDisplay}
                readOnly
                className={readonlyBase}
                placeholder="$"
                tabIndex={-1}
              />
              <CompactAllocation
                value={tp.alloc}
                onChange={tp.setAlloc}
                disabled={tp.disabled}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
