import { Trash2 } from "lucide-react";
import { RULE_ATOMS_V1, RULES_CATALOG_V1 } from "../../domain/rulesCatalogV1";
import RuleParamFields from "./RuleParamFields";

const selectBase =
  "h-9 rounded-xl bg-[#0b1120] px-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
const inputBase =
  "h-9 rounded-xl bg-[#0b1120] px-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";

function findFieldErrors(allErrors, side, index, suffix) {
  const prefix = `${side}.rules[${index}]${suffix ? "." + suffix : ""}`;
  return allErrors.filter((e) => e.path.startsWith(prefix));
}

export default function RuleRow({ rule, index, side, onPatch, onToggle, onRemove, errors }) {
  const atom = RULES_CATALOG_V1[rule.atomId];
  const allowedOps = atom?.operators || ["IS"];

  const operator = rule.operator || allowedOps[0] || "IS";

  const handleAtomChange = (atomId) => {
    const nextAtom = RULES_CATALOG_V1[atomId];
    const nextParams = {};
    if (nextAtom?.params) {
      for (const [k, spec] of Object.entries(nextAtom.params)) {
        if (spec?.default !== undefined) nextParams[k] = spec.default;
      }
    }
    const nextOp = (nextAtom?.operators && nextAtom.operators[0]) || "IS";

    // set default value
    let nextValue = undefined;
    let nextValues = undefined;
    if (nextOp === "IS" && Array.isArray(nextAtom?.values) && nextAtom.values.length) {
      nextValue = nextAtom.values[0];
    }
    if (nextOp === "BETWEEN") {
      nextValues = [30, 70];
    }

    onPatch({
      atomId,
      params: nextParams,
      operator: nextOp,
      value: nextValue,
      values: nextValues,
    });
  };

  const rowErrors = findFieldErrors(errors, side, index, "");
  const hasErrors = rowErrors.length > 0;

  return (
    <div className={`border rounded-2xl p-3 ${hasErrors ? "border-rose-500/30 bg-rose-500/5" : "border-white/5"}`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={!!rule.enabled} onChange={onToggle} />
          <div className="text-xs text-slate-400">
            Rule {index + 1}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        {/* Atom */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">Condition</label>
          <select
            className={selectBase}
            value={rule.atomId}
            onChange={(e) => handleAtomChange(e.target.value)}
          >
            {RULE_ATOMS_V1.map((a) => (
              <option key={a.atomId} value={a.atomId}>
                {a.label}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500 mt-1">{atom?.description || ""}</div>
        </div>

        {/* Operator */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">Operator</label>
          <select
            className={selectBase}
            value={operator}
            onChange={(e) => onPatch({ operator: e.target.value })}
          >
            {allowedOps.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        {/* Value */}
        <div>
          <label className="text-[11px] text-slate-300 mb-1 block">Value</label>

          {/* IS with enum values */}
          {operator === "IS" && Array.isArray(atom?.values) && atom.values.length ? (
            <select
              className={selectBase}
              value={rule.value ?? atom.values[0]}
              onChange={(e) => onPatch({ value: e.target.value })}
            >
              {atom.values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : operator === "BETWEEN" ? (
            <div className="flex gap-2">
              <input
                className={inputBase}
                type="number"
                value={Array.isArray(rule.values) ? rule.values[0] : ""}
                onChange={(e) => {
                  const a = e.target.value;
                  const b = Array.isArray(rule.values) ? rule.values[1] : "";
                  onPatch({ values: [a, b] });
                }}
              />
              <input
                className={inputBase}
                type="number"
                value={Array.isArray(rule.values) ? rule.values[1] : ""}
                onChange={(e) => {
                  const a = Array.isArray(rule.values) ? rule.values[0] : "";
                  const b = e.target.value;
                  onPatch({ values: [a, b] });
                }}
              />
            </div>
          ) : operator === "EXISTS" ? (
            <div className="text-sm text-slate-400 border border-white/10 rounded-xl h-9 px-3 flex items-center">
              (no value)
            </div>
          ) : (
            <input
              className={inputBase}
              type="number"
              value={rule.value ?? ""}
              onChange={(e) => onPatch({ value: e.target.value })}
            />
          )}
        </div>
      </div>

      <div className="mt-3">
        <RuleParamFields
          atomId={rule.atomId}
          params={rule.params || {}}
          onChange={(nextParams) => onPatch({ params: nextParams })}
          side={side}
          index={index}
          errors={errors}
        />
      </div>
    </div>
  );
}
