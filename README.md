# 📊 AlphaRhythm

**Trading Strategy Execution & Analytics App**

AlphaRhythm is a lightweight (but structured) app for **manual trade execution logging** and **performance review**.
The core idea: *treat trading like an execution system* — consistent inputs → clean data → actionable analytics.

---

## 🕒 Current dev stage (timestamp)

**Last updated:** 2025-12-17

**Stage:** Functional MVP ✅ (extensible architecture)

What’s already working:

- Multi-tab workflow (**Backtest / Live**) with shared trade model
- Trade logging + edit/delete
- Risk engine calculations (PnL pipeline, SL/TP handling, partial TP logic)
- **Equity curve** visualization connected to trades
- **Weekly results** view (summary per week)
- Deposit % and risk % selection feeding analytics

---

## ✅ Core features

- Log every trade with:
  - Strategy / confluence context (e.g., Supertrend, MA200, USDT.D, Overlay)
  - Entry, SL, TP1–TP3
  - Direction, risk %, leverage, result (incl. open trades)
- Automatic calculations:
  - SL % / SL $, TP % / TP $
  - Commission + risk exposure
  - Realized PnL + equity evolution
- Review layer:
  - Filters by strategy / direction / result
  - Weekly aggregation
  - Equity curve

---

## 📦 Tech stack

- React (Vite)
- Tailwind CSS
- JavaScript calculation layer
- Local persistence (MVP): localStorage
- GitHub Desktop + VS Code

---

## 🧭 Project workflow (source of truth = Trello board)

We develop strictly via the board (execution-only, no life-level planning):

**Lists**
- 🗃 Backlog
- ✅ Ready
- 🚧 In Progress (**WIP limit: 3**)
- 👀 Review / Waiting
- 🏁 Done

**Rules**
- Only pull into **In Progress** from **Ready**
- Keep **In Progress ≤ 3** cards (finish → then pull)
- Anything unclear goes to **Review / Waiting** (blocked / needs input)
- “Done” means shipped/merged and not pending cleanup

---

## 🛠️ Local setup

```bash
npm install
npm run dev
```

---

## 🧱 Next development direction (high-level)

- Data persistence upgrade (e.g., DB-backed history)
- Strategy-level analytics dashboards
- Export/reporting (CSV/PDF)
- UX polish + mobile responsiveness

---

## 📌 Positioning 

This repo is intentionally structured as a **Tech PM / Full-Stack case study**:

- problem framing → scope control → iterative delivery
- clean execution workflow (Kanban + WIP)
- real product constraints (data quality first, analytics second)
