// Rule type definitions + field schemas for the Entry Rule Builder.

export const RULE_TYPES = {
  indicator: {
    label: "Indicator",
    fields: [
      {
        key: "indicator",
        label: "Indicator",
        type: "select",
        options: [
          "MA200", "MA50", "EMA21", "EMA50", "RSI",
          "Supertrend", "VWAP", "MACD", "Stochastic",
        ],
      },
      {
        key: "timeframe",
        label: "Timeframe",
        type: "select",
        options: ["1m", "5m", "15m", "1h", "4h", "1D"],
      },
      {
        key: "comparator",
        label: "State",
        type: "select",
        options: ["above", "below", "bullish", "bearish", "crossing up", "crossing down"],
      },
      { key: "value", label: "Value", type: "text", placeholder: "e.g. 200, 50" },
    ],
  },

  price_action: {
    label: "Price / Structure",
    fields: [
      {
        key: "pattern",
        label: "Pattern",
        type: "select",
        options: [
          "Break of Structure", "CHoCH", "Retest zone",
          "Liquidity sweep", "OTE / Fib retest",
          "Support bounce", "Resistance rejection",
          "Fair Value Gap", "Order Block",
        ],
      },
      {
        key: "timeframe",
        label: "Timeframe",
        type: "select",
        options: ["1m", "5m", "15m", "1h", "4h", "1D"],
      },
      {
        key: "comparator",
        label: "Direction",
        type: "select",
        options: ["bullish", "bearish", "neutral"],
      },
    ],
  },

  context: {
    label: "Market Regime / Filter",
    fields: [
      {
        key: "factor",
        label: "Factor",
        type: "select",
        options: [
          "HTF Bias", "Trend/Range", "USDT.D", "DXY", "BTC.D",
          "Session", "News risk", "Overlay color", "Cloud color",
        ],
      },
      {
        key: "comparator",
        label: "State",
        type: "select",
        options: [
          "bullish", "bearish", "ranging", "trending",
          "blue", "red", "neutral", "high", "low", "none",
        ],
      },
      { key: "value", label: "Detail", type: "text", placeholder: "optional note" },
    ],
  },

  custom: {
    label: "Custom",
    fields: [
      { key: "description", label: "Description", type: "text", placeholder: "Describe the condition" },
    ],
  },
};

export const RULE_TYPE_LIST = Object.entries(RULE_TYPES).map(([value, t]) => ({
  value,
  label: t.label,
}));
