# Legacy Evidence Doc 06 — Payroll & Payout, Ops (Library / Inventory), Communications, Settings & Branding, Reports/Exports, Dining/Boarding/Insurance/Visitor, Cron, HR Self-Service (SchoolManager → iEduPro)

> Audit scope: `payroll + Hubtel payout, library, inventory/store, communications (messages, SMS, notifications, email), settings/branding/system config, reports/exports/printing, dining coupons, boarding/hostel, insurance, visitor tracking, employee/HR self-service, misc controllers, cron, multi-language`.
> Branch audited: `zai/full-platform-reconciliation-20261024` (HEAD ff96b2e). All paths relative to repo root. Schema authority: `schema/schoolmanager_schema_redacted.sql` ("schema :N" = line in that file).
> Research only — no application code was modified.

---

## 1. Overview

This domain is a **mixed bag of one modern subsystem (payroll + Hubtel payout — recently hardened, test-pinned), one genuinely useful ops module (inventory with POS/purchases/returns), one thin legacy module (library: catalogue + requests only, no fines/issue ledger), a Hubtel-only SMS stack with three overlapping notification generations, a large flat key/value settings table with two dead sibling models, HTML-based "PDF" printing (Dompdf wrapper mostly for invoices/reports), and a cluster of small feature stubs (dining coupons, boarding, vehicle insurance, visitor tracker, vestigial HR tables, multi-language)**.

Headline findings:

1. **Payroll money-state is server-authoritative and provider-confirmed**: `pay_salary.approval_status` draft→pending_approval→approved→**paid only via Hubtel callback** (`Hubtel_payroll_payout_model::mark_payroll_paid_from_provider`, application/models/Hubtel_payroll_payout_model.php:258-309). Direct `mark_as_paid` is deliberately blocked (application/models/Payroll_approval_model.php:409-417) and pinned by tests (`tests/payroll-state-lifecycle.test.js`).
2. **PAYE is a real GRA progressive calculator** with DB-driven brackets (`tax_brackets`) + hardcoded Ghana-2024 fallback (application/libraries/Tax_calculator.php:309-361); statutory rates are DB-configurable with snapshotting per payroll row (application/models/Payroll_model.php:158-164).
3. **SMS is 100% Hubtel** at runtime (simple + personalized batch), but the codebase carries **dead Twilio and hubtel-sms-api SDK folders** and **two parallel "SMS templates/automation" generations** (`sms_automations` live vs `sms_templates`/`sms_schedules` unwired).
4. **Email is broken by design**: `Email_model::do_email` hardcodes an SMTP host + **plaintext password in source** (application/models/Email_model.php:96-104) and appends vendor branding to every message.
5. **`get_phrase()` does not translate anything** — it title-cases the key (application/helpers/multi_language_helper.php:10-20); language files exist but are never `lang->load()`ed.
6. Several tables referenced by live code are **absent from the authoritative schema** (`student_residence` for boarding, `v_car_insurance`/`v_vehicle` for insurance, `daily_fee_audit_log` exists but dining coupon joins depend on it); conversely `settings_audit` exists in schema with **no writer anywhere**.

---

## 2. Payroll engine (computation + approval + payout)

### 2.1 Data model — `pay_salary` (schema :4817-4911)

- One row per employee per month (`employee_code` varchar(25) + `month` **month-name string** + `year` int — no unique index; uniqueness enforced only by app-level duplicate check, Payroll_model.php:485-499).
- Allowances: `basic_salary`, `market_premium_allowance`, `teaching_allowance`, `responsibility_allowance`, `rural_allowance`, `extra_class_allowance`, `other_allowances`, `total_allowances`, `gross_salary` (schema :4829-4835).
- Deductions: `ssnit` (Tier-1 employer — comment: "NOT deducted from employee", schema :4837), `tier2_contribution` (+ `tier2_provider_id` FK schema :4838-4839), `loan`, `income_tax`, `get_fund`, `gnat_dues`, `salary_advance`, `nhil`, `welfare_dues`, `other_deductions`, `total_deductions`, `total_deductions_without_ssnit`, `net_salary` ("Gross − (Tier 2 + Other Deductions). Tier 1 is NOT subtracted", schema :4850).
- **Rate snapshots** per row: `rate_ssnit_tier1_employer/employee`, `rate_ssnit_tier2`, `rate_getfund`, `rate_nhil` decimal(5,2) (schema :4851-4855) — written at store time (Payroll_model.php:158-164) for historical accuracy.
- Attendance meta: `working_days`, `days_present`, `days_absent` (schema :4856-4858) — informational only, no auto-proration code found.
- Lifecycle: `status` enum('Paid','Process') default **'Paid'** (legacy quirk — schema :4859) and `approval_status` enum('draft','pending_approval','approved','rejected','paid') default **'paid'** (schema :4860). Application code always writes explicit `'draft'` on creation (Payroll_model.php:155-156), so the schema default is a booby trap for direct SQL inserts.
- Sync/audit columns: `sync_status`, `last_modified_at`, `device_id`, `last_modified_by` (schema :4861-4864), `paid_type` enum('Hand Cash','Bank') default 'Bank' (schema :4867), `paid_by` int, `reference` varchar(30) (schema :4868-4869), plus legacy `sync` enum('yes','no') (schema :4870).

### 2.2 Payslip computation (`Payroll_model::store` — application/models/Payroll_model.php:73-354)

- **Input contract**: POST `payrollMonth` ("YYYY-MM"), `staffData` (CSV of `table_code` tokens, e.g. `teacher_TCH001`; `administrator|admin` both map to `admin` table — Payroll_model.php:110-116), then **one shared set of values applied to every selected employee** (basic salary, allowances, deductions — Payroll_model.php:126-150). There is no per-employee editing in the batch path; per-employee edit exists via `payroll_edit_form`/`payroll_update_ajax` (Admin.php:29486, 29498).
- **Reference generation**: `P{year}/{monthNN}/{3-digit-ts}{4-digit-rand}` — Payroll_model.php:120 (note the dead assignment `$randomNumber = random_int(...)` overwritten in the same statement — quirk).
- **Transaction + whitelist + validation**: `trans_start()` (:100); statutory rates loaded once per batch (:102-104); field whitelisting via `apply_field_whitelist` (:166-167, impl :364-374, list :31-43); `Payroll_validator::validate_payroll_data` (:170-180); Tier-2 provider validation (:182-190, impl :549-581 — provider required iff tier2 > 0, must exist and be active in `pension_tier2_providers`).
- **Duplicate prevention** (Task 7.7): update path checks existing row for (employee_code, month, year) (:197-225); insert path `check_duplicate_payroll` (:213-241, impl :485-499). Admin-side "overwrite existing" endpoint `payroll_overwrite_existing` (Admin.php:30202) exists for the UI.
- **Audit**: field-level before/after diff logged to `payroll_audit_enhanced` on update (:255-280), full-JSON log on create (:286-307); impl `log_audit` (:653-674) captures user, IP, truncated UA. Table has **anti-tamper triggers** preventing UPDATE/DELETE (schema :4739-4750).
- Dashboard file-cache invalidation `payroll_dashboard_{mm}_{yyyy}` on store and delete (:336-339, 619-639).
- **No SMS at creation**: comment "Payment notification is intentionally deferred until mark_as_paid()" (:245) — and `mark_as_paid` itself is now blocked; the only "payment" notification is post-payout (§2.4).

### 2.3 Formulas

- **SSNIT** (`calculate_ssnit_tier1_tier2`, Payroll_model.php:388-410): both tiers computed on **basic salary only**. Tier 1 (employer, default 13%) is employer cost — **never deducted**; Tier 2 (employee, default 5%) is deducted from gross. Rates from `Payroll_statutory_model::get_rates_array` (percent values).
- **Gross/Net** (`calculate_gross_net_salary`, Payroll_model.php:428-445): `gross = basic + total_allowances`; `net = gross − (tier2 + other_deductions)`. These helpers exist but the live batch path trusts the browser-computed POST totals (`totalAllowancesForDb`, `grossSalaryForDb`, `netSalaryForDb` — Payroll_model.php:147-150) — i.e. **client-side math is authoritative for the batch**, a parity risk.
- **PAYE** (`calculate_paye_for_payroll` → `Tax_calculator::calculate_monthly_paye`, Payroll_model.php:456-473; application/libraries/Tax_calculator.php:175-187): monthly×12 → annual progressive brackets → ÷12. Taxable = annual gross − annual SSNIT deduction (:104-107). Brackets loaded from `tax_brackets` (country='Ghana', is_active, effective date window, ordered by min_income — Tax_calculator.php:65-72); **fallback Ghana-2024 annual schedule** 0/5/10/17.5/25/30/35% at 7056/8016/9216/44016/236016/600000 cedi boundaries if DB empty (Tax_calculator.php:309-361). Bracket-by-bracket breakdown available via `get_tax_breakdown` (:200-202) and `get_detailed_calculation` (:212-231). Self-test `validate_calculation` expects GRA example GHS 6,000 gross → GHS 980 PAYE (±1) (:381-399).
- **PAYE is computed for display/preview and stored into `income_tax` only if the form posts it** — the AJAX endpoint `Admin::payroll_calculate_paye` (Admin.php:29664-29731) returns `monthly_paye` + `breakdown` to the form (and leaks `debug_first_bracket` in the JSON — quirk).
- `Tax_calculator::calculate_ssnit_tier1/tier2/total_ssnit` (:242-299) duplicate the model's math using DB rates with **no fallbacks**.

