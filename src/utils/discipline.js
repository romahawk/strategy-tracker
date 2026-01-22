// src/utils/discipline.js

const DAY_MS = 24 * 60 * 60 * 1000;

export function disciplineKey(strategyId, accountId) {
  return `discipline:strategy:${Number(strategyId || 1)}:account:${Number(
    accountId || 1
  )}`;
}

export function nowMs() {
  return Date.now();
}

export function loadDiscipline(strategyId, accountId) {
  const key = disciplineKey(strategyId, accountId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultDiscipline();
    const parsed = JSON.parse(raw);
    return { ...defaultDiscipline(), ...parsed };
  } catch {
    return defaultDiscipline();
  }
}

export function saveDiscipline(strategyId, accountId, state) {
  const key = disciplineKey(strategyId, accountId);
  localStorage.setItem(key, JSON.stringify(state));
}

export function defaultDiscipline() {
  return {
    cooldownUntil: 0,
    violations: [], // { ts, type }
    cleanStreak: 0,
  };
}

export function pruneViolationsLast24h(discipline) {
  const cutoff = nowMs() - DAY_MS;
  const v = Array.isArray(discipline.violations) ? discipline.violations : [];
  return {
    ...discipline,
    violations: v.filter((x) => (x?.ts || 0) >= cutoff),
  };
}

export function countViolationsLast24h(discipline) {
  const d = pruneViolationsLast24h(discipline);
  return d.violations.length;
}

export function riskCapMultiplier(discipline) {
  const n = countViolationsLast24h(discipline);
  if (n >= 2) return 0.25;
  if (n === 1) return 0.5;
  return 1;
}

export function isCooldownActive(discipline) {
  return Number(discipline?.cooldownUntil || 0) > nowMs();
}

export function cooldownRemainingMs(discipline) {
  const until = Number(discipline?.cooldownUntil || 0);
  return Math.max(0, until - nowMs());
}

export function formatCooldown(ms) {
  if (!ms) return "0m";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function applyViolation({
  discipline,
  type,
  cooldownMinutes,
}) {
  const d0 = pruneViolationsLast24h(discipline);
  const v = Array.isArray(d0.violations) ? d0.violations : [];
  const next = {
    ...d0,
    cleanStreak: 0,
    violations: [...v, { ts: nowMs(), type }],
    cooldownUntil: Math.max(
      Number(d0.cooldownUntil || 0),
      nowMs() + Math.max(0, Number(cooldownMinutes || 0)) * 60000
    ),
  };
  return next;
}

export function applyCleanTrade(discipline) {
  const d0 = pruneViolationsLast24h(discipline);
  return {
    ...d0,
    cleanStreak: Number(d0.cleanStreak || 0) + 1,
  };
}
