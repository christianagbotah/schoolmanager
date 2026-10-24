# Cashier Server Smart Allocation Implementation Plan

**Goal:** Make Quick payment server-authoritative without disrupting manual daily-fee allocation.

**Architecture:** Keep the existing Cashier controller/model contract for manual payments. Add a narrow Quick payment controller that calculates the five fee buckets from the latest wallet state, then delegates persistence to `Daily_fee_model::process_payment()`. Add a page-specific jQuery AJAX prefilter so the existing form/receipt UX transparently uses the new endpoint only when Quick payment is active.

## Task 1 — Regression contract (RED)
- Add `tests/cashier-server-smart-allocation.test.js`.
- Assert the dedicated controller, page bridge and page-scoped loader/config exist.
- Assert POST/auth/validation, server wallet reload, fixed priority, excess-wallet allowlist and delegation to the existing payment model.
- Assert Advanced/manual submissions remain on the existing endpoint.
- Add a focused GitHub Actions workflow and confirm it fails before implementation.

## Task 2 — Server-authoritative endpoint
- Add `application/controllers/Cashier_smart_allocation.php`.
- Mirror Cashier office-collection authorization.
- Accept only POST.
- Validate `student_id`, `quick_amount`, `excess_credit_type` and payment method.
- Reload outstanding wallet data and calculate allocation in the exact priority Feeding → Classes → Breakfast → Water → Transport.
- Assign excess to the selected prepaid wallet.
- Delegate to `Daily_fee_model::process_payment()` with `payment_type=mixed`, forwarding notes and breakfast/water opt-in state.
- Return receipt fields plus the final allocation and applied total.

## Task 3 — Cashier page bridge
- Add `assets/js/cashier-server-smart-allocation.js`.
- Register an AJAX prefilter only when the page config is present.
- Intercept only the existing cashier process URL and only when Quick payment amount > 0.
- Reroute to the dedicated endpoint and append `quick_amount` and `excess_credit_type` while preserving the serialized CSRF token and existing form data.
- Leave Advanced/manual allocation untouched.

## Task 4 — Page-scoped integration
- Update `application/views/backend/include_main.php` to load the bridge only on `daily_fee_collection`.
- Emit the existing process URL and new server-smart endpoint into a small page config object.

## Task 5 — Verification and delivery
- Confirm focused contract GREEN.
- Run the repository’s full CI/check suite.
- Review diff for unintended changes.
- Merge only when green.
- Verify post-merge CI and Deployment Handoff on the resulting main SHA.
