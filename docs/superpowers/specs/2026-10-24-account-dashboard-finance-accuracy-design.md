# Account Dashboard Finance Accuracy Design

## Goal
Make the legacy Account Dashboard report trustworthy before further visual modernization.

## Problems found
1. Income is accumulated with `number_format($row['amount'])`. Formatting before arithmetic can turn values such as `1200` into `"1,200"`, which is not a safe numeric operand and can produce incorrect totals or warnings depending on PHP behavior.
2. Feeding-fee date lookup dereferences `row()->timestamp` without first confirming a row exists. A new school/term with no feeding-fee records can therefore fail while opening or filtering the finance dashboard.
3. Monetary values should remain numeric through all aggregation and only be formatted once, at presentation time.

## Chosen approach
Keep this as a narrow correctness patch in the existing view. Do not redesign queries, change schema, or change navigation. Accumulate raw numeric amounts using explicit float conversion, handle empty feeding-fee queries safely, and retain the existing final currency-formatting step.

## Expected behavior
- `1000 + 2500.50` is aggregated as `3500.50` before formatting.
- Both current-term and filtered dashboard paths tolerate zero feeding-fee rows.
- Existing invoice, expense, feeding, classes, transport and navigation behavior is preserved.
