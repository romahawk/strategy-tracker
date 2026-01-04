// src/domain/entrySchemaV2.js
// Entry Rule Schema v2 (canonical contract)
// - Data shape (EntryDefinitionV2, EntryRuleV2)
// - Enums/constants
// - Helpers to create/normalize/validate
//
// This file should be the single source of truth for schema v2.
// Stores and UI must import from here (not re-define schema).

/** @type {"2.0"} */
export const ENTRY_SCHEMA_VERSION = "2.0";

/** @type {readonly string[]} */
export const TIMEFRAMES_V2 = Object.freeze(["1m", "5m", "15m", "1h", "4h", "1d"]);

/** @type {readonly string[]} */
export const SYMBOLS_V2 = Object.freeze(["MAIN", "USDT.D"]);

/** @type {readonly string[]} */
export const LOGIC_TYPES_V2 = Object.freeze(["ALL"]); // MVP: AND only

/** @type {readonly string[]} */
export const OPERATORS_V2 = Object.freeze([
  "IS",
  "GT",
  "GTE",
  "LT",
  "LTE",
  "BETWEEN",
  "EXISTS",
]);

/**
 * @returns {string} ISO timestamp
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * Generate a short-ish id without dependencies.
 * (You can swap this to crypto.randomUUID() later.)
 * @returns {string}
 */
export function makeRuleId() {
  return `rule_${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16).slice(-4)}`;
}

/**
 * @typedef {"1m"|"5m"|"15m"|"1h"|"4h"|"1d"} TimeframeV2
 * @typedef {"MAIN"|"USDT.D"} SymbolRefV2
 * @typedef {"ALL"} LogicTypeV2
 * @typedef {"IS"|"GT"|"GTE"|"LT"|"LTE"|"BETWEEN"|"EXISTS"} OperatorV2
 *
 * @typedef {{type:"NOW"} | {type:"WITHIN_BARS", lookbackBars:number}} RuleScopeV2
 *
 * @typedef {Object} EntryRuleV2
 * @property {string} id
 * @property {boolean} enabled
 * @property {string} atomId
 * @property {Object<string, any>} params
 * @property {OperatorV2} operator
 * @property {string|number|boolean=} value
 * @property {Array<string|number>=} values
 * @property {RuleScopeV2=} scope
 * @property {string=} label
 * @property {string=} createdAt
 * @property {string=} updatedAt
 *
 * @typedef {Object} EntrySideV2
 * @property {boolean} enabled
 * @property {{type: LogicTypeV2}} logic
 * @property {EntryRuleV2[]} rules
 *
 * @typedef {Object} EntryDefinitionV2
 * @property {"2.0"} schemaVersion
 * @property {string} updatedAt
 * @property {{maxRulesPerSide:8, defaultTimeframes: TimeframeV2[], defaultSymbols: SymbolRefV2[]}} settings
 * @property {EntrySideV2} long
 * @property {EntrySideV2} short
 * @property {{name?:string, createdFrom?:string, migratedFrom?:string, notes?:string}=} meta
 */

/**
 * Create an empty v2 entry definition (safe default).
 * @param {Partial<EntryDefinitionV2>=} init
 * @returns {EntryDefinitionV2}
 */
export function createEmptyEntryV2(init = {}) {
  const base = {
    schemaVersion: ENTRY_SCHEMA_VERSION,
    updatedAt: nowISO(),
    settings: {
      maxRulesPerSide: 8,
      defaultTimeframes: /** @type {any} */ (["1m", "5m", "15m", "1h", "4h"]),
      defaultSymbols: /** @type {any} */ (["MAIN", "USDT.D"]),
    },
    long: { enabled: true, logic: { type: "ALL" }, rules: [] },
    short: { enabled: true, logic: { type: "ALL" }, rules: [] },
    meta: {
      name: "Entry v2",
      createdFrom: "",
      migratedFrom: "",
      notes: "",
    },
  };

  /** @type {EntryDefinitionV2} */
  const merged = {
    ...base,
    ...init,
    settings: { ...base.settings, ...(init.settings || {}) },
    long: { ...base.long, ...(init.long || {}) },
    short: { ...base.short, ...(init.short || {}) },
    meta: { ...base.meta, ...(init.meta || {}) },
  };

  // ensure constant invariants
  merged.schemaVersion = ENTRY_SCHEMA_VERSION;
  merged.settings.maxRulesPerSide = 8;

  // normalize arrays
  if (!Array.isArray(merged.settings.defaultTimeframes)) {
    merged.settings.defaultTimeframes = /** @type {any} */ (["1m", "5m", "15m", "1h", "4h"]);
  }
  if (!Array.isArray(merged.settings.defaultSymbols)) {
    merged.settings.defaultSymbols = /** @type {any} */ (["MAIN", "USDT.D"]);
  }
  if (!Array.isArray(merged.long.rules)) merged.long.rules = [];
  if (!Array.isArray(merged.short.rules)) merged.short.rules = [];

  return merged;
}

/**
 * Normalize a side object: enforce v2 defaults, ids, timestamps, limits.
 * @param {any} side
 * @param {number} maxRules
 * @returns {EntrySideV2}
 */
export function normalizeEntrySideV2(side, maxRules = 8) {
  const base = /** @type {EntrySideV2} */ ({
    enabled: true,
    logic: { type: "ALL" },
    rules: [],
  });

  /** @type {EntrySideV2} */
  const merged = {
    ...base,
    ...(side || {}),
    logic: { ...(base.logic || {}), ...((side && side.logic) || {}) },
  };

  // enforce MVP logic
  merged.logic = { type: "ALL" };

  // rules array
  const inputRules = Array.isArray(merged.rules) ? merged.rules : [];
  merged.rules = inputRules
    .slice(0, maxRules)
    .map((r) => normalizeRuleV2(r))
    .filter(Boolean);

  return merged;
}

