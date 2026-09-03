---
title: Ledgerline — treasury automation
numeral: 壱
year: 2026
order: 1
outcome:
  value: R$ 340M
  label: Reconciled per year
tags: [TypeScript, Node.js, PostgreSQL, React, AWS]
---

Multi-currency treasury platform for mid-size exporters. I built the double-entry
core, the reconciliation engine, and the dashboard the CFO actually opens every
morning. Idempotent by design: replaying a day of webhooks changes nothing.
