# AlphaRhythm v1.0 — Personal Baseline

**Status:** Complete  
**Audience:** Personal use  
**Tag:** v1.0-personal  
**Date:** 2026-01-15

## What is included
- Stable multi-strategy trading journal (TS1, TS2, FTMO/TS4)
- Retrospective trade insertion with correct equity recalculation
- Equity curve & KPIs
- Strategy-specific risk logic:
  - TS1 / TS2: leverage-based
  - TS2 default: 100% deposit
  - FTMO / TS4: funded-style risk
- Advanced leverage UX:
  - x5 / x10 / x20 / x50 checkpoints
  - visual ticks
  - snap-to-checkpoint behavior
- Safe scoped clearing per tab / strategy / account
- Personal-first UX decisions (no public constraints)

## What is intentionally excluded
- Public onboarding / auth
- Strategy marketplace or sharing
- Multi-user separation
- Settings panel (hardcoded defaults by design)

## How to continue from here
- All future development should branch from tag `v1.0-personal`
- Public / SaaS version must **not** modify this baseline
- Treat this as a frozen reference implementation

## Branching guidance
- `main` (or `personal`) → remains stable
- New work:
  - `feature/public-*`
  - `feature/settings-*`
  - `experiment/*`
