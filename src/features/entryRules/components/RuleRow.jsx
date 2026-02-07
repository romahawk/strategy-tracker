import { X } from "lucide-react";
import { RULE_TYPES, RULE_TYPE_LIST } from "../ruleTypes";
import { ruleToSentence } from "../ruleHelpers";

const inputBase =
  "h-8 rounded-lg bg-[#0b1120] px-3 text-sm text-white border border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-400/40";

export default function RuleRow({ rule, onUpdate, onRemove }) {
  const typeDef = RULE_TYPES[rule.type];
  const fields = typeDef?.fields || [];

  const setParam = (key, value) => {
    onUpdate({ params: { ...rule.params, [key]: value } });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-2 space-y-2">
      {/* Header: type selector + label override + remove */}
      <div className="flex items-center gap-2">
        <select
          value={rule.type}
          onChange={(e) => onUpdate({ type: e.target.value, params: {}, label: "" })}
          className={`${inputBase} w-36 text-xs`}
        >
          {RULE_TYPE_LIST.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          type="text"
          value={rule.label || ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder={ruleToSentence(rule) || "Custom label (auto-generated)"}
          className={`${inputBase} flex-1 text-xs`}
        />

        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-400/30 transition"
          title="Remove rule"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Param fields — dynamic per type */}
      {fields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-0.5 min-w-[100px] flex-1">
              <span className="text-[10px] text-slate-400">{f.label}</span>
              {f.type === "select" ? (
                <select
                  value={rule.params?.[f.key] || ""}
                  onChange={(e) => setParam(f.key, e.target.value)}
                  className={`${inputBase} text-xs`}
                >
                  <option value="">—</option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={rule.params?.[f.key] || ""}
                  onChange={(e) => setParam(f.key, e.target.value)}
                  placeholder={f.placeholder || ""}
                  className={`${inputBase} text-xs`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Readable sentence preview */}
      <div className="text-[10px] text-slate-500 italic">
        {ruleToSentence(rule)}
      </div>
    </div>
  );
}
