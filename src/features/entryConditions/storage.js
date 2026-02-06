import { defaultEntryConfig } from "./defaults";

const keyFor = (strategyId) =>
  `alpharhythm:entryConfig:v1:strategy:${strategyId}`;

export function loadEntryConfig(strategyId) {
  try {
    const raw = localStorage.getItem(keyFor(strategyId));
    if (!raw) {
      const cfg = defaultEntryConfig(strategyId);
      localStorage.setItem(keyFor(strategyId), JSON.stringify(cfg));
      return cfg;
    }

    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) {
      const cfg = defaultEntryConfig(strategyId);
      localStorage.setItem(keyFor(strategyId), JSON.stringify(cfg));
      return cfg;
    }

    return parsed;
  } catch {
    const cfg = defaultEntryConfig(strategyId);
    localStorage.setItem(keyFor(strategyId), JSON.stringify(cfg));
    return cfg;
  }
}

export function saveEntryConfig(strategyId, config) {
  const next = {
    ...config,
    strategyId,
    version: 1,
    updatedAt: Date.now(),
  };
  localStorage.setItem(keyFor(strategyId), JSON.stringify(next));
  return next;
}
