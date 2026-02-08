import { useState, useMemo } from "react";
import { X, Plus, Layers } from "lucide-react";
import { loadRuleSet, saveRuleSet, createRule, createGroup } from "../ruleStore";
import RuleRow from "./RuleRow";

function structuredCloneSafe(obj) {
  try { return structuredClone(obj); }
  catch { return JSON.parse(JSON.stringify(obj)); }
}

const tabClass = (active) =>
  `px-4 py-1.5 rounded-t-lg text-sm font-medium transition ${
    active
      ? "bg-th-hl/10 text-th-text border border-th-border border-b-transparent"
      : "text-th-text-muted hover:text-th-text-sub"
  }`;

export default function RuleBuilder({ strategyId, onClose, onSaved }) {
  const sid = Number(strategyId);
  const base = useMemo(() => loadRuleSet(sid), [sid]);
  const [draft, setDraft] = useState(() => structuredCloneSafe(base));
  const [tab, setTab] = useState("long"); // "long" | "short"

  const groupsKey = tab === "long" ? "longGroups" : "shortGroups";
  const groups = draft[groupsKey] || [];

  // --- Mutations ---

  const updateGroups = (nextGroups) => {
    setDraft((prev) => ({ ...prev, [groupsKey]: nextGroups }));
  };

  const addGroup = (operator = "AND") => {
    updateGroups([...groups, createGroup(operator, tab === "long" ? "lg" : "sg")]);
  };

  const removeGroup = (groupId) => {
    updateGroups(groups.filter((g) => g.id !== groupId));
  };

  const toggleGroupOperator = (groupId) => {
    updateGroups(
      groups.map((g) =>
        g.id === groupId ? { ...g, operator: g.operator === "AND" ? "OR" : "AND" } : g
      )
    );
  };

  const addRule = (groupId, type = "indicator") => {
    updateGroups(
      groups.map((g) =>
        g.id === groupId ? { ...g, rules: [...g.rules, createRule(type)] } : g
      )
    );
  };

  const updateRule = (groupId, ruleId, patch) => {
    updateGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          rules: g.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
        };
      })
    );
  };

  const removeRule = (groupId, ruleId) => {
    updateGroups(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, rules: g.rules.filter((r) => r.id !== ruleId) };
      })
    );
  };

  const handleSave = () => {
    const saved = saveRuleSet(sid, draft);
    if (typeof onSaved === "function") onSaved(saved);
    if (typeof onClose === "function") onClose();
  };

  const totalRules = groups.reduce((n, g) => n + g.rules.length, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center px-4 pt-12 pb-6 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-th-base border border-th-border p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-th-text">
                Entry Rule Builder
              </h3>
            </div>
            <div className="text-[11px] text-th-text-muted mt-0.5">
              TS {sid} — Define required conditions for trade entry
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-th-text-muted hover:text-th-text-sub transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Direction tabs */}
        <div className="flex gap-1 mb-0 border-b border-th-border">
          <button type="button" className={tabClass(tab === "long")} onClick={() => setTab("long")}>
            Long Rules
          </button>
          <button type="button" className={tabClass(tab === "short")} onClick={() => setTab("short")}>
            Short Rules
          </button>
        </div>

        {/* Groups */}
        <div className="mt-3 space-y-4">
          {groups.length === 0 && (
            <div className="rounded-xl border border-th-border bg-th-inset p-4 text-center">
              <p className="text-[11px] text-th-text-muted">
                No rule groups. Add one to start defining conditions.
              </p>
            </div>
          )}

          {groups.map((group, gi) => (
            <div
              key={group.id}
              className="rounded-xl border border-th-border bg-th-hl/[0.02] p-3"
            >
              {/* Group header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-th-text-muted">Group {gi + 1}</span>
                  <button
                    type="button"
                    onClick={() => toggleGroupOperator(group.id)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                      group.operator === "AND"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-amber-400/30 bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {group.operator === "AND" ? "ALL must be true" : "ANY one true"}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => addRule(group.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-th-text-dim hover:text-emerald-300 transition px-2 py-1 rounded-lg bg-th-hl/5 border border-th-border"
                  >
                    <Plus className="w-3 h-3" /> Rule
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    className="text-[11px] text-th-text-muted hover:text-rose-400 transition px-2 py-1"
                    title="Remove group"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Rules in this group */}
              {group.rules.length === 0 ? (
                <div className="text-[11px] text-th-text-muted py-2 text-center">
                  Empty group — add a rule above.
                </div>
              ) : (
                <div className="space-y-2">
                  {group.rules.map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      onUpdate={(patch) => updateRule(group.id, rule.id, patch)}
                      onRemove={() => removeRule(group.id, rule.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add group + footer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addGroup("AND")}
              className="inline-flex items-center gap-1.5 text-[11px] text-th-text-dim hover:text-emerald-300 transition px-3 py-1.5 rounded-lg bg-th-hl/5 border border-th-border"
            >
              <Plus className="w-3 h-3" /> AND Group
            </button>
            <button
              type="button"
              onClick={() => addGroup("OR")}
              className="inline-flex items-center gap-1.5 text-[11px] text-th-text-dim hover:text-amber-300 transition px-3 py-1.5 rounded-lg bg-th-hl/5 border border-th-border"
            >
              <Plus className="w-3 h-3" /> OR Group
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-th-text-muted">
              {totalRules} rule{totalRules !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-th-text-muted hover:text-th-text-sub transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-emerald-400 text-[#020617] text-sm font-semibold hover:brightness-110 transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
