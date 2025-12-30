// src/storage/accountStore.js
// Accounts CRUD + defaults per strategy (localStorage MVP)
//
// Storage key:
// - strategy:{strategyId}:accounts  -> [{ id, name, createdAt?, updatedAt? }, ...]
//
// Notes:
// - Keeps numeric IDs for compatibility with current routing
// - Guarantees at least Account 1 exists via ensureDefaults()

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

const keyAccounts = (strategyId) => `strategy:${Number(strategyId)}:accounts`;

function normalizeAccount(a, fallbackId = 1) {
  const id = Number(a?.id ?? fallbackId);
  return {
    id,
    name: (a?.name || `Account ${id}`).toString(),
    createdAt: typeof a?.createdAt === "string" ? a.createdAt : nowISO(),
    updatedAt: typeof a?.updatedAt === "string" ? a.updatedAt : nowISO(),
  };
}

export const accountStore = {
  ensureDefaults(strategyId) {
    const sid = Number(strategyId);
    const k = keyAccounts(sid);

    const parsed = safeParseJSON(localStorage.getItem(k));
    if (Array.isArray(parsed) && parsed.length) {
      const normalized = parsed.map((a) => normalizeAccount(a)).sort((a, b) => a.id - b.id);
      localStorage.setItem(k, JSON.stringify(normalized));
      return normalized;
    }

    const def = [normalizeAccount({ id: 1, name: "Account 1" })];
    localStorage.setItem(k, JSON.stringify(def));
    return def;
  },

  list(strategyId) {
    return this.ensureDefaults(strategyId);
  },

  getFirstAccountId(strategyId) {
    const list = this.ensureDefaults(strategyId);
    const first = list[0];
    return Number(first?.id) || 1;
  },

  exists(strategyId, accountId) {
    const sid = Number(strategyId);
    const aid = Number(accountId);
    if (!Number.isFinite(sid) || !Number.isFinite(aid)) return false;
    const list = this.ensureDefaults(sid);
    return list.some((a) => Number(a.id) === aid);
  },
};
