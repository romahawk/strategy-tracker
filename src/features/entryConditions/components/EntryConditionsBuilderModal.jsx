import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { loadEntryConfig, saveEntryConfig } from "../storage";
import { CONDITION_TEMPLATES } from "../templates";

export default function EntryConditionsBuilderModal({
  strategyId,
  initialConfig,
  onClose,
  onSaved,
}) {
  // Always start from the freshest source:
  // - initialConfig if provided
  // - otherwise localStorage
  const base = useMemo(() => {
    return initialConfig ?? loadEntryConfig(Number(strategyId));
  }, [initialConfig, strategyId]);

  const [draft, setDraft] = useState(() => structuredCloneSafe(base));

  const entryBlock = draft?.blocks?.find((b) => b.id === "entry");

  const toggleBlockEnabled = () => {
    setDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === "entry" ? { ...b, enabled: !b.enabled } : b
      ),
    }));
  };

  const toggleConditionEnabled = (condId) => {
    setDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== "entry") return b;
        return {
          ...b,
          conditions: (b.conditions || []).map((c) =>
            c.id === condId ? { ...c, enabled: !c.enabled } : c
          ),
        };
      }),
    }));
  };

  const setLabelOverride = (condId, nextLabel) => {
    setDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== "entry") return b;
        return {
          ...b,
          conditions: (b.conditions || []).map((c) =>
            c.id === condId ? { ...c, labelOverride: nextLabel } : c
          ),
        };
      }),
    }));
  };

  const clearLabelOverride = (condId) => {
    setLabelOverride(condId, "");
  };

  const handleSave = () => {
    // Persist to localStorage
    saveEntryConfig(Number(strategyId), draft);

    // Re-read from localStorage to guarantee UI uses saved truth
    const fresh = loadEntryConfig(Number(strategyId));

    if (typeof onSaved === "function") onSaved(fresh);
    if (typeof onClose === "function") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#020617] border border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] text-slate-400">
              TS: <span className="text-slate-300">{strategyId}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Entry Conditions Builder
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Block toggle */}
        <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
          <div>
            <div className="text-sm text-slate-200">Entry block</div>
            <div className="text-[11px] text-slate-400">
              When disabled, no entry selects are shown.
            </div>
          </div>

          <button
            type="button"
            onClick={toggleBlockEnabled}
            className={`text-xs px-2 py-1 rounded ${
              entryBlock?.enabled
                ? "bg-emerald-400/20 text-emerald-300"
                : "bg-white/5 text-slate-400"
            }`}
          >
            {entryBlock?.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Conditions list */}
        <div className="space-y-2">
          {(entryBlock?.conditions || []).map((c) => {
            const tpl = CONDITION_TEMPLATES[c.templateKey];
            if (!tpl) return null;

            return (
              <div
                key={c.id}
                className="rounded-xl border border-white/10 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-slate-200">{tpl.label}</div>
                    <div className="text-[11px] text-slate-400">
                      id: <span className="text-slate-300">{c.id}</span> • key:{" "}
                      <span className="text-slate-300">{c.templateKey}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleConditionEnabled(c.id)}
                    className={`shrink-0 text-xs px-2 py-1 rounded ${
                      c.enabled
                        ? "bg-emerald-400/20 text-emerald-300"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {c.enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                {/* NEW: label override */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">
                      Custom label (optional)
                    </span>
                    <button
                      type="button"
                      onClick={() => clearLabelOverride(c.id)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 transition"
                    >
                      Reset
                    </button>
                  </div>

                  <input
                    value={c.labelOverride ?? ""}
                    onChange={(e) => setLabelOverride(c.id, e.target.value)}
                    placeholder={tpl.label}
                    className="w-full h-8 rounded-lg bg-[#0b1120] px-3 text-sm text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-emerald-400 text-[#020617] text-sm font-semibold hover:brightness-110 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function structuredCloneSafe(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}
