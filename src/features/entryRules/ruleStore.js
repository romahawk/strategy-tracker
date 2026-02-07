// Persistence layer for Entry Rule Sets (localStorage MVP).
//
// Key: alpharhythm:entryRules:v1:ts:{tsId}
// Value: EntryRuleSet JSON

const KEY = (tsId) => `alpharhythm:entryRules:v1:ts:${tsId}`;

export function makeId(prefix = "r") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function defaultRuleSet(tsId) {
  return {
    id: `rs_${tsId}`,
    tsId: Number(tsId),
    mode: "hard_gate",
    longGroups: [
      { id: makeId("lg"), operator: "AND", rules: [] },
    ],
    shortGroups: [
      { id: makeId("sg"), operator: "AND", rules: [] },
    ],
    version: 1,
    updatedAt: Date.now(),
  };
}

export function loadRuleSet(tsId) {
  try {
    const raw = localStorage.getItem(KEY(tsId));
    if (!raw) return defaultRuleSet(tsId);
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return defaultRuleSet(tsId);
    return parsed;
  } catch {
    return defaultRuleSet(tsId);
  }
}

export function saveRuleSet(tsId, ruleSet) {
  const next = { ...ruleSet, tsId: Number(tsId), version: 1, updatedAt: Date.now() };
  localStorage.setItem(KEY(tsId), JSON.stringify(next));
  return next;
}

export function createRule(type = "indicator") {
  return {
    id: makeId("r"),
    type,
    label: "",
    params: {},
    required: true,
  };
}

export function createGroup(operator = "AND", prefix = "g") {
  return {
    id: makeId(prefix),
    operator,
    rules: [],
  };
}
