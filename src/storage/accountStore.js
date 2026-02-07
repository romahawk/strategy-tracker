// src/storage/accountStore.js
// Accounts CRUD + defaults per strategy (localStorage MVP)
//
// Storage key:
// - strategy:{strategyId}:accounts  -> [{ id, name, accountType, venue, broker, baseCurrency, status, createdAt, updatedAt }, ...]
//
// Notes:
// - Keeps numeric IDs for compatibility with current routing
// - Guarantees at least one account exists via ensureDefaults()

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
  const isFunded = a?.accountType === "funded";

  return {
    id,
    name: (a?.name || `Account ${id}`).toString(),

    // account split foundation — enforce type→venue→currency invariants
    accountType: isFunded ? "funded" : "personal",
    venue: isFunded ? "prop" : (["CEX", "DEX"].includes(a?.venue) ? a.venue : "CEX"),
    broker: (a?.broker || "").toString(),
    baseCurrency: isFunded ? "USD" : (a?.baseCurrency === "USD" ? "USD" : "USDT"),
    status: a?.status === "archived" ? "archived" : "active",

    createdAt: typeof a?.createdAt === "string" ? a.createdAt : nowISO(),
    updatedAt: typeof a?.updatedAt === "string" ? a.updatedAt : nowISO(),
  };
}

function readList(strategyId) {
  const sid = Number(strategyId);
  const k = keyAccounts(sid);
  const parsed = safeParseJSON(localStorage.getItem(k));
  if (!Array.isArray(parsed)) return null;

  const normalized = parsed
    .map((a) => normalizeAccount(a))
    .sort((a, b) => a.id - b.id);

  return normalized.length ? normalized : null;
}

function writeList(strategyId, list) {
  const sid = Number(strategyId);
  const k = keyAccounts(sid);
  localStorage.setItem(k, JSON.stringify(list));
}

export const accountStore = {
  ensureDefaults(strategyId) {
    const existing = readList(strategyId);
    if (existing) {
      writeList(strategyId, existing);
      return existing;
    }

    // sensible defaults: personal crypto + funded FTMO
    const def = [
      normalizeAccount({
        id: 1,
        name: "Personal (Crypto)",
        accountType: "personal",
        venue: "CEX",
        broker: "CEX",
        baseCurrency: "USDT",
        status: "active",
      }),
      normalizeAccount({
        id: 2,
        name: "FTMO (Funded)",
        accountType: "funded",
        venue: "prop",
        broker: "FTMO",
        baseCurrency: "USD",
        status: "active",
      }),
    ];

    writeList(strategyId, def);
    return def;
  },

  list(strategyId) {
    return this.ensureDefaults(strategyId);
  },

  getFirstAccountId(strategyId) {
    const list = this.ensureDefaults(strategyId);
    return Number(list?.[0]?.id) || 1;
  },

  exists(strategyId, accountId) {
    const sid = Number(strategyId);
    const aid = Number(accountId);
    if (!Number.isFinite(sid) || !Number.isFinite(aid)) return false;
    const list = this.ensureDefaults(sid);
    return list.some((a) => Number(a.id) === aid);
  },

  create(strategyId, payload) {
    const sid = Number(strategyId);
    const list = this.ensureDefaults(sid);

    const nextId = list.length ? Math.max(...list.map((a) => a.id)) + 1 : 1;

    const created = normalizeAccount(
      {
        ...payload,
        id: nextId,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
      nextId
    );

    const next = [...list, created].sort((a, b) => a.id - b.id);
    writeList(sid, next);
    return { list: next, created };
  },

  update(strategyId, accountId, patch) {
    const sid = Number(strategyId);
    const aid = Number(accountId);
    const list = this.ensureDefaults(sid);

    const next = list.map((a) => {
      if (Number(a.id) !== aid) return a;
      return normalizeAccount(
        {
          ...a,
          ...patch,
          id: a.id,
          updatedAt: nowISO(),
        },
        a.id
      );
    });

    writeList(sid, next);
    return next;
  },

  remove(strategyId, accountId) {
    const sid = Number(strategyId);
    const aid = Number(accountId);
    const list = this.ensureDefaults(sid);

    if (list.length <= 1) return list; // cannot delete last account

    const next = list.filter((a) => Number(a.id) !== aid);
    writeList(sid, next);
    return next;
  },
};
