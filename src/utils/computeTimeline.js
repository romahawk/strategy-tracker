// src/utils/computeTimeline.js
/**
 * Deterministic equity chain computation (retro-safe).
 *
 * Core invariant (for chronological trades):
 *  equityBefore[i] === equityAfter[i-1]
 *
 * IMPORTANT:
 * - By default, this function can treat `deposit` / `nextDeposit` as cashflow events.
 * - For "always continuous" equity chain, call it with:
 *    treatDepositAsCashflow: false,
 *    treatNextDepositAsCashflow: false
 *   and provide a single startingEquity.
 */

function toNum(v) {
  if (v === null || v === undefined || v === "") return 0;
  const s = typeof v === "string" ? v.replace(",", ".").trim() : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function getFirst(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function tradeTimestamp(tr) {
  // Combined datetime field (optional)
  const dt = getFirst(tr, ["datetime", "dateTime", "timestamp", "ts"]);
  if (dt) {
    const ms = typeof dt === "number" ? dt : Date.parse(dt);
    if (Number.isFinite(ms)) return ms;
  }

  const date = getFirst(tr, ["date", "tradeDate", "entryDate", "openDate"]);
  const time = getFirst(tr, ["time", "tradeTime", "entryTime", "openTime"]);

  if (!date) return Number.MAX_SAFE_INTEGER;

  const d = String(date).trim();
  const t = time ? String(time).trim() : "00:00";

  const ms = Date.parse(`${d}T${t}:00`);
  if (Number.isFinite(ms)) return ms;

  const ms2 = Date.parse(d);
  if (Number.isFinite(ms2)) return ms2;

  return Number.MAX_SAFE_INTEGER;
}

function tradeId(tr, idx) {
  return (
    getFirst(tr, ["id", "_id", "tradeId", "key", "uuid"]) ??
    `idx:${idx}`
  );
}

/**
 * @param {Array<object>} trades
 * @param {{
 *   startingEquity?: number,
 *   treatDepositAsCashflow?: boolean,
 *   treatNextDepositAsCashflow?: boolean
 * }} opts
 *
 * @returns {{
 *   enriched: Array<object>,
 *   events: Array<object>,
 *   endingEquity: number,
 *   cumPnL: number
 * }}
 */
export function computeTimeline(trades, opts = {}) {
  const {
    startingEquity = 0,
    treatDepositAsCashflow = true,
    treatNextDepositAsCashflow = true,
  } = opts;

  const raw = Array.isArray(trades) ? trades : [];
  const events = [];

  raw.forEach((tr, idx) => {
    const id = tradeId(tr, idx);
    const ts = tradeTimestamp(tr);

    const createdAtRaw = getFirst(tr, ["createdAt", "created_at", "updatedAt", "updated_at"]);
    const createdAt =
      typeof createdAtRaw === "number"
        ? createdAtRaw
        : createdAtRaw
          ? Date.parse(createdAtRaw)
          : 0;

    const depositField = toNum(getFirst(tr, ["deposit", "cashflow", "cashflowBefore"]));
    const cashflowBefore = treatDepositAsCashflow ? depositField : 0;

    const pnl = toNum(getFirst(tr, ["pnl", "profit", "pnlUsd", "pnlUSDT"]));
    const commission = toNum(getFirst(tr, ["commission", "fees", "fee"]));
    const netPnl = pnl - commission;

    const nextDepositField = toNum(getFirst(tr, ["nextDeposit", "cashflowAfter"]));
    const cashflowAfter = treatNextDepositAsCashflow ? nextDepositField : 0;

    if (cashflowBefore !== 0) {
      events.push({
        ts,
        order: 0,
        createdAt,
        type: "cashflow_before",
        tradeId: id,
        amount: cashflowBefore,
      });
    }

    // ✅ ALWAYS add a net_pnl event (even if 0) so we can snapshot equityBefore/After
    events.push({
      ts,
      order: 1,
      createdAt,
      type: "net_pnl",
      tradeId: id,
      amount: netPnl, // can be 0
    });

    if (cashflowAfter !== 0) {
      events.push({
        ts,
        order: 2,
        createdAt,
        type: "cashflow_after",
        tradeId: id,
        amount: cashflowAfter,
      });
    }
  });

  events.sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    if (a.order !== b.order) return a.order - b.order;
    if ((a.createdAt || 0) !== (b.createdAt || 0)) return (a.createdAt || 0) - (b.createdAt || 0);
    return String(a.tradeId).localeCompare(String(b.tradeId));
  });

  let equity = toNum(startingEquity);
  let cumPnL = 0;

  const snap = new Map(); // tradeId -> snapshots

  for (const e of events) {
    if (e.type === "net_pnl") {
      if (!snap.has(e.tradeId)) snap.set(e.tradeId, {});

      // equity BEFORE trade result (after any cashflow_before)
      snap.get(e.tradeId).equityBefore = equity;

      // apply net pnl
      equity += e.amount;
      cumPnL += e.amount;

      // equity AFTER trade result (before any cashflow_after)
      snap.get(e.tradeId).equityAfter = equity;
      snap.get(e.tradeId).cumPnL = cumPnL;
      snap.get(e.tradeId).netPnl = e.amount;
    } else {
      equity += e.amount;
    }
  }

  const enriched = raw.map((tr, idx) => {
    const id = tradeId(tr, idx);
    const s = snap.get(id) || {};

    // keep original id if present
    const actualId =
      getFirst(tr, ["id", "_id", "tradeId", "key", "uuid"]) ?? id;

    // convenience: compute netPnl even if not present
    const pnl = toNum(getFirst(tr, ["pnl", "profit", "pnlUsd", "pnlUSDT"]));
    const commission = toNum(getFirst(tr, ["commission", "fees", "fee"]));
    const net = pnl - commission;

    return {
      ...tr,
      id: actualId,
      netPnl: Number.isFinite(s.netPnl) ? s.netPnl : net,
      equityBefore: Number.isFinite(s.equityBefore) ? s.equityBefore : null,
      equityAfter: Number.isFinite(s.equityAfter) ? s.equityAfter : null,
      cumPnL: Number.isFinite(s.cumPnL) ? s.cumPnL : null,
    };
  });

  return {
    enriched,
    events,
    endingEquity: equity,
    cumPnL,
  };
}

export default computeTimeline;