### 2.4 Statutory rate configuration (Task: configurable SSNIT/GETFund/NHIL)

- `Payroll_statutory_model` (application/models/Payroll_statutory_model.php): CRUD over `payroll_statutory_settings` (setting_key/name/value percent, is_active, updated_by — schema :4772-4786); `update_setting` writes an audit row to `payroll_statutory_settings_log` (old/new value, changed_by, reason — :94-129; schema :4795-4806); history join to admin (:154-163); `calculate_deductions` convenience (:171-197); JSON rates for the JS form (:204-213); `get_rates_array` logs DB emptiness to error log (:220-236).
- Admin UI: `Admin::payroll_statutory_settings` (Admin.php:43725), single update :43749, **bulk update** :43803, live rates JSON :43890; view `backend/admin/payroll_statutory_settings.php`.
- Keys in use: `ssnit_tier1_employer`, `ssnit_tier1_employee`, `ssnit_tier2`, `getfund`, `nhil` (seeded by `database/migrations/payroll/payroll_system_enhancements.sql` family).

### 2.5 Approval lifecycle (`Payroll_approval_model` — application/models/Payroll_approval_model.php)

- **submit_for_approval** (:45-138): guard against already pending/approved/paid (:60-63); `pay_salary.approval_status → 'pending_approval'` (:66-70); inserts `payroll_approvals` row action='submitted' (:73-82); dual audit (Audit_log_model + Payroll_model::log_audit :85-100); dispatches `Notification_dispatcher::dispatch_notification('submission', …)` (:109-129) with try/catch so notification failure never breaks the workflow.
- **approve_payroll** (:150-262): permission gate `can_user_approve` (:476-496 — only `super_admin`/`admin` account types; teachers always false with a TODO comment :486-493); status → 'approved' (:175-180); approval row action='approved' (:183-192); cache invalidation (:219-222); 'approval' notification (:224-253).
- **reject_payroll** (:274-398): requires reason ≥ 10 chars (:282-284); status → 'rejected'; approval row action='rejected'; 'rejection' notification with rejector name + reason (:353-389).
- **mark_as_paid — deliberately dead** (:400-417): logs a warning and returns failure "Direct paid transition is disabled. Initiate the Hubtel provider payout instead." Keeps legacy callers compiling.
- **get_pending_approvals** (:427-446): returns **all** payroll states (comment: frontend filters), joining `teacher`/`admin`/`non_teaching_staff` by `employee_code` + `employment_category`, and — only if `payroll_payout_transactions` exists — LEFT JOINs payout ledger exposing `payout_status`, `payout_reference`, `provider_transaction_id`, `payout_failure_reason` (:435-440).
- **get_approval_history** (:457-467) joins approver names; **get_payroll_with_staff** (:509-534) is the canonical payroll+employee hydration used by notifications and payout.
- **UI permission model** (Admin.php:29208-29213): level 1/HR-role → submit; level 2/manager/principal-role → approve/reject; level 1 or 3/finance-role → initiate payout (`can_mark_paid`). `payroll_approvals` view at backend/admin/payroll_approvals.php.
- Admin AJAX endpoints: `payroll_submit_for_approval` (Admin.php:29734), `payroll_approve` (:29782), `payroll_reject` (:29831, server-side ≥10-char check :29862-29868), `payroll_pending_approvals` (:29997), `payroll_approval_history` (:30027). **Note**: controller passes `(pay_id, user_id, comments)` to the model methods that only accept `(pay_id, …)` — PHP silently ignores the extra args (quirk).
- `payroll_mark_paid` (Admin.php:29895-29941) is a **legacy-compatible alias that delegates to `Hubtel_payroll_payout_model::initiate_payout`** and never writes paid state itself — asserted by `tests/payroll-hubtel-ui-authority.test.js` ("legacy Admin mark-paid endpoint delegates to Hubtel…", lines 38-47).

### 2.6 Hubtel payout integration (money-out, server-authoritative)

