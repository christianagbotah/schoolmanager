# Hubtel money boundaries

## Inbound school-fee collections

Hubtel collection is a payment-gateway concern. A provider callback may confirm an existing server-created payment intent, but it must never define the student, invoice or amount to be credited. The authoritative values are the `payment_transactions` intent plus the locked `invoice` record.

Settlement requirements:
- create a cryptographically random client reference;
- validate invoice ownership and requested partial-payment amount on the server;
- compare callback reference and amount with the stored intent;
- serialize settlement with database row locks;
- make repeated callbacks a no-op after a successful settlement;
- create at most one `payment` row per gateway transaction reference;
- update the student ledger through `Finance_model` after the payment record exists;
- send notifications only after the database transaction succeeds.

## Outbound payroll disbursements

Payroll payout is a separate lifecycle and must not reuse collection transactions. Payroll calculation creates a payroll obligation; approval authorizes it; a payout request places it in a processing state; only a successful Hubtel send-money callback may mark it paid.

A calculated or approved payroll must never tell staff that their account has been credited until the payout provider confirms the transfer.

## Offline-sync boundary

Provider credentials, gateway transaction state and payout state are server-authoritative. Offline clients must not be allowed to create, overwrite or delete provider transaction records or force payment/payout status transitions.
