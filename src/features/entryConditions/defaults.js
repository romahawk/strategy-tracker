// Defines default Entry Conditions per Trading System (TS)

export function defaultEntryConfig(strategyId) {
  const base = {
    version: 1,
    strategyId,
    updatedAt: Date.now(),
    blocks: [
      {
        id: "entry",
        title: "Entry Conditions",
        enabled: true,
        conditions: [],
      },
      {
        id: "extras",
        title: "Extra Confluences",
        enabled: false,
        conditions: [],
      },
    ],
  };

  const entry = base.blocks.find((b) => b.id === "entry");

  if (strategyId === 1) {
    entry.conditions = [
      { id: "c1", enabled: true, templateKey: "stTrend15m" },
      { id: "c2", enabled: true, templateKey: "overlay15m" },
      { id: "c3", enabled: true, templateKey: "ma20015m" },
      { id: "c4", enabled: true, templateKey: "usdt15m" },
      { id: "c5", enabled: true, templateKey: "signal5m" },
      { id: "c6", enabled: true, templateKey: "ma2005m" },
    ];
  }

  if (strategyId === 2) {
    entry.conditions = [
      { id: "c1", enabled: true, templateKey: "overlay15m" },
      { id: "c2", enabled: true, templateKey: "ma20015m" },
      { id: "c3", enabled: true, templateKey: "usdt15m" },
      { id: "c4", enabled: true, templateKey: "chochBos15m" },
      { id: "c5", enabled: true, templateKey: "st1m" },
      { id: "c6", enabled: true, templateKey: "ma2001m" },
    ];
  }

  if (strategyId === 3) {
    entry.conditions = [
      { id: "c1", enabled: true, templateKey: "overlay15m" },
      { id: "c2", enabled: true, templateKey: "ma20015m" },
      { id: "c3", enabled: true, templateKey: "usdt15m" },
      { id: "c4", enabled: true, templateKey: "signal5m" },
      { id: "c5", enabled: true, templateKey: "ma2005m" },
    ];
  }

  if (strategyId === 4) {
    entry.conditions = [
      { id: "c1", enabled: true, templateKey: "overlay15m" },
      { id: "c2", enabled: true, templateKey: "ma20015m" },
      { id: "c3", enabled: true, templateKey: "usdt15m" },
      { id: "c4", enabled: true, templateKey: "signal5m" },
      { id: "c5", enabled: true, templateKey: "ma2005m" },
      { id: "c6", enabled: true, templateKey: "bos1m" },
    ];
  }

  return base;
}