/**
 * Normalize a single rule.
 * @param {any} r
 * @returns {EntryRuleV2}
 */
export function normalizeRuleV2(r) {
  /** @type {EntryRuleV2} */
  const base = {
    id: makeRuleId(),
    enabled: true,
    atomId: "",
    params: {},
    operator: "IS",
    scope: { type: "NOW" },
    label: "",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  /** @type {EntryRuleV2} */
  const merged = {
    ...base,
    ...(r || {}),
    params: { ...(base.params || {}), ...(((r || {}).params) || {}) },
  };

  // id
  if (typeof merged.id !== "string" || !merged.id.trim()) merged.id = makeRuleId();

  // atomId
  if (typeof merged.atomId !== "string") merged.atomId = "";
  merged.atomId = merged.atomId.trim();

  // operator
  if (!OPERATORS_V2.includes(merged.operator)) merged.operator = "IS";

  // scope
  if (!merged.scope || typeof merged.scope !== "object") merged.scope = { type: "NOW" };
  if (merged.scope.type !== "NOW" && merged.scope.type !== "WITHIN_BARS") merged.scope = { type: "NOW" };
  if (merged.scope.type === "WITHIN_BARS") {
    const n = Number(merged.scope.lookbackBars);
    merged.scope.lookbackBars = Number.isFinite(n) && n > 0 ? n : 20;
  }

  // value/values sanity (keep flexible; catalog will validate later)
  if (merged.operator === "BETWEEN") {
    if (!Array.isArray(merged.values) || merged.values.length !== 2) {
      // best-effort: derive from value if possible
      merged.values = Array.isArray(merged.values) ? merged.values.slice(0, 2) : [];
    }
  }

  return merged;
}

/**
 * Normalize any object into EntryDefinitionV2.
 * @param {any} obj
 * @returns {EntryDefinitionV2}
 */
export function normalizeEntryDefinitionV2(obj) {
  const base = createEmptyEntryV2();

  /** @type {EntryDefinitionV2} */
  const merged = {
    ...base,
    ...(obj || {}),
    settings: { ...base.settings, ...(((obj || {}).settings) || {}) },
    meta: { ...(base.meta || {}), ...(((obj || {}).meta) || {}) },
  };

  merged.schemaVersion = ENTRY_SCHEMA_VERSION;
  merged.settings.maxRulesPerSide = 8;

  // normalize settings arrays
  if (!Array.isArray(merged.settings.defaultTimeframes)) merged.settings.defaultTimeframes = base.settings.defaultTimeframes;
  if (!Array.isArray(merged.settings.defaultSymbols)) merged.settings.defaultSymbols = base.settings.defaultSymbols;

  // normalize sides with limit
  merged.long = normalizeEntrySideV2((obj || {}).long, 8);
  merged.short = normalizeEntrySideV2((obj || {}).short, 8);

  merged.updatedAt = typeof merged.updatedAt === "string" ? merged.updatedAt : nowISO();

  return merged;
}

/**
 * Lightweight validation (schema-level only).
 * Does NOT validate params/operator/value compatibility with the rule catalog.
 * (Catalog validation is the next card.)
 *
 * @param {any} entry
 * @returns {{ok:boolean, errors:string[]}}
 */
export function validateEntryDefinitionV2(entry) {
  const errors = [];

  if (!entry || typeof entry !== "object") {
    return { ok: false, errors: ["EntryDefinition is not an object."] };
  }
  if (entry.schemaVersion !== ENTRY_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be "${ENTRY_SCHEMA_VERSION}".`);
  }

  if (!entry.settings || typeof entry.settings !== "object") {
    errors.push("settings must exist.");
  } else {
    if (entry.settings.maxRulesPerSide !== 8) errors.push("settings.maxRulesPerSide must be 8 (MVP invariant).");
    if (!Array.isArray(entry.settings.defaultTimeframes)) errors.push("settings.defaultTimeframes must be an array.");
    if (!Array.isArray(entry.settings.defaultSymbols)) errors.push("settings.defaultSymbols must be an array.");
  }

  for (const sideName of ["long", "short"]) {
    const side = entry[sideName];
    if (!side || typeof side !== "object") {
      errors.push(`${sideName} must exist.`);
      continue;
    }
    if (!side.logic || typeof side.logic !== "object" || side.logic.type !== "ALL") {
      errors.push(`${sideName}.logic.type must be "ALL" (MVP).`);
    }
    if (!Array.isArray(side.rules)) errors.push(`${sideName}.rules must be an array.`);
    if (Array.isArray(side.rules) && side.rules.length > 8) errors.push(`${sideName}.rules must be <= 8.`);
    if (Array.isArray(side.rules)) {
      side.rules.forEach((r, idx) => {
        if (!r || typeof r !== "object") errors.push(`${sideName}.rules[${idx}] is not an object.`);
        if (!r.id || typeof r.id !== "string") errors.push(`${sideName}.rules[${idx}].id is required.`);
        if (!r.atomId || typeof r.atomId !== "string") errors.push(`${sideName}.rules[${idx}].atomId is required.`);
        if (!OPERATORS_V2.includes(r.operator)) errors.push(`${sideName}.rules[${idx}].operator is invalid.`);
        if (!r.params || typeof r.params !== "object") errors.push(`${sideName}.rules[${idx}].params must be object.`);
      });
    }
  }

  return { ok: errors.length === 0, errors };
}
