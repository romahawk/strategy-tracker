import { useEffect, useMemo, useState } from "react";
import { Layers, Settings, Check, Ban, MessageSquare } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { loadRuleSet } from "../ruleStore";
import { ruleToSentence, snapshotRulesForTrade, confluenceStats } from "../ruleHelpers";
import RuleBuilder from "./RuleBuilder";

export default function EntryChecklist({
  strategyId,
  direction,
  ruleResults,
  onResultsChange,
  onSnapshotChange,
}) {
  const sid = Number(strategyId);
  const dir = direction || "Long";

  const [ruleSet, setRuleSet] = useState(() => loadRuleSet(sid));
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    setRuleSet(loadRuleSet(sid));
  }, [sid]);

  // Rebuild snapshot when ruleSet or direction changes
  const { ruleSnapshot, ruleResults: defaultResults } = useMemo(
    () => snapshotRulesForTrade(ruleSet, dir, ruleResults),
    [ruleSet, dir, ruleResults]
  );

  // Sync snapshot to parent
  useEffect(() => {
    if (typeof onSnapshotChange === "function") {
      onSnapshotChange(ruleSnapshot);
    }
    // Only on ruleSnapshot identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleSnapshot]);

  // If parent has no results yet, seed from defaults
  const activeResults = ruleResults && ruleResults.length > 0 ? ruleResults : defaultResults;

  const toggleSatisfied = (ruleId) => {
    const next = activeResults.map((r) =>
      r.ruleId === ruleId ? { ...r, satisfied: !r.satisfied } : r
    );
    onResultsChange(next);
  };

  const setNotes = (ruleId, notes) => {
    const next = activeResults.map((r) =>
      r.ruleId === ruleId ? { ...r, notes } : r
    );
    onResultsChange(next);
  };

  const stats = confluenceStats(activeResults);

  const groups = dir === "Long" ? ruleSet.longGroups : ruleSet.shortGroups;
  const hasRules = groups?.some((g) => g.rules.length > 0);

  const handleBuilderSaved = (saved) => {
    setRuleSet(saved);
  };

  return (
    <>
      <Card variant="secondary" className="p-2">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Entry Checklist
            </h3>
            {stats.total > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                stats.pct === 100
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : stats.pct >= 50
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                  : "border-rose-400/30 bg-rose-400/10 text-rose-400"
              }`}>
                {stats.satisfied}/{stats.total} ({stats.pct}%)
              </span>
            )}
            <span className="text-[10px] text-slate-400 ml-1">
              {dir}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowBuilder(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 transition"
            title="Edit entry rules for this TS"
          >
            <Settings className="w-3.5 h-3.5 text-slate-200" />
            <span className="text-[11px] text-slate-200">Rules</span>
          </button>
        </div>

        {!hasRules ? (
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-[11px] text-slate-400">
              No entry rules defined for {dir} trades.
              Click Rules to add conditions for this Trading System.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {groups.map((group, gi) => (
              <div key={group.id} className="flex flex-col gap-1.5">
                {/* Group label */}
                {(groups.length > 1 || group.operator === "OR") && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded-full border text-[9px] ${
                      group.operator === "AND"
                        ? "border-emerald-400/20 text-emerald-400/60"
                        : "border-amber-400/20 text-amber-400/60"
                    }`}>
                      {group.operator}
                    </span>
                    G{gi + 1}
                  </div>
                )}

                {group.rules.map((rule) => {
                  const result = activeResults.find((r) => r.ruleId === rule.id);
                  const satisfied = result?.satisfied ?? false;
                  const sentence = ruleToSentence(rule);

                  return (
                    <div
                      key={rule.id}
                      className={`rounded-xl border p-2 transition ${
                        satisfied
                          ? "border-emerald-400/20 bg-emerald-400/[0.04]"
                          : "border-white/10 bg-black/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSatisfied(rule.id)}
                          className={`shrink-0 h-6 w-6 rounded-lg flex items-center justify-center transition ${
                            satisfied
                              ? "bg-emerald-400/20 border border-emerald-400/40 text-emerald-300"
                              : "bg-white/5 border border-white/10 text-slate-400"
                          }`}
                        >
                          {satisfied ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className={`text-xs leading-tight truncate ${satisfied ? "text-emerald-200" : "text-slate-200"}`} title={sentence}>
                            {sentence}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {rule.type}
                            {rule.params?.timeframe && ` · ${rule.params.timeframe}`}
                          </div>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={result?.notes || ""}
                        onChange={(e) => setNotes(rule.id, e.target.value)}
                        placeholder="notes…"
                        className="mt-1 w-full h-5 rounded-lg bg-[#0b1120] px-2 text-[10px] text-white/70 border border-white/5 focus:outline-none focus:ring-1 focus:ring-emerald-400/30"
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Card>

      {showBuilder && (
        <RuleBuilder
          strategyId={sid}
          onClose={() => setShowBuilder(false)}
          onSaved={handleBuilderSaved}
        />
      )}
    </>
  );
}
