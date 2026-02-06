// Registry of all possible entry-condition templates.
// These define HOW a condition renders and which form field it binds to.

export const CONDITION_TEMPLATES = {
  stTrend15m: {
    key: "stTrend15m",
    label: "15m ST",
    formField: "stTrend",
    options: [
      ["", "— Select —"],
      ["bull", "Bull"],
      ["bear", "Bear"],
    ],
    violationKey: "st15mViolated",
  },

  overlay15m: {
    key: "overlay15m",
    label: "Overlay",
    formField: "overlay",
    options: [
      ["", "— Select —"],
      ["blue", "Blue"],
      ["red", "Red"],
      ["neutral", "Neutral"],
    ],
    violationKey: "overlayViolated",
  },

  ma20015m: {
    key: "ma20015m",
    label: "MA200",
    formField: "ma200",
    options: [
      ["", "— Select —"],
      ["above", "Above"],
      ["below", "Below"],
      ["ranging", "Ranging"],
    ],
    rangingValue: "ranging",
    violationKey: "ma200Violated",
  },

  usdt15m: {
    key: "usdt15m",
    label: "15m USDT.D",
    formField: "usdtTrend",
    options: [
      ["", "— Select —"],
      ["bull", "Bull"],
      ["bear", "Bear"],
      ["ranging", "Ranging"],
    ],
    rangingValue: "ranging",
    violationKey: "usdtViolated",
  },

  signal5m: {
    key: "signal5m",
    label: "5m Signal",
    formField: "buySell5m",
    options: [
      ["", "— Select —"],
      ["buy", "Buy"],
      ["sell", "Sell"],
    ],
    violationKey: "sig5mViolated",
  },

  ma2005m: {
    key: "ma2005m",
    label: "5m MA200",
    formField: "ma2005m",
    options: [
      ["", "— Select —"],
      ["above", "Above"],
      ["below", "Below"],
      ["ranging", "Ranging"],
    ],
    rangingValue: "ranging",
    violationKey: "ma2005mViolated",
  },

  // Strategy-specific
  chochBos15m: {
    key: "chochBos15m",
    label: "15m CHoCH / BoS",
    formField: "chochBos15m",
    options: [
      ["", "— Select —"],
      ["bull_choch", "Bull CHoCH"],
      ["bull_bos", "Bull BoS"],
      ["bear_choch", "Bear CHoCH"],
      ["bear_bos", "Bear BoS"],
    ],
  },

  st1m: {
    key: "st1m",
    label: "1m ST",
    formField: "st1m",
    options: [
      ["", "— Select —"],
      ["bull", "Bull"],
      ["bear", "Bear"],
    ],
  },

  ma2001m: {
    key: "ma2001m",
    label: "1m MA200",
    formField: "ma2001m",
    options: [
      ["", "— Select —"],
      ["above", "Above"],
      ["below", "Below"],
      ["ranging", "Ranging"],
    ],
    rangingValue: "ranging",
  },

  bos1m: {
    key: "bos1m",
    label: "1m BoS",
    formField: "bos1m",
    options: [
      ["", "— Select —"],
      ["bull", "Bull BoS"],
      ["bear", "Bear BoS"],
    ],
  },
};
