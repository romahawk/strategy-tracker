import { loadEntryConfig } from "./storage";
import { CONDITION_TEMPLATES } from "./templates";

// Used by TradeForm when saving trades
export function buildEntryConditionsFromConfig(form, strategyId) {
  const cfg = loadEntryConfig(strategyId);
  const entryBlock = cfg.blocks.find((b) => b.id === "entry");

  if (!entryBlock?.enabled) return [];

  return entryBlock.conditions
    .filter((c) => c.enabled)
    .map((c) => CONDITION_TEMPLATES[c.templateKey])
    .filter(Boolean)
    .map((tpl) => {
      const raw = form?.[tpl.formField];
      if (raw == null || raw === "") return null;

      return {
        key: tpl.label,
        ok: String(raw).toLowerCase() !== "no",
        value: String(raw),
      };
    })
    .filter(Boolean);
}
