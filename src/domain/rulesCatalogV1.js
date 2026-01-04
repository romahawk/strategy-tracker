// src/domain/rulesCatalogV1.js
// Rule Catalog v1
// ------------------------------------------------------
// Single source of truth for:
// - supported rule atoms
// - params schema
// - allowed operators
// - allowed values
// - UI field descriptors
//
// Used by:
// - Entry Builder UI
// - Validation layer
// - (later) Evaluation Engine
// ------------------------------------------------------

import {
  TIMEFRAMES_V2,
  SYMBOLS_V2,
  OPERATORS_V2,
} from "./entrySchemaV2";

/**
 * Common UI field helpers
 */
const UI = {
  timeframe: {
    type: "select",
    name: "tf",
    label: "Timeframe",
    options: TIMEFRAMES_V2,
    default: "15m",
  },
  symbol: {
    type: "select",
    name: "symbol",
    label: "Symbol",
    options: SYMBOLS_V2,
    default: "MAIN",
  },
  length200: {
    type: "number",
    name: "length",
    label: "Length",
    default: 200,
    min: 1,
  },
  lookbackBars: {
    type: "number",
    name: "lookbackBars",
    label: "Lookback bars",
    default: 20,
    min: 1,
  },
};

/**
 * Catalog object
 */
export const RULES_CATALOG_V1 = {
  // --------------------------------------------------
  // SUPERTREND
  // --------------------------------------------------
  supertrend_direction: {
    atomId: "supertrend_direction",
    label: "Supertrend Direction",
    description: "Checks Supertrend trend direction",
    outputType: "enum",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      length: {
        type: "number",
        label: "Length",
        default: 10,
        min: 1,
      },
      multiplier: {
        type: "number",
        label: "Multiplier",
        default: 3,
        min: 0.1,
        step: 0.1,
      },
    },
    operators: ["IS"],
    values: ["bull", "bear", "ranging"],
  },

  supertrend_flip_within: {
    atomId: "supertrend_flip_within",
    label: "Supertrend Flip Within",
    description: "Supertrend flipped direction within N bars",
    outputType: "boolean",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      lookbackBars: UI.lookbackBars,
    },
    operators: ["EXISTS"],
  },

  // --------------------------------------------------
  // MOVING AVERAGE (MA200)
  // --------------------------------------------------
  ma_position: {
    atomId: "ma_position",
    label: "MA Position",
    description: "Price position relative to moving average",
    outputType: "enum",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      length: UI.length200,
      source: {
        type: "select",
        label: "Source",
        options: ["close", "open", "hl2"],
        default: "close",
      },
    },
    operators: ["IS"],
    values: ["above", "below", "ranging"],
  },

  ma_slope: {
    atomId: "ma_slope",
    label: "MA Slope",
    description: "Slope direction of moving average",
    outputType: "enum",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      length: UI.length200,
      slopeLookbackBars: UI.lookbackBars,
    },
    operators: ["IS"],
    values: ["up", "down", "flat"],
  },

  // --------------------------------------------------
  // CLOUD / OVERLAY
  // --------------------------------------------------
  cloud_state: {
    atomId: "cloud_state",
    label: "Cloud State",
    description: "Cloud / overlay color or state",
    outputType: "enum",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      variant: {
        type: "select",
        label: "Variant",
        options: ["overlay", "cloud"],
        default: "overlay",
      },
    },
    operators: ["IS"],
    values: ["blue", "red", "neutral"],
  },

  cloud_retest_within: {
    atomId: "cloud_retest_within",
    label: "Cloud Retest Within",
    description: "Price retested cloud within N bars",
    outputType: "boolean",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      lookbackBars: UI.lookbackBars,
    },
    operators: ["EXISTS"],
  },

  // --------------------------------------------------
  // RSI
  // --------------------------------------------------
  rsi_threshold: {
    atomId: "rsi_threshold",
    label: "RSI Threshold",
    description: "RSI compared to a numeric threshold",
    outputType: "number",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      length: {
        type: "number",
        label: "RSI Length",
        default: 14,
        min: 1,
      },
      source: {
        type: "select",
        label: "Source",
        options: ["close"],
        default: "close",
      },
    },
    operators: ["GT", "GTE", "LT", "LTE", "BETWEEN"],
    valueConstraints: {
      min: 0,
      max: 100,
    },
  },

  // --------------------------------------------------
  // BREAK OF STRUCTURE (BoS)
  // --------------------------------------------------
  bos_within: {
    atomId: "bos_within",
    label: "Break of Structure Within",
    description: "BoS detected within N bars",
    outputType: "enum",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      swingLookback: {
        type: "number",
        label: "Swing Lookback",
        default: 20,
        min: 2,
      },
      lookbackBars: UI.lookbackBars,
    },
    operators: ["IS"],
    values: ["bull", "bear"],
  },

  // --------------------------------------------------
  // OTE (Optimal Trade Entry)
  // --------------------------------------------------
  ote_retest_within: {
    atomId: "ote_retest_within",
    label: "OTE Retest Within",
    description: "OTE zone retest detected within N bars",
    outputType: "boolean",
    params: {
      symbol: UI.symbol,
      tf: UI.timeframe,
      swingLookback: {
        type: "number",
        label: "Swing Lookback",
        default: 20,
        min: 2,
      },
      fibLow: {
        type: "number",
        label: "Fib Low",
        default: 0.62,
        min: 0,
        max: 1,
        step: 0.01,
      },
      fibHigh: {
        type: "number",
        label: "Fib High",
        default: 0.79,
        min: 0,
        max: 1,
        step: 0.01,
      },
      lookbackBars: UI.lookbackBars,
    },
    operators: ["EXISTS"],
  },
};

/**
 * Helper: list atoms for dropdowns
 */
export const RULE_ATOMS_V1 = Object.values(RULES_CATALOG_V1).map(
  ({ atomId, label, description }) => ({
    atomId,
    label,
    description,
  })
);
