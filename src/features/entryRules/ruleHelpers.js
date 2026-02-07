// Helpers for rendering rule labels and building trade-time snapshots.

/**
 * Converts a rule into a human-readable sentence.
 */
export function ruleToSentence(rule) {
  if (rule.label) return rule.label;

  const p = rule.params || {};

  switch (rule.type) {
    case "indicator":
      return [p.indicator, p.comparator, p.value, p.timeframe && `on ${p.timeframe}`]
        .filter(Boolean)
        .join(" ");

    case "price_action":
      return [p.pattern, p.comparator && `(${p.comparator})`, p.timeframe && `on ${p.timeframe}`]
        .filter(Boolean)
        .join(" ");

    case "context":
      return [p.factor, p.comparator, p.value].filter(Boolean).join(": ");

    case "custom":
      return p.description || "Custom condition";

    default:
      return "Unknown condition";
  }
}

/**
 * Snapshot the active rules for a direction at trade time.
 * Returns { ruleSnapshot, ruleResults } to persist on the trade.
 */
export function snapshotRulesForTrade(ruleSet, direction, existingResults = []) {
  const groups = direction === "Long" ? ruleSet.longGroups : ruleSet.shortGroups;

  // Flatten all rules with their group context
  const snapshot = [];
  const results = [];

  for (const group of (groups || [])) {
    for (const rule of (group.rules || [])) {
      const sentence = ruleToSentence(rule);
      snapshot.push({
        ruleId: rule.id,
        groupId: group.id,
        groupOperator: group.operator,
        type: rule.type,
        label: sentence,
        params: { ...rule.params },
        required: rule.required,
      });

      // Preserve existing result if user already toggled it
      const existing = existingResults.find((r) => r.ruleId === rule.id);
      results.push({
        ruleId: rule.id,
        label: sentence,
        satisfied: existing?.satisfied ?? false,
        notes: existing?.notes ?? "",
      });
    }
  }

  return { ruleSnapshot: snapshot, ruleResults: results };
}

/**
 * Compute confluence stats from rule results.
 */
export function confluenceStats(ruleResults) {
  if (!ruleResults || ruleResults.length === 0) return { total: 0, satisfied: 0, pct: 0 };
  const satisfied = ruleResults.filter((r) => r.satisfied).length;
  return {
    total: ruleResults.length,
    satisfied,
    pct: Math.round((satisfied / ruleResults.length) * 100),
  };
}
