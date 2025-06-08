# 📈 Strategy Execution Tracker

A React-based trading log app that helps traders manually track and analyze the performance of their strategies with full context, precision, and clarity.

## ✅ Features

- 🎯 Log every trade with:
  - Strategy context (Supertrend, MA200, USDT.D overlay, etc.)
  - Entry, SL, TP1–TP3
  - Direction, risk %, leverage, result
- 💰 Calculates:
  - SL %, SL $, TP % and $
  - Risk exposure
  - Commission
  - Realized PnL and simulated next deposit
- 🧠 Built-in logic for:
  - Win/loss handling
  - SL-only trades
  - Partial TP exits (2/3 hit)
- 💡 Intuitive layout using Tailwind CSS

## 📦 Tech Stack

- React (Vite)
- Tailwind CSS
- Vanilla JS for calculations
- GitHub Desktop + VS Code for version control

## 🚀 Planned (Sprint 2+)

- [ ] Save trades to localStorage / Firebase
- [ ] Add filters, charts, and export options
- [ ] Mobile responsiveness
- [ ] Strategy-based analytics

---

## 🛠️ Setup

```bash
npm install
npm run dev