- **Ledger table** `payroll_payout_transactions` (application/migrations/20261010_create_payroll_payout_transactions.sql): `pay_id` UNIQUE, `client_reference` UNIQUE, provider='hubtel', recipient_phone, amount DECIMAL(14,2), currency default 'GHS', status ('pending'→'processing'→'success'|'failed'), initiated_by(+_role), request/response/**callback payload** LONGTEXTs, failure_reason, initiated/confirmed/failed timestamps. Deliberately **separate from the inbound fee-payment ledger** (header comment lines 1-2).
- **initiate_payout** (application/models/Hubtel_payroll_payout_model.php:28-160):
  - Preconditions: ledger table installed (:37-39); credentials `hubtel_payment_client_id/secret` configured (:40-42); `hubtel_payroll_send_url` must contain a `{mobileNumber}` placeholder (**the send-money URL is operator-supplied, never guessed** — :43-45; test hubtel-payroll-payout.test.js:28-32 asserts no hardcoded api.hubtel.com/send-money).
  - Payroll must be **approved** (:47-53); amount = round(net_salary,2) > 0 (:55-59); employee phone normalised to Ghana `233XXXXXXXXX` (`normalise_phone` :372-379).
  - `SELECT … FOR UPDATE` row locks on pay_salary and the payout transaction inside `trans_begin` (:64-126) — prevents double-initiation; existing payout short-circuits with manual_review_required for failed state (:75-90).
  - `client_reference = 'HUB-PAY-' + 24 hex` (:92); request payload = amount/title/description/clientReference/callbackUrl=site_url('payroll_payout/hubtel_callback') (:94-100); persisted as 'pending' (:102-117).
  - POST via curl with **Basic auth client_id:client_secret** (:128-136, `post_json` :347-370, timeouts 10/30s). Response: `data.transactionId` + `clientReference` echo compared with `hash_equals` (:131-136). 2xx + no curl error + reference match ⇒ status 'processing', else 'failed' with failure_reason persisted (:138-152).
- **handle_callback** (:162-256): parses `data`/`Data` envelope; **four-way binding before any state change** — clientReference, provider transactionId, amount (±0.005), normalised phone (:179-213; mismatches 409 + `record_callback_review` :311-318). Explicit provider status required (:215-219); success synonyms `success|successful|completed|complete|paid`; failure synonyms `failed|failure|declined|rejected|cancelled|canceled` (:176-177) → `record_provider_failure` (:320-330). Idempotent: already-success returns 200 'already_confirmed' (:194-197).
- **mark_payroll_paid_from_provider** (:258-309): FOR UPDATE lock; requires approval_status='approved' (already-paid idempotent success :267-269); sets `approval_status='paid'`, `status='paid'`, optional `paid_at` if column exists (:274-283); inserts `payroll_approvals` action='paid' with "Hubtel payout confirmed: {txn}" comment (:285-292); inserts `payroll_audit_enhanced` action='provider_payment' if table exists (:294-306). Payout row then updated to success + callback_payload + confirmed_at (:236-243); **only then** is the payment SMS/notification dispatched (`send_payment_notification` :249, :332-345 → Notification_dispatcher 'payment' event with provider='hubtel').
- **HTTP boundary** `Payroll_payout` controller (application/controllers/Payroll_payout.php): `initiate` POST-only + `admin_login` + finance/super-admin permission (`user_type` 1 or 3 or role contains 'finance' — :77-83) → 200/401/403/422; `status` (:41-64); `hubtel_callback` is provider-facing and unauthenticated-by-session by design (validated by reference/amount/recipient binding instead — :66-74).
- **Payroll notifications** (Wave 8 / payroll_notifications_addon): dispatcher recipients — submission → super_admin(1)+accountant(7); approval → creator+accountant; rejection → creator; payment → employee+creator+accountant (application/libraries/Notification_dispatcher.php:140-214). Channels sms/in_app/email with per-channel error isolation (:297-355); SMS filtered by per-user opt-in (`User_notification_preferences::get_user_sms_preference`, default **opt-out**, application/models/User_notification_preferences.php:26-39); per-delivery rows in `notification_delivery_log` (dispatcher log_delivery; schema :4379-4390). Message copy produced by `Sms_notification_formatter` (format_submission_sms :66, format_approval_sms :100, format_rejection_sms :137, format_payment_sms :176, currency/160-char truncation :206-249).
- Payout migration guide: `database/migrations/PAYROLL_NOTIFICATIONS_MIGRATION_GUIDE.md`; addon SQL `database/migrations/payroll/payroll_notifications_addon.sql`.

### 2.7 Payslip preview, printing, reports, dashboards (Admin)

- Form/staff hydration: `getStaffDetails` (Admin.php:29249) and `getPayrollFormByStaffCode` (:29262-29322) render `backend/admin/getStaffDetailsForPayroll.php` / `getPayrollForm.php` / `getPayrollFormWithoutData.php` with statutory rates JSON, Tier-2 provider list (`pension_tier2_providers`, :29307-29311) and **system-wide hidden-field prefs** from `form_field_preferences` (:29288-29298; model table `payroll_form_field_preferences` schema :4759-4764; prefs endpoints Admin.php:43317/43347/43422).
- Payslip: `payslip_preview($staffCode,$month,$year,$employment_category)` (Admin.php:29324), `get_payslip_preview($pay_id)` (:29944), `payslipList` (:29468); views `payslip_preview.php`, `payslip_preview_a5.php`, `payslip_list.php`.
- CRUD: `payroll_edit_form` (:29486), `payroll_update_ajax` (:29498), `payroll_delete` (:29553), `payroll_validate` (:29594), `payroll_copy_last_month` (:30057 → Payroll_model::copy_from_last_month :509-538, month ordering via `FIELD(month, "December"…)` :513), `payroll_check_duplicate` (:30099).
- Dashboards/reports: `payroll_dashboard` (:30304) + `payroll_dashboard_data` (:30330) + private summaries (`get_payroll_summary` :30403, category breakdown :30461, trend :30569); register `payroll_register` (:30913) with data endpoint (:30929) and **Excel (CSV) export** (:31080) + **PDF export** (:31178); department payroll (:31254, :31266, export :31402); SSNIT Tier-1 & Tier-2 reports (:29225, :29237) with dedicated views.
- Libraries: `Payroll_printer` (application/libraries/Payroll_printer.php) normalises a record to the 37-field schema (:18-28), null→defaults (:45-74), batch/summary/CSV variants (:83-100, :144-167, :176-207). `Payroll_parser` (application/libraries/Payroll_parser.php:34-120) parses JSON payloads with required-field/type checks (employee_code/month/year/basic_salary — :21). **Grep shows neither is wired to any controller** — they are utility code for a planned import/export surface (quirk).

### 2.8 Employee self-service portal (payroll only)

- `Employee` controller (application/controllers/Employee.php) gates on session `employee_login` (:24-26).
- `portal` (:35-47) welcome page; `view_payslips` (:55-75) lists own `pay_salary` rows scoped by session `employee_code` + `employment_category`; `download_payslip($pay_id)` (:83-118) re-queries **with ownership scoping** and renders `backend/employee/payslip_pdf.php` — an HTML page (comment: "can be enhanced with TCPDF later", :116) — filename pretends `.pdf` (:114); `download_all_payslips` (:126-163) zips simple HTML payslips via CI zip lib; `payment_history` (:171-216) YTD sums + monthly breakdown + average.
- Staff hydration covers teacher/administrator/non_teaching_staff (:221-243).
- **No leave, appraisal, training, disciplinary, payslip-email, or HR workflow exists in this portal** (§13).

---

## 3. Library

### 3.1 Capability surface

- Role controller `Librarian` (application/controllers/Librarian.php) gates on `librarian_login` (:42-44): dashboard (:57-69), noticeboard read-only (:72-86), **book catalogue CRUD** (:88-196), **book request accept/reject** (:199-275), own profile/password (:278-336), DataTables JSON `get_books` (:338-405).
- `Admin::book` (Admin.php:17572-17692) duplicates the same CRUD (with `$this->db->cache_delete()` calls) and `Admin::get_books` (:17694+).
- **Book creation**: name, class_id, status='Available', optional description/price/total_copies/author + file upload straight into `uploads/document/` with the client-supplied filename (Librarian.php:109-117 — no sanitisation; download links point at `site_url("uploads/document/$row->file_name")` :378 → public document exposure).
- **Copies model**: `book.total_copies` + `book.issued_copies` counters; availability recomputed as `issued < total` after every update/accept (Librarian.php:157-168, 220-255; Admin.php:17654-17668). No reservation of a specific copy, no barcode/ISBN, no due-date enforcement.
- **Book requests**: students create requests (`Student::book_request` / `book_request_add` → `Crud_model::create_book_request`, application/controllers/Student.php:1256-1291); librarian `accept` sets `book_request.status=1` and increments `issued_copies` (with a re-check race window — Librarian.php:207-257), `reject` sets status=2 (:262-270). `book_request.issue_start_date/issue_end_date` are free-text columns (schema :1039-1042) — **no return workflow, no overdue detection, no fines table anywhere** (schema grep for fine/penalty returns only `emp_penalty`/`penalty` HR tables).
- **No member limits** (no per-student borrow cap), no categories, no librarian-managed members (librarian accounts only in `librarian` table, schema :4044).

### 3.2 Tables

- `book` (schema :1015-1026): book_id, name, description, author, class_id (longtext!), price (longtext!), total_copies, issued_copies, status (text 'Available'/'Unavailable'), file_name, sync.
- `book_request` (schema :1035-1046): book_request_id, book_id, student_id, issue_start_date, issue_end_date, status (int: 0/NULL pending, 1 accepted, 2 rejected), sync.
- `librarian` (schema :4044+): staff account (name/email/password/auth…).

---

## 4. Inventory & store

### 4.1 Access & pages (`Inventory` controller — application/controllers/Inventory.php)

- Gate: `admin_login` + `admin.level ∈ {1 super admin, 2 admin, 3 accountant, 6 shop attendant}` (:12-22) — shop attendant is an admin-tier level, not a login type.
- Pages: dashboard `index` (:67-72), `products` (:75), `categories` (:85), `sales` (:94), **`pos`** (:103-110 — active products + student picker + currency from settings), reports `generate_report($type)` (:805), suppliers (:431+), movements (:424), returns (:3069).
- Currency is read per-page from `settings.currency` (:70, 80, 98, 108).

### 4.2 Stock core (`Inventory_model` — application/models/Inventory_model.php)

- `process_sale` (:145-180): transaction; insert `inventory_sales` (+ receipt via controller), per-item `inventory_sale_items`, decrement `inventory_products.quantity`, and an `inventory_stock_movements` row type 'out' with notes "Sale #N - Customer: X|Walk-in" (:162-171).
- `stock_in`/`stock_out` (:237-290) + `get_stock_movements` (:291-316) + `get_low_stock_items` (reorder_level compare, :317-328).
- `get_dashboard_stats` (:17-51), `get_total_sales_revenue` (exposed for the finance revenue dashboard, :183-197), paginated products (:198-236), per-product audit `log_audit` → `inventory_audit_log` (:341-364).

### 4.3 POS sale + receipt

- Controller `process_sale` (:304-365) builds sale_data (student_id or customer_name, payment_method 1=Cash/2=Bank/3=MoMo per schema :3383) and returns receipt; `sale_receipt($receipt_code)` (:366-423) renders printable receipt; `get_sale_for_print` (:1011), `sale_details` (:1042), sale form with live JS totals (`sale_form` :1091-1321, `create_sale` :1625-1738, `update_sale` :1739-1886).

### 4.4 Returns (`returns`, :3069-3940)

- `search_sales_for_return` (:3731), `get_sale_for_return` (:3757), `process_return` (:3780) → model `process_return` (:502-630): validates remaining returnable qty per sale item (already-returned sum from `inventory_return_items`, :527-548), computes refund, inserts `inventory_returns` (reason enum Damaged/Wrong item/Changed mind/Expired/Other; refund_method 1=Cash/2=Account Credit/3=Original Method — schema :3331-3352) + items, restocks, records negative movement; returns list/details/statistics/export (:631-803; controller :3827-3940).

### 4.5 Purchase orders & payables

- `create_purchase_order` (model :857-976): line items with cost; **percentage or fixed PO discount** (:866-879); PO code `PO-{Ym}-{rand}` (`generate_po_code` :826-855); **POs are inserted as status='received' immediately** — stock and cost updated in the same transaction (:886-947) — then an **expense is recorded through `Financial_integration_hooks::record_expense`** (:949-968; failure rolls the whole PO back). Legacy pending→receive path retained in `mark_purchase_received` (:1091-1185) with **three cost methods**: `replace` (purchase cost), `weighted_average` (`calculate_weighted_average_cost` :1533-1557), `keep_existing`.
- Payments & payables: `record_purchase_payment` (:1712-1850, writes `inventory_purchase_payments` with optional `expenditure_payment_id` link), `calculate_payment_status` (:1852-1878 → unpaid/partially_paid/fully_paid on `inventory_purchases`), `get_outstanding_payables(_summary)` (:1913-2106), PO expenditure by date (:2007-2022), `delete_purchase_payment` with reason (:2023-2106).
- PO lifecycle endpoints: `purchase_orders` (:1887), form/edit (:1906, :4375), `create_purchase_order` (:3941), list (:4212), details (:4240), status update (:4269), delete (:4320), update (:4393), export (:4501); suppliers CRUD (`create_supplier` :4551, `update_supplier` :4597, model :365-399, deactivate :1646).
- Migration backing the payables work: `database/migrations/inventory_returns_purchases.sql`, `database/migrations/payroll/purchase_order_financial_integration.sql`, results note `database/migrations/PURCHASE_ORDER_MIGRATION_RESULTS.md`.

### 4.6 Tables (schema :3153-3466)

- `inventory_products` (:3218-3249): sku, **barcode**, category_id, supplier_id, is_asset, cost_price/selling_price decimal(10,2), quantity, unit_of_measure, reorder_level default 10, location, status.
- `inventory_categories` (:3180-1888); `inventory_locations` (:3198-3208 — manager/status; **no per-location stock ledger**).
- `inventory_purchases` (:3251-3285): po_code, supplier, dates, reference_number, total_amount, amount_paid, payment_status enum, status enum(pending/received/cancelled), discount_type/value/amount, subtotal, final_total, created/received_by(+date).
- `inventory_purchase_items` (:3287-3297); `inventory_purchase_payments` (:3307-3329).
- `inventory_sales` (:3375-3389): student_id or customer_name, total_amount, payment_method tinyint (1 Cash/2 Bank/3 MoMo), served_by, receipt_code.
- `inventory_sale_items` (:3397-3406); `inventory_returns` (:3331-3352); `inventory_return_items` (:3354-3364).
- `inventory_stock_movements` (:3417-3429): enum in/out/adjustment/transfer + reference_type/id (transfer is never written by code).
- `inventory_suppliers` (:3440-3455); `inventory_audit_log` (:3153-3170, with sync columns).
- **No POS cash-drawer/session, no VAT/tax line, no multi-warehouse quantity** (single quantity column; `inventory_locations` unused by stock logic).

---

## 5. Communications / SMS matrix

### 5.1 Gateways actually wired

| Gateway | Where | Status |
|---|---|---|
| **Hubtel simple batch** | `Sms_model::SendMessage` → `https://sms.hubtel.com/v1/messages/batch/simple/send` (application/models/Sms_model.php:20-51, URL :24); Basic auth client_id:client_secret (:33-35) | **Live** — sole runtime gateway |
| **Hubtel personalized batch** | `SendPersonalizedMessage` → `/v1/messages/batch/personalized/send` (:54-85, URL :58); used by `send_sms_batch_personalized` (:347-425) | Live |
| **Hubtel balance/rate** | `get_hubtel_balance` → `api.hubtel.com/v1/merchantaccount/merchants/{id}/balance` (:455-498) — drives "INSUFFICIENT/LOW BALANCE" error enrichment (:210-232, :397-420) and `calculate_sms_cost` (160-char pages × rate, default GHS 0.03, :501-525) | Live |
| **Twilio SDK** | application/libraries/twilio_library/ (Twilio.php + Twilio/*) | **Dead** — zero references outside the folder |
| **hubtel-sms-api SDK** | application/libraries/hubtel-sms-api/Hubtel/* (MessagingApi, ContactApi, …) | **Dead** — zero references outside the folder |
| Gateway switch | `settings.active_sms_service` ('hubtel' or anything else = disabled, Sms_model.php:96-103) | Live |

- Phone normalisation (Ghana-specific) duplicated in `send_sms` (:130-174) and `format_phone_number` (:428-452); invalid recipients abort the whole batch with an HTML-wrapped error string (:179-183 — UI-in-model quirk).
- `send_sms_password_reset` (:239-344) is a near-copy **with a fatal bug**: `$correct_name` is used but never defined (:309) — would fatal on any valid recipient list.
- "Welcome" messages get password-change instructions + login URL appended by prefix sniffing `substr($message,0,7)=='Welcome'` (:111-115, :198-201) — magic-string contract.

### 5.2 Trigger → template → gateway matrix

| # | Trigger | Template / copy source | Recipients | Gateway call | File:line |
|---|---|---|---|---|---|
| 1 | **Monthly bill reminder (cron)** | Inline string built from live balances per parent ("Bill Reminder from {school}… Total: {currency}X") | Parents of enrolled, un-muted students with `SUM(invoice.due)>0` (join enroll on running year/term, parent phone non-empty) | `send_sms_batch_personalized` | application/controllers/Cron.php:12-117 (recipients :28-60, message :71-79, log :87-94, send :97-104) |
| 2 | **SMS automation rules** (event-driven: payment_received / invoice_created / exam_result_published / attendance_marked / monthly_bill_reminder) | `sms_automations.message_template` with `{placeholder}` replacement | parents/students/teachers/all (recipients column) | via Sms_model | application/controllers/Sms_automation.php (save :46, toggle :127, test :196, placeholders :230-253, trigger list :255-263); schema sms_automations :5640-5655, sms_automation_logs :5657-5672 |
| 3 | **Payroll approval events** (submission/approval/rejection/payment) | `Sms_notification_formatter::format_*` + dispatcher copy | Role-routed (super_admin 1, accountant 7, creator, employee) filtered by SMS opt-in | `Sms_model` via Notification_dispatcher | application/libraries/Notification_dispatcher.php:140-214, 297-355; formatter :66-249 |
| 4 | **Bulk ad-hoc SMS** (admin messaging page) | Free text (stripped of tags/&nbsp;/br) | groups: 6=admins, 2=teachers, 3=students(by class), 4=parents, 1=staff(all users), 5=raw phone list | `send_sms` simple batch | application/controllers/Admin.php:19888-19974 (permission gate :19889-19907: super admin or level-2 with `user_permission` 'Can send SMS') |
| 5 | **Invoice link SMS** | Invoice link message with 7-day token | student/guardian/parent phones per selection | `send_sms` | application/controllers/Invoice_sms.php:30-166 (token insert :63-79 → `public_invoice/view/{token}`) |
| 6 | **Admission alert** | "New Admission Alert: … Total Bill: GH₵X - {school}" | All super admins (level 1) with phone | `send_sms` | application/models/Notification_model.php:165-172 (dispatcher :85-113) |
| 7 | **Password reset SMS** | "Welcome…"/reset copy + login link | User phone | `send_sms_password_reset` (**buggy — see §5.1**) | application/models/Sms_model.php:239-344 |
| 8 | **Hubtel payroll payout confirmed SMS** | 'payment' event formatted copy | Employee + creator + accountant (opt-in filtered) | `send_sms_batch_personalized` path via dispatcher | Hubtel_payroll_payout_model.php:332-345 |
| 9 | **Daily-fee low-balance / high-arrears alerts** | Helper returns student lists (no SMS copy inline) | Caller decides | none wired here | application/helpers/daily_fee_alerts_helper.php:10-23 (low balance), :25-37 (arrears), :39-55 (collection target), :57-73 (uncollected transport fares) |
| 10 | **Template store (unwired)** | `sms_templates` seeded 3 rows: payment_reminder / payment_received / overdue_notice with {variables}; `sms_schedules` daily/weekly/monthly scheduler rows | — | **no runtime reader** | application/sql/sms_templates.sql:13-17, 20-33; schema :5736-5747, :5717-5732 |
| 11 | **Payment SMS automation lib (broken)** | Hardcoded copy in `Payment_sms_automation` (received/reminder/overdue/bulk) | parent by student.parent_id | calls **non-existent `sms_sender` library** and writes `sms_logs` | application/libraries/Payment_sms_automation.php:11, 17-48, 126-139 — constructor would fatal; lib unreferenced by controllers |

### 5.3 In-app notifications

- **Two parallel creator APIs write the same `notifications` table**: `Notification_model::create_notification` (application/models/Notification_model.php:11-24, created_at = unix `time()`) and `Notification_manager::create_notification` (application/models/Notification_manager.php:25-51, created_at = datetime + JSON `data` with module/event/reference). `Notification_model` also hosts admission fan-out to super admins with SMS+email (:85-172).
- Poll/read APIs: `Notifications::get_unread_count` (application/controllers/Notifications.php:15-21), `get_notifications` (top 10 + time_ago, :23-43), `get_notification_details` (:45-189) — **type→route map** (admission → student profile, payment → invoice, payroll* → view_payslip/payroll_pending_approvals, receipt/invoice modification requests, attendance, transport, inventory, exam/marks, generic data.link) and marks read on view; `mark_as_read`/:191, `mark_all_read`/:199.
- Soft delete on notifications exists (migration `add_soft_delete_to_notifications.sql`) and read tracking column `read_at` (Notification_manager.php:104, schema :4377 area).

### 5.4 Email

- `Email_model` (application/models/Email_model.php): account_opening (:9-37, includes login credentials **and auth key in body**), password_reset (:40-59, plaintext new password), password_changed (:61-79), contact/personal message (:81-88). All funnel to `do_email` (:90-131) which:
  - **hardcodes** `smtp_host = lightworldtech.com`, `smtp_user = $from`, **`smtp_pass = "~Myjesus4me2018"`**, port 465 ssl (:96-104) — plaintext credential committed to the repo;
  - appends "For more details, please login here" + **"Powered By: Lightworldtech"** footer to every email (:122-124);
  - protocol sendmail with SMTP crypto mix (quirk).
- Transactional email templates exist for finance flows: application/views/email_templates/ (invoice_email, invoice_overdue, payment_received, expense_approved) — used by Invoice_email/Expenditure flows, not by Email_model.
- `Invoice_email::send` (application/controllers/Invoice_email.php:30+, `send_single` :156) mirrors Invoice_sms with 7-day `invoice_access_tokens` and email delivery.
- Email delivery logging tables: `email_log` (schema :2030-2040) and `email_logs` (:2043-2051) — two generations, the latter used by newer finance code.

### 5.5 Private / group messaging + attachments

- Threads: `message` / `message_thread` (schema :4216-4237, sender key `type-id`), groups: `group_message` / `group_message_thread` / `group_message_other` (schema :2992-3035). Attachments stored **off-webroot** via `attached_file_storage_key` + `Private_file_storage` (migration application/migrations/20261017_private_message_attachment_storage.sql).
- Send/reply/delete with participant checks: `Admin::message` (Admin.php:19821-19886 → Crud_model::send_new_private_message / send_reply_message / is_message_thread_participant / delete_private_message_thread / upload_private_message_attachment).
- **Hardened download boundary**: `Message_attachment::private_message|group_message` (application/controllers/Message_attachment.php:14-34) authenticates session type against allowlist admin/accountant/librarian/parent/student/teacher (:36-44), verifies participant (:21, :32), then `force_download` from private storage (:46-53); 403/404 otherwise. Test-pinned by `tests/private-message-attachment-safety.test.js`.

### 5.6 Noticeboard

- `noticeboard` table (schema :4351-4360): title/notice/create_timestamp/created_on/status(1)/show_on_website/image.
- Admin CRUD: `Admin::noticeboard` (Admin.php:19294+), `noticeboard_edit` (:19774); archived view (`archived_noticeboard.php`); public website rendering gated by `show_on_website` (frontend views frontend/default/noticeboard.php); every role controller exposes a read-only noticeboard (e.g. Librarian.php:72-86); staff read-tracking columns `read_notice_ids` on non_teaching_staff (schema :4317) and equivalents on other roles.

---

## 6. Settings & branding catalogue

### 6.1 Storage

- **Live store = key/value table `settings`** (schema :5589-5601): `type` (longtext key), `description` (longtext value), plus sync columns (sync_status PENDING default, device_id 'local-server-001', version, retry…). Read helper `get_settings($type)` (application/helpers/manager_helper.php:38; duplicate in Crud_model.php:2039).
- **`settings_audit`** (schema :5615-5632) — per-change audit (setting_type, old/new, changed_by, IP, UA + sync cols) — **has no writer in application code and no DB trigger**; dormant.
- **`Setting_model` / `sch_settings`** (application/models/Setting_model.php:1-144) targets a `sch_settings` table (name/email/address/dise_code/date_format/currency_symbol/start_month/session_id/theme/cron_secret_key/fee_due_days…). **`sch_settings` does not exist in the schema** — the model is dead legacy from another product (quirk).
- Settings screen: `Admin::system_settings` (Admin.php:20306-20705) renders `backend/admin/system_settings_modern.php`; separate pages for payment, sms, theme, permission, fee-collection, daily-fee, alert, sync settings (views listed in §6.3).

### 6.2 Configurable keys (what `system_settings` do_update writes — Admin.php:20313-20559)

| Key group | Keys written |
|---|---|
| Identity/branding | `system_name` (upper-cased), `system_title` (title-cased), `location`, `box_number`, `digital_address`, `website_address`, `address`, `phone` (array index 0), `system_email`, `ssnit_number`, `language`, `text_align`, `disable_frontend` (+ rewrites `routes.php` default controller via `update_default_controller` :20699-20705 — both branches write 'login', i.e. no-op quirk) |
| Academic calendar | `term_ending`, `next_term_begins`, `half_payment_week`, `full_payment_date` + `terms` row upsert (year/term/term_ending/next_term_begins/full_payment_date/days_opened, :20460-20477); `running_year/term/sem` updates are **commented out** (:20437-20450) — they're changed by dedicated change_session/change_term flows instead |
| Money | `currency` (e.g. `₵`/`GHS`), `mo_account_name`, `mo_account_number` (mobile-money display account), `invoice_number_format`, `invoice_due`, `receipt_style`, `late_fee_*` (elsewhere) |
| Codes | `teacher_code_prefix`, `teacher_code_format`, **`student_code_prefix` (with a one-time rewrite of every `student.student_code` stripping the old prefix — :20496-20508)**, `student_code_format` |
| Report cards | `raw_score` (WAEC best-electives grading toggle — form field name `waec_grading_enabled`, :20334-20337), `terminal_report_style`, `creche_exam_template` (template1/2 validated, :20535-20553) |
| Ops toggles | `boarding_system` (on/off, :20554-20557), `auto_lock_enabled` (insert-or-update pattern, :20542-20552), `offline_online_mode` (0/1, :20544+) |
| Licensing | `purchase_code` (:20524-20527) |
| Logo/signature uploads | `upload_logo` → `uploads/school_logo.png` (:20582-20587), `upload_signature` → `uploads/signature/admin/head_teacher.png` PNG-only 2 MB (:20591-20617), `upload_ssnit_logo` → `uploads/ssnit_logo.png` (:20619-20623) |
| Theme | `change_skin` writes `skin_colour` (:20625-20632); `Admin::theme_settings` (:36960-36996) writes `accent_color`/`primary_color`/`secondary_color` (:36991 area) |
| SMS gateways (sms_settings.php) | `active_sms_service`, `hubtel_client_id`, `hubtel_client_secret`, `hubtel_sender` (view form fields) |
| Payments (payment_settings, super-admin-only writes) | `hubtel_payment_client_id/secret`, `hubtel_payment_receive_url`, `hubtel_payroll_send_url`, `hubtel_payment_merchant_number`, `hubtel_test_mode`, `hubtel_enabled`, plus legacy `hubtel_client_id/secret/sender`, `stripe_keys`, `paypal_email`, `paystack_secret_key`, `mtn_momo_api_key`, `vodafone_api_key` (get_settings usage survey) |
| Fee module | `daily_fee_collection_mode`, `teacher_fee_collection_mode`, `credit_system_enabled`, `auto_apply_credits`, `late_fee_enabled/days/amount` |
| Misc read | `smtp_host/user/pass/port` (mail settings keys exist as settings rows), `sms_api_url/key/sender_id`, `running_session` |

- Count snapshot from code survey: `running_year` ×244, `running_term` ×214, `system_name` ×68, `currency` ×60, `running_sem` ×23, `system_email` ×12, `daily_fee_collection_mode` ×12, `theme_color` ×9 (plus everything in the table above) — i.e. the flat settings table is the single most-referenced table in the app.
- **Theme behaviour**: `skin_colour` stylesheet link in `includes_top.php` is **commented out** (application/views/backend/includes_top.php:35) — skin switching is inert; `theme_color`/`accent_color` are consumed inline by newer receipt/dashboard HTML (Admin.php:36888-36953); `theme_color_2` read in two places.

---

## 7. Reports & exports / printing

- **`export_helper.php`** (application/helpers/export_helper.php): `export_to_excel` = streamed **CSV with UTF-8 BOM** (misnamed Excel, :5-23); `export_to_pdf` = Dompdf via `Pdf` library (:26-38); `generate_pdf_table` = inline-styled HTML table builder (:41-83).
- **`Pdf` library** (application/libraries/Pdf.php): thin Dompdf wrapper (loadHtml/setPaper/render/stream/output, HTML5 parser + remote enabled, :1-40) — the app's PDF engine for invoices, payroll register PDF, report cards.
- **`Csvimport` library** (application/libraries/Csvimport.php): generic CSV→array parser (:1-338). **Dead code** — the live student bulk import parses with raw `str_getcsv` (see evidence doc 02 §import); no controller loads Csvimport.
- **`report_display_helper.php`** (application/helpers/report_display_helper.php): report-card display bridge — smart-detects legacy free-text vs modern numeric IDs for conduct (c1-c15 → `conduct_items.name`, :17-45) and interests; used by terminal report views.
- **`Payroll_printer::print_csv`** (application/libraries/Payroll_printer.php:176-207) provides payroll CSV but is unwired (§2.7); the live payroll exports are `Admin::export_payroll_register_excel` (Admin.php:31080, CSV) and `export_payroll_register_pdf` (:31178, Dompdf).
- Print flows in views: payslip preview + A5 (`payslip_preview.php`, `payslip_preview_a5.php`), bulk invoice print (`bulk_invoice_print.php`), class routine print (`class_routine_print_view.php`), attendance report print (`attendance_report_print_view.php`), POS sale receipt (`Inventory::sale_receipt` :366-423), coupon sheets (§8). Browser-print (window.print) is the dominant "printing" mechanism; Dompdf for downloads.
- `Audit_logger`/`Audit_log_model` provide the general audit trail view (`audit_trail.php`) — outside this doc's payroll-specific audit.

---

## 8. Dining coupons (feeding integration)

- `Dining_coupon` controller (application/controllers/Dining_coupon.php) + `dining_coupon_helper.php`.
- **Who can generate**: teachers only for `generateTeacherCoupon` (role check :21-24, scoped to `class.teacher_id` classes via `getTeacherClassIds`, helper :14-36); admin/teacher/cashier roles for `generateCashierCoupon` (`canGenerateCoupons`, helper :58-66), optional class filter.
- **Eligibility algorithm** (`generateCouponData`, :104-219) — this is the feeding/dining integration:
  1. Fee-type map feeding/breakfast/transport/classes/water → `daily_charge_log.{fee}_charged` and `daily_fee_transactions.{fee}_amount` (:110-119);
  2. Students **charged** on the date (inner join `daily_charge_log` on midnight `charge_date`, :130);
  3. Include if they also **paid cash** that day (`daily_fee_transactions` left join, payment_type='Direct Payment', :150-160) **or** a `daily_fee_audit_log` 'charge' row for the same day shows prepaid balance was deducted (balance_before − balance_after > 0 → 'Prepaid', :162-199);
  4. Charged-but-nothing-paid (all to arrears) students are **excluded** (:199-204).
- **Output**: printable HTML sheet — A4, **20 coupons per page (4×5 grid)** (:241-247 area), colour-coded per fee type (:226-232), student name/code/class/section/amount/payment-type; validity: same-day 5:00 PM except **water = weekly, expires Friday 5:00 PM** (:252-264). Pure view-model: no coupon persistence, no redemption scan, no anti-reuse (quirk to design properly in iEduPro).
- Depends on daily-fee ledgers: `daily_charge_log` (schema :1470-1490), `daily_fee_transactions` (:1574-1608), `daily_fee_audit_log` (:1503-1522), `daily_fee_wallet` (:1621-1651: feeding/breakfast/classes/water/transport balance+arrears columns).

---

## 9. Boarding / hostel

- Three-level hierarchy: **house → dormitory → bed** (`boarding_house` schema :994-1010 with house_master/prefect/GPS/capacity/user fee; `boarding_dormitory` :974-990 with house_id FK, bed capacity, prefect; `boarding_bed` :957-967 with bed_code/number/type/description, dormitory_id, bed_status enum Available/Assigned/Maintenance/Unknown — metadata migration `database/migrations/boarding_bed_metadata.sql`).
- Legacy flat `dormitory` table (schema :1973-1981, MyISAM) still exists — old-generation leftover.
- `Boarding_model` (application/models/Boarding_model.php): availability getters (:59-86), manage house/dormitory/bed (:88-125), **assignStudentToBed** (:155-181) — transactional: bed → Assigned + `student_id` + `assigned_date`, plus `student_residence` row (residence_type='Boarding', house/dormitory/bed ids, running year/term, status 'Active'); **unassignStudentFromBed** (:183-205) frees bed + residence status 'Inactive'; `getStudentResidence` (:207-213) scoped to running year/term; occupancy counters (:215-231); boarder/day counts via `enroll.residence_type` (:232-274); admission fee differentiation by residence (:24-57).
- Gating: `settings.boarding_system` toggle written in system settings (Admin.php:20554-20557).
- **CRITICAL GAP**: `student_residence` table is referenced by Boarding_model and `backend/admin/boarding/boarding_dashboard.php` but is **absent from the authoritative schema dump** — like other v_*/aux tables, it lives only in the production DB.

