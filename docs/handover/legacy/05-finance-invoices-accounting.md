# Legacy Audit 05 — Finance, Invoices, Discounts & Accounting

**Repository:** `schoolmanager` (CodeIgniter 3.x) · **Branch:** `zai/full-platform-reconciliation-20261024` · **Audit date:** 2026-10-24
**Agent:** Explore-finance (Task 3-e) · **Purpose:** authoritative parity-matrix input for the iEduPro multi-tenant SaaS migration.
**Audience:** migration architects. Every claim carries a `file:line` citation. Labels: **[VERIFIED LEGACY BEHAVIOR]** (how it works today, evidenced) and **[RECOMMENDATION]** (what iEduPro should do).

All paths are relative to the repo root unless prefixed `application/`. Line numbers refer to branch HEAD (`ff96b2e`). `schema/...` = `schema/schoolmanager_schema_redacted.sql` (the table-structure authority; production data rows are redacted out of the dump).

---

## 1. Overview

The finance domain is the most fragmented subsystem in the legacy app. It contains **four co-existing accounting generations**, two invoice families (termly "bill" invoices and daily-fee wallets), two expense systems, two discount governance systems and one hardened payment-gateway path that was retrofitted onto a legacy gateway controller:

1. **Legacy cashbook ledger** — `accounts` (real money accounts incl. bank flag), `payment` (everything is a `payment` row: income *and* expense), `general_journal` double-entry written by `Expenditure_model` (vehicle expenditure; `general_journal` referenced at `application/models/Expenditure_model.php:136,153` — table absent from schema dump, i.e. lives only in prod/DB views).
2. **Enterprise accounting core** — `chart_of_accounts` + `journal_entries`/`journal_entry_lines` + `finance_audit_trail`, driven by `Accounts_model.php` and the `Financial_integration_hooks` library (`application/libraries/Financial_integration_hooks.php`), with dashboard reports (trial balance, income statement, balance sheet, general ledger) at `application/models/Accounts_model.php:679-831`.
3. **Student sub-ledger** — `student_ledger` running-balance rows written by `Finance_model` (`application/models/Finance_model.php:218-327`).
4. **Modern enhancement layer** — `expenses_enhanced` + `budgets`/`budget_lines` + `bank_accounts`/`bank_transactions`/`bank_reconciliations`/`reconciliation_items`, exposed by `Expense_management.php`, `Budget_management.php`, `Bank_reconciliation.php` (all admin-gated controllers added in the "enhanced finance" wave).

Invoice termly bills live in one physical table: **`invoice` is a line-item table** — one row per (student, bill item, year, term); an "invoice code" groups a student's termly items (schema line 3463; grouping logic `Admin.php:12233-12245`). `payment` rows settle `invoice.due` per line (`Admin.php:14732-14775`).

Multi-tenancy: none. There is no `tenant_id`/`school_id` scoping in any finance table except stray `bill_item.school_id` filters in one AJAX helper (`application/controllers/discount_profile_ajax.php:16`), consistent with the single-tenant finding of audit 01.

**[RECOMMENDATION]** iEduPro should keep exactly one ledger (double-entry journal + per-student sub-ledger projection), make `journal_entries` the single source of monetary truth, and re-implement termly billing, daily fees, expenses, budgets and bank rec as modules posting to it. The four-generation structure must not be ported.

---

## 2. Invoice system — lifecycle (create → modify → pay → lock → receipt)

### 2.1 Data model

**[VERIFIED LEGACY BEHAVIOR]**

- **`invoice` table = line items, not invoices.** One row per bill item per student per term: `invoice_id`, `invoice_code` (bigint, groups items), `student_id`, `title` (bill item title, uppercase), `description`, `amount`, `discount`, `amount_paid`, `credit_applied`, **generated columns** `original_due = amount - amount_paid` and `net_due = original_due - credit_applied` (stored), plus a mutable `due` double column, `status` ('paid'/'unpaid'/'due'), `year`/`term`/`sem`/`class_id`, `residence_type` enum('Day','Boarding'), soft-state enums `can_delete` ('default|request|approved|declined|trash') and `can_edit` ('default|request|approved|declined'), lock columns `locked_at`/`locked_reason`, approval columns (`approval_status` none|pending|approved|rejected + requested_by/at, handled_by/at, notes), and ledger-sync flags `synced_to_ledger`/`ledger_entry_id` (schema 3463-3523).
- **Bill items (fee structure catalogue)** — `bill_item` (`id`, unique-ish `title`, `description`, `bill_category_id`, `class_category`, `specific_class_ids` CSV, `amount`) at schema 881-897; per-term per-class snapshot in `bill_item_history` (`bill_item_id`, `class_id`, `term`, `year`, `bill_item_amount`, `residence_type` 'Day|Boarding|Both', schema 910-927). Bill categories in `bill_category` (schema 857). A separate rarely-used `fee_structures` table stores JSON fee items per class/year/term (schema 2598-2613; admin endpoints `Admin::fee_structure` `Admin.php:13877` / `get_fee_structure` 13887).
- **`payment` table = receipts & expenditures.** Columns include `payment_id`, `payment_type` ('income'/'Expense'), `invoice_id`, `invoice_code`, `receipt_code` (bigint), `student_id`, `class_id`, `payment_method` (free text; numeric codes 1=cash,2=cheque/bank,3=momo), `amount`, `due` (running balance after receipt), `transaction_id` (momo ref), `bank_name`, `cheque_number`, `issuer_id`, `account_type`, `timestamp`/`day_timestamp` (unix), `year`/`term`/`sem`, `residence_type`, same `can_delete`/`can_edit`/lock/approval enums as invoice, plus accounting flags `synced_to_accounts`, `journal_entry_id`, `synced_at`, print/email flags `is_printed`/`is_emailed`/`printed_at`/`emailed_at` (schema 4524-4589).

### 2.2 Termly bill creation — `Admin::mass_invoice_create` (`Admin.php:12053-12935`)

