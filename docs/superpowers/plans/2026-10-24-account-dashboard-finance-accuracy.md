# Account Dashboard Finance Accuracy Implementation Plan

**Goal:** Correct finance dashboard aggregation and make feeding-fee date lookup safe when no records exist.

## Task 1 — RED contract
- Add a focused Node static regression contract for `account_dashboard.php`.
- Assert income sums raw numeric values in both filtered and current-term paths.
- Forbid `number_format()` inside arithmetic accumulation.
- Assert both feeding timestamp lookups guard empty query results before dereferencing rows.
- Add a focused GitHub Actions gate and confirm failure before implementation.

## Task 2 — Minimal correctness fix
- Replace both formatted-string income accumulations with explicit numeric accumulation.
- Retain `numfmt_format_currency()` only after aggregation is complete.
- Replace unsafe feeding timestamp dereferences with query-result guards and existing today fallback.
- Keep all surrounding queries, routes, labels and cards unchanged.

## Task 3 — Verification and delivery
- Run the focused contract to GREEN.
- Run full CI.
- Review the exact diff for unintended presentation changes.
- Merge only when green.
- Verify post-merge CI and Deployment Handoff.
