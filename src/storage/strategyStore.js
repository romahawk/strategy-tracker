// src/storage/strategyStore.js
// Strategy CRUD + persistence for localStorage (MVP)
// Single source of truth: "strategies:list"
//
// Notes:
// - Keeps numeric IDs for compatibility with current routing (/strategy/:id/account/:id)
// - Migrates legacy names from "strategy:names" if present
// - On delete, cleans up known per-strategy keys (entry, trades, accounts)

const STRATEGIES_KEY = "strategies:list";
const LEGACY_NAMES_KEY = "strategy:names";

const DEFAULT_STRATEGIES = [
  { id: 1, name: "15m ST" },
  { id: 2, name: "1m BoS" },
  { id: 3, name: "Fx" },
];

function nowISO() {
  return new Date().toISOString();
}

function safeParseJSON(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isStrategyList(x) {
  return (
    Array.isArray(x) &&
    x.every(
      (s) =>
        s &&
        typeof s === "object" &&
        Number.isFinite(Number(s.id)) &&
        typeof s.name === "string"
    )
  );
}

function normalizeStrategy(s) {
  const id = Number(s.id);
  return {
    id,
    name: (s.name || `Strategy ${id}`).toString(),
    createdAt: typeof s.createdAt === "string" ? s.createdAt : nowISO(),
    updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : nowISO(),
  };
}

function readList() {
  const parsed = safeParseJSON(localStorage.getItem(STRATEGIES_KEY));
  if (!isStrategyList(parsed)) return null;
  return parsed.map(normalizeStrategy).sort((a, b) => a.id - b.id);
}

function writeList(list) {
  localStorage.setItem(STRATEGIES_KEY, JSON.stringify(list));
}

function readLegacyNamesMap() {
  const parsed = safeParseJSON(localStorage.getItem(LEGACY_NAMES_KEY));
  if (!parsed || typeof parsed !== "object") return null;
  return parsed;
}

function cleanupStrategyStorage(strategyId) {
  // Read accounts first (for trade keys), then delete
  const accounts = safeParseJSON(
    localStorage.getItem(`strategy:${strategyId}:accounts`)
  );

  const accountIds = Array.isArray(accounts)
    ? accounts.map((a) => Number(a?.id)).filter((n) => Number.isFinite(n))
    : [];

  const modes = ["live", "backtest", "history"];
  for (const aid of accountIds) {
    for (const mode of modes) {
      localStorage.removeItem(
        `strategy:${strategyId}:account:${aid}:trades:${mode}`
      );
    }
  }

  localStorage.removeItem(`strategy:${strategyId}:entry:v1`);
  localStorage.removeItem(`strategy:${strategyId}:accounts`);
}

export const strategyStore = {
  ensureDefaults() {
    const existing = readList();
    if (existing && existing.length) return existing;

    const legacyNames = readLegacyNamesMap();

    const seeded = DEFAULT_STRATEGIES.map((s) => {
      const id = s.id;
      const legacyName =
        legacyNames && legacyNames[String(id)]
          ? String(legacyNames[String(id)])
          : s.name;

      return normalizeStrategy({
        id,
        name: legacyName,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      });
    });

    // IMPORTANT: do NOT create accounts here (decouple)
    writeList(seeded);
    return seeded;
  },

  list() {
    return this.ensureDefaults();
  },

  getById(strategyId) {
    const id = Number(strategyId);
    if (!Number.isFinite(id)) return null;
    const list = this.ensureDefaults();
    return list.find((s) => s.id === id) || null;
  },

  create(name) {
    const list = this.ensureDefaults();
    const nextId = list.length ? Math.max(...list.map((s) => s.id)) + 1 : 1;

    const created = normalizeStrategy({
      id: nextId,
      name:
        typeof name === "string" && name.trim()
          ? name.trim()
          : `Strategy ${nextId}`,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    const next = [...list, created].sort((a, b) => a.id - b.id);
    writeList(next);

    // IMPORTANT: do NOT create accounts here (decouple)
    return { list: next, created };
  },

  rename(strategyId, name) {
    const id = Number(strategyId);
    const trimmed = (name || "").toString().trim();
    if (!Number.isFinite(id) || !trimmed) return this.list();

    const list = this.ensureDefaults();
    const next = list.map((s) =>
      s.id === id ? { ...s, name: trimmed, updatedAt: nowISO() } : s
    );
    writeList(next);
    return next;
  },

  remove(strategyId) {
    const id = Number(strategyId);
    if (!Number.isFinite(id)) return this.list();

    const list = this.ensureDefaults();
    if (list.length <= 1) return list;

    const next = list.filter((s) => s.id !== id);
    writeList(next);

    cleanupStrategyStorage(id);
    return next;
  },
};