---

## 10. Insurance (vehicle fleet insurance — not student insurance)

- `Insurance` controller (application/controllers/Insurance.php): `add_insurance` (:47-91), `edit_insurance` (:93+), delete — CRUD for **insurance policies attached to transport vehicles**, with duplicate validation helper `insurance_duplicate`.
- `Insurance_model` (application/models/Insurance_model.php): reads/writes table **`v_car_insurance`** (getAllInsurance :33-36, add :119-129, edit :133-139) and guards deletion against vehicles referencing the policy via **`v_vehicle`** (:141-155). DataTables listing via Ajaxdataload_model (:48-108).
- **`v_car_insurance` / `v_vehicle` are not in the schema dump** (transport-family tables are systematically missing from the redacted dump — consistent with doc 03 finding). Insurance = name + company + timestamps only; no premium/renewal/expiry tracking fields visible in the model.
- No student/medical insurance module exists.

---

## 11. Visitor tracking

- **`visitor_tracker`** table (schema :6740-6747, **MyISAM**): id, ip varchar(15), page_view mediumtext, date (unix int) — one row per new IP.
- Writer: `Iptracker` library (application/libraries/Iptracker.php) — `save_site_visit` (:49-68) inserts IP+URL once per IP, skipping URLs containing 'dimiyo'; **instantiated at file scope** (:70-71) so it would run on library load — but **nothing loads the library** (not in autoload, no `load->library('iptracker')` anywhere) ⇒ the tracker is effectively dormant.
- Reader: `Admin::visitor_tracker` (Admin.php:24053-24060) + view `backend/admin/tracker.php` (list of visitor IPs).

