import { Layers, Plus, X, Check, Ban } from "lucide-react";
import { Card } from "../../../components/ui/Card";

const inputBase =
  "w-full h-8 rounded-lg bg-[#0b1120] px-3 text-sm text-white border border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

const selectBase =
  "w-full h-8 rounded-lg bg-[#0b1120] px-3 text-sm text-white border border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

function ConditionRow({ condition: c, onUpdate, onRemove }) {
  const opts = (c.options || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-2 space-y-2">
      <div className="flex items-center gap-2">
        {/* Label */}
        <input
          type="text"
          value={c.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Label"
          className={`${inputBase} flex-1`}
        />

        {/* Type selector */}
        <select
          value={c.type}
          onChange={(e) => onUpdate({ type: e.target.value, value: "" })}
          className="h-8 rounded-lg bg-[#0b1120] px-2 text-xs text-white border border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        >
          <option value="select">Select</option>
          <option value="text">Text</option>
        </select>

        {/* OK / NO toggle */}
        <button
          type="button"
          onClick={() => onUpdate({ ok: !c.ok })}
          className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition ${
            c.ok
              ? "bg-emerald-400/20 border border-emerald-400/40 text-emerald-300"
              : "bg-rose-400/10 border border-rose-400/30 text-rose-400"
          }`}
          title={c.ok ? "OK — click to mark NO" : "NO — click to mark OK"}
        >
          {c.ok ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-400/30 transition"
          title="Remove condition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Value row */}
      <div className="flex items-center gap-2">
        {c.type === "select" ? (
          <>
            {/* Options editor */}
            <input
              type="text"
              value={c.options || ""}
              onChange={(e) => onUpdate({ options: e.target.value })}
              placeholder="Options (comma-separated)"
              className={`${inputBase} flex-1 text-xs`}
            />

            {/* Value selector */}
            <select
              value={c.value}
              onChange={(e) => onUpdate({ value: e.target.value })}
              className={`${selectBase} flex-1`}
            >
              <option value="">— Select —</option>
              {opts.map((opt) => (
                <option key={opt} value={opt.toLowerCase()}>
                  {opt}
                </option>
              ))}
            </select>
          </>
        ) : (
          <input
            type="text"
            value={c.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Value"
            className={inputBase}
          />
        )}
      </div>
    </div>
  );
}

export default function EntryConditionsSection({
  conditions,
  onConditionsChange,
}) {
  const updateCondition = (id, patch) => {
    onConditionsChange(
      conditions.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const addCondition = () => {
    onConditionsChange([
      ...conditions,
      {
        id: `c_${Date.now()}`,
        label: "",
        type: "select",
        value: "",
        options: "",
        ok: false,
      },
    ]);
  };

  const removeCondition = (id) => {
    onConditionsChange(conditions.filter((c) => c.id !== id));
  };

  return (
    <Card variant="secondary" className="p-2">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Entry Conditions
          </h3>
          {conditions.length > 0 && (
            <span className="text-[10px] text-slate-400">
              {conditions.filter((c) => c.ok).length}/{conditions.length} OK
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={addCondition}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 transition"
          title="Add entry condition"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-[11px] text-slate-200">Add</span>
        </button>
      </div>

      {conditions.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/10 p-3">
          <p className="text-[11px] text-slate-400">
            No entry conditions. Click Add to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((c) => (
            <ConditionRow
              key={c.id}
              condition={c}
              onUpdate={(patch) => updateCondition(c.id, patch)}
              onRemove={() => removeCondition(c.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
