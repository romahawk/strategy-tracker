import Dexie from "dexie";

export const db = new Dexie("TradeHistoryDB");
db.version(1).stores({ trades: "++id,date" });

db.version(2).stores({
  strategies: "++id, name, createdAt",
  trades: "++id, strategyId, date, [strategyId+date]"
}).upgrade(async tx => {
  const strategies = tx.table("strategies");
  let firstId = await strategies.add({
    name: "Strategy 1",
    createdAt: new Date().toISOString()
  }).catch(async () => (await strategies.toCollection().first())?.id);

  await tx.table("trades").toCollection().modify(t => {
    if (t.strategyId == null) t.strategyId = firstId;
  });
});