---

## 12. Cron inventory

| Job | Route/entry | Schedule hint | What it does | File:line |
|---|---|---|---|---|
| Monthly bill reminders | `cron/monthly_bill_reminders` (HTTP) | crontab (unspecified) | Reads active `sms_automations` row with trigger_event='monthly_bill_reminder'; aggregates per-parent outstanding `invoice.due` for enrolled un-muted students in running year/term; personalized Hubtel SMS; writes `sms_automation_logs` (pending→sent/failed by batch result); stamps `sms_automations.last_run` | application/controllers/Cron.php:12-117 |
| Finance daily tasks | `finance_cron/daily_tasks` | crontab doc: `0 8 * * * curl …/finance_cron/daily_tasks` (:5-9) | 1) **late fees**: reads `late_payment_settings` (grace_period_days, late_fee_type fixed/percent, value) and **adds late fee into invoice.due/amount** for 'due' invoices older than grace (:43-85); 2) **payment reminders** at configured reminder_days offsets → HTML email via CI email + **SMS stub that only log_message()s** (:88-152); 3) installment status → overdue; completed payment plans (:155-177); 4) purge `finance_dashboard_cache` >24h (:180-184) | application/controllers/Finance_cron.php:30-184 |
| Finance monthly reports | `finance_cron/monthly_reports` | monthly | SUM(payment) summary for running year/term + admin email report via `Finance_cron_model::generate_admin_report` | Finance_cron.php:187-226; application/models/Finance_cron_model.php |
| Finance backup | `finance_cron/backup_financial_data` | manual/adhoc | CI dbutil backup of invoice/payment/receipts/payment_plans/installments/credit_notes/payment_transactions into `backups/finance/` | Finance_cron.php:229-252 |
| Smoke test | `finance_cron/test` | — | echo PHP info | Finance_cron.php:255-259 |