**[VERIFIED LEGACY BEHAVIOR]** — the canonical termly billing flow (mirrored by `clone_previous_bill` at `Admin.php:13253` for cloning last term's bills):

1. **Inputs:** classes (or all classes if none posted, `Admin.php:12075-12083`), `year`, `term`, `students_category` ('boarding'/'day'/both → `residence_type` for bill history, `Admin.php:12091-12103`), `student_id[]` array, serialized item fields `<rand>_<time>_title/_amount/_description` (`Admin.php:12249-12253`).
2. **Invoice-code generation is MAX+1 with leading-zero preservation:** read highest `invoice_code` (`ORDER BY invoice_code DESC LIMIT 1`, `Admin.php:12147-12150`), add 1 (+ per-student `$invoice_adder`), and if the old code started with '0' keep the zero prefix by substring padding (`Admin.php:12153-12181`). Fallback seed = `settings.type='invoice_number_format'` (`Admin.php:12060`). Duplicate codes are retried via helper `invoice_code_validation_insert` in a `while` loop (`Admin.php:12184-12211`).
3. **Dedupe:** if the student already has any invoice rows for (student, year, term, class), **reuse the existing invoice_code + creation_timestamp** instead of a new one (`Admin.php:12233-12245`) — one invoice_code per student per term.
4. **Class applicability filter per item:** `bill_item.specific_class_ids` (priority 1) > `bill_item.class_category` vs `class.category` (priority 2) > all classes (`Admin.php:12302-12324`).
5. **Discount application at bill time:** approved `student_discount_assignments` joined to `discount_profiles` where `discount_category='invoice'` and `status='approved'` (`Admin.php:12261-12269`). Percentage discounts reduce each matching item pro-rata; fixed discounts are pre-totalled across selected items then allocated pro-rata by item share (`Admin.php:12271-12286`, 12326-12359). Discount ledger rows are written to `invoice_discounts` (+ per-item rows in `invoice_discount_items`) as pre-approved, applied_by = approver = session user (`Admin.php:12782-12834`).
6. **Update vs insert:** existing row for same (student,title,year,term,class) with `can_delete != trash` and `can_edit != declined` is updated (amount, due = max(0, amount - paid - credit)), else inserted (`Admin.php:12371-12437`, 12398-12423). Only rows with `can_delete in (default, approved)` **and** `can_edit in (default, approved)` are touched — locked/pending-request rows are skipped (`Admin.php:12398`).
7. **Replacement semantics:** bill items not present in the new bill and with `amount_paid == 0` are **hard-deleted** from `invoice` (and `invoice_discount_items`) — i.e. re-billing replaces unpaid items (`Admin.php:12550-12614`).
8. **Credit auto-apply:** on every insert/update, old `credit_applications` are reversed and `Credit_model::apply_credits_to_invoice` re-applies student credits (`Admin.php:12643-12685`, 12705-12769).
9. **Ledger hook:** for each student, `sync_invoice_to_ledger(latest invoice_code, student_id)` → `Finance_model::update_student_ledger_for_invoice` debits the student sub-ledger with the sum of all invoice rows for the code (`Admin.php:12859-12872`; `finance_integration_helper.php:17-23`; `Finance_model.php:218-252`).
10. **No transaction wraps the whole batch** — inserts/updates/deletes run as separate statements; only the credit-rewrite and modification paths use `trans_start` (`Admin.php:12640-12641` vs `Admin.php:39055`).

**[RECOMMENDATION]** A billing engine with: one invoice header + item rows (not item-as-invoice), unique constraint on (student, year, term), draft→issued→paid states, idempotent batch creation in one DB transaction, discount computation as a derived table (never overwriting gross amounts), and credit application as first-class allocations.

### 2.3 Single invoice creation (legacy paths)

- `Accountant::invoice_create` (`Accountant.php:107-264`) and `Accountant::mass_invoice_create` (`Accountant.php:267-…`): same MAX+1 code generation, insert loop per serialized item, then **~40 hard-coded `$this->db->cache_delete(...)` calls** to invalidate query cache (`Accountant.php:191-261`) — no discounts, no ledger hooks, no transactions.
- `Admin::invoice('do_update')` (`Admin.php:14557-14572`) allows raw editing of any invoice row (amount, amount_paid, due, status) with no state checks — the old edit path that the lock system bypasses.
- `Admin::create_invoice_with_credits` (`Admin.php:40469-40518`) — modern transactional path creating one invoice row (column `timestamp` not `creation_timestamp` — **bug risk**: schema has `creation_timestamp`, so this inserts a null date) then auto-applying credits; also `Admin::generate_invoice_code()` is only defined in `application/helpers/finance_helper.php:111-118` as a **completely different format** `INV-YYYY-T{n}-00001` (never reconciled with MAX+1 numeric codes).

### 2.4 Payment capture — `Admin::invoice('take_payment')` (`Admin.php:14580-15014`)

**[VERIFIED LEGACY BEHAVIOR]**

1. Receipt code: user-entered or system-generated as MAX(`receipt_code`)+1 over `payment` (default seed 100001) (`Admin.php:14600-14621`); duplicates rejected via `receipt_code_validation_insert` (`Admin.php:14624-14631`).
2. Method validation: momo requires ≥10-char transaction id (else a **random 10-digit array** is auto-generated by shuffling 1-100 — `Admin.php:14660-14672`); cheque requires bank name ≥3 chars and cheque number ≥10 chars (`Admin.php:14677-14689`).
3. **Allocation across arrears:** fetches all owing invoice ids/codes via `Financial_report_model::getAllBillInvoicesOwingByStudentId/-IdsOwingByStudentId` (`Admin.php:14699-14704`; model at `Financial_report_model.php:317-339`), then loops oldest→…, allocating min(due, remaining) and updating `invoice.amount_paid/due` with SQL expressions (`Admin.php:14732-14772`), one `payment` row per invoice touched (`insert_batch` `Admin.php:14775`).
4. **Overpayment → student credit:** leftover amount creates a `student_credits` row + a `payment` row titled 'PREPAID CREDIT' with `invoice_id=NULL` (so the full cash received is recorded) (`Admin.php:14787-14838`).
5. **Accounting hooks:** every allocation's payment row gets `sync_payment_to_accounts()` (→ `Financial_integration_hooks::sync_invoice_payment`, JE-INV-…) and `sync_payment_to_ledger()` (`Admin.php:14842-14852`; `Finance_model.php:331-334`).
6. **Balance on receipt:** last `payment` row of the receipt gets `due += SUM(invoice.due)` — a running "balance due" snapshot on the receipt (`Admin.php:14854-14876`).
7. **Status recompute:** invoice status set to 'paid'/'unpaid' per invoice_code from `getBillOweSumByInvoiceCode` (`Admin.php:14881-14897`; model `Financial_report_model.php:405-416`).
8. **Auto-lock:** if `settings.auto_lock_enabled == 'yes'` → `lock_payments_by_receipt($receipt_code)` and `lock_invoice()` on every now-paid invoice (`Admin.php:14902-14916`; helper `application/helpers/invoice_lock_helper.php:47-73`).
9. **Parent SMS** receipt notification through `sms_model->send_sms` when `active_sms_service != 'disabled'` (`Admin.php:14956-14979`); print receipt via `admin/receipt/{code}/{student}/{amount}/{datetime}/{owe}` (`Admin.php:14985-14994`).

**[RECOMMENDATION]** Allocate payments through a proper allocation table (payment ↔ invoice many-to-many with amounts; the modern `invoice_payment_links` table, schema 3683-3700, exists but is unused by this path), never mutate `invoice.due` directly (use generated columns), and make lock-on-payment automatic rather than settings-gated.

### 2.5 Invoice modification workflow (requests/approvals)

**[VERIFIED LEGACY BEHAVIOR]** — the hardened path (`Admin.php:38924-39110+`):

- `request_invoice_modification` is POST-only; validates invoice/student consistency, blocks when a pending/processing request exists (`Admin.php:38947-38948`); **delete requests with payments return a warning + require `confirm_invoice_delete_with_payments`** (`Admin.php:38950-38956`, 38986-39016); **level-1 admins execute immediately**, others create `invoice_modification_requests` rows (status pending, `old_data` JSON of all rows, `new_data` JSON of normalized items) and notify (`Admin.php:38969-38982`).
- `normalize_invoice_edit_payload` enforces: ≤200 items, numeric amounts, no duplicate items, paid invoices cannot change bill-item identity/add/remove items, total > 0 (`Admin.php:39019-39047`).
- `apply_invoice_edit` runs inside a transaction with `SELECT ... FOR UPDATE` on invoice rows and `student_credits`, reverses credit applications, **refuses edits when >1 approved discount exists** (`Admin.php:39072-39075`), and recomputes due/discounted amounts.
- Legacy parallel system: invoice rows use `can_delete`/`can_edit` enums with 'request' states + `delete_request_issuer_id`/`edit_request_issuer_id` (schema 3499-3502) and generic `request` table (schema 5377-5396) via `Admin::manageRequestApproval` (`Admin.php:28953`), `bulk_invoice_delete($location, $isRequest)` (`Admin.php:24623`), and views `invoice_modification_requests.php` / `receipt_invoice_modification_requests.php`.

### 2.6 Invoice locking

**[VERIFIED LEGACY BEHAVIOR]**

- `invoice_lock_helper.php`: `lock_invoice()` sets `can_edit='declined'`, `can_delete='declined'`, `locked_at`, `locked_reason` + `log_audit()` into `invoice_payment_audit_log` (`invoice_lock_helper.php:9-26`); `lock_payment()` same for payment rows (28-45); `lock_payments_by_receipt()` locks all rows sharing a receipt code (47-62); `is_auto_lock_enabled()` reads `settings.auto_lock_enabled == 'yes'` (64-73); `log_audit()` inserts `invoice_payment_audit_log` (record_type invoice|payment, action create|edit|delete|lock|unlock|approve|reject, performed_by, ip_address; schema 3657-3678) (75-96).
- Unlock path is a separate generic helper: `request_unlock()` inserts into `unlock_requests`; `unlock_record()` sets `can_edit/can_delete = 'approved'` — note this **unlocks by setting approved, not 'default'** (`application/helpers/unlock_helper.php:4-46`).
- Lock is *advisory* to the re-billing path (2.2 step 6) and the `take_payment` flow, but `Admin::invoice('do_update')` (2.3) still ignores it.

### 2.7 Receipts

- Receipt views selected by `settings.receipt_style` ('style_1|2|3') in `Admin::receipt` (`Admin.php:23994-24016`); FCT (feeding/classes/transport) receipts via `Admin::fct_receipt` (`Admin.php:24019-24031`); thermal POS via `receipt_model->print_in_thermal` (`Admin.php:24033-24035`).
- `Bulk_receipts::generate` (admin-gated, `Bulk_receipts.php:11-27`) renders Dompdf PDFs for selected payment ids with `RCP-{padded id}` numbers (`Bulk_receipts.php:29-118`).
- `Finance_model::generate_receipt` synthesizes `RCP-` numbers on the fly without persistence (`Finance_model.php:152-163`).

### 2.8 Arrears computation

**[VERIFIED LEGACY BEHAVIOR]** — two parallel arrears ledgers:

- **Billed arrears** = `SUM(invoice.due)` per student (`Finance_model.php:38-42`, `Admin.php:14854-14861`), with per-invoice owes from `Financial_report_model::getBillOwingByInvoiceCode/getBillOweSumByInvoiceCode` (`Financial_report_model.php:395-427`) and receivable reports filtered by `can_delete != 'trash'` (`Financial_report_model.php:177-289`).
- **Daily-fee arrears** = per-component `feeding_arrears/.../transport_arrears` in `daily_fee_wallet` (see audit 03; totals at `Fee_collection.php:170-179`).
- Invoice status semantics drift: take_payment writes status 'paid'/'unpaid' (`Admin.php:14881-14897`), Hubtel settle writes 'paid'/'due' (`Hubtel_payment_model.php:289`), Stripe/PayPal force 'paid' (`Stripe_model.php:40`, `Paypal_model.php:23`), `finance_helper::check_payment_restrictions` queries `status = 'due'` (`finance_helper.php:126-129`) — three vocabularies for the same column.

---

## 3. Discount system map

There are **three overlapping discount generations**. All write to overlapping tables; the current system of record is generation 3 (profiles + assignments).

### 3.1 Generation map

**[VERIFIED LEGACY BEHAVIOR]**

| Generation | Tables | Models/Controllers | Status |
|---|---|---|---|
| G1: benefit categories | `benefit_category` (schema 780-796), denorm columns on `invoice` (`benefit_category_id/name/discount_type/feeding/classes/tuition/total_discount`, schema 3472-3477) | `Admin::benefit_category` (`Admin.php:24211`), `beneficiary_helper.php` | Legacy; invoice columns still exist and are populated by older flows |
| G2: types/categories/approvals | `discount_types` (`Discount_type_model` reads it, `Discount_type_model.php:30-97`), `discount_categories` (schema 1838-1853), `discount_approvals` (schema 1757-1774), `discount_audit_trail` (schema 1812-1830) | `Discount_category_model.php`, `Discount_type_model.php`, `Discount_approval_model.php` (operates on `invoice_discounts` using non-existent columns — see 3.3) | **Half-dead**: approval model joins `discount_types/discount_categories/students/users` tables that don't exist in schema (students table is `student`) |
| G3: discount profiles (current) | `discount_profiles` (profile_id, profile_name, discount_type, bill_item_ids CSV or '*', discount_category invoice|daily_fees, discount_method percentage|fixed, discount_value, schema 1865-1893), `discount_profile_rules` (per class/category overrides, schema 1898-1914), `student_discount_assignments` (per-student assignment w/ status pending|approved|rejected|pending_removal, is_active, year/term/sem, schema 5945-5976), application ledger `discount_applications` (schema 1719-1749), `discount_audit_log` (schema 1784-1806), `discount_summary_cache` (schema 1925-1940), view `v_discount_audit_summary` (schema 6754) | `Discount.php`, `discount_profile_ajax.php`, `Admin::get_discount_profile_form` (`Admin.php:23017`), `Admin::update_invoice_discount` (`Admin.php:23105`), helpers `discount_helper.php`, `discount_tracking_helper.php`, `discount_profile_helper.php`, `discount_modification_helper.php` | **Active** |

### 3.2 Who approves what

**[VERIFIED LEGACY BEHAVIOR]**

- **Discount creation:** `Discount::create` — any logged-in role creates an `invoice_discounts` row; **super admin (admin.level==1) rows are auto-approved**, everyone else's are `pending` (`Discount.php:41-74`).
- **Approval/rejection:** `Discount::approve` / `Discount::reject` — hard-coded "Only super admin can approve" via `admin.level != 1` check (`Discount.php:76-103`); pending list also level-1 only (`Discount.php:105-116`).
- **Modification of approved discounts:** `Discount_modification::request_modification` + `discount_modification_helper.php`: approved+locked discounts require a `discount_modification_requests` row approved by super admin with a **24h validity window** and single execution (`discount_modification_helper.php:132-173`); `can_modify_discount` allows creators to modify pending/rejected rows freely (`discount_modification_helper.php:17-86`).
- **Assignments (G3):** `student_discount_assignments.status` pending→approved; `discount_approval_invariants.sql` enforces "pending assignments must not be active" (is_active default 0 + backfill) and adds `invoice_discounts.replacement_discount_id` for atomic replacement (`database/migrations/discount_approval_invariants.sql:1-14`).
- **Audit:** `discount_audit_log` (application-level, actions created|modified|reversed|approved|rejected with old/new JSON, ip, user_agent; written by `discount_tracking_helper.php:85-114`), `discount_audit_trail` (G2 entity audit), `invoice_payment_audit_log` for invoice/payment locks; aggregates cached in `discount_summary_cache` via `update_discount_summary_cache` (`discount_tracking_helper.php:116-182`).

### 3.3 Interaction semantics (invoice discounts)

**[VERIFIED LEGACY BEHAVIOR]**

- At bill creation, approved profile assignments are **baked into the invoice amounts** (item `amount` reduced), and a snapshot is recorded in `invoice_discounts` (status 'approved', reason "Profile: {name}") + `invoice_discount_items` per item (`Admin.php:12261-12359`, 12782-12834). The `invoice.amount` is therefore *net of discount*; gross is only recoverable from `invoice_discount_items.original_amount`.
- `Invoice_discount_model` (G2) computes discounts at display/preview time from `invoice_discounts` joined to `discount_types` — but joins `discount_categories dc ON id.category_id` and `students s` tables which do not exist in the schema → dead in practice unless legacy tables persist in prod (`Invoice_discount_model.php:25-98`).
- `Discount_model::get_student_discount_for_date` resolves daily-fee discounts from `student_discount_assignments` with the `all_daily_fees` wildcard, **ignoring year/term by design** (discount persists across periods until deactivated) and preferring specific fee type over wildcard (`Discount_model.php:152-234`).
- `Daily_fee_discount_model` mirrors the G2 pattern against `invoice_discounts` with `discount_category='daily_fees'` (`Daily_fee_discount_model.php:19-93`).
- `Discount_temporal_model` expects `start_date`/`end_date` columns on `invoice_discounts` and an approved→active→expired lifecycle that no writer implements (`Discount_temporal_model.php:22-73`) — vestigial scheduled-activation engine.
- `billing_helper.php` re-implements `get_discount_types`, `discount_requires_approval` (via `discount_types.approval_threshold`), `get_invoice_discounts`, `get_total_discount` (`billing_helper.php:24-86`) — a third helper surface with the same names as `discount_profile_ajax::get_discount_types` (name collision across CI helpers/controller methods).

**[RECOMMENDATION]** One discount engine: profiles (scoped to items/classes/periods) → assignments (approval workflow, effective dating) → applications (immutable ledger with gross/net amounts). Never mutate invoice gross; keep discount as a separate line. Retire G1/G2 models and the temporal engine.

---

## 4. Accounting core — chart of accounts, journals, posting rules

### 4.1 Chart of accounts

**[VERIFIED LEGACY BEHAVIOR]** — `chart_of_accounts` (schema 1160-1181): `account_id`, `account_code` varchar(20), `account_name`, `account_type` enum('asset','liability','equity','revenue','expense'), `account_category`, `parent_account_id`, `is_active`, `opening_balance`, `current_balance` (materialized), timestamps. Seeded lazily by `Financial_integration_hooks::create_default_account` when a code is missing (`Financial_integration_hooks.php:386-428`):

| Code | Name | Type | Used by |
|---|---|---|---|
| 1010 | Cash on Hand | asset | payments/daily fees cash (hooks `:371`, refunds `:628`) |
| 1020 | Mobile Money Account | asset | payment_method 2/`mobile_money` (`:374`) |
| 1030 | Bank Account | asset | payment_method 3/`bank` (`:377`) |
| 1200 | Inventory Asset | asset | inventory purchases (`:623`) |
| 2010 | Accounts Payable | liability | defined only (`:403`) |
| 2040 | *(name from seed/DB; "Unearned Revenue")* | liability | daily-fee prepayment stage 1 (`:124`, `:208`) |
| 4060 | Tuition Fee Revenue | revenue | invoice payments (`:37`) |
| 4200/4210/4220/4230/4240 | Daily Feeding/Breakfast/Classes/Water/Transport Fee Revenue | revenue | revenue recognition (`:242-248`) |
| 4900 | Sales Returns & Allowances | revenue (contra) | inventory refunds (`:501`) |
| 5100 | Cost of Goods Sold | expense | cogs purchases (`:621`) |

Note: `2040` is absent from the `create_default_account` defaults map (`:398-412`), so on a fresh DB `get_account_by_code('2040')` returns **null** and `sync_daily_fee` would fatal on `->account_id` — seed data must exist in prod.

### 4.2 Journal entry formats & posting rules

**[VERIFIED LEGACY BEHAVIOR]** — `journal_entries` (schema 3752-3776): `entry_number` varchar(50), `entry_date`, `entry_type` enum('general','adjustment','closing','opening','reversal'), `reference_type`/`reference_id`, `source_type`/`source_id`, `total_debit`/`total_credit` decimal(15,2), `status` enum('draft','posted','void'), `posted_by/at`, `fiscal_year/period`, `created_by/at`. `journal_entry_lines` (schema 3785-3801): `entry_id`, `account_id`, `debit_amount`, `credit_amount`, `description`.

Entry-number formats (all date-embedded, id-suffixed; uniqueness not DB-enforced):

| Prefix | Producer | Source | Format |
|---|---|---|---|
| `JE-INV-{Ymd}-{payment_id}` | invoice payment hook | payment | `Financial_integration_hooks.php:40` |
| `JE-PREPAY-{Ymd}-{txn_id}` | daily-fee collection | daily_fee_transactions | `:127` |
| `JE-REVENUE-{Ymd}-{student_id}` | revenue recognition (currently never called) | attendance | `:211` |
| `JE-REV-{Ymd}-{payment_id}` | payment reversal | payment | `:301` |
| `JE-REFUND-{Ymd}-{return_id\|uniqid}` | inventory refund | inventory_returns | `:504` |
| `JE-PURCHASE-{Ymd}-{purchase_id\|uniqid}` | inventory purchase | inventory_purchases | `:631` |
| `JE-{Ym}-{0001n}` (sequential) | manual journal creation | `Accounts_model::generate_entry_number` | `Accounts_model.php:374-393` |

Posting rules:

- **Invoice payment:** DR cash/bank/momo account (by `payment.payment_method` 1/2/3), CR 4060 Tuition Revenue; balances updated; payment marked `synced_to_accounts=1`, `journal_entry_id` set; idempotency guard "Already synced or not found" (`Financial_integration_hooks.php:25-100`).
- **Daily-fee collection (stage 1):** DR cash account, CR 2040 Unearned Revenue — prepayments are liabilities, not revenue (`:106-188`). Called from `Daily_fee_model.php:2254`, `Sync_daily_fees.php:51,84`, `Financial_integration.php:255,638`.
- **Revenue recognition (stage 2):** DR 2040, CR 4200-4240 per fee type (`:194-277`). **`recognize_daily_fee_revenue` has zero callers in the application** (verified by repo search; only definition found) — revenue recognition is dormant; audit 03 documents a separate `JE-REV-*` recognition writer inside `Daily_fee_model::process_daily_charges`.
- **Reversal:** `reverse_invoice_payment` creates an `entry_type='reversal'` entry mirroring lines and re-derives balances, marks payment unsynced (`:283-361`).
- **Refunds/purchases:** DR 4900/1200-or-5100, CR cash (`:468-688`).
- **Balance math:** asset/expense debit-positive; liability/equity/revenue credit-positive, maintained as `current_balance` on the account row (`:433-452`; identical logic in `Accounts_model::post_journal_entry` `Accounts_model.php:271-291` and inverse in `void_journal_entry` `:305-350`).
- **Double-entry invariant:** enforced only at manual posting — `post_journal_entry` refuses `total_debit != total_credit` (`Accounts_model.php:259-262`). Hook-created entries are 2-line balanced by construction but **not wrapped in a DB transaction** (each insert standalone).
- **Audit:** every manual create/post/void writes `finance_audit_trail` (`Accounts_model.php:395-408`; schema 2644-2661); hook path writes `financial_integration_log` rows (`Financial_integration_hooks.php:693-706`).

### 4.3 Student sub-ledger

**[VERIFIED LEGACY BEHAVIOR]** — `student_ledger` (schema 5988-6013): rows of transaction_type invoice|payment|discount|credit_note|adjustment|refund with debit/credit and a **materialized running `balance`**; balance = last row's balance (`Finance_model::get_student_ledger_balance` `:282-290` — race-prone, no lock). Writers: `update_student_ledger_for_invoice` (debit total of invoice rows, `:218-252`), `..._for_payment` (credit amount, `:254-280`), `..._for_discount` (credit discount, `:292-315`). `synced_to_ledger`/`ledger_entry_id` written back to invoice when the columns exist (`:246-249`). Guarded by `table_exists('student_ledger')` checks that silently skip when absent.

### 4.4 Reports (accounting core)

**[VERIFIED LEGACY BEHAVIOR]** — `Accounts_model`: trial balance from `current_balance` split by account type sign (`get_trial_balance` `:764-802`); income statement from `journal_entry_lines` joined to posted entries (revenue = Σ(credit−debit), expenses = Σ(debit−credit)) (`:710-747`); balance sheet straight from `chart_of_accounts.current_balance` sums (`:679-708`); cash flow **returns empty skeleton** (`:749-762`); general ledger per account from posted lines (`:804-831`); dashboard metrics (`:21-89`). Controller exposure: `Admin::accounts` (`Admin.php:20059`), `Accountant.php` mirrors.

**[RECOMMENDATION]** Port one double-entry core with DB-enforced balanced-entry constraints, append-only posted entries + reversal entries (never mutate balances without a line), automated revenue recognition wired to attendance, and period close. Retire the legacy `accounts`/`general_journal` cashbook by migrating opening balances into `chart_of_accounts`.

---

## 5. Expenses, budgets, bank reconciliation

### 5.1 Vehicle expenditure (legacy) — `Expenditure.php` + `Expenditure_model`

**[VERIFIED LEGACY BEHAVIOR]**

- `Expenditure::add_expenditure` (admin-gated; AJAX 401 vs redirect, `Expenditure.php:40-55`) validates name/type/amount/numeric/date/vehicle/driver/account (`:94-125`) then calls the model.
- `Expenditure_model::add_expenditure` (`Expenditure_model.php:71-173`): checks `accounts.current_balance > amount` (strict >, so draining to zero is impossible — `:85`); inserts into **`v_expenditure`** (a view used as a table); deducts the paying account and **credits a magic 'General Vehicle Expenses' account by name** (`:92-101`); writes a `payment` row with `payment_type='Expense'` (`:107-119`); writes **two `general_journal` rows** (debit expense account, credit paying account) and links `payment.journal_id`/`v_expenditure_id` (`:121-161`). Edit recomputes deltas the same way (`:177-330`); delete reverses accounts (`:332+`). No approval workflow, no budget link, no transaction wrapper.
- Special-case: expenditure named 'FUEL' captures `fuel_type` (`Expenditure.php:83-85`).
- Auth-boundary tests pin the constructor gate (`tests/expenditure-auth-boundary.test.js:22-48`).

### 5.2 Enhanced expenses — `Expense_management.php` + `expenses_enhanced`

**[VERIFIED LEGACY BEHAVIOR]**

- Schema `expenses_enhanced` (schema 2476-2500): `expense_date`, `description`, `category_id` → `expense_categories_enhanced` (schema 2504-2520; `budget_code`, `requires_approval`, `approval_threshold` auto-approve-below), `vendor`, `amount`, `payment_method`, `reference_number`, `attachment` (uploaded to `./uploads/expenses/`, jpg/png/pdf ≤5MB, `Expense_management.php:61-77`), `status` enum('pending','approved','rejected'), `requested_by`, `approved_by/at`, `rejection_reason`, `budget_line_id`, `linked_at`.
- Flow: `create()` (status pending, `Expense_management.php:60-99`) → `approve()` (POST-only via `requirePostMutation` `:267-280`; sets approved + `budget_integration->link_expense_to_budget` + email notification `:141-168`) → `reject()` with reason (`:170-184`) → `delete()` unlinks file (`:186-201`). **No role check beyond admin_login; any admin can approve their own request** (no self-approval guard, unlike discounts).
- Stats/export: `get_statistics` (`:211-241`), `export_expenses` with `'GHS ' . number_format(...)` hard-coded (`:243-265`).
- Audit into `financial_audit_trail` (module/action/record_id/old/new/user/ip/ua; `:282-294`) — note this table is distinct from `finance_audit_trail` used by Accounts_model.
- Auth-boundary tests: `tests/expense-management-auth-boundary.test.js:22-44`; mutation-safety tests pin POST-only mutations (`tests/expense-management-mutation-safety.test.js`).
- Legacy expense surface also lives inside Admin (`Admin::expense*` CRUD `Admin.php:16998-17569` against `payment`/`expense_category`, schema 2526-2541) — two expense systems co-exist.

### 5.3 Budgets — `Budget_management.php` + `budgets`/`budget_lines`

**[VERIFIED LEGACY BEHAVIOR]**

- Schema `budgets` (schema 1051-1069): budget_name, fiscal_year, start/end_date, total_amount, status enum('draft','approved','active','closed'), approved_by/at. `budget_lines` (schema 1073-1092): budget_id, **account_id → chart_of_accounts**, budgeted_amount, actual_amount, variance, utilized_amount, utilization_percentage, remaining_amount. `budget_utilization_log` records each utilization event (schema 1094-1110).
- Flow: `Budget_management::create` (status draft) → `add_line`/`update_line`/`delete_line` recompute `budgets.total_amount = SUM(budgeted_amount)` (`Budget_management.php:110-161`) → `approve` sets status approved (`:170-183`). **Setting status 'active'/'closed' has no UI** — approve leaves it 'approved'.
- **Two budget integration models disagree:** `Budget_integration` library joins `budgets b ON budget_lines.budget_id = b.id` and `budget_lines.allocated_amount` (`Budget_integration.php:45-58, 98-102`) — but the real PK is `budget_id` and the column is `budgeted_amount` (`Budget_management.php:111-124`), so `find_matching_budget_line`/`check_budget_limit`/`get_budget_performance` (Advanced_reporting `:92-101`) **query non-existent columns/keys**. Meanwhile `Budget_management::get_actual_spent` uses `actual_amount` (`:163-168`), which nothing increments — only `Budget_integration::update_budget_utilization` (dead) would update `utilized_amount`. **Budget-vs-actual is effectively non-functional**; `get_budget_vs_actual` (`Budget_integration.php:117-127`) also filters `e.status='approved'` against `expenses_enhanced` via `e.budget_line_id` (valid column) but the join key mismatch on budgets breaks it.
- Auth boundary pinned by `tests/budget-management-auth-boundary.test.js:22-57`.

### 5.4 Bank reconciliation — `Bank_reconciliation.php`

**[VERIFIED LEGACY BEHAVIOR]**

- Admin-gated constructor (AJAX 401 / redirect 302, `Bank_reconciliation.php:13-29`).
- Data: `bank_accounts` (schema 704-727; `account_type` enum checking|savings|credit_card|mobile_money, currency default 'GHS', `chart_account_id` link), `bank_transactions` (schema 759-781; deposit|withdrawal|transfer|fee|interest, `is_reconciled`, `reconciled_by/at`), `bank_reconciliations` (schema 735-756; statement_balance, book_balance, difference, reconciled_items_count/amount, status pending|completed|reviewed, reconciled_by, reviewed_by/at), `reconciliation_items` (schema 5349-5365; transaction_type book|bank, debit, credit, amount, matched, matched_with_id).
- Flow: `create` computes `difference = statement_balance - book_balance` (status pending, `Bank_reconciliation.php:64-84`) → `add_item` adds book/bank lines (`:155-173`) → `toggle_match` / `auto_match` (matches opposite-type items with identical amount **and** date, `:223-251`) → `complete` counts matched items & sums amounts, sets status completed (`:106-133`) → manual `reviewed` status exists in schema but **no UI sets it**.
- A second, unused reconciliation API exists on `Accounts_model::get_unreconciled_transactions/reconcile_transactions` against `bank_transactions.is_reconciled` (`Accounts_model.php:649-676`).
- Auth boundary pinned by `tests/bank-reconciliation-auth-boundary.test.js:22-61` (constructor-level auth for all 13 routes; dedicated CI workflow `.github/workflows/bank-reconciliation-auth.yml`).

**[RECOMMENDATION]** Unify on one expense module (approval + budget check pre-approval), fix the budget schema (budget_id/budgeted_amount) and wire utilization, and treat bank rec as statement-import → auto-match by amount/date/reference → review → post adjustments as journal entries.

---

## 6. Payment gateways

### 6.1 Surface & retirement of legacy gateways

**[VERIFIED LEGACY BEHAVIOR]** — `Payment_gateway.php` (shared student/parent portal + admin views):

- **Actors:** `pay_invoice` requires student_login or parent_login (`Payment_gateway.php:207-210`); parents are scoped to their children via `resolve_payment_student_id` (student: own session id; parent: must match `student.parent_id`, `:217-240`); payer identity (name/email/phone) always loaded from DB, never from POST (`:258-274`; pinned by `tests/parent-hubtel-payment-safety.test.js:54-63`).
- **Retired endpoints return HTTP 410** `legacy_gateway_disabled`: `initiate_momo_payment`, `momo_callback`, `initiate_paystack`, `paystack_callback`, `webhook_mtn`, `webhook_vodafone`, `webhook_paystack` (`:54-68`, 191-201, 306-320; pinned by `tests/payment-gateway-surface-safety.test.js:38-62`).
- **Status endpoints are read-only:** `verify_hubtel` / `check_status` authenticate student/parent/admin and enforce ownership (transaction.student_id or parent-child) and `gateway='hubtel'` (`:142-171`, 276-304) — "Provider callback processing is the only path that may settle money" (`:138-141`).

### 6.2 Hubtel collection (the hardened path) — `Hubtel_payment_model`

**[VERIFIED LEGACY BEHAVIOR]** — `application/models/Hubtel_payment_model.php`:

- **Initiation (`initiate_invoice_payment`, `:28-139`):** server-side invoice lookup by (invoice_code, student_id, not trash); refuses `due <= 0`, amount ≤ 0 or amount > due; refuses unconfigured credentials; generates `HUB-COL-` + 24 hex chars of `random_bytes` (`:366-369`); normalises Ghana phone to 233xxxxxxxxx (`:371-378`); persists a `payment_transactions` intent (status pending) **before** calling Hubtel; POSTs to `settings.hubtel_payment_receive_url` (fallback `https://api.hubtel.com/v1/merchantaccount/merchants/{merchant}/receive/mobilemoney`, `:81-87`) with Basic auth (`client_id:client_secret`, `:332-336`); callback URL embeds `?token=` (`:96`); accepts 2xx + curl-ok + `hash_equals(returned ref)` + whitelisted response codes 0000/0001/00/0/200/201 (`:107-115`); stores `gateway_ref` + full response JSON.
- **Callback auth (`handle_callback`, `:141-189`):** parses JSON; extracts ClientReference; **validates an HMAC-SHA256 token** `hash_hmac('sha256', "hubtel-collection|{merchant}|{ref}", client_secret)` with `hash_equals` **before any settlement** (`:160-164`, token builder `:352-364`); 403 `invalid_callback_token` on mismatch. Then: intent lookup (404), amount equality within 0.005 (409 `amount_mismatch`, recorded for review), provider success gate (codes 0000/00/0 + status success/successful/completed/complete/paid; anything else recorded `provider_not_successful` and returned 200 not-settled, `:179-186`).
- **Settlement (`settle_transaction`, `:213-317`):** DB transaction with `SELECT ... FOR UPDATE` on the intent row; idempotent (`already_settled` if status success; duplicate check on `payment.transaction_id = transaction_ref`); re-locks the invoice row FOR UPDATE and re-validates amount ≤ due ("invoice_balance_conflict"); inserts a `payment` row (`payment_method='hubtel'`, `payment_type='income'`, `can_delete='no'`) via `only_existing_fields` schema-tolerant writer (`:380-389`); updates invoice `amount_paid`/`due`/`status` paid|due; writes the student-ledger credit (`Finance_model::update_student_ledger_for_payment`) **inside the transaction** and rolls back on ledger error (`:296-299`); marks intent success with response payload; any Throwable → rollback + 500 `settlement_failed` + error log. **Note: this path does not create a journal entry / chart-of-accounts posting** — it only writes `payment` + `student_ledger` (the `synced_to_accounts` JE hook is not invoked here).
- Payout side (out of scope for collections but same model family): `Hubtel_payroll_payout_model::initiate_payout` requires approved payroll, `HUB-PAY-` refs, `payroll_payout_transactions` ledger, configured send URL with `{mobileNumber}` placeholder, callback to `payroll_payout/hubtel_callback` (`Hubtel_payroll_payout_model.php:28-147`; callback handler `:162-310` marks payroll paid only on provider success, records failures for reconciliation).

### 6.3 Legacy gateway model (largely superseded) — `Payment_gateway_model`

**[VERIFIED LEGACY BEHAVIOR]** — `application/models/Payment_gateway_model.php`:

- MTN MoMo: sandbox requesttopay call with Bearer key from settings (`:87-122`); Vodafone/AirtelTigo are **stubs returning success** (`:124-134`); `process_momo_callback` trusts POSTed `status` with **no signature/HMAC verification** and calls `complete_payment` (`:136-151`) — retired at the controller layer (§6.1) but the unsafe model code remains.
- Paystack: initialize + `callback_url` (`:154-205`), callback verification (`:207-260`), manual verify (`manual_verify_transaction` used by `Payment_gateway::transactions/verify`, `Payment_gateway.php:183-187`).
- Gateway CRUD (`get_active_gateways` etc., `:262-463`).
- `Stripe_model::pay` marks any invoice paid after a stripeToken POST and zeroing `due` (`Stripe_model.php:14-49`) and `Paypal_model::pay` sets paid **without any payment verification at all** (`Paypal_model.php:12-27`) — both are legacy portal paths (`Parents.php`/`Student.php` views) that pre-date the hardening; they create no `payment` row and no journal entry.

### 6.4 Data capture

**[VERIFIED LEGACY BEHAVIOR]** — `payment_transactions` (schema 4672-4697): `transaction_ref` (unique ref), `student_id`, `invoice_code`, `amount`, `gateway` enum('hubtel','mtn_momo','vodafone_cash','airteltigo_money','paystack','stripe','flutterwave'), `gateway_ref`, `phone_number`, `network`, `status` enum('pending','success','failed','cancelled'), `response_data` JSON. `hubtel_transaction_logs` (schema 3092-3101) stores raw req/res per ref (written by older Hubtel code paths). `mobile_money_payment` (schema 4249-4270) is a MyISAM legacy mirror of momo receipts (`mo_a_paid`, `t_id`).

**[RECOMMENDATION]** Keep the Hubtel collection design as the reference: server-priced intents → provider callbacks with reference-bound HMAC token → row-lock + idempotent settle + amount re-validation → single payment record. Add: journal posting inside the settle transaction, webhook signature allow-listing per provider, and delete the retired gateway code (PayPal/Stripe models, momo stubs) rather than carrying 410 endpoints forever.

---

## 7. Invoice delivery & public tokens

**[VERIFIED LEGACY BEHAVIOR]**

- **Email — `Invoice_email.php`** (admin-gated constructor, AJAX 401 / redirect 302, `Invoice_email.php:12-28`): recipients chosen among student/guardian/father/mother emails from `student` columns (`:54-77`); HTML built from `views/email_templates/invoice_email.php`; SMTP config from settings (`:91-105`); per-recipient `email_log` rows (`:109-118`); `bulk_send` loops `send_single` (student email only) (`:133-173`). No PDF attachment — link/HTML only.
- **SMS + public link — `Invoice_sms.php`** (admin-gated `:11-27`): generates a 64-hex-char token `bin2hex(random_bytes(32))` with 7-day expiry and stores it in `invoice_access_tokens` (`:53-63`); SMS body "Invoice #CODE from SCHOOL. View & download: {url} (Valid for 7 days)" (`:101-103`); sends via generic settings-driven SMS API (`sms_api_key/sender_id/url`) and logs to `invoice_sms_log` (`:109-124`, 136-165).
- **Public invoice — `Public_invoice.php`** (no auth by design): `view($token)` validates token + `expires_at > time()` then renders the **admin** `modal_view_invoice_professional` view with the token's invoice_code (`Public_invoice.php:11-25`). Tokens are single-purpose but **not one-time** (reusable until expiry), not revoked on payment, and the rendered view is a backend admin partial (layout leakage risk). No rate limiting/auditing of token views.
- Schema: `invoice_access_tokens` (schema 3531-3547: invoice_code, token char(64), expires_at int, created_at int; MyISAM, flagged for InnoDB conversion in `application/migrations/20261022_convert_enabled_sync_myisam_to_innodb.sql:34`); `invoice_sms_log` (schema 3705-3722: recipient, message, type, reference_id, sent_at, status).
- Payment-time SMS: take_payment sends a balance SMS to the parent (`Admin.php:14956-14979`); the newer `Payment_sms_automation` library + `sms_templates.sql` provide templated automation (`application/libraries/Payment_sms_automation.php`, `application/sql/sms_templates.sql`).
- Auth boundary pinned by `tests/invoice-delivery-auth-boundary.test.js:35-48` (both controllers must authenticate before any delivery; dedicated CI workflow).

**[RECOMMENDATION]** Replace token-in-SMS with signed short-lived links bound to invoice + payer, one-time or revocable, rendered by a dedicated public controller (not an admin partial), with view auditing; email should attach the PDF invoice.

---

## 8. Financial reports catalogue

**[VERIFIED LEGACY BEHAVIOR]**

| Report | Producer | Notes |
|---|---|---|
| Accounts Receivable (billed invoices + FCT arrears, filterable class/student/term/residence, export) | `Financial_report_model::accountsReceivables` (`Financial_report_model.php:24-139`) + views `reports/get_receivables*.php`; UI `Admin::financial_reports('receivables')` (`Admin.php:24903-24965`) | FCT arrears from `daily_fee_wallet.*_arrears` (`:149-174`); billed from `invoice.due` |
| Accounts Payable (payable/refund mirror of receivables) | `Financial_report_model::accountsPayables` (`:463-717`), `Admin.php:24861-24901` | Mirrored *_payable queries |
| Payments report (by date/type/class/method/bill item) | `Financial_report_model::paymentsReport` (`:718-1187`) | Feeds `reports/get_payments_detailed.php`, pivot, monthly-by-item views |
| Income & Expenditure | `Financial_report_model::incomeExpenditure` + `getIncomeItems/AmountByItem`, `getExpenditure*` (`:1188-1279`); UI `Admin.php:24967+` | payment vs payment(Expense) |
| Item collections breakdown / payment-method breakdown | `getAllInvoiceItemsReceived`, `getTotalAmountReceivedForItem`, `getPaymentMethodBreakdown` (`:1299-1460`) | |
| Class termly bills / admission bills | `getBillsForNewAdmission`, `getTermlyClassBillsForStudent`, `getClassTermlyBillsByResidenceTypeBatchInsertArray`, `getPreviousBillsHistory` (`:1461-1695`) | Power the admission-bill preview (`Admin::getAdmissionBillPreview` `Admin.php:28492`) |
| Trial balance / Income statement / Balance sheet / General ledger | `Accounts_model::get_trial_balance` (`:764`), `get_income_statement` (`:710`), `get_balance_sheet` (`:679`), `get_general_ledger` (`:804`) | Accounting-core generation |
| Cash flow | `Accounts_model::get_cash_flow` (`:749`) — returns empty skeleton | Not implemented |
| Advanced: financial summary, cash flow (payment/expense diff), aging, category expenses, payment-method analysis, student financial profile | `Advanced_reports.php` controller (`Advanced_reports.php:21-83`) over `Advanced_reporting.php` library (`Advanced_reporting.php:16-291`), export via `export_report` | Aging buckets by `due_date` (`Advanced_reporting.php` aging section); library queries compare `timestamp >= 'Y-m-d'` against unix columns (string-vs-int comparison — works only accidentally in MySQL) |
| Income/expenditure dashboards (charts) | `Admin::income_dashboard/get_income_stats/get_income_trend/get_revenue_breakdown` (`Admin.php:16362-16600`), `expenditure_dashboard` + trend/category/top (`Admin.php:16601-16997`) | JSON feeds |
| Cashier dashboards/handover | `Admin::cashier_dashboard_admin`, `get_cashier_dashboard_data`, `cashier_daily_summary`, `save_handover_report`, `export_cashier_summary` (`Admin.php:286-485`) | Level-4 cashier analytics |
| Student statements/bill reports | `Admin::student_bill_report(_bulk)`, `student_invoice`, `invoice_summary($student_id,$invoice_code)` (`Admin.php:16319-16361`, 36241) over `invoice_summary` view (`application/sql/invoice_summary_view.sql:1-28`) | View aggregates per invoice_code with payment_status paid|partial|unpaid |
| Credit system reports | `Credit_model::get_students_with_credits/get_credit_statistics` (`Credit_model.php:325-380`), `Admin::student_credits` (`Admin.php:40572`) | |
| Aging report view | `views/backend/admin/aging_report.php` | |
| Monthly admin report (cron) | `Finance_cron::monthly_tasks` → `Finance_cron_model::generate_admin_report` (`Finance_cron.php:187-228`; `Finance_cron_model.php:6-104`); overdue check + late fees + reminders `Finance_cron.php:43-114` (guarded by `is_allowed_ip` `:24`) | |

**[RECOMMENDATION]** Rebuild the catalogue on the single ledger with a proper reporting star (fact: journal lines; dims: class/student/item/term/method), period-aware aging, and server-side CSV/XLSX export. Preserve receivables/payables semantics (billed vs FCT) during migration as two AR sub-ledgers.

---

## 9. Tables & columns (finance domain, from `schema/schoolmanager_schema_redacted.sql`)

| Table (line) | Key columns | Engine | Purpose |
|---|---|---|---|
| `invoice` (3463) | invoice_id PK; invoice_code bigint; student_id; title; description; amount double; discount; amount_paid; credit_applied dec(10,2); original_due/net_due **generated stored**; due double; due_date date; discount_applied; benefit_* denorm; creation/payment_timestamp int; payment_method; status varchar(30); residence_type enum; year/term/sem/class_id; mute; can_delete enum(default,request,approved,declined,trash); can_edit enum(default,request,approved,declined); delete/edit_request_issuer_id; locked_at/locked_reason; approval_status/requested_by/at/handled_by/at/notes; synced_to_ledger/ledger_entry_id; sync_status/last_modified_at/last_modified_by/device_id/version/retry_count/sync_error | InnoDB | Termly bill line items |
| `payment` (4524) | payment_id PK; expense_category_id; title; payment_type (income/Expense); invoice_id; account_id; journal_id; invoice_code; receipt_code bigint; student_id/class_id; payment_method text; is_printed/is_emailed/printed_at/emailed_at; synced_to_accounts; journal_entry_id; synced_at; receipt_id; installment_id; transaction_id; bank_name; cheque_number; description; amount double; issuer_id; account_type; due double; timestamp/day_timestamp int; residence_type; year/term/sem; can_delete/can_edit enums + request issuer ids; locked_at/locked_reason; approval_*; sync_* | InnoDB | Receipts & expenditure records |
| `bill_item` (881) | id PK; title varchar(50); description; bill_category_id; class_category; specific_class_ids text; amount double; sync_* | InnoDB | Fee-structure catalogue |
| `bill_item_history` (910) | id; bill_item_id; class_id; term; year; bill_item_amount double; timestamp; residence_type enum(Day,Boarding,Both) | InnoDB | Per-term per-class price snapshot |
| `bill_category` (857) | category grouping of bill items | — | |
| `fee_structures` (2598) | structure_id; class_id; academic_year; term; fee_items JSON mediumtext; total_amount; is_active; created_by | InnoDB | Parallel JSON fee structure (rarely used) |
| `invoice_access_tokens` (3531) | id; invoice_code; token varchar(64); expires_at int; created_at int; sync_* | **MyISAM** | Public invoice links |
| `invoice_discounts` (3552) | discount_id; student_id; invoice_code; discount_category enum(invoice,daily_fees); profile_id; replacement_discount_id; discount_method enum(percentage,fixed); discount_value; discount_amount; reason; applied_by/created_by; applied_at; approved_by/at; status enum(pending,approved,rejected,pending_removal); rejection_reason; year/term; sync_* | InnoDB | Discount snapshot per invoice |
| `invoice_discount_items` (3592) | id; discount_id; invoice_id; invoice_code; student_id; item_title; original_amount; discount_amount; discounted_amount; created_at | InnoDB | Per-item discount breakdown |
| `invoice_modification_requests` (3623) | request_id; invoice_code; student_id; request_type enum(edit,delete); requested_by; request_reason; old_data/new_data JSON; status enum(pending,processing,approved,declined); reviewed_by/comment/at; created_at | InnoDB | Hardened edit/delete workflow |
| `invoice_payment_audit_log` (3657) | id; record_type enum(invoice,payment); record_id; action enum(create,edit,delete,lock,unlock,approve,reject); performed_by; performed_at; old_data/new_data (utf8mb4_bin longtext); notes; ip_address | InnoDB | Lock/unlock audit |
| `invoice_payment_links` (3683) | id; invoice_id; payment_id; amount; linked_at; linked_by | InnoDB | Payment allocation (defined, not used by take_payment) |
| `invoice_sms_log` (3705) | id; recipient; message; type; reference_id; sent_at; status | **MyISAM** | Invoice SMS log |
| `invoice_summary` (3728) | view (SQL at `application/sql/invoice_summary_view.sql`) | — | Per-invoice_code aggregates |
| `chart_of_accounts` (1160) | account_id; account_code varchar(20); account_name; account_type enum(asset,liability,equity,revenue,expense); account_category; parent_account_id; is_active; opening_balance/current_balance dec(15,2) | InnoDB | COA |
| `journal_entries` (3752) | entry_id; entry_number varchar(50); entry_date; entry_type enum(general,adjustment,closing,opening,reversal); reference_type/id; source_type/id; total_debit/total_credit dec(15,2); status enum(draft,posted,void); posted_by/at; fiscal_year/period; created_by/at | InnoDB | Journal headers |
| `journal_entry_lines` (3785) | line_id; entry_id; account_id; debit_amount/credit_amount dec(15,2); description | InnoDB | Journal lines |
| `finance_audit_trail` (2644) | audit_id; table_name; record_id; action; old_values/new_values JSON; user_id; user_type; ip_address; created_at | — | Accounting-core audit |
| `student_ledger` (5988) | ledger_id; student_id; transaction_date; transaction_type enum(invoice,payment,discount,credit_note,adjustment,refund); reference_type/id; description; debit/credit dec(10,2); balance dec(10,2); year/term; created_by/at | InnoDB | Student sub-ledger |
| `student_credits` (5867) | credit_id; student_id; credit_amount dec(10,2); source_payment_id/receipt_code/invoice_code; applied_amount; remaining_amount **generated stored**; status enum(active,fully_applied,expired,cancelled); expires_at; notes | InnoDB | Overpayment credits |
| `credit_applications` (1305) | credit↔invoice application rows (used by Credit_model) | InnoDB | |
| `credit_notes` (1334) | credit_note_id; credit_note_number 'CN-Ymd-####'; student_id; invoice_id; amount; reason; status pending|approved|applied|cancelled | — | Credit notes (Finance_model `:475-525`) |
| `student_credit_summary` (5901) | view | — | |
| `accounts` (187) | account_id; bank_name; branch; account_name; account_number; account_type int; opening/current_balance double; account_is_bank; account_is_transferrable | **MyISAM** | Legacy money accounts |
| `accounts_payable` (214) | payable tracking (legacy) | — | |
| `general_journal` | **not in schema dump** (prod-only; written by Expenditure_model:136,153) | — | Legacy double-entry |
| `v_expenditure` / `v_expenditure_list` | **not in schema dump** (views used as tables by Expenditure_model) | — | |
| `expenses_enhanced` (2476) | id; expense_date; description; category_id; budget_line_id; vendor; amount dec(10,2); payment_method; reference_number; attachment; notes; status enum(pending,approved,rejected); requested_by; approved_by/at; rejection_reason; linked_at | InnoDB | Enhanced expenses |
| `expense_categories_enhanced` (2504) | id; name; description; budget_code; requires_approval; approval_threshold; is_active | InnoDB | |
| `expense_category` (2526) | expense_category_id; name; icon; description | — | Legacy categories |
| `budgets` (1051) | budget_id; budget_name; fiscal_year; start/end_date; total_amount dec(15,2); status enum(draft,approved,active,closed); approved_by/at; created_by | InnoDB | Budget headers |
| `budget_lines` (1073) | budget_line_id; budget_id; **account_id**; budgeted_amount dec(15,2); actual_amount; variance; utilized_amount dec(10,2); utilization_percentage; remaining_amount | InnoDB | Budget lines |
| `budget_utilization_log` (1094) | id; budget_id; budget_line_id; expense_id; amount; description; recorded_by/at | — | Utilization events |
| `bank_accounts` (704) | bank_account_id; account_name; bank_name; account_number; account_type enum(checking,savings,credit_card,mobile_money); currency default 'GHS'; opening/current_balance; chart_account_id; is_active; branch; swift_code | InnoDB | Bank accounts |
| `bank_transactions` (759) | transaction_id; bank_account_id; transaction_date; transaction_type enum(deposit,withdrawal,transfer,fee,interest); amount dec(15,2); balance_after; reference_number; description; payee_payer; journal_entry_id; is_reconciled; reconciled_by/at/date | InnoDB | Statement lines |
| `bank_reconciliations` (735) | id; bank_account_id; reconciliation_date; statement_date; statement_balance; book_balance; difference; reconciled_items_count/amount; status enum(pending,completed,reviewed); reconciled_by; reviewed_by/at; notes | InnoDB | Rec sessions |
| `reconciliation_items` (5349) | id; reconciliation_id; transaction_id; transaction_type enum(book,bank); transaction_date; description; debit; credit; amount; matched; matched_with_id | InnoDB | Rec lines |
| `payment_transactions` (4672) | transaction_id; transaction_ref varchar(100); student_id; invoice_code; amount dec(10,2); gateway enum(hubtel,mtn_momo,vodafone_cash,airteltigo_money,paystack,stripe,flutterwave); gateway_ref; phone_number; network; status enum(pending,success,failed,cancelled); response_data | InnoDB | Gateway intents |
| `payment_plans` (4644) | plan_id; student_id; invoice_code; total_amount; installments; paid_installments; frequency enum(weekly,monthly,quarterly); start_date; status | InnoDB | Installment plans |
| `payment_installments` (4593) | installment_id; plan_id; installment_number; amount; due_date; paid_amount/date; status enum(pending,paid,overdue,partial); late_fee | InnoDB | |
| `payment_methods` (4618) | id; name; icon; is_active; display_order | InnoDB | |
| `mobile_money_payment` (4249) | mo_id; invoice_code; student_id; method; mo_a_paid double; t_id; date_time/timestamp/year/term/sem longtext | **MyISAM** | Legacy momo mirror |
| `hubtel_transaction_logs` (3092) | log_id; transaction_ref; request_data/response_data mediumtext; response_code; status | InnoDB | Raw gateway logs |
| `incomplete_fee_transactions` (3108) | id; student_id; fees text (JSON breakdown); tendered dec(10,2); payment_method; payment_date varchar(50); status varchar(20); created_at/by | **MyISAM** | Abandoned-cash-drawer recovery (see §10) |
| `daily_fee_transactions` (1574) | id; transaction_code; student_id; payment_date int; feeding/breakfast/classes/water/transport_amount dec(10,2); total_amount; payment_type enum(arrears,current,advance,mixed); payment_method int(1 cash,2 cheque,3 momo,4 bank); collected_by; collection_point enum(classroom,office,bus); receipt_number; year/term; residence_type; notes; synced_to_accounts/journal_entry_id/synced_at | InnoDB | Daily-fee receipts |
| `daily_fee_wallet` (1621) | per-student feeding/breakfast/classes/water/transport **balance + arrears** columns | InnoDB | Daily-fee wallet |
| `daily_fee_audit_log` (1503) | student_id; fee_type; action_type; amount; created_at (source of truth for recovery) | — | |
| `discount_profiles` (1865) / `discount_profile_rules` (1898) / `student_discount_assignments` (5945) / `discount_applications` (1719) / `discount_audit_log` (1784) / `discount_audit_trail` (1812) / `discount_categories` (1838) / `discount_approvals` (1757) / `discount_summary_cache` (1925) | see §3 | InnoDB | Discount system |
| `tax_brackets` (6373) | country; min_income; max_income; rate; fixed_amount; effective_from/to; is_active | — | PAYE (payroll; `Tax_calculator.php:53-83`) |
| `late_payment_settings` (3844) | grace_period_days; late_fee_type enum(fixed,percentage); late_fee_value; reminder_days; restrict_exams | — | Late-fee engine (`finance_helper.php:82-97`, `Finance_cron.php:73-87`) |
| `finance_dashboard_cache` (2663) | cached dashboard aggregates | — | |
| `unlock_requests` | record_type; record_id; action_type; requested_by; reason; status (written by `unlock_helper.php:5-18`) | — | Unlock approvals |
| `financial_audit_trail` | module; action; record_id; old_values; new_values; user_id; user_type; ip_address; user_agent (Expense/Budget/BankRec audit, `Expense_management.php:282-294`) | — | Distinct from `finance_audit_trail` |
| `financial_integration_log` | integration_type; source_table/id; target_table/id; status; error_message (hook logging, `Financial_integration_hooks.php:693-706`) | — | |

**Absent-from-dump but referenced by code** (must be captured from prod before migration): `general_journal`, `v_expenditure`, `v_expenditure_list`, `discount_types` (G2 models), `discount_modification_requests`, `unlock_requests` (some created by migrations not in the dump), `payment_sync`-related columns.

---

## 10. `incomplete_fee_transactions` & Transaction_recovery

**[VERIFIED LEGACY BEHAVIOR]**

- `incomplete_fee_transactions` (schema 3108-3126, MyISAM) stores *abandoned cashier sessions*: JSON `fees` breakdown, `tendered`, `payment_method`, `payment_date` (varchar), `status`, `created_at/by`. It is a draft-parking table for the daily-fee cashier workspace (written by the cashier flow, recovered by `Cashier.php`); it is **not** used by the termly invoice path.
- `Transaction_recovery.php` is a **privileged one-off maintenance tool**, not a generic recovery engine:
  - Constructor: admin_login + **admin.level === 1** enforced with 401/403 AJAX responses and redirects; 300s time limit (`Transaction_recovery.php:13-64`). Pinned by `tests/transaction-recovery-boundary.test.js:24-60` (super-admin gate, POST-only mutation, CSRF token in UI, CI workflow).
  - `process()` is **hard-coded to target date '2026-05-04'** (`Transaction_recovery.php:114`, `:299`) — it repairs a specific incident where `daily_fee_transactions` rows were lost while their journal entries survived: finds `journal_entries` with `source_type='daily_fee_prepayment'` for that date whose `source_id` has no matching `daily_fee_transactions.id` (`:129-151`), re-derives the per-fee breakdown **from `daily_fee_audit_log` as source of truth** (last payment entry per fee type, `:259-293`), inserts reconstructed `daily_fee_transactions` rows with `transaction_code='RECOVERED-{entry_number}'` and `payment_type='advance'` (`:194-227`), skipping duplicates by id or (student, payment_date) (`:169-183`), then recalculates wallets from that date (`:229-246`).
  - True idempotency semantics: journal entries are the recovery source; audit log is the amount source; wallets are rebuilt, never incremented.

**[RECOMMENDATION]** Productize this: generic date-range reconciliation of journal↔transaction gaps with a review queue (never auto-insert), and drop the hard-coded date. Keep the invariant "journal entries + audit log can reconstruct any collection".

---

## 11. Money & currency presentation

**[VERIFIED LEGACY BEHAVIOR]**

- **Currency string is a settings row:** `settings.type='currency'` → `description` (e.g. `GH₵`), read in nearly every controller/view (`Admin.php:12058`, `14245`, `Bulk_receipts.php:64`, `receipt_3.php:341`, `finance_helper.php:77`, `daily_fee_stats_helper.php:10` …). A second key `system_currency` appears in two older spots (`Admin.php:7919`, `7973`).
- **Formatting is mixed:**
  - ICU `NumberFormatter('en_US', CURRENCY)` + `numfmt_format_currency($fmt, $amount, $currency)` in receipt/invoice/bulk-receipt views (`Admin.php:12059`, `Bulk_receipts.php:65,96`, `receipt_3.php:703-803`) — with the legacy symbol passed as a "locale currency", which yields odd output for `GH₵` (ICU falls back to `¤` or raw string depending on ICU data).
  - Manual `'currency . ' ' . number_format($amount, 2)` elsewhere (`Admin.php:14956`, `finance_helper.php:75-80`, `billing_helper.php:50-54`, `daily_fee_stats_helper.php:60-144`).
  - **Hard-coded `GH₵` literals** in credit UI, notifications and discount labels (`Admin.php:40752-41472`, `Notification_model.php:91-167`, `Credit_model.php:82-415`, `Invoice_discount_model.php:64`, `Daily_fee_discount_model.php:58`, `Dining_coupon.php:517`) — currency setting changes do not propagate there.
  - Exports hard-code `'GHS '` prefix (`Expense_management.php:258`, `Budget_management.php:222`).
- **Amount-in-words:** `addCurrencyInWords($currencyType, $amount)` maps GHC/GHS/₵/GH₵ → "Ghana Cedis/Pesewas", USD → Dollars/Cents, used on receipts (`application/helpers/user_validation_helper.php:667-710`, `receipt_3.php:749-759`); a second `number_to_words` exists in `finance_helper.php:9-73` with different output format.
- **Money columns are inconsistently typed:** `invoice.amount/amount_paid/due` are **DOUBLE** (float), `invoice.credit_applied` and all `*_enhanced`/credit/ledger amounts are DECIMAL(10,2), journal amounts DECIMAL(15,2), legacy `accounts.current_balance` DOUBLE (schema §9) — float arithmetic on invoice dues is a rounding-hazard invariant to fix.
- **`incomplete_fee_transactions.tendered`** suggests cash-change handling in cashier flow (see `tests/cashier-cash-change-helper.test.js`, `cashier-cash-variance-closeout.test.js`).

**[RECOMMENDATION]** One `currencies` table + per-tenant currency; store integer minor units; render through a single formatter; drive amount-in-words from the same currency record; never hard-code symbols.

---

## 12. Legacy quirks to retire (consolidated)

1. **Four accounting generations co-exist** (`accounts`+`general_journal`, `chart_of_accounts`+`journal_entries`, `student_ledger`, `financial_audit_trail` vs `financial_audit_trail` vs `invoice_payment_audit_log`) — §1, §9.
2. `invoice` is a line-item table keyed by string `title` joins, one code per student/term; `payment` doubles as expense ledger (`payment_type='Expense'`) — §2.1, §5.1.
3. Invoice-code = MAX+1 bigint with leading-zero padding, retry-loop uniqueness, seed from `settings.invoice_number_format`; two incompatible generators (`finance_helper::generate_invoice_code` vs controllers) — §2.2, §2.3.
4. Batch billing runs with **no DB transaction**; partial failures leave half-written bills — §2.2 step 10.
5. Re-billing **hard-deletes unpaid invoice rows** and rewrites amounts in place; gross amounts unrecoverable except via `invoice_discount_items` — §2.2 steps 5-7.
6. `Admin::invoice('do_update')` bypasses locks/approvals (raw amount/due/status edit) — §2.3.
7. Status vocabulary drift: 'paid'/'unpaid' vs 'due' vs generated `net_due` vs `original_due` generated columns coexisting — §2.8.
8. Discount generations G1/G2 are half-dead but still autoloaded; `Discount_approval_model`/`Invoice_discount_model` join non-existent tables (`students`, `users`, `discount_types` columns); `Discount_temporal_model` expects columns no writer creates — §3.1, §3.3.
9. Discount baking mutates invoice gross; approval = admin.level==1 hard-coded; approval invariants only partially migrated (`discount_approval_invariants.sql`) — §3.2-3.3.
10. Account 2040 (Unearned Revenue) missing from the auto-seed map → fatal `sync_daily_fee` on fresh DBs; revenue recognition (`recognize_daily_fee_revenue`) never called — §4.1-4.2.
11. Hook-created journal entries bypass transactions and the `draft→posted` gate; entry-number formats collide (JE-{Ym}-#### vs JE-INV-…) with no uniqueness constraint — §4.2.
12. Two audit trails with near-identical names (`finance_audit_trail`, `financial_audit_trail`) used by different modules — §4.2, §5.2.
13. `Accounts_model::get_cash_flow` returns an empty skeleton; `get_budget_vs_actual`/`check_budget_limit`/`get_budget_performance` join non-existent `budgets.id`/`budget_lines.allocated_amount` — budget-vs-actual broken — §4.4, §5.3.
14. `Budget_management` has no path to status 'active'/'closed'; `actual_amount` never incremented — §5.3.
15. Expense approval has **no self-approval guard**; two expense systems (legacy `Admin::expense*` on `payment` + `expenses_enhanced`) — §5.2.
16. Expenditure model writes to views as tables (`v_expenditure`), magic account row 'General Vehicle Expenses' by name, strict `>` balance check, no transaction — §5.1.
17. Bank-rec 'reviewed' status unreachable; auto-match matches book↔bank lines rather than statement↔ledger; second unused reconciliation API on Accounts_model — §5.4.
18. Legacy gateways: `Paypal_model::pay` marks invoices paid with zero verification; `Stripe_model::pay` trusts a posted token; momo callback trusts POSTed status; stub Vodafone/AirtelTigo APIs return success — §6.3 (controller retirement via 410 confirmed).
19. `take_payment` momo fallback generates a **10-element array** into `momo_transaction_id` (type bug) — §2.4 step 2.
20. Public invoice tokens: reusable 7-day tokens rendered through an admin partial, no revocation on payment, no view audit — §7.
21. `Transaction_recovery` hard-codes '2026-05-04'; `incomplete_fee_transactions` is cashier-session-specific with varchar dates — §10.
22. Currency: settings-string + ICU NumberFormatter + hard-coded `GH₵`/`GHS` literals + two amount-in-words implementations; DOUBLE money columns — §11.
23. `Accountant::invoice_create` runs ~40 hard-coded cache_delete calls after insert — §2.3.
24. `finance_helper::check_payment_restrictions` queries `status='due'` while writers produce 'unpaid'/'paid' — §2.8.
25. `invoice_access_tokens`, `invoice_sms_log`, `mobile_money_payment`, `accounts`, `incomplete_fee_transactions` are **MyISAM** in a mostly-InnoDB schema (`application/migrations/20261022_convert_enabled_sync_myisam_to_innodb.sql:34` only partially converts) — §9.

---

## 13. VERIFIED LEGACY BEHAVIOR vs RECOMMENDATION (parity matrix input)

| # | Area | [VERIFIED LEGACY BEHAVIOR] | [RECOMMENDATION] for iEduPro |
|---|---|---|---|
| V1 | Billing model | `invoice` = per-item rows grouped by bigint `invoice_code` per student/term (`Admin.php:12053+`) | invoice header + items; header carries totals/discount; items immutable once issued |
| V2 | Invoice codes | MAX+1 numeric, zero-prefix preserved, `invoice_number_format` seed (`Admin.php:12147-12211`) | per-tenant numbering sequence w/ unique constraint & gap tolerance |
| V3 | Termly re-bill | Updates existing rows; deletes unpaid items not in new bill (`Admin.php:12371-12437`, 12550-12614) | versioned bill revisions; never delete issued items; credit-note corrections |
| V4 | Payments | Receipt code MAX+1 (seed 100001), FIFO allocation across all owing items, overpay→credit (`Admin.php:14600-14838`) | payment → allocations table → auto-apply oldest-first; credits as first-class wallet |
| V5 | Locking | auto_lock setting → lock paid invoices + receipt rows; unlock via `unlock_requests` approval (`invoice_lock_helper.php`, `unlock_helper.php`) | immutable posted payments; corrections via reversal only |
| V6 | Modification workflow | POST-only requests, level-1 instant execution, FOR UPDATE edit w/ paid-invoice restrictions (`Admin.php:38924-39077`) | keep (already close to target) — add two-person rule & payment-aware reversals |
| V7 | Arrears | billed = Σ invoice.due; FCT = daily_fee_wallet arrears; receivable reports separate (`Financial_report_model.php:24-427`) | unified AR ledger w/ aging; daily-fee receivables as sub-ledger |
| V8 | Discounts | profiles→assignments→bake-into-amount + snapshot (`Admin.php:12261-12359`); level-1 approves (`Discount.php:76-103`) | profiles→assignments(approval)→applications; amounts stay gross |
| V9 | COA | codes 1010/1020/1030/1200/2010/2040/4060/4200-4240/4900/5100 auto-seeded (`Financial_integration_hooks.php:397-428`) | full COA hierarchy seeded per tenant; 2040 must exist before first collection |
| V10 | Posting | JE-INV / JE-PREPAY / JE-REVENUE / JE-REV / JE-REFUND / JE-PURCHASE formats; balanced-only on manual post (`Financial_integration_hooks.php`, `Accounts_model.php:259-262`) | single JE format + DB balanced constraint; post everything through one service; transactional |
| V11 | Daily fees accounting | collection = DR cash CR 2040 (liability); recognition dormant in hooks (active writer inside Daily_fee_model per audit 03) | wire recognition to attendance events; keep liability→revenue two-stage |
| V12 | Expenses | pending→approved (any admin, self-approval allowed) → budget link (broken joins) (`Expense_management.php:141-168`, `Budget_integration.php`) | approval w/ separation of duties + threshold auto-approve; working budget check pre-approval |
| V13 | Budgets | budgets+budget_lines keyed to COA; total recompute on line edit; no activation UI (`Budget_management.php:110-183`) | fiscal-year budgets, commitment+actual tracking, alerts at thresholds |
| V14 | Bank rec | manual statement lines + amount+date auto-match + complete; reviewed unreachable (`Bank_reconciliation.php`) | statement import (CSV/camt), matching suggestions, review workflow, adjustment JEs |
| V15 | Gateways | Hubtel-only live: HMAC-token callbacks, FOR UPDATE idempotent settle, amount re-validation (`Hubtel_payment_model.php`); others 410/stub | keep pattern; add provider signature verification, JE posting in settle, remove dead models |
| V16 | Delivery | admin-only email (SMTP settings) & SMS w/ 7-day token links (`Invoice_email.php`, `Invoice_sms.php`, `Public_invoice.php`) | templated email+PDF, revocable signed links, per-recipient audit |
| V17 | Recovery | super-admin-only, hard-coded date, journal+audit-log reconstruction (`Transaction_recovery.php`) | generalized reconciliation tool + review queue |
| V18 | Currency | settings `currency` string + ICU/manual/hard-coded mix; DOUBLE columns (`Admin.php:12058`, §11) | currency table, minor-unit ints, one formatter |
| V19 | Reports | catalogue in §8; cash flow empty; some date filters compare strings to unix ints | rebuilt on ledger facts; aging + cash flow real; exports server-side |
| V20 | Multi-tenancy | none (no tenant scoping; stray `bill_item.school_id` only) | tenant_id on every finance table + per-tenant COA/numbering/settings |

---

## 14. Test coverage summary

**Finance-relevant suites (static contract tests over source; `node --test`):**

| Test file | Pins |
|---|---|
| `tests/hubtel-collection-safety.test.js` (9 tests) | hardened adapter routing, server-side invoice/amount validation, `random_bytes` refs, FOR UPDATE + idempotent settle, amount/reference checks before mutation, read-only verify endpoint, HMAC callback token (`hubtel-collection|`), token-before-settle ordering, controller passes `php://input` + `?token=` |
| `tests/parent-hubtel-payment-safety.test.js` (11 tests) | parent/child server-side ownership, DB-derived payer identity, Hubtel-only status polling w/ ownership, shared view outside role folders, CSRF-safe form, legacy browser-momo retirement, no webhook.site usage anywhere |
| `tests/hubtel-payroll-payout.test.js` (8 tests) | dedicated payout ledger, approved-payroll-only, configured send URL, reference/amount/recipient binding, explicit success gate, failure persistence, atomic paid-state sync, authenticated initiation/provider-facing callback |
| `tests/payment-gateway-surface-safety.test.js` (5 tests) | authenticated + ownership-validated pay route, 410 retirement helper for momo/paystack, retired webhooks, only configured Hubtel advertised, only hardened form on shared page |
| `tests/bank-reconciliation-auth-boundary.test.js` (3 tests) | constructor-level admin auth (AJAX 401/redirect 302/exit), all 13 routes constructor-protected, dedicated CI workflow + `php -l` |
| `tests/expense-management-auth-boundary.test.js` / `tests/expense-management-mutation-safety.test.js` | constructor auth for all expense routes; POST-only mutations |
| `tests/budget-management-auth-boundary.test.js` (3 tests) | constructor auth for all budget routes, CI workflow |
| `tests/expenditure-auth-boundary.test.js` (3 tests) | constructor auth for expenditure routes, CI workflow |
| `tests/invoice-delivery-auth-boundary.test.js` (3 tests) | Invoice_email + Invoice_sms constructor auth before any delivery, CI workflow |
| `tests/bulk-receipts-auth-boundary.test.js` (3 tests) | Bulk_receipts constructor auth for generate/print routes |
| `tests/transaction-recovery-boundary.test.js` (5 tests) | super-admin gate, POST-only recovery, CSRF token in UI, constructor covers all routes, CI workflow |
| `tests/payment_gateway_surface_behavior_test.php` (PHP) | gateway surface behavior |
| `tests/hubtel_collection_callback_auth_behavior_test.php` (PHP) | PHP-side Hubtel callback auth behavior |
| `tests/payroll-hubtel-ui-authority.test.js` | payroll payout UI authority (who may initiate payouts) |
| Cashier family: `cashier-workspace-contract`, `cashier-dashboard-kpi-contract`, `cashier-cash-change-helper`, `cashier-cash-variance-closeout`, `cashier-recent-receipt-reprint` | cashier KPI/cash-change/variance/reprint contracts |

**Gaps (no automated coverage):** termly bill creation math (discount baking, pro-rata fixed discounts, replacement deletes), take_payment FIFO allocation + overpayment credits, invoice modification apply path, journal balance invariants/trial balance correctness, budget integration, bank-rec matching, invoice token lifecycle, currency formatting, `Transaction_recovery` reconstruction logic (only boundary is tested). **Recommendation:** golden regression tests on allocation/discount math and JE balance before cutover.

---

*End of audit 05. Companion docs: 01-auth-rbac-profiles.md, 02-admission-students-parents.md, 03-attendance-transport.md (daily-fee charge/reversal engine), 04-exams-grading-reports.md.*
