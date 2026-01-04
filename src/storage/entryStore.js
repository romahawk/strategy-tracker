// src/storage/entryStore.js
// Per-strategy Entry Definition store (localStorage MVP)
//
// Keys:
//   v2: strategy:{sid}:entry:v2   (builder-based, canonical)
//   v1: strategy:{sid}:entry:v1   (legacy fallback, migration source)
//
// Notes:
// - v2 stores EntryDefinitionV2 (schemaVersion "2.0")
// - We keep meta.legacyForm for backward compatibility with the current selector UI
// - ensureDefaults() migrates v1 -> v2 once, then uses v2 forward
// - IMPORTANT: we DO NOT overwrite v2 rules from legacyForm unless rules are empty.
//   This lets the future builder own rules[] without being clobbered.

import {
  nowISO,
  createEmptyEntryV2,
  normalizeEntryDefinitionV2,
} from "../domain/entrySchemaV2";

import { validateEntryDefinitionV2WithCatalog } from "../domain/ruleValidation";

function safeParseJSON(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const KEY_V2 = (sid) => `strategy:${Number(sid)}:entry:v2`;
const KEY_V1 = (sid) => `strategy:${Number(sid)}:entry:v1`;

/**
 * Presets are intentionally "UI-friendly" defaults.
 * They seed meta.legacyForm so your current selector-based UI has values.
 * (This is needed because EntryConditionsSection persists only legacy form today.)
 */
function presetLegacyForm(strategyId) {
  const sid = Number(strategyId);

  // Shared defaults for the current dropdown UI:
  const base = {
    stTrend: "bull",
    usdtTrend: "bear",
    overlay: "blue",
    ma200: "above",
  };

  if (sid === 2) {
    return {
      ...base,
      // Strategy 2 extras (text inputs)
      chochBos15m: "",
      overlay1m: "",
      bos1m: "",
      ma2001m: "",
    };
  }

  // Strategy 1 and 3 include 5m selectors in the current UI
  return {
    ...base,
    buySell5m: "buy",
    ma2005m: "above",
  };
}

/**
 * Project a minimal rules[] list from legacyForm.
 * This keeps the current UI working while we build the real Rule Builder UI.
 *
 * IMPORTANT:
 * - We only include atoms that exist in RULES_CATALOG_V1.
 * - We intentionally DO NOT include "buySell5m" until you define its atom in the catalog.
 */
function buildRulesFromLegacyForm(legacyForm = {}) {
  const rules = [];

  const pushEnumRule = (atomId, value, params = {}, label = "") => {
    if (!value) return;
    rules.push({
      id: undefined, // will be normalized to a generated id
      enabled: true,
      atomId,
      params,
      operator: "IS",
      value,
      scope: { type: "NOW" },
      label,
    });
  };

  // 15m ST (MAIN)
  pushEnumRule(
    "supertrend_direction",
    legacyForm.stTrend,
    { tf: "15m", symbol: "MAIN", length: 10, multiplier: 3 },
    "15m ST is Bull/Bear"
  );

  // 15m ST (USDT.D)
  pushEnumRule(
    "supertrend_direction",
    legacyForm.usdtTrend,
    { tf: "15m", symbol: "USDT.D", length: 10, multiplier: 3 },
    "15m USDT.D ST is Bull/Bear"
  );

  // Overlay -> cloud_state (variant overlay)
  pushEnumRule(
    "cloud_state",
    legacyForm.overlay,
    { tf: "15m", symbol: "MAIN", variant: "overlay" },
    "Overlay is Blue/Red"
  );

  // MA200 position
  pushEnumRule(
    "ma_position",
    legacyForm.ma200,
    { tf: "15m", symbol: "MAIN", length: 200, source: "close" },
    "MA200 position"
  );

  // NOTE: buySell5m / ma2005m not mapped into rules yet (unless you add catalog atoms).
  return rules.slice(0, 8);
}

/**
 * Convert a v1 rule atomId to v2 catalog atomId (if needed).
 * v1 used overlay_state, catalog v1 uses cloud_state.
 */
function mapV1AtomToV2(atomId) {
  if (atomId === "overlay_state") return "cloud_state";
  return atomId;
}

/**
 * Migrate v1 EntryDefinition -> v2 EntryDefinition (best-effort).
 * Non-destructive: keeps legacyForm if present.
 */
function migrateV1ToV2(sid, v1) {
  const legacyForm = v1?.meta?.legacyForm || presetLegacyForm(sid);

  // Try to migrate rules from v1 if they exist; otherwise rebuild from legacyForm.
  const v1LongRules = Array.isArray(v1?.long?.rules) ? v1.long.rules : null;
  const v1ShortRules = Array.isArray(v1?.short?.rules) ? v1.short.rules : null;

  const convertRule = (r) => {
    if (!r || typeof r !== "object") return null;
    const atomId = mapV1AtomToV2(r.atomId);
    if (!atomId) return null;

    // Patch params for cloud_state variant if coming from overlay_state
    const params = { ...(r.params || {}) };
    if (atomId === "cloud_state" && !params.variant) params.variant = "overlay";

    return {
      id: r.id,
      enabled: typeof r.enabled === "boolean" ? r.enabled : true,
      atomId,
      params,
      operator: r.operator || "IS",
      value: r.value,
      values: r.values,
      scope: r.scope || { type: "NOW" },
      label: r.label,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  };

  const longRulesConverted =
    v1LongRules && v1LongRules.length
      ? v1LongRules.map(convertRule).filter(Boolean).slice(0, 8)
      : buildRulesFromLegacyForm(legacyForm);

  const shortRulesConverted =
    v1ShortRules && v1ShortRules.length
      ? v1ShortRules.map(convertRule).filter(Boolean).slice(0, 8)
      : buildRulesFromLegacyForm(legacyForm);

  const v2 = createEmptyEntryV2({
    updatedAt: nowISO(),
    long: { enabled: true, logic: { type: "ALL" }, rules: longRulesConverted },
    short: { enabled: true, logic: { type: "ALL" }, rules: shortRulesConverted },
    meta: {
      name: "Entry v2",
      createdFrom: `migrated:strategy-${sid}`,
      migratedFrom: "1.0",
      notes: "",
      legacyForm, // keep UI compatibility
    },
  });

  return normalizeEntryDefinitionV2(v2);
}

/**
 * Ensure v2 entry exists for a strategy.
 * - Use v2 if present
 * - else migrate v1 -> v2
 * - else create new v2 default
 */
function ensureV2(strategyId) {
  const sid = Number(strategyId);
  const k2 = KEY_V2(sid);

  // 1) v2 exists
  const existingV2 = safeParseJSON(localStorage.getItem(k2));
  if (existingV2 && typeof existingV2 === "object") {
    const normalized = normalizeEntryDefinitionV2(existingV2);

    // Ensure legacyForm exists for current UI
    if (!normalized.meta || typeof normalized.meta !== "object") normalized.meta = {};
    if (!normalized.meta.legacyForm) normalized.meta.legacyForm = presetLegacyForm(sid);

    // IMPORTANT: only seed rules from legacyForm if rules are empty (so future builder owns rules)
    const longEmpty = !Array.isArray(normalized.long.rules) || normalized.long.rules.length === 0;
    const shortEmpty = !Array.isArray(normalized.short.rules) || normalized.short.rules.length === 0;

    if (longEmpty) normalized.long.rules = buildRulesFromLegacyForm(normalized.meta.legacyForm);
    if (shortEmpty) normalized.short.rules = buildRulesFromLegacyForm(normalized.meta.legacyForm);

    normalized.updatedAt = nowISO();

    // Save normalization fixes back (safe)
    localStorage.setItem(k2, JSON.stringify(normalized));
    return normalized;
  }

  // 2) migrate v1 if present
  const k1 = KEY_V1(sid);
  const existingV1 = safeParseJSON(localStorage.getItem(k1));
  if (existingV1 && typeof existingV1 === "object") {
    const migrated = migrateV1ToV2(sid, existingV1);
    localStorage.setItem(k2, JSON.stringify(migrated));
    return migrated;
  }

  // 3) seed fresh v2
  const legacyForm = presetLegacyForm(sid);
  const seeded = normalizeEntryDefinitionV2(
    createEmptyEntryV2({
      updatedAt: nowISO(),
      long: { enabled: true, logic: { type: "ALL" }, rules: buildRulesFromLegacyForm(legacyForm) },
      short: { enabled: true, logic: { type: "ALL" }, rules: buildRulesFromLegacyForm(legacyForm) },
      meta: {
        name: "Entry v2",
        createdFrom: `template:strategy-${sid}`,
        migratedFrom: "",
        notes: "",
        legacyForm,
      },
    })
  );

  localStorage.setItem(k2, JSON.stringify(seeded));
  return seeded;
}

export const entryStore = {
  /**
   * Ensures defaults exist and returns v2 entry definition.
   */
  ensureDefaults(strategyId) {
    return ensureV2(strategyId);
  },

  /**
   * Get current v2 entry (always returns a normalized v2 object).
   */
  get(strategyId) {
    return ensureV2(strategyId);
  },

  /**
   * Set v2 entry definition.
   *
   * IMPORTANT:
   * - We normalize v2
   * - We keep meta.legacyForm (to support current dropdown UI)
   * - We do NOT overwrite rules from legacyForm (builder will own rules[])
   *
   * Validation:
   * - We validate against catalog and still save (for now) to avoid breaking UX
   * - In the Builder UI, you’ll use validation result to block saving invalid configs.
   */
  set(strategyId, entryDefinition) {
    const sid = Number(strategyId);
    const k2 = KEY_V2(sid);

    // Load existing to preserve legacyForm if caller didn’t include it
    const current = ensureV2(sid);
    const incoming = entryDefinition && typeof entryDefinition === "object" ? entryDefinition : {};

    // Merge meta.legacyForm safely
    const merged = {
      ...incoming,
      meta: {
        ...(current.meta || {}),
        ...(incoming.meta || {}),
        legacyForm:
          (incoming.meta && incoming.meta.legacyForm) ? incoming.meta.legacyForm : current?.meta?.legacyForm,
      },
    };

    const normalized = normalizeEntryDefinitionV2(merged);
    normalized.updatedAt = nowISO();

    // If rules are empty (e.g., only legacy UI changed), seed from legacyForm
    const longEmpty = !Array.isArray(normalized.long.rules) || normalized.long.rules.length === 0;
    const shortEmpty = !Array.isArray(normalized.short.rules) || normalized.short.rules.length === 0;
    if (longEmpty) normalized.long.rules = buildRulesFromLegacyForm(normalized.meta?.legacyForm || {});
    if (shortEmpty) normalized.short.rules = buildRulesFromLegacyForm(normalized.meta?.legacyForm || {});

    // Catalog validation (config-level)
    const validation = validateEntryDefinitionV2WithCatalog(normalized);
    if (!validation.ok) {
      // Don’t throw: current UI expects saving to “just work”.
      // Builder UI later will block invalid saves using this result.
      console.warn("[entryStore] EntryDefinition v2 validation failed:", validation.errors);
    }

    localStorage.setItem(k2, JSON.stringify(normalized));
    return normalized;
  },

  /**
   * Utility: read raw v1 for debugging only.
   */
  getLegacyV1(strategyId) {
    const sid = Number(strategyId);
    const raw = safeParseJSON(localStorage.getItem(KEY_V1(sid)));
    return raw || null;
  },
};