- Security: Finance_cron allows **CLI or localhost IPs only** (:19-27 — hard-coded allowlist, no secret token); **Cron.php has no authentication at all** (no CLI/IP/token gate — anyone with the URL can fire the bill-reminder blast; it is idempotent-ish per run but unauthenticated — parity/security quirk).
- There is **no cron runner for**: `sms_schedules` (template scheduler table), dining/water expiry, library overdue, PO receipt, payroll month-end, boarding, or visitor cleanup. Transport auto-billing is invoked via hook/self-cURL, not cron (doc 03 §6.1).

---

## 13. Employee / HR self-service & vestigial HR tables

- **Live HR surface = Employee.php payroll portal only** (§2.8). No leave application, appraisal, training, disciplinary, or HR profile editing exists for staff in active code.
- **Vestigial HR schema family** (zero references in application/controllers or models — confirmed by grep):
  - `employee` (:2056-2085) — full HR entity (em_code, role enum ADMIN/EMPLOYEE/SUPER ADMIN, joining/contract dates, NID…); `employee_file` (:2087-2095) attachments; `education` (:2003-2011); `social_media` (emp_id keyed);
  - `earned_leave` (:1992-2000) leave accrual; `emp_salary` (:2224-2230); `emp_penalty` (:2213-2219) + `penalty` lookup (:4881-4887);
  - `emp_attendance` (flagged vestigial in doc 03).
