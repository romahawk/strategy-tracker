// src/utils/discipline.js

const DAY_MS = 24 * 60 * 60 * 1000;

/** 🔧 DEV MODE FLAG */
export const DEV_MODE = true;

export function disciplineKey(strategyId, accountId) {
  return `discipline:strategy:${Number(strategyId || 1)}:account:${Number(
    accountId || 1
  )}`;
}

export function nowMs() {
  return Date.now();
}

export function defaultDiscipline() {
  return {
    cooldownUntil: 0,
    cooldownDisabled: false,
    violations: [], // { ts, type }
    cleanStreak: 0,
  };
}

export function loadDiscipline(strategyId, accountId) {
  try {
    const raw = localStorage.getItem(disciplineKey(strategyId, accountId));
    if (!raw) return defaultDiscipline();
    return { ...defaultDiscipline(), ...JSON.parse(raw) };
  } catch {
    return defaultDiscipline();
  }
}

export function saveDiscipline(strategyId, accountId, state) {
  localStorage.setItem(
    disciplineKey(strategyId, accountId),
    JSON.stringify(state)
  );
}

export function pruneViolationsLast24h(discipline) {
  const cutoff = nowMs() - DAY_MS;
  return {
    ...discipline,
    violations: (discipline.violations || []).filter(
      (v) => (v?.ts || 0) >= cutoff
    ),
  };
}

export function isCooldownActive(discipline) {
  if (DEV_MODE && discipline?.cooldownDisabled) return false;
  return Number(discipline?.cooldownUntil || 0) > nowMs();
}

export function cooldownRemainingMs(discipline) {
  return Math.max(0, Number(discipline?.cooldownUntil || 0) - nowMs());
}

export function formatCooldown(ms) {
  if (!ms) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function applyViolation({ discipline, type, cooldownMinutes }) {
  const d = pruneViolationsLast24h(discipline);
  return {
    ...d,
    cleanStreak: 0,
    violations: [...d.violations, { ts: nowMs(), type }],
    cooldownUntil: Math.max(
      Number(d.cooldownUntil || 0),
      nowMs() + (cooldownMinutes || 0) * 60000
    ),
  };
}

export function applyCleanTrade(discipline) {
  const d = pruneViolationsLast24h(discipline);
  return { ...d, cleanStreak: (d.cleanStreak || 0) + 1 };
}

/* ---------- violation metadata ---------- */

export function violationLabel(type) {
  return {
    OVERRIDE_COOLDOWN: "Cooldown override",
    OVERRIDE_ENTRY: "Entry override",
    OVERRIDE_SAVE: "Saved without arming",
    NO_SL: "No Stop Loss",
    MOVING_SL_WIDER: "SL widened",
    RULE_BROKEN: "Rule broken",
  }[type] || type;
}

export function violationDescription(type) {
  return {
    OVERRIDE_COOLDOWN: "Trade was armed during enforced cooldown.",
    OVERRIDE_ENTRY: "Trade was entered bypassing execution gate.",
    OVERRIDE_SAVE: "Trade saved without being armed.",
    NO_SL: "Trade entered without a stop loss.",
    MOVING_SL_WIDER: "Stop loss was moved further away from entry.",
    RULE_BROKEN: "One or more strategy rules were violated.",
  }[type] || "Discipline violation.";
}

export function lastViolation(discipline) {
  const v = discipline?.violations || [];
  return v.length ? v[v.length - 1] : null;
}

/**
 * Risk cap multiplier based on recent violations
 * - 0 violations → 1.0x
 * - 1 violation (last 24h) → 0.5x
 * - 2+ violations → 0.25x
 */
export function riskCapMultiplier(discipline) {
  const v = discipline?.violations || [];
  const count = v.length;

  if (count >= 2) return 0.25;
  if (count === 1) return 0.5;
  return 1;
}

/* ---------- DEV maintenance helpers ---------- */

export function clearCooldown(discipline) {
  return { ...discipline, cooldownUntil: 0 };
}

export function clearViolations(discipline) {
  return { ...discipline, violations: [], cleanStreak: 0 };
}

export function resetDisciplineState(discipline) {
  // preserve cooldownDisabled toggle (useful in dev)
  return {
    ...defaultDiscipline(),
    cooldownDisabled: !!discipline?.cooldownDisabled,
  };
}
