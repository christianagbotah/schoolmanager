# Cashier Server-Authoritative Smart Allocation Design

## Goal
Make the existing Daily Fee Collection “Quick payment” flow safe and authoritative on the server while preserving the current responsive cashier UI and the existing Advanced allocation/manual workflow.

## Problem
The cashier screen already lets a user enter one amount and previews a split across Feeding, Classes, Breakfast, Water and Transport. That split is currently calculated in browser JavaScript and submitted as five independent amount fields. The server therefore trusts client-side bucket values instead of recomputing the quick-payment allocation from the current wallet state.

This creates a stale-data/tampering boundary: wallet arrears can change between screen load and submit, and a modified request can claim a different allocation than the quick-payment rule shown to the cashier.

## Chosen approach
Add a dedicated authenticated POST endpoint for Quick payment and a small page-specific AJAX bridge. The bridge reroutes only submissions with a positive Quick payment amount. Manual/Advanced allocation continues to use the existing Cashier endpoint unchanged.

The server endpoint will:

1. Re-check cashier authorization.
2. Validate student ID, positive amount, payment method and the excess-credit wallet allowlist.
3. Reload the student’s current daily-fee wallet from the database.
4. Allocate arrears in the exact UI priority: Feeding → Classes → Breakfast → Water → Transport.
5. Put any remaining amount into the cashier-selected prepaid wallet.
6. Call the existing `Daily_fee_model::process_payment()` path so wallet updates, audit trail, preference handling, receipts and accounting integration remain centralized.
7. Return the final server allocation with the existing receipt/transaction fields.

## Compatibility
- Existing Advanced allocation remains available and posts to the legacy endpoint.
- Existing receipt printing remains unchanged.
- Existing breakfast/water preference values are forwarded.
- Existing payment method and notes are forwarded.
- No schema migration is required.

## Security and correctness
- POST only.
- Existing CodeIgniter CSRF protection remains in force because the request is submitted through the existing form serialization.
- Client bucket amounts are ignored for Quick payment; the server reconstructs them from current wallet arrears.
- Excess-credit destination is allowlisted to the five supported daily-fee wallets.
- Invalid/non-positive quick amounts fail without creating a transaction.

## UX impact
The cashier keeps the already-modern single-input flow. The visible behavior stays familiar, but the amount shown as “Smart allocation” is now enforced by the server at payment time instead of being only a browser-side promise.
