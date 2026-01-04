import { RULES_CATALOG_V1 } from "../../domain/rulesCatalogV1";

const selectBase =
  "h-9 rounded-xl bg-[#0b1120] px-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
const inputBase =
  "h-9 rounded-xl bg-[#0b1120] px-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";

function fieldErrors(errors, side, index, paramKey) {
  const prefix = `${side}.rules[${index}].params.${paramKey}`;
  return errors.filter((e) => e.path.startsWith(prefix));
}

export default function RuleParamFields({ atomId, params, onChange, side, index, errors }) {
  const atom = RULES_CATALOG_V1[atomId];
  const specParams = atom?.params || {};

  const setParam = (key, value) => {
    onChange({ ...params, [key]: value });
  };

  const entries = Object.entries(specParams);

  if (!entries.length) return null;

  return (
    <div className="grid md:grid-cols-3 gap-2">
      {entries.map(([key, spec]) => {
        const errs = fieldErrors(errors, side, index, key);
        const hasErr = errs.length > 0;

        return (
          <div key={key}>
            <label className="text-[11px] text-slate-300 mb-1 block">
              {spec.label || key}
            </label>

            {spec.type === "select" ? (
              <select
                className={`${selectBase} ${hasErr ? "border-rose-500/50" : ""}`}
                value={params[key] ?? spec.default ?? ""}
                onChange={(e) => setParam(key, e.target.value)}
              >
                {(spec.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : spec.type === "number" ? (
              <input
                className={`${inputBase} ${hasErr ? "border-rose-500/50" : ""}`}
                type="number"
                min={spec.min}
                max={spec.max}
                step={spec.step}
                value={params[key] ?? spec.default ?? ""}
                onChange={(e) => setParam(key, e.target.value)}
              />
            ) : (
              <input
                className={`${inputBase} ${hasErr ? "border-rose-500/50" : ""}`}
                type="text"
                value={params[key] ?? spec.default ?? ""}
                onChange={(e) => setParam(key, e.target.value)}
              />
            )}

            {hasErr && (
              <div className="text-[11px] text-rose-300 mt-1">
                {errs[0].message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