- Real staff data lives in `teacher` / `admin` / `non_teaching_staff` (schema :4282-4348 — the latter is the payroll-facing HR record with SSNIT id, Ghana card, PETRA id, TIN, bank account, tier2 provider/member ids, designation/department/position/qualification, employment_date/type).

---

## 14. Multi-language

- `Multilanguage::select_language($language)` (application/controllers/Multilanguage.php:43-50) just sets `session.current_language` and redirects to base_url; `index()` is empty.
- **`get_phrase($phrase)` returns `ucwords(str_replace('_',' ',$phrase))`** (application/helpers/multi_language_helper.php:10-20) — i.e., every "translated" string in the UI is just the prettified key; **no dictionary lookup at all**.
- Language packs: `application/language/english/` contains only 7 module files (attendance, cashier_reports, discount, expense_bulk, inventory, receipt_modification, remarks) and are **never loaded** (`lang->load` appears once, for CI's own `pagination` — application/controllers/Home.php:36).
- Per-user `language` setting row exists (system_settings writes it, Admin.php:20422-20425) but nothing consumes it beyond the dead mechanism. **iEduPro should treat the legacy UI as English-only.**

---

## 15. Tables & columns (consolidated from `schema/schoolmanager_schema_redacted.sql`)

### Payroll
- **pay_salary** (:4817-4911) — §2.1 in full (36 money/admin columns + rate snapshots + sync + paid_type + employment_category + reference).
- **payroll_approvals** (:4701-4709): approval_id PK, pay_id, approver_user_id, approver_role, action enum('approved','rejected','submitted') — **note: 'paid' action inserted by payout code is outside the enum** (relies on non-strict mode — quirk), comments, action_date.
- **payroll_audit_enhanced** (:4717-4737): audit_id bigint, pay_id, user_id, action enum(create/update/delete/approve/reject/submit/reopen), field_changed, old/new value text, ip_address, user_agent(255), created_at + **anti-update/anti-delete triggers** (:4739-4750).
- **payroll_statutory_settings** (:4772-4786) & **payroll_statutory_settings_log** (:4795-4806) — §2.4.
- **payroll_form_field_preferences** (:4759-4764): field_name, is_visible, updated_at.
- **pension_tier2_providers** (:4913-4930): provider_name/code, description, address/phone/email, is_active.
- **tax_brackets** (:6373-6385): country default 'Ghana', bracket_name, min/max_income decimal(15,2) (NULL = no limit), tax_rate, fixed_amount, is_active, effective_from/to.
- **payroll_payout_transactions** — **not in schema dump**; authority = application/migrations/20261010_create_payroll_payout_transactions.sql (§2.6).
- **user_notification_preferences** (:6680-6686): user_id (admin), sms_enabled default 0 (opt-out), updated_at.

### Library
- **book** (:1015-1026), **book_request** (:1035-1046), **librarian** (:4044+) — §3.2.

### Inventory — §4.6 list (inventory_audit_log, categories, locations, products, purchases, purchase_items, purchase_payments, returns, return_items, sales, sale_items, stock_movements, suppliers; schema :3153-3466).

### Communications
- **message** (:4216-4225) & **message_thread** (:4228-4237): thread_code, message, sender ('type-id'), timestamp, read_status, attached_file_name/**attached_file_storage_key**.
- **group_message** (:2992-3001), **group_message_other** (:3010-3018, external members by phone), **group_message_thread** (:3024-3033, members longtext CSV of keys).
- **notifications** (:4369-4378): user_id, user_type, type, title, message, data JSON, icon, is_read, created_at datetime (+read_at via migration; soft-delete migration exists).
- **notification_delivery_log** (:4379-4390): notification_id, channel(sms/email/in_app), recipient, status, sent_at, error_message.
- **sms_automations** (:5640-5655) & **sms_automation_logs** (:5657-5672) — live automation pair.
- **sms_log** (:5687-5696: student/parent-keyed legacy log) vs **sms_logs** (:5701-5711: generic log) — two generations.
- **sms_templates** (:5736-5747) & **sms_schedules** (:5717-5732) — unwired generation.
- **email_log** (:2030-2040) vs **email_logs** (:2043-2051) — two generations.
- **invoice_access_tokens** — referenced by Invoice_sms/Invoice_email (token, expires_at) — present in schema (see doc 04/02 family; used for public invoice links).

### Settings
- **settings** (:5589-5601) key/value + sync columns; **settings_audit** (:5615-5632) dormant; `form_field_preferences` (payroll hidden fields, schema :4759).

### Dining/fees integration
- **daily_charge_log** (:1470-1490), **daily_fee_audit_log** (:1503-1522), **daily_fee_transactions** (:1574-1608), **daily_fee_wallet** (:1621-1651) — coupon eligibility sources.

### Boarding
- **boarding_house** (:994-1010), **boarding_dormitory** (:974-990), **boarding_bed** (:957-967), legacy **dormitory** (:1973-1981, MyISAM); **student_residence — MISSING from dump** (live-code dependency).

### Insurance / visitors / misc
- **v_car_insurance**, **v_vehicle** — **MISSING from dump** (insurance + transport family).
- **visitor_tracker** (:6740-6747, MyISAM).
- HR vestigials: employee (:2056), employee_file (:2087), education (:2003), earned_leave (:1992), emp_penalty (:2213), emp_salary (:2224), penalty (:4881), social_media.
- **noticeboard** (:4351-4360).

---

## 16. Legacy quirks to retire

1. **Client-computed payroll totals trusted** (`*ForDb` POST fields) — server should recompute gross/net/deductions (Payroll_model.php:147-150).
2. `pay_salary.month` stored as **month name string**; ordering relies on `FIELD(month,…)` hacks (Payroll_model.php:513); no unique (employee,month,year) index — duplicate guard is app-level only.
3. Schema defaults `status='Paid'`/`approval_status='paid'` on `pay_salary` contradict draft-on-create logic (schema :4859-4860).
4. `payroll_approvals.action` enum lacks 'paid' though payout inserts it (schema :4705 vs Hubtel_payroll_payout_model.php:289).
5. `mark_as_paid` retained-but-blocked shim; `payroll_mark_paid` admin route kept for compatibility (Payroll_approval_model.php:409-417; Admin.php:29895).
6. Admin approval endpoints pass extra args the model ignores (Admin.php:29734/29782/29831 vs model signatures).
7. `payroll_calculate_paye` leaks `debug_first_bracket` and logs bracket JSON at debug (Admin.php:29694-29723).
8. Shared-form batch payroll: one value-set applied to all selected staff in one POST (Payroll_model.php:126-150) — UX/correctness hazard.
9. **Dead payroll libraries**: Payroll_parser/Payroll_printer unwired (§2.7).
10. Employee "PDF" payslip is HTML with .pdf filename; ZIP of HTML payslips (Employee.php:83-163).
11. Library: file uploads use client filenames into public `uploads/document/`; no fines, no return lifecycle, `issued_copies` counter races (Librarian.php:109-117, 220-257).
12. Inventory POs auto-receive on create; `mark_purchase_received`/weighted-average path retained but bypassed (Inventory_model.php:886 vs :1091).
13. Stock movement 'transfer' enum + `inventory_locations` table unused by logic.
14. Two SMS log tables + two email log tables + `sms_log` legacy family — consolidate.
15. `sms_templates`/`sms_schedules` and `Payment_sms_automation` (calls non-existent `sms_sender` library) are dead/broken (application/sql/sms_templates.sql; Payment_sms_automation.php:11).
16. Twilio + hubtel-sms-api SDK folders dead (~70 files) — remove.
17. `send_sms_password_reset` fatal `$correct_name` bug (Sms_model.php:309).
18. SMS validation returns **HTML strings** from the model on failure (Sms_model.php:179-183, 206-231).
19. **Hardcoded SMTP password in Email_model** (`~Myjesus4me2018`, Email_model.php:100) + vendor branding footer on all email (:122-124).
20. Cron.php monthly bill reminders: **unauthenticated HTTP endpoint** (Cron.php:4-9); Finance_cron IP allowlist is localhost-only hardcode (Finance_cron.php:24-27); finance reminder SMS is a log-only stub (Finance_cron.php:144-152).
21. `settings_audit` table with no writer; `Setting_model`/`sch_settings` dead model; `update_default_controller` no-op rewrite of routes.php (Admin.php:20699-20705).
22. `skin_colour` theme switch inert (commented stylesheet, includes_top.php:35); student_code_prefix change rewrites every student code in a PHP loop (Admin.php:20496-20508).
23. `get_phrase` fake translation (multi_language_helper.php:10-20); 7 orphan lang files; language setting rows unused.
24. Boarding `student_residence` and insurance `v_car_insurance`/`v_vehicle` missing from schema dump — drift between code and schema authority.
25. visitor_tracker writer dormant (Iptracker never loaded); MyISAM remnants (`dormitory`, `noticeboard`, `visitor_tracker`, `group_message_other`).
26. Dining coupons are ephemeral print HTML — no issuance/redemption ledger; exclusion logic depends on `daily_fee_audit_log` row-per-day assumption.
27. Noticeboard `read_notice_ids` CSV string columns for read tracking.
28. `sms_automation_logs` status update by 5-minute time window heuristic (Cron.php:101-104).
29. Duplicate `get_settings` implementations (manager_helper + Crud_model).
30. Hardcoded 'GH¢'/'GH₵' literals in notification/email copy despite configurable `currency` setting (Notification_dispatcher.php:267; Notification_model.php:91,123,147).

---

## 17. VERIFIED LEGACY BEHAVIOR vs RECOMMENDATION

| # | VERIFIED LEGACY BEHAVIOR (evidence) | RECOMMENDATION for iEduPro |
|---|---|---|
| V1 | Payroll rows are per-employee-per-month obligations created as `draft`; paid state reachable **only** through provider-confirmed payout (Payroll_model.php:155-156; Hubtel_payroll_payout_model.php:258-309; tests/payroll-state-lifecycle.test.js:20-30) | Preserve state machine draft→pending_approval→approved→paid with provider callback as sole paid-transition; keep `payroll_approvals` history + immutable audit |
| V2 | SSNIT Tier 1 = employer (basic×13%), Tier 2 = employee (basic×5%), both on **basic salary**; net = gross − (tier2 + other deductions) (Payroll_model.php:377-445; schema :4837-4850 comments) | Encode statutory component semantics (employer vs employee, base=basic) as config, not convention |
| V3 | PAYE = annualized progressive brackets from `tax_brackets` (Ghana fallback 0/5/10/17.5/25/30/35%) (Tax_calculator.php:104-187, 309-361) | Keep DB-driven bracket tables with effective dating + breakdown per payslip |
| V4 | Statutory rates editable with audit log + per-payroll rate snapshots (Payroll_statutory_model.php:94-129; Payroll_model.php:158-164) | Recreate rate versioning + snapshot columns or effective-dated rate entities |
| V5 | Payout initiation requires finance/super-admin; callback binds reference+amount+recipient+txn with FOR UPDATE locking; failures persisted for reconciliation (Payroll_payout.php:77-83; Hubtel_payroll_payout_model.php:162-256) | Port the payout ledger design (unique pay_id + client_reference, callback review states) |
| V6 | Payroll notifications: role-routed (submission→approvers; approval/rejection→creator(+finance); payment→employee) with SMS opt-out default (Notification_dispatcher.php:140-214; user_notification_preferences default 0) | Build notification-preference matrix per user/event/channel; default opt-out for SMS costs |
| V7 | Payroll dashboards/exports cache on file adapter keyed by month/year; approval invalidates (Payroll_model.php:336-339; Payroll_approval_model.php:219-222) | Replace file-cache invalidation dance with query-level aggregates |
| V8 | Library = catalogue + request/accept with copy counters; **no fines/returns/limits** (Librarian.php:88-275; schema :1015-1046) | Design real circulation (loan records, due dates, fines, member caps) rather than porting |
| V9 | Inventory: sales decrement stock with movement log; POs auto-received + integrated to expenses via hooks; returns validated against already-returned; supplier payables with partial payments (Inventory_model.php:145-180, 857-976, 502-630, 1712-1878) | Port as first-class purchasing + POS module; add receiving workflow instead of auto-receive |
| V10 | SMS = Hubtel-only (simple + personalized), balance-aware errors, Ghana phone normalisation (Sms_model.php:20-237, 428-452) | Abstract gateway layer; keep template + recipient-group model; drop HTML-in-model responses |
| V11 | In-app notifications with type→route map and mark-read-on-view (Notifications.php:45-189) | Keep typed notification entities with deep links; unify the two creator APIs |
| V12 | Email hardcoded SMTP + credential in source (Email_model.php:96-104) | Move to env/config-driven transport; secrets vault; remove branding footer |
| V13 | Settings = flat `settings` key/value, ~60+ keys incl. student_code_prefix with global code rewrite (Admin.php:20313-20559) | Typed settings registry w/ validation, audit (wire the dormant settings_audit concept), and no destructive prefix rewrite |
| V14 | Branding: logo/signature/SSNIT-logo file uploads to fixed paths; skin/colour settings partially inert (Admin.php:20582-20632; includes_top.php:35) | Proper media library + theme tokens |
| V15 | Exports: CSV-with-BOM "Excel", Dompdf PDFs, browser printing (export_helper.php:5-38; Pdf.php) | Standardize server-side XLSX/PDF with print CSS parity for receipts/coupons/payslips |
| V16 | Dining coupons: daily eligibility from charge/transaction/audit ledgers; water weekly-Friday validity; 20-up print sheet (Dining_coupon.php:104-264) | If retained, persist coupon issuance/redemption with anti-reuse scanning |
| V17 | Boarding: house→dormitory→bed assignment writes bed status + per-year/term `student_residence` (Boarding_model.php:155-231) | Port hierarchy + residency periods; add missing table to migrations |
| V18 | Vehicle insurance CRUD on `v_car_insurance` (Insurance_model.php:119-155) | Fold into fleet asset management (or drop if out of scope) |
| V19 | Visitor tracker dormant (Iptracker.php:70-71 never loaded; table :6740) | Replace with real analytics or drop |
| V20 | Crons: monthly bill reminder (unauth HTTP), finance daily late-fee+reminders+installments, monthly report, DB backup (Cron.php:12-117; Finance_cron.php:30-252) | Authenticated scheduler (secret/CLI), idempotent jobs, real reminder SMS, monitoring |
| V21 | HR self-service = payslip list/download/payment-history only (Employee.php:35-216) | Decide scope: either full HR (leave/appraisal/disciplinary) or slim payslip portal; retire vestigial HR tables (§13) |
| V22 | Multi-language is decorative (get_phrase title-cases keys; Multilanguage.php:43-50) | Ship English-only initially; add i18n framework later with real dictionaries |

---

## 18. Test coverage summary (tests/ + behavior tests)

- **hubtel-payroll-payout.test.js** (72 lines): 7 assertions — dedicated payout ledger migration with UNIQUE pay_id/client_reference (:14-18); approved-only initiation + net_salary/employee_phone/random_bytes (:20-26); configured-not-guessed send URL, no hardcoded endpoint (:28-32); callback four-way binding + FOR UPDATE + mismatch codes (:34-44); explicit provider success required (:46-50); provider failure persistence (:52-57); atomic provider-confirmed paid transition writing payroll_approvals + payout success (:59-65); controller auth surface (:67-71).
- **payroll-state-lifecycle.test.js** (~45 lines): draft-on-create; **no "account credited" SMS at creation**; approval stops at approved (mark_as_paid must not write paid); payment notification only from payout path.
- **payroll-hubtel-ui-authority.test.js** (~90 lines): approvals view uses `payroll_payout/initiate` (not admin/payroll_mark_paid), shows "Pay via Hubtel/Send Salary" copy + payout_status; legacy mark-paid delegates to Hubtel without direct pay_salary writes; approval list exposes payout reconciliation via table_exists guard; numeric user_level finance contract.
- Related safety tests touching this domain: `private-message-attachment-safety.test.js` (attachment boundary), `production-debug-surface.test.js` (debug leakage — relates to payroll_calculate_paye debug fields), `runtime-encryption-secret.test.js` (no hardcoded secrets pattern).
- **Gaps (no coverage)**: Tax_calculator bracket math & fallback; SSNIT/gross/net formulas; Payroll_model.store batch/whitelist/duplicate logic; Payroll_validator rules; statutory settings audit; Cron.php bill-reminder aggregation; Finance_cron late-fee math; Inventory sale/return/PO math (weighted average, payment status); dining-coupon eligibility algorithm; Boarding assign/unassign; Sms_model phone normalisation & batch semantics; notification dispatcher recipient routing; export helpers. Recommend golden tests for tax/statutory math and payout state machine before cutover (mirrors doc 03 recommendation).

---

*End of evidence doc 06. Companion docs: 01-auth-rbac-profiles.md, 02-admission-students-parents.md, 03-attendance-transport.md, 04-exams-grading-reports.md.*
