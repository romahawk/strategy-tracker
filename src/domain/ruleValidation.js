// src/domain/ruleValidation.js
// Validation layer for EntryDefinition v2 based on Rule Catalog v1.
//
// Responsibilities:
// - Validate a single rule against RULES_CATALOG_V1
// - Validate a whole EntryDefinitionV2 (long/short)
// - Return structured errors for UI rendering
//
// Notes:
// - This does NOT evaluate market data.
// - This is "config validation" only.

import { OPERATORS_V2 } from "./entrySchemaV2";
import { RULES_CATALOG_V1 } from "./rulesCatalogV1";

const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
const isString = (v) => typeof v === "string";
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

function pushErr(errors, path, message) {
  errors.push({ path, message });
}

function asNumberMaybe(v) {
  if (isNumber(v)) return v;
  if (isString(v) && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function validateParamBySpec(value, spec, path, errors) {
  const type = spec?.type;

  if (!type) return; // ignore unknown spec

  if (type === "select") {
    const options = Array.isArray(spec.options) ? spec.options : [];
    if (!isString(value) || !value.trim()) {
      pushErr(errors, path, "Required.");
      return;
    }
    if (options.length && !options.includes(value)) {
      pushErr(errors, path, `Invalid value "${value}". Allowed: ${options.join(", ")}`);
    }
    return;
  }

  if (type === "number") {
    const n = asNumberMaybe(value);
    if (n === null) {
      pushErr(errors, path, "Must be a number.");
      return;
    }
    if (isNumber(spec.min) && n < spec.min) {
      pushErr(errors, path, `Must be >= ${spec.min}.`);
    }
    if (isNumber(spec.max) && n > spec.max) {
      pushErr(errors, path, `Must be <= ${spec.max}.`);
    }
    return;
  }

  // Fallback: if spec.type is unknown, do nothing (future-proof).
}

/**
 * Validate rule value based on operator and catalog entry.
 */
function validateOperatorAndValue(rule, atom, basePath, errors) {
  const op = rule.operator;

  if (!OPERATORS_V2.includes(op)) {
    pushErr(errors, `${basePath}.operator`, `Invalid operator "${op}".`);
    return;
  }

  const allowedOps = Array.isArray(atom.operators) ? atom.operators : [];
  if (allowedOps.length && !allowedOps.includes(op)) {
    pushErr(
      errors,
      `${basePath}.operator`,
      `Operator "${op}" not allowed for "${atom.atomId}". Allowed: ${allowedOps.join(", ")}`
    );
    return;
  }

  // Operators:
  // - IS: enum (must be in atom.values) OR boolean-like if atom.outputType === "boolean"
  // - EXISTS: no value required
  // - GT/GTE/LT/LTE: numeric value required
  // - BETWEEN: values array length 2 numeric required

  if (op === "EXISTS") {
    // no value needed
    return;
  }

  if (op === "IS") {
    const values = Array.isArray(atom.values) ? atom.values : null;

    if (values && values.length) {
      if (!isString(rule.value) || !values.includes(rule.value)) {
        pushErr(
          errors,
          `${basePath}.value`,
          `Value must be one of: ${values.join(", ")}`
        );
      }
      return;
    }

    // If atom has no enum values defined, allow boolean/string/number (catalog can tighten later)
    if (rule.value === undefined) {
      pushErr(errors, `${basePath}.value`, "Value is required.");
    }
    return;
  }

  if (op === "BETWEEN") {
    const arr = Array.isArray(rule.values) ? rule.values : null;
    if (!arr || arr.length !== 2) {
      pushErr(errors, `${basePath}.values`, "Must be an array of 2 numbers.");
      return;
    }
    const a = asNumberMaybe(arr[0]);
    const b = asNumberMaybe(arr[1]);
    if (a === null || b === null) {
      pushErr(errors, `${basePath}.values`, "Both values must be numbers.");
      return;
    }

    // Optional numeric constraints from catalog (e.g. RSI 0..100)
    const vc = atom.valueConstraints || null;
    if (vc) {
      if (isNumber(vc.min) && (a < vc.min || b < vc.min)) {
        pushErr(errors, `${basePath}.values`, `Values must be >= ${vc.min}.`);
      }
      if (isNumber(vc.max) && (a > vc.max || b > vc.max)) {
        pushErr(errors, `${basePath}.values`, `Values must be <= ${vc.max}.`);
      }
    }

    return;
  }

  // Numeric comparisons
  if (op === "GT" || op === "GTE" || op === "LT" || op === "LTE") {
    const n = asNumberMaybe(rule.value);
    if (n === null) {
      pushErr(errors, `${basePath}.value`, "Value must be a number.");
      return;
    }
    const vc = atom.valueConstraints || null;
    if (vc) {
      if (isNumber(vc.min) && n < vc.min) pushErr(errors, `${basePath}.value`, `Must be >= ${vc.min}.`);
      if (isNumber(vc.max) && n > vc.max) pushErr(errors, `${basePath}.value`, `Must be <= ${vc.max}.`);
    }
  }
}

/**
 * Validate a single rule (EntryRuleV2) against Rule Catalog v1.
 *
 * @param {any} rule
 * @param {object=} opts
 * @param {number=} opts.index (for path)
 * @param {"long"|"short"=} opts.side (for path)
 * @returns {{ ok: boolean, errors: Array<{path:string, message:string}> }}
 */
export function validateRuleV2(rule, opts = {}) {
  const errors = [];
  const side = opts.side || "long";
  const idx = Number.isFinite(opts.index) ? opts.index : 0;
  const basePath = `${side}.rules[${idx}]`;

  if (!isObject(rule)) {
    pushErr(errors, basePath, "Rule must be an object.");
    return { ok: false, errors };
  }

  // atomId existence
  if (!isString(rule.atomId) || !rule.atomId.trim()) {
    pushErr(errors, `${basePath}.atomId`, "atomId is required.");
    return { ok: false, errors };
  }

  const atom = RULES_CATALOG_V1[rule.atomId];
  if (!atom) {
    pushErr(errors, `${basePath}.atomId`, `Unknown atomId "${rule.atomId}".`);
    return { ok: false, errors };
  }

  // enabled
  if (typeof rule.enabled !== "boolean") {
    pushErr(errors, `${basePath}.enabled`, "enabled must be boolean.");
  }

  // params
  if (!isObject(rule.params)) {
    pushErr(errors, `${basePath}.params`, "params must be an object.");
  } else {
    const specParams = atom.params || {};
    // Validate required params based on spec
    for (const [paramKey, spec] of Object.entries(specParams)) {
      const val = rule.params[paramKey];

      // For v1: treat all catalog params as required (strict but predictable).
      if (val === undefined || val === null || (isString(val) && val.trim() === "")) {
        pushErr(errors, `${basePath}.params.${paramKey}`, "Required.");
        continue;
      }

      validateParamBySpec(val, spec, `${basePath}.params.${paramKey}`, errors);
    }
  }

  // operator + value
  if (!isString(rule.operator)) {
    pushErr(errors, `${basePath}.operator`, "operator is required.");
  } else {
    validateOperatorAndValue(rule, atom, basePath, errors);
  }

  // scope is optional at this stage (we validate it later if needed)

  return { ok: errors.length === 0, errors };
}

/**
 * Validate an entire EntryDefinitionV2 against schema-level + catalog-level rules.
 *
 * @param {any} entry
 * @returns {{
 *   ok: boolean,
 *   errors: Array<{path:string, message:string}>,
 *   bySide: { long: Array<{path:string, message:string}>, short: Array<{path:string, message:string}> }
 * }}
 */
export function validateEntryDefinitionV2WithCatalog(entry) {
  const errors = [];
  const bySide = { long: [], short: [] };

  if (!isObject(entry)) {
    pushErr(errors, "entry", "EntryDefinition must be an object.");
    return { ok: false, errors, bySide };
  }

  // Basic shape expectations (light; schema file does deeper checks already)
  for (const sideName of ["long", "short"]) {
    const side = entry[sideName];
    if (!isObject(side)) {
      pushErr(errors, sideName, `${sideName} must exist.`);
      continue;
    }
    if (!Array.isArray(side.rules)) {
      pushErr(errors, `${sideName}.rules`, "rules must be an array.");
      continue;
    }

    side.rules.forEach((rule, idx) => {
      // Skip disabled rules? You can choose. For now: still validate disabled rules to keep configs clean.
      const res = validateRuleV2(rule, { side: sideName, index: idx });
      if (!res.ok) {
        bySide[sideName].push(...res.errors);
        errors.push(...res.errors);
      }
    });
  }

  return { ok: errors.length === 0, errors, bySide };
}
