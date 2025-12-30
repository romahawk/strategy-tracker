# Strategy Engine – Architecture Baseline (MVP)

## Purpose
This document defines the **architecture baseline** for implementing flexible, user-defined trading strategies in AlphaRhythm.

The goal is to:
- Make **strategies first-class entities**
- Decouple strategy logic from UI
- Enable **per-strategy entry conditions**
- Prepare the system for future rule evaluation, backtesting, and live execution

This is an architectural contract. All further development must follow it.

---

## 1. Architectural Layers

### 1. Domain Layer (Data Model)
Pure data structures that describe *what exists* in the system.
- No persistence logic
- No UI logic
- No indicator computation

Entities:
- Strategy
- Account
- EntryDefinition
- EntryBlock
- Rule
- Trade

---

### 2. Storage Layer (Single Source of Truth)
A dedicated abstraction responsible for **all persistence**.

Responsibilities:
- Read/write data (localStorage in MVP)
- Enforce key structure
- Provide CRUD APIs
- Initialize defaults and migrations

**Rule:**  
UI components must never access `localStorage` directly.

---

### 3. UI Layer
React components that:
- Render state
- Call storage APIs
- React to routing changes

UI must not:
- Hardcode strategy IDs
- Contain `if (strategyId === X)` logic
- Encode business rules

---

### 4. Engine Layer (Future)
Not implemented in this epic, but anticipated.

Responsibilities:
- Rule catalog
- Rule evaluation
- Backtesting and signal generation

The data structures defined here must already be compatible with this layer.

---

## 2. Canonical Data Models

### Strategy
```text
Strategy {
  id: string
  name: string
  createdAt: ISO string
  updatedAt: ISO string
}
```

### Account (per strategy)
```text
Account {
  id: string
  name: string
  createdAt: ISO string
  updatedAt: ISO string
}
```

### EntryDefinition (per strategy)
```text
EntryDefinition {
  schemaVersion: "1.0"
  updatedAt: ISO string
  long: EntryBlock
  short: EntryBlock
}
```

### EntryBlock
```text
EntryBlock {
  enabled: boolean
  mode: "CONFLUENCE"
  logic: "AND"
  maxRules: 8
  rules: Rule[]
}
```

### Rule
```text
Rule {
  id: string
  enabled: boolean
  atomId: string
  params: object
  operator?: string
  value?: any
  values?: any[]
  scope?: {
    type: "NOW" | "WITHIN_BARS"
    lookbackBars?: number
  }
  label?: string
}
```

---

## 3. Persistence Model (localStorage – MVP)

### Standardized Keys
```text
strategies:list
strategy:{strategyId}:accounts
strategy:{strategyId}:entry:v1
strategy:{strategyId}:account:{accountId}:trades:live
strategy:{strategyId}:account:{accountId}:trades:backtest
strategy:{strategyId}:account:{accountId}:trades:history
```

**Rules:**
- UI must never build keys manually
- All access goes through storage modules
- Versioned keys are required for schemas

---

## 4. Storage API Contracts

### strategyStore
- list()
- create(name?)
- rename(strategyId, name)
- remove(strategyId)
- ensureDefaults()

### accountStore
- list(strategyId)
- create(strategyId, name?)
- rename(strategyId, accountId, name)
- remove(strategyId, accountId)
- ensureDefaults(strategyId)

### entryStore
- get(strategyId)
- set(strategyId, entryDefinition)
- ensureDefaults(strategyId)

### tradeStore
- get(strategyId, accountId, mode)
- set(strategyId, accountId, mode, trades)

---

## 5. Routing Baseline & Guards

### URL format
/strategy/:strategyId/account/:accountId

### Rules
- `/` redirects to first valid strategy/account
- Invalid strategyId → redirect to first
- Invalid accountId → redirect to first for that strategy

---

## 6. Migration & Defaults Policy
- Existing strategies recreated as stored entities
- Default entry preset written on first access if missing
- Existing trades untouched

---

## 7. Rule Catalog Baseline
Defines allowed rule atoms and validation.

Draft atoms:
- Supertrend direction
- MA position
- MA slope
- Overlay state
- USDT.D filter
- RSI threshold
- Price cross MA
- Break of structure
- OTE retest

---

## 8. Technology Decision
- Persistence: localStorage (now)
- Dexie / IndexedDB: later behind abstraction

---

## 9. Definition of Done
Architecture baseline is complete when:
- This document exists in repo
- Models, keys, storage, routing are agreed
- No UI logic violates this baseline

---

## Next Step
Strategy CRUD + Persistence
