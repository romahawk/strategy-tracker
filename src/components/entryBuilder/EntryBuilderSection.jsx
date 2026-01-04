import { useEffect, useMemo, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { entryStore } from "../../storage/entryStore";
import { normalizeEntryDefinitionV2, makeRuleId, nowISO } from "../../domain/entrySchemaV2";
import { RULE_ATOMS_V1, RULES_CATALOG_V1 } from "../../domain/rulesCatalogV1";
import { validateEntryDefinitionV2WithCatalog } from "../../domain/ruleValidation";
import RuleRow from "./RuleRow";

const btn =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-slate-100";

function emptyRuleForAtom(atomId) {
  const atom = RULES_CATALOG_V1[atomId];
  const params = {};
  if (atom?.params) {
    for (const [k, spec] of Object.entries(atom.params)) {
      if (spec?.default !== undefined) params[k] = spec.default;
    }
  }

  const operator = (atom?.operators && atom.operators[0]) || "IS";

  // Default value
  let value = undefined;
  let values = undefined;
  if (operator === "IS" && Array.isArray(atom?.values) && atom.values.length) {
    value = atom.values[0];
  }
  if (operator === "BETWEEN") {
    values = [30, 70]; // safe default for RSI-like ranges
  }

  return {
    id: makeRuleId(),
    enabled: true,
    atomId,
    params,
    operator,
    value,
    values,
    scope: { type: "NOW" },
    label: "",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

export default function EntryBuilderSection({ strategyId }) {
  const sid = Number(strategyId);

  const [entry, setEntry] = useState(null);
  const [activeSide, setActiveSide] = useState("long"); // "long" | "short"
  const [errors, setErrors] = useState([]);

  // Load per strategy (v2)
  useEffect(() => {
    if (!Number.isFinite(sid)) return;
    const e = entryStore.get(sid);
    setEntry(normalizeEntryDefinitionV2(e));
    setErrors([]);
  }, [sid]);

  const side = useMemo(() => {
    if (!entry) return null;
    return activeSide === "long" ? entry.long : entry.short;
  }, [entry, activeSide]);

  const sideErrors = useMemo(() => {
    // Filter errors for current side
    const prefix = `${activeSide}.rules[`;
    return errors.filter((e) => e.path.startsWith(prefix));
  }, [errors, activeSide]);

  const persist = (next) => {
    const normalized = normalizeEntryDefinitionV2(next);
    const validation = validateEntryDefinitionV2WithCatalog(normalized);

    setErrors(validation.errors || []);
    setEntry(normalized);

    // For now we still save (non-blocking). Later, we can block if !validation.ok
    entryStore.set(sid, normalized);
  };

  const updateSideRules = (updater) => {
    if (!entry) return;

    const next = { ...entry };
    const key = activeSide === "long" ? "long" : "short";
    const currentRules = Array.isArray(next[key].rules) ? next[key].rules : [];
    const newRules = updater(currentRules).slice(0, 8);

    next[key] = {
      ...next[key],
      rules: newRules.map((r) => ({ ...r, updatedAt: nowISO() })),
    };

    next.updatedAt = nowISO();
    persist(next);
  };

  const addRule = () => {
    const atomId = RULE_ATOMS_V1[0]?.atomId || "supertrend_direction";
    updateSideRules((rules) => [...rules, emptyRuleForAtom(atomId)]);
  };

  const removeRule = (ruleId) => {
    updateSideRules((rules) => rules.filter((r) => r.id !== ruleId));
  };

  const updateRule = (ruleId, patch) => {
    updateSideRules((rules) =>
      rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r))
    );
  };

  const toggleRule = (ruleId) => {
    updateSideRules((rules) =>
      rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  if (!entry || !side) return null;

  return (
    <div className="border border-white/5 rounded-2xl p-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">Entry Builder</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`${btn} ${activeSide === "long" ? "ring-2 ring-emerald-400/30" : ""}`}
            onClick={() => setActiveSide("long")}
            type="button"
          >
            Long
          </button>
          <button
            className={`${btn} ${activeSide === "short" ? "ring-2 ring-emerald-400/30" : ""}`}
            onClick={() => setActiveSide("short")}
            type="button"
          >
            Short
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-xs text-slate-400">
          Logic: <span className="text-slate-200">ALL (AND)</span> • Max rules:{" "}
          <span className="text-slate-200">{entry.settings.maxRulesPerSide}</span>
        </div>

        <button className={btn} onClick={addRule} type="button">
          <Plus className="w-4 h-4" /> Add rule
        </button>
      </div>

      <div className="space-y-2">
        {side.rules.length === 0 ? (
          <div className="text-sm text-slate-400 border border-white/5 rounded-xl p-4">
            No rules yet. Add your first rule.
          </div>
        ) : (
          side.rules.map((r, idx) => (
            <RuleRow
              key={r.id}
              index={idx}
              rule={r}
              onToggle={() => toggleRule(r.id)}
              onRemove={() => removeRule(r.id)}
              onPatch={(patch) => updateRule(r.id, patch)}
              errors={sideErrors}
              side={activeSide}
            />
          ))
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-3 text-xs text-rose-300 border border-rose-500/20 bg-rose-500/10 rounded-xl p-3">
          <div className="font-semibold mb-1">Validation issues</div>
          <ul className="list-disc pl-5 space-y-1">
            {errors.slice(0, 6).map((e, i) => (
              <li key={i}>
                <span className="text-rose-200">{e.path}:</span> {e.message}
              </li>
            ))}
          </ul>
          {errors.length > 6 && <div className="mt-2 text-rose-200">+{errors.length - 6} more…</div>}
        </div>
      )}
    </div>
  );
}
