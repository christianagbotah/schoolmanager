# Legacy Evidence Doc 03 — Attendance & Transport (SchoolManager → iEduPro)

**Repo:** `/home/z/my-project/repos/schoolmanager` · **Branch:** `zai/full-platform-reconciliation-20261024` (HEAD `ff96b2e`)
**Scope:** student attendance (modern + legacy flows), attendance-driven daily-fee automations, teacher/staff attendance surface, transport system (routes/vehicles/drivers/conductors), bus IN/OUT, daily transport choices, transport billing, offline attendance + sync.
**Method:** read-only code audit. All claims cite `file:line`. Line numbers refer to this branch.
**Related docs:** `docs/page-audits/attendance-wave.md` (UI modernization wave), `docs/SOURCE_BASELINE.md`.

---

## 1. Overview

Attendance in the legacy app is not a standalone module — it is the **billing trigger** for a per-day fee economy (feeding/lunch, breakfast, classes, water, transport). Marking a student present or late **charges their wallet** (prepaid deduction first, arrears otherwise) via `Daily_fee_model::process_daily_charges()`, which is idempotent through a `daily_charge_log` row keyed on `(student_id, charge_date)`.

There are **four coexisting student-attendance surfaces** (a retirement hazard):

| Surface | Entry | Status model | Fee automation |
|---|---|---|---|
| **Attendance portal (modern)** | `Attendance.php` (admin + teacher) | 0–6 statuses, fee panel inline | ✅ full (charge + reverse + payments) |
| **Attendance_enterprise (AJAX shell)** | `Attendance_enterprise.php` | same model | ⚠️ broken `save()` signature (§2.6) |
| **Legacy admin/teacher register** | `Admin.php` / `Teacher.php` (`manage_attendance*`, `attendance_selector*`, `attendance_update`) | 0–5 statuses | ✅ in Admin (via same model), ❌ Teacher still writes `transport_fare` legacy table |
| **Barcode check-in/out** | `Admin.php::verify_check_in` | `checked_in`/`checked_out` flags | gates entry on invoice arrears; separate feeding scan |

Transport has **three coexisting bus-attendance ledgers** (another retirement hazard): `bus_attendance` (direction + fares, the active one), `transport_daily_log` (yes/no boarded/paid, used by the auto-biller), and `daily_transport_choices` (parent/admin daily IN/OUT intent). Vehicles/drivers exist in **two parallel table families** (`v_*` legacy vs `vehicles`/`drivers`/`vehicle_assignments` new), **neither present in the schema dump**.

---

## 2. Student attendance workflow

### 2.1 Access control & role scoping

- `Attendance.php:10-14` — constructor redirects unless `login_type` is `admin` or `teacher`.
- `Attendance.php:16-30` — `can_access_class()`: teachers may only touch classes where `class.teacher_id == session.login_user_id`; admins bypass.
- `Attendance.php:32-38` — `deny_class_access_json()` returns HTTP 403 JSON.
- Enforcement order is test-pinned: guard runs **before** section lookup in `mark()` (`Attendance.php:57-59`), before student-data AJAX (`:156-159`), and **before** `save_attendance_and_fees` (fee persistence) in `save()` (`:206-209`); also on `print_report` (`:404-410`), `get_report_data` (`:542-548`), `export_report` (`:710-716`). Contract test: `tests/attendance-teacher-scope-contract.test.js:17-49`.
- `Attendance_daily_fees.php:22-26` — conductors are explicitly barred from classroom attendance marking.
- `Attendance_enterprise_model.php:15-35` — `get_user_permissions()`: admin level 1–2 may mark; any teacher may mark; `can_collect_fees` follows the `teacher_fee_collection_mode` setting (`restricted` blocks collection).
- **Attendance *monitoring* privilege** (view-only, not marking): `teacher_privileges` table, type `attendance_monitoring`; admin L1 manages grants at `Admin.php:25469-25579` (bulk grant `:25524-25579`); helper `application/helpers/attendance_privilege_helper.php:26-53` (admin L1/L2 always), `:64-82` (`has_teacher_privilege`). Migration `database/migrations/teacher_attendance_privileges.sql:9-40`.
- Fee-collection permission matrix lives in `Daily_fee_model::get_fee_collection_permissions()` (`Daily_fee_model.php:173+`), `can_collect_daily_fees()` (`:31`), `can_collect_fee_type()` (`:154`), backed by `fee_collection_assignments` (admin CRUD `Admin.php:18312-18369`).

### 2.2 Marking flow (modern portal)

`Attendance::mark()` (`Attendance.php:50-144`):

1. `class_id` + `date` from GET (`:51-52`); ownership check (`:57-59`).
2. Loads students via `Attendance_enterprise_model::get_class_students()` (`:83`), which joins `enroll` for running year/term, excludes muted, and **per student** fetches attendance status, wallet, and per-type discounts (`Attendance_enterprise_model.php:36-82`; route via `MIN(enroll.transport_id)` at `:41`).
3. Loads `daily_fee_rates` for the class (`:84`; model `:84-99`, defaults all-zero when unset).
4. Loads existing attendance rows keyed `class_id + timestamp` (`:89-98`) — date is a **unix timestamp** (`strtotime($date)`, `:86`).
5. Loads per-student payment status (`Payment_status_model::getBulkPaymentStatus`, `:105`), same-day `daily_fee_transactions` paid amounts (`:108-117`), and full-discount students (`:120-131`).

`Attendance::save()` (`Attendance.php:194-235`) posts per-student `attendance[student_id]=status` and `fees[student_id][feeding_paid|breakfast_paid|classes_paid|water_paid|transport_paid|transport_id|transport_direction|transport_boarded]` (`:218-231`), then calls the model below.

### 2.3 Persistence + reversal — `save_attendance_and_fees`

`Attendance_enterprise_model::save_attendance_and_fees($class_id,$section_id,$date,$students)` (`Attendance_enterprise_model.php:114-573`), wrapped in a DB transaction (`:115`, `:566-570`):

- **Upsert key**: `(student_id, timestamp, class_id)` (`:138-142`). Insert path stamps `year`, `term`, `section_id` (`:282-288`); update path stamps `marked_by`, `marked_by_role` (`:144-148`).
- **Status 6 = Excused**: stores `permission_reason`; cleared when status ≠ 6 (`:150-156`). No UI in the mark view renders status 6 (view `mark_attendance.php:566-571` renders 1–5 only) — Excused is API-reachable only.
- **Present→absent reversal** (`:158-280`): if old status ∈ {1,3} and new ∈ {2,4,5,6} (`:162`):
  - Reverses each charged component from the wallet **arrears-first, remainder to prepaid balance** for feeding/breakfast/classes/water/transport (`:186-248`), then writes `daily_fee_wallet` (`:251-263`).
  - **Deletes** `daily_charge_log` for that student+date (`:269-271`) so a later re-present re-charges.
  - **Keeps** the `daily_fee_transactions` payment (prepaid balance survives; comment `:273-274`), and resets `attendance.payment_status = NULL` (`:277-279`).
- **Charging trigger**: only when new status is 1 (present) or 3 (late) → `Daily_fee_model::process_daily_charges(...)` with `options['transport_status']` only if the client posted `transport_direction` (`:291-301`).
- **Bus attendance side-write** (`:303-338`): if `transport_direction` provided and ≠ `none` and `bus_attendance` table exists, upserts a row keyed `(student_id, attendance_date)` with `direction`, `status = 'boarded'|'expected'`, `marked_by` (`:314-335`). Note this row shape (single `status`/`direction`) differs from `mark_student_boarded()`'s richer shape (§5.2).
- **Breakfast opt-in/out side-effects** (`:340-500`): opt-out reverses today's breakfast charge from wallet, zeroes `daily_charge_log.breakfast_charged`, zeroes `attendance.breakfast_charged`, and reduces `daily_fee_transactions.breakfast_amount` while **keeping the transaction as prepaid** (`:349-421`); opt-in (present/late only, not already charged) applies breakfast charge with discount and mirrors it into wallet/charge-log/attendance (`:424-489`); preference persisted to `student_daily_fee_preferences` (`:493-499`).
- **Payments** (`:502-563`): sums the five paid fields; `payment_type` auto = `arrears|mixed|advance` by wallet arrears (`:515-518`); `collection_point='attendance_portal'` (`:533`); routes to `update_payment()` if a transaction exists for `(student_id, payment_date)` else `process_payment()` (`:538-542`); writes `attendance.payment_status` (`:544-553`). If payments drop to 0 the transaction is **kept as prepaid** and `payment_status` reset (`:554-563`).
- **`mark_all_present()`** (`:607-625`) uses `db->replace()` per student with status 1 and **never calls `process_daily_charges`** — bulk present marks do not charge (quirk; the inline "save" path is the charged one).

### 2.4 Attendance statuses (canonical contract)

| Value | Meaning | Fee behaviour |
|---|---|---|
| 0 | Not marked (default in DB `status` col, schema `:595`) | none |
| 1 | Present | charges |
| 2 | Absent | reversal if previously 1/3 |
| 3 | Late | **charges (present-like)** |
| 4 | Sick at Home | reversal if previously 1/3 |
| 5 | Sick at Clinic | reversal if previously 1/3 |
| 6 | Excused (+`permission_reason`) | treated as absent-ish for reversal (`:162`); no UI |

- Dashboard aggregates "absent" as 2+4+5 (`Attendance.php:282`); percentage uses present/total (`:283-284`).
- Contract test `tests/attendance-status-contract.test.js:12-30` pins `<option>` labels `Present (P)/Absent (A)/Late (L)/Sick at Home (S)/Sick at Clinic (C)` for admin + shared marking views, forbids "Busy (B)", and `:48-51` pins the late-charges rule (`isAbsent = status != '1' && status != '3'` in the view + `status == 1 || status == 3 → process_daily_charges` in `Admin.php`).

### 2.5 Reports & exports

- `Attendance::get_stats()` (`:236-300`): role-scoped counts; teacher scope joins `class.teacher_id`; admin uses `get_daily_stats()` (`Attendance_enterprise_model.php:575-595`, counts by `timestamp`+status over all rows).
- `get_status_details()` (`:338-364`): drill-down list per status/day.
- `print_report()` (`:396-492`) and `get_report_data()` (`:524-651`): date-range counts per student via batch query `get_attendance_by_student_ids()` (`Attendance_enterprise_model.php:755-784`).
- `export()` (`:653-700`) / `export_report()` (`:702-761`): CSV, per-student N queries (inefficient), teacher-scoped.
- `send_notifications()` (`:494-522`): SMS to parents of today's status-2 students.
- Modern daily report view contract: `tests/attendance-report-filter-contract.test.js:19-56` (exact status filters incl. `0 = Not Marked`, string-typed comparison in `Admin::getAttendanceReportData`, no year/term filter widgets, daterangepicker, "Sick at Home/Clinic" wording) and `tests/attendance-report-assets-contract.test.js:13-41` (shared DataTables/Chart bundles; only daterangepicker/moment/report JS local).

### 2.6 `Attendance_enterprise.php` (thin shell) — and its broken path

`Attendance_enterprise.php` (103 lines): `index` `:11`, `mark` `:22`, `get_stats` `:33`, `get_teacher_classes` `:40`, `get_student_data` `:47`, `save` `:65-69`, `quick_mark_present` `:72`, barcode `:82`, `get_student_by_code` `:93`.
**Quirk:** `save()` passes the raw POST as a single arg, but the model signature is 4-arg (`Attendance_enterprise_model.php:114`); the model then rejects non-array `$students` (`:118-120`) → the enterprise `save()` endpoint can never persist. The real save path is `Attendance::save()`.

### 2.7 Legacy admin/teacher register (still live code)

- `Admin::manage_attendance` (`Admin.php:10879`) / `manage_attendance_view` (`:10889`).
- `enrollment_updator` (`:10967-11214`) + `attendance_selector` (`:11231+`): **seeds** one unmarked `attendance` row per enrolled student for today (status defaults 0), keyed `class_id+section_id+year+term|sem+timestamp`; also auto-creates term enrollments from the previous term and flips `enroll.status_attendance` to `close`; `_safe_insert_attendance` helper (`:10937-10962`) guards duplicates.
- `Admin::attendance_update` (`:32845-33000`): per-student `status_<attendance_id>` + `transport_<attendance_id>` (in/out/both/none/pending); updates `attendance.status`; **if status 1 or 3 → `process_daily_charges`** and mirrors the returned charge array into `attendance.feeding_charged/.../transport_charged` (`:32884-32909`); optional same-form payment collection (`:32913+`).
- `Teacher::attendance_update` (`Teacher.php:1774-1868`): legacy variant — updates statuses, **still writes the legacy `transport_fare` table** (per-day rows `amount_paid`/`due`) at `:1796-1823`, and sends **SMS + email** to parents on status 2 (`:1825-1864`). Comments admit daily fees moved to `Admin` (`:1788-1791`).
- Barcode check-in/out: `Admin::verify_check_in` (`:26578`; logic `:26055-26205`): sets `attendance.checked_in/checked_out` + timestamps; refuses duplicate scans (`:26068-26083`); **denies check-in when the student has unpaid `invoice.due`** ("school_fees_access: denied", `:26115-26132`) unless overridden (`approve`, `:26097-26112`); separate `feeding` scan reads legacy wallet columns `feeding_status/att_status/due` (`:26176-26204`) — an **older daily_fee_wallet schema** that no longer matches the dumped table (columns `*_balance/*_arrears`, schema `:1621-1644`).

### 2.8 Edit windows

**There is no edit window/lock.** Any date can be re-marked (date input `mark_attendance.php:206,258`), and correctness is preserved by charge-log idempotency + the reversal block (`§2.3`) rather than by time-based restrictions. Payments for backdated dates are flagged only as `$is_backdated` in the cashier portal (`Fee_collection.php:907`) with no hard block.

---

## 3. Attendance → fee automation chain (CRITICAL)

### 3.1 Trigger & order

Chain (modern portal): `Attendance::save` → `Attendance_enterprise_model::save_attendance_and_fees` → **`Daily_fee_model::process_daily_charges`** (`Attendance_enterprise_model.php:300`). Other entry points calling the same model method: `Admin::attendance_update` (`Admin.php:32889`), `Attendance_daily_fees::mark_attendance_with_fees` (`Attendance_daily_fees.php:95`), cashier portal `Fee_collection.php:829,1049,1184`, `Bus_conductor::mark_bus_attendance` (`Bus_conductor.php:142`).

`process_daily_charges($student_id,$attendance_date,$class_id,$year,$term,$sem,$options)` (`Daily_fee_model.php:387-661`):

1. **Normalize** `$charge_date = strtotime(date('Y-m-d', $attendance_date))` — midnight timestamp (`:388-389`).
2. **Idempotency gate**: reads `daily_charge_log` for `(student_id, charge_date)`; **returns early if `feeding_charged > 0 || classes_charged > 0`** ("Attendance already processed", `:391-404`). Transport-only rows do NOT block re-entry.
3. **`skip_transport`**: if the existing log already has `transport_charged > 0` and a transport status is now supplied → skip transport component (`:406-411`).
4. Load wallet (`get_student_wallet`, `:278-332` — lazily creates per-`year/term` wallet; note it mutates an existing wallet's year/term in place `:299-312`), class rates (`get_class_rates`, `:337-360`, latest row per class+year, `sem` filter commented out `:342`), preferences (`get_student_preferences`, `:365-381` — creates defaults: breakfast off, water on, auto-deduct on).
5. **Charge sequence** (each gated by `is_fee_module_enabled($module)` — settings key `fee_module_<module>`, helper `application/helpers/fee_module_helper.php:8-12`):
   1. **Feeding** — mandatory if `feeding_rate > 0` (`:430-457`).
   2. **Breakfast** — optional: `breakfast_enabled` AND `prefs.breakfast_subscribed` (`:459-486`).
   3. **Classes** — mandatory if `classes_rate > 0` (`:488-515`).
   4. **Water** — **weekly**: `water_enabled` AND `water_subscribed`; charged only if no `daily_charge_log` row with `water_charged > 0` within `monday this week … sunday this week` of the attendance date (`:517-556`).
   5. **Transport** — only when `options.transport_status ∈ {in,out,both}` (not `none`/`pending`, `:560`); requires `enroll.transport_id`; fare = `transport.route_fare` for `in` or `out`, **`route_fare × 2` for `both`** (`:561-575`).
6. **Discounts**: per fee type via `Discount_model::get_student_discount_for_date(...)`; `percentage` → `amount × value/100`, `fixed` → `min(value, amount)`; recorded via `record_discount_safely` (`:433-451` pattern; discount log write `:639-654`).
7. **Wallet application** — `apply_charge()` (`:666-713`): prepaid-first (`balance ≥ amount` → deduct, status `paid`), partial (balance > 0 → remainder to arrears, `partial`), else all arrears (`unpaid`); honours `auto_deduct_enabled`; every movement audit-logged to `daily_fee_audit_log` (`:708-710`).
8. **Charge log write** (`:607-636`): insert or update `daily_charge_log`. ⚠️ Update path bug: `'total_charged' => $existing->transport_charged + $total_charged` (`:620`) double-counts transport on the update branch; `transport_charged` uses `max(existing, new)` (`:619`).
9. **Revenue recognition** — `recognize_revenue()` (`:657`; impl `:2142-2230`): per fee type, idempotent journal entry `JE-REV-<TYPE>-<Ymd>-<student_id>` (`:2161-2165`); **DR Unearned Revenue (2040)** when wallet settled prepaid, **DR Accounts Receivable (1200)** when in arrears; **CR revenue** `4200 feeding / 4210 breakfast / 4220 classes / 4230 water / 4240 transport` (`get_revenue_account`, `:2294-2306`); account balances updated (`:2270-2289`).

### 3.2 `student_daily_fee_preferences` gating

Columns `breakfast_subscribed` (default 0), `water_subscribed` (default 1), `auto_deduct_enabled` (default 1), `notes`, `updated_at` (schema `schema/schoolmanager_schema_redacted.sql:5917-5934`; defaults in `Daily_fee_model.php:368-377`). Breakfast/water charges fire only when both the class rate is enabled **and** the preference is on. `auto_deduct_enabled = 0` pushes all charges to arrears regardless of balance (`apply_charge` else-branch, `:697-706`).

### 3.3 What happens when attendance changes after charging

- **Present/Late → Absent/Sick/Excused**: full per-component reversal to the wallet (arrears-first), charge-log deletion, payment transaction **retained as prepaid**, `attendance.payment_status` reset (`Attendance_enterprise_model.php:162-280`, detailed in §2.3).
- **Re-present same day**: because the charge log was deleted, `process_daily_charges` re-charges from scratch.
- **Opt-out breakfast** (portal, cashier edit, or payment update): `reverse_charge()` (`Daily_fee_model.php:718-754`) restores arrears-first→balance; charge log + `attendance.breakfast_charged` zeroed; transaction adjusted/kept (`Attendance_enterprise_model.php:349-421`; `Daily_fee_model.php:1082-1099`).
- **Retroactive opt-in** via `update_payment` (`:790-800`, application `:1055-1080`) and the inverse reversal (`:1082-1117`) — updates charge log, attendance columns, and revenue entries.
- **Cashier edit path** (`Fee_collection.php:909-1068`): editing a transaction **deletes the day's `daily_charge_log`** (normalized midnight key, `:937-957`) then re-runs `process_daily_charges` (`:1041-1068`), which re-applies current preferences; total edited to 0 → `delete_payment()` + `recalculate_wallet_from_date()` (`:720-748`).
- **Full wallet rebuild**: `recalculate_wallet_from_date()` (`Daily_fee_model.php:1702+`) replays payments/charges/topups from an audit snapshot (`get_wallet_state_before_date` `:1784`, `replay_*` `:1848-1928`).

### 3.4 Attendance-fueled collections (cashier portal excerpts)

`Fee_collection::collect_fees` (transport-relevant excerpt `:700-896`):
- Existing-transaction probe by `(student_id, payment_date)` (`:714-717`).
- Zero-total edit → delete + wallet recalc (`:720-748`).
- No attendance yet + `mark_present` or transport direction → **inserts `attendance` status 1 with `marked_by/marked_by_role` and `sync_status='PENDING'`** (`:806-822`), then `process_daily_charges` (`:829`), then bus boarding (`:832-834`).
- Transport amount > 0: `transport_boarded=1` → `mark_student_boarded_cashier` (wrapper → `Daily_fee_model::mark_student_boarded`, `:1961-1966`); else `record_transport_intention` → `Daily_fee_model::record_transport_decision` (`:1972-1977`).

`Attendance_daily_fees::mark_attendance_with_fees` (`Attendance_daily_fees.php:33-126`): presents-only array flow; per-student upsert (status forced 1), `process_daily_charges` with `transport_status: 'none'` ("Will be updated by bus conductor", `:104`), then stamps `attendance.*_charged` and `payment_status='unpaid'` (`:109-116`).

---

## 4. Teacher / staff attendance

**There is no staff timekeeping module in active use.**

- `Employee.php` is the payroll **self-service portal** only (payslips `:55-75`, PDF `:83-118`, ZIP `:126-163`, payment history `:171-216`) — no attendance functions.
- `emp_attendance` table exists (schema `:2132-2156`: `emp_id, atten_date, signin_time, signout_time, working_hour, place, absence, overtime, earnleave, status`) but **zero references** in any controller/model (grep across `application/` returns nothing) → vestigial.
- `teacher_privileges` (`schema:6450`) is an authorization grant for **viewing** school-wide attendance monitoring, not staff attendance (§2.1).
- `daily_fee_wallet`/`bus_attendance.conductor_id` track conductors as actors (who marked), not as attendees.

**Recommendation:** treat staff attendance as net-new in iEduPro; do not model on `emp_attendance`.

---

## 5. Transport system

### 5.1 Routes, vehicles, drivers

- **Routes = `transport` table** (schema `:6602-6614`): `transport_id, route_name, number_of_vehicle (longtext! — free text, not FK), description, route_fare (longtext), driver_id (FK→non_teaching_staff.staff_id per column comment)`. CRUD: `Admin::transport()` create/update/delete (`Admin.php:17765-17832`); DataTable `get_transports` (`:17852-17938`, per-route student count from `enroll` `:17903-17907`); report stats `get_transport_report_data` (`:17939-17964`); import template `get_transport_template_data` (`:17994+`). A `due` column migration exists for `transport_fare` (`application/migrations/add_due_column_to_transport_fare.sql`).
- **Student→route assignment**: `enroll.transport_id` (per year/term). `Admin::assign_transport` bulk-updates `enroll` (`:18371-18408`); unassign/reassign `:31834-31846`. ⚠️ Inconsistent reads: `Transport.php:27-34,143-153,178-182` filter on **`student.transport_id`** (a column the modern save path does not write), while everything else uses `enroll.transport_id`.
- **Vehicles/drivers — two parallel families, both absent from the schema dump:**
  - Legacy `v_*` family: `Vehicle.php` CRUD (`add_vehicle:67`, types `:301`, models `:415`, roadworthy expiry `:543`) over `v_vehicle, v_vehicle_type, v_vehicle_model, v_transporter` (`Vehicle_model.php` table refs); `Driver.php` CRUD (`add_driver:66` — auto code `D<year><rand>`, mobile validation Ghana 10-digit `:118-126`, duplicate check `:156`) over `v_driver` + link `v_vehicle.driver_id` (`Driver_model.php:101-139`), delete blocked if referenced by `v_loading`/`v_expenditure` (`:142-167`), license types `v_license_type` (`:94-98`).
  - Newer family in `Transport_model.php`: `vehicles, drivers, vehicle_assignments, vehicle_insurance, vehicle_maintenance` (`:17-93`; `assign_driver` completes previous assignment then inserts `active` `:72-83`; expiring-insurance report `:51-59`).
  - `schema/schoolmanager_schema_redacted.sql` contains **no** `vehicle*`/`driver*`/`v_*` tables (only the `transport.number_of_vehicle` text column at `:6605`) → these subsystems were deployed ad hoc or are dead on current installs.
- Route lookups by newer controllers hit **nonexistent tables**: `Daily_transport.php:66,194` uses `transport_routes`; `Bus_conductor::get_route_students` uses `transport_route` (`Bus_conductor.php:182`); `Transport_auto_billing.php:117-129` uses `transport_fare`; `Conductor::get_daily_students` uses `students`/`classes` table names (`Conductor.php:51-59`) instead of `student`/`class`.

### 5.2 Bus IN/OUT — `Daily_fee_model::mark_student_boarded()` (read fully)

`Daily_fee_model.php:2398-2595` — the authoritative boarding routine (used by cashier portal wrapper `Fee_collection.php:1961-1966` and exposed via `Fee_collection` AJAX `:1458`):

1. `$today = strtotime(date('Y-m-d', $attendance_date))` (midnight) or today (`:2399`).
2. Resolve route: `enroll` (year/term) → `enroll.transport_id`; error `'Student not assigned to any route'` if absent (`:2404-2412`); `transport` row → `route_fare` (`:2414-2419`).
3. Existing record probe: `bus_attendance` keyed `(student_id, attendance_date)` — **one row per student per day** (no route/direction in key) (`:2422-2425`).
4. **Fare math** (`:2427-2430`): `in_fare = fare` if direction `in|both`; `out_fare = fare` if `out|both`; `total_fare = in+out`. So **charges accrue per direction leg: IN charges the fare, OUT charges the fare again, BOTH = 2×** — there is no "charge on IN only" rule.
5. **Direction `none`** (`:2432-2454`): if a record exists, **reverses** the previously charged amount (`reverse_transport_charge`, `:2600-2617` — arrears-first→balance), zeroes `bus_attendance` (fares, boarded flags, `transport_charged`), resets `daily_charge_log.transport_charged` via `update_charge_log(...,0)` (`:2622-2650`) → **"Marked as not using transport"**.
6. **Discount** applied to `total_fare` (`:2456-2483`, via `Discount_model::get_student_discount_for_date` + `record_discount_safely` with `reference_type='transport_boarding'`).
7. **Re-boarding (direction change)**: previous `amount_charged` (`bus_record->amount_charged ?? 0`, `:2485-2489`) is reversed from the wallet before applying the new fare (`:2491-2497`) — i.e., **last-write-wins with full prior-charge reversal**.
8. **Wallet application** (`:2499-2534`): prepaid → `paid/payment_source=prepaid`; partial → `partial/mixed`; else `unpaid/arrears` (arrears increase; no cash collected). Audit log entry `:2536-2539`.
9. **bus_attendance upsert** (`:2541-2575`): update path keeps `route_id/date`; insert path stamps `route_id = enroll.transport_id`, `attendance_date`, `collection_point='portal'`, `year`, `term`, `created_at`. Row records `transport_direction, in_fare, out_fare, total_fare (gross), amount_charged (net after discount), boarded_in, boarded_out, in_time/out_time ('H:i'), conductor_id, payment_status, payment_source, prepaid_deducted, cash_collected, paid_amount, payment_time, collected_by(+_role)`.
10. **Downstream syncs**: `update_charge_log` (transport component of `daily_charge_log`, `:2577-2578`), `update_attendance_transport` (`attendance.transport_charged` where `(student_id, timestamp)`, `:2580-2581, 2655-2666`), `update_transaction_transport` (latest `daily_fee_transactions` for the date gets `transport_amount` adjusted, `:2671+`), and `recognize_revenue(['transport_charged'=>fare])` (`:2586-2587`).
11. Returns `{status, message 'Transport updated - <DIR>', fare, payment_status}` (`:2589-2594`).

**State machine (bus_attendance per student/day):**

```
        set direction (attendance save / set_choice_and_collect / cashier)
 ┌──────────┐   direction≠none    ┌─────────────────────────────┐
 │ (no row) ├────────────────────►│ expected/boarded per flags  │
 └────┬─────┘                     │  in / out / both            │
      │                           └──────┬──────────────────────┘
      │ direction=none (no row → no-op)   │ change direction → reverse amount_charged, apply new
      ▼                                   ▼
   none (zero fares, boarded=0) ◄──── direction=none → reverse + zero
```
`boarded_in/boarded_out` are set by conductor flows (`Bus_conductor::mark_bus_attendance`, `Admin::transport_attendance`, `Daily_transport::mark_boarding`); fares+charges by `mark_student_boarded()` (cashier/portal) or fare-free conductor marking.

### 5.3 Who marks what — conductor vs driver vs cashier

| Actor | Controller | Capability |
|---|---|---|
| **Conductor** (session `login_type='conductor'`) | `Bus_conductor.php` (guard `:14-16`) | `mark_bus_attendance` (`:31-170`): sets `boarded_in/out` + times; derives `transport_status` (`:95-102`); computes charge from `$rates['transport_in_rate'|'transport_out_rate'|'transport_both_rate']` (`:118-128`) — ⚠️ `get_class_rates()` never returns those keys (`Daily_fee_model.php:349-356`), so `$transport_charge` is always null/0 here unless the rates row carries them; then calls `process_daily_charges` with the status (`:142-150`) and mirrors to `attendance` (`:152-158`). `collect_transport_fare` (`:220-341`): transport-only payment (create/update `daily_fee_transactions`, `collection_point='bus'`, direction-based amount incl. 2× for both, discount `:278-293`, duplicate-guard `:311-331`). Discount profile management restricted to `discount_category='daily_fees'` (`:355-489`). |
| **Conductor (admin level 5)** | `Conductor.php` (gate `:22-32`), `Daily_transport::mark_boarding` (gate `admin.level == 5`, `Daily_transport.php:177-186`) | afternoon OUT page + `transport_daily_log` upsert (`Conductor.php:69-91`). `get_daily_students` is broken (wrong table names, `:51-59`). |
| **Conductor** | `Daily_transport::mark_boarding` (`:172-278`) | IN: `boarded_in=1`, `in_time`, `in_fare` if 0. OUT: `boarded_out=1`, `out_time`; **if `out_fare == 0` (didn't pay in morning) → fare set, `payment_status='unpaid'`, `add_transport_arrears()`** (`:221-226, 249-252`) which increments `daily_fee_wallet.transport_arrears` and writes a `daily_fee_audit_log` row ("Boarded OUT without morning payment …") (`:283-321`). New-row insert path defaults `payment_status='unpaid'` (`:267`). Direction string derived from flags (`:233-242`). Uses `transport_routes` table (`:194`) — missing from schema. |
| **Driver** | `Driver.php` | **CRUD/registry only** (`add_driver:66`, `edit:188`, `delete:310`, print `:419`). No boarding/collection capability anywhere. |
| **Cashier / attendance portal** | `Fee_collection.php`, `Attendance.php` | Direction decision + optional boarding → `mark_student_boarded()` (full charge/reversal semantics §5.2). |
| **Admin (any level)** | `Admin::transport_attendance` (`:18453-18541`) | Bulk `mark_attendance` for morning/afternoon/both — sets flags/times/direction in `bus_attendance` **without fare computation** (`:18502-18522`). |

### 5.4 Daily transport choices — `Daily_transport::set_choice_and_collect()` step-by-step

`Daily_transport.php:24-150`:

1. Auth: actor must be `admin` or `teacher` with `can_collect_daily_fees == 1` on their row; `collection_point` = admin's (`office` default) or teacher's (`classroom` default) (`:32-45`).
2. Inputs: `student_id`, `choice_date` (default today → timestamp), `transport_direction ∈ {none,in,out,both}` (validated `:52-56`), `notes` (`:47-50`).
3. Route resolution: `student.transport_id` (**student-table column**, not enroll) → `transport_routes` row (`:59-70` — table missing from schema dump).
4. Fare calc: `in`/`out` → `route_fare`; `both` → 2×; `none` → 0 (`:72-87`).
5. **bus_attendance upsert** keyed `(student_id, attendance_date)` (`:89-121`): `transport_direction, in_fare, out_fare, total_fare, payment_status = total>0 ? 'paid' : 'unpaid', paid_amount, payment_time, collected_by, collected_by_role, collection_point` (insert path adds `route_id, year, term, created_at`). ⚠️ It marks money as *paid* without touching the wallet or creating a `daily_fee_transactions` row — no `process_daily_charges`, no reconciliation.
6. **daily_transport_choices upsert** keyed `(student_id, choice_date)` (`:123-143`): `transport_direction, choice_made_at, choice_made_by (login_type), notes`.
7. Response message differs for `none` vs paid direction (`:145-149`).

Companion endpoints: `get_choice` (`:155-167`), `get_route_students_with_payment` (`:326-354` — raw SQL joining `student/enroll/class/bus_attendance` with `in_paid/out_paid` flags).

**Intent-only alternative:** `Daily_fee_model::record_transport_decision()` (`:2043-2136`) records the choice in `bus_attendance` with `payment_status='pending'`, fares per direction, **explicitly no deduction** ("Deduction happens when conductor confirms boarding", `:2076-2077`), returns `has_sufficient_balance` for UI.

---

## 6. Transport billing

### 6.1 Auto-biller (attendance + conductor log driven)

`Transport_auto_billing.php`:

- `process_daily_billing($date)` (`:12-28`): loops **all** enrolled transport students (`enroll.transport_id > 0`) and calls the per-student check. Invoked over HTTP only — no cron entry in `Cron.php` (grep for `transport|attendance|daily_fee` returns nothing) and `Transport_billing_hook` (`application/hooks/Transport_billing_hook.php:7-29`) triggers *recalculation* (not billing) via a 5-second cURL call to `transport_auto_billing/recalculate_billing/...` after attendance saves.
- `check_and_bill_student` (`:31-74`), **per (student, date)**:
  1. Idempotency: existing `transport_auto_billing` row → return (`:33-38`).
  2. Presence: `attendance.status == 1` for `strtotime($date)` → `was_present yes/no` (`:40-46`).
  3. Conductor log: `transport_daily_log` row for `(student_id, log_date=$date)` → `boarded_bus`, `paid_fare` ('yes'/'no' enums) (`:48-55`).
  4. **Bill iff present AND boarded AND not paid** (`:57-58`): inserts `transport_auto_billing` (`fare_amount = transport.route_fare`, `billing_status='confirmed'`) and adds the fare to legacy `transport_fare.balance` (`update_transport_fare_balance`, `:117-129`).
- `recalculate_billing($student_id,$date)` (`:77-115`): re-evaluates the same predicates; if attendance absent or not boarded → sets `billing_status='reversed'` and subtracts the fare from `transport_fare.balance`.
- `Admin_transport_billing.php` (`:10-41`) is a thin read-only dashboard over `transport_auto_billing` (latest 100, stats by `billing_status`), joining a nonexistent `students` alias (`s.id`).

**Billing cadence:** strictly **per-day**, not monthly/weekly. The weekly/monthly dimension exists only in the *water* weekly charge (§3.1) and term-level route fare reporting (`Admin::get_transport_collected_fares_by_term`, `Admin.php:17966-17991`, summing `daily_fee_transactions.transport_amount`).

### 6.2 Ledgers involved

- `transport_auto_billing` (schema `:6630-6649`): `billing_id, student_id, transport_id, billing_date (DATE), fare_amount, was_present, boarded_bus (enum yes/no), billing_status (pending/confirmed/reversed), created_at` + sync columns.
- `transport_daily_log` (schema `:6655-6676`): `log_id, student_id, transport_id, log_date (DATE), boarded_bus (yes/no), paid_fare (yes/no), conductor_id, remarks, logged_at` + sync columns. Written by `Conductor::save_daily_log` (`Conductor.php:69-91`) keyed `(student_id, log_date)`.
- Legacy `transport_fare` per-day fare ledger (not in schema dump; written by `Teacher.php:1796-1823`, read by `Transport_auto_billing.php:117-129`; `Admin::get_transport_fare_students` `:18410-18451` instead reads `daily_fee_wallet.amount_paid` — a column the modern wallet doesn't have).

---

## 7. Tables & columns (from `schema/schoolmanager_schema_redacted.sql`)

All engines InnoDB unless noted; every table carries the sync block `sync_status enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW'), last_modified_at, last_modified_by, device_id (default 'local-server-001'), version, retry_count, sync_error` (omitted below for brevity).

### `attendance` (schema :581-626) — core
`attendance_id PK`, `timestamp longtext` (unix ts stored as text), `year longtext`, `term longtext`, `class_id int`, `section_id int`, `student_id int NOT NULL`, `class_routine_id`, `status int NOT NULL DEFAULT 0`, `checked_in int DEF 0`, `checked_in_timestamp longtext`, `checked_out int DEF 0`, `checked_out_timestamp longtext`, `sem longtext`, `mute enum('0','1') DEF '0'`, `sync enum('yes','no') DEF 'no'` (legacy flag), `feeding_charged/breakfast_charged/classes_charged/water_charged/transport_charged decimal(10,2) DEF 0`, `transport_status enum('none','in','out','both') DEF 'none'`, `breakfast_opted tinyint(1) DEF 0`, `payment_status enum('paid','unpaid','partial','advance') DEF 'unpaid'`, `marked_by int`, `marked_by_role varchar(20)`, then sync block. **No unique key on (student_id, timestamp, class_id) in the dump** — dedupe is application-enforced (`_safe_insert_attendance`, `Attendance_enterprise_model.php:138-142`).

### `bus_attendance` (schema :1111-1152)
`id PK`, `student_id`, `route_id`, `attendance_date int` (midnight ts), `transport_direction varchar(10) DEF 'none'`, `boarded_in tinyint(1)`, `boarded_out tinyint(1)`, `in_time varchar(10)`, `out_time varchar(10)`, `in_fare/out_fare/total_fare/amount_charged decimal(10,2)`, `payment_status varchar(20) DEF 'pending'`, `paid_amount decimal`, `payment_time int`, `payment_source varchar(20)`, `cash_collected decimal`, `prepaid_deducted decimal`, `collected_by int`, `collected_by_role varchar(20)`, `collection_point varchar(20) DEF 'office'`, `conductor_id int`, `year/term/sem varchar(10)`, `created_at/updated_at int`, sync block. Engine utf8mb3.

### `daily_charge_log` (schema :1470-1490) — idempotency ledger
`id PK`, `student_id`, `charge_date int` ("Midnight timestamp of the day"), `feeding_charged/breakfast_charged/classes_charged/water_charged/transport_charged/total_charged decimal`, `charged_at int`, `synced_to_ledger tinyint`, `ledger_entry_id`, sync block.

### `daily_fee_rates` (schema :1540-1561)
`id PK`, `class_id`, `feeding_rate/breakfast_rate/classes_rate/water_rate decimal(10,2)`, `breakfast_enabled tinyint(1) DEF 0`, `water_enabled tinyint(1) DEF 0`, `year varchar(20)`, `term int`, `sem int`, `created_at/updated_at`. (No `transport_*_rate` columns — see §5.3 quirk.)

### `daily_fee_transactions` (schema :1574-1608)
`id PK`, `transaction_code varchar(50)`, `student_id`, `payment_date int`, `feeding_amount/breakfast_amount/classes_amount/water_amount/transport_amount/total_amount decimal`, `payment_type enum('arrears','current','advance','mixed') DEF 'current'`, `payment_method int DEF 1 (1 cash,2 cheque,3 momo,4 bank)`, `collected_by int`, `collection_point enum('classroom','office','bus') DEF 'office'`, `receipt_number`, `year/term`, `residence_type` ("Day or Boarding"), `notes`, `synced_to_accounts tinyint`, `journal_entry_id`, `synced_at`, `created_at/modified_at/modified_by/modification_count`, sync block.

### `daily_fee_wallet` (schema :1621-1644)
`id PK`, `student_id`, `year varchar(10)`, `term varchar(10)`, `{feeding,breakfast,classes,water,transport}_balance decimal` (prepaid), `{feeding,breakfast,classes,water,transport}_arrears decimal` (debt), `last_updated int`, sync block. (Legacy per-day wallet shape — `due/amount/att_status/feeding_status/timestamp` — still referenced by `Admin.php:26183-26204, 32824-32832` and `Fee_collection` barcode paths.)

### `daily_transport_choices` (schema :1657-1675)
`id PK`, `student_id`, `choice_date int` (ts), `transport_direction enum('none','in','out','both') DEF 'none'`, `choice_made_at int`, `choice_made_by varchar(20)` (parent/teacher/admin), `notes mediumtext`, sync block.

### `transport` (schema :6602-6614) — **MyISAM**
`transport_id PK`, `route_name longtext`, `number_of_vehicle longtext`, `description longtext`, `route_fare longtext`, `driver_id int` (comment: FK→`non_teaching_staff.staff_id`), legacy `sync enum`, sync block.

### `transport_auto_billing` (schema :6630-6649)
See §6.2.

### `transport_daily_log` (schema :6655-6676)
See §6.2.

### `student_daily_fee_preferences` (schema :5917-5934)
`id PK`, `student_id`, `breakfast_subscribed tinyint(1) DEF 0`, `water_subscribed tinyint(1) DEF 1`, `auto_deduct_enabled tinyint(1) DEF 1`, `notes`, `updated_at`, sync block.

### `attendance_billing_log` (schema :628-647)
`id PK`, `operation_type enum('auto_bill','payment','bulk_payment','adjustment')`, `student_id`, `class_id`, `amount`, `description`, `performed_by`, `ip_address`, `created_at`, sync block. (Written by legacy billing ops; companion to `daily_fee_audit_log` :1503-1527 which stores wallet-movement audits with `action_type, fee_type, amount, balance_before/after, arrears_before/after, performed_by(+_role), reference_id, notes`.)

### `water_charge_log` (schema :6837-6847) — vestigial
`id, student_id, week_start_date int, week_end_date int, amount_charged, payment_status enum('paid','unpaid'), year int, term, sem, charged_at` — **no writer found in code** (weekly water idempotency uses `daily_charge_log` date-range scan, `Daily_fee_model.php:522-527`).

### `teacher_privileges` (schema :6450+)
`id PK, teacher_id FK→teacher, privilege_type varchar(50) DEF 'attendance_monitoring', granted_by FK→admin, granted_at, status enum('active','revoked'), revoked_by FK, revoked_at, notes`, unique `(teacher_id, privilege_type, status)` (migration `database/migrations/teacher_attendance_privileges.sql:9-40`).

### `emp_attendance` (schema :2132-2156) — vestigial
`id, emp_id varchar(64), atten_date varchar(64), signin_time, signout_time, working_hour, place, absence, overtime, earnleave, status, legacy sync`, sync block. No code references.

### Tables referenced by code but **absent from the schema dump**
`transport_routes` (Daily_transport.php:66,194), `transport_route` (Bus_conductor.php:182), `transport_fare` (Teacher.php:1796-1823; Transport_auto_billing.php:117-129; migration `application/migrations/add_due_column_to_transport_fare.sql`), `vehicles/drivers/vehicle_assignments/vehicle_insurance/vehicle_maintenance` (Transport_model.php:17-93), `v_vehicle/v_driver/v_vehicle_type/v_vehicle_model/v_transporter/v_license_type/v_loading/v_expenditure` (Vehicle_model.php, Driver_model.php), `students/classes` aliases (Conductor.php:51-59, Admin_transport_billing.php:20).

---

## 8. Offline attendance & sync

### 8.1 Browser offline store — `assets/js/attendance_offline.js`

- IndexedDB `AttendanceDB` v1, object store `attendance` with `keyPath:'id', autoIncrement:true`, indexes `student_id`, `date`, `synced` (`:12-33`).
- `save(records)` stamps `synced=false` + client `timestamp` ISO (`:38-53`).
- `getUnsynced()` via `synced` index (`:58-69`); `markSynced(ids)` after successful push (`:74-94`).
- `syncToServer(url)` POSTs `{records: [...]}` JSON (`:99-124`); auto-invoked on `online` event targeting **`site_url("attendance_enterprise/sync")`** (`:148-152`).

### 8.2 Sync endpoints — what actually exists

- **`Attendance::sync()` is a placeholder** that echoes success without persisting anything (`Attendance.php:366-369`).
- **`Attendance_enterprise` has no `sync()` method** (controller listing, §2.6) → the JS endpoint 404s; offline capture is effectively **unwired**.
- `application/controllers/attendance_sync_method.php` is a **design snippet, not routed code** ("Add this method to Attendance_enterprise controller", `:1-4`): would `db->replace('attendance', $record)` after stripping local `id`/`synced` (`:16-20`). Because client ids are local autoincrement integers, REPLACE would overwrite arbitrary server rows — **unsafe, never ship as-is**. No business-key idempotency (no `(student_id,timestamp,class_id)` dedupe).
- **Gen2 device sync** (the hardened path): `application/controllers/api/Sync.php` — global `X-API-Key` gate failing closed (`:38-47`), device `X-Device-ID`/`X-Auth-Token` verified against SHA-256 hashes in `sync_devices` (`:49-71`); `push` queue (`:76-110`) → `Sync_model::process_push_item` (`Sync_model.php:159-196`): INSERT/UPDATE by table primary key (`attendance → attendance_id`, map `:295-308`), **DELETE disabled** ("Gen2 … tombstone propagation", `:183-189`); conflict detection on `last_modified_at` vs server + originating device → `sync_conflicts` row (`:222-246`); resolution LOCAL_WINS/SERVER_WINS/MERGED (`:248-281`); pull by `last_modified_at > $last_sync AND device_id != mine` over `sync_metadata.sync_enabled` tables (`:198-215`).
- `api/Sync::batch_push` (`:184-307`) — FK-safe upsert: rejects `record_id`/payload PK mismatch (`:321-329`), **updates in place without deleting** (preserves FK/audit rows, `:343-353`), inserts preserving offline PK (`:356-362`); server-side table allowlist (`:226-239`); PK map includes `attendance → attendance_id` (`:371-396`). Contract tests: `tests/sync-batch-upsert-contract.test.js`, `tests/sync-device-auth-contract.test.js`.
- **Row-level sync stamps** on `attendance` are auto-maintained by `MY_Model` for models extending it (e.g. `Attendance_enterprise_model`, `Transport_model`): on write sets `sync_status='PENDING'`, `last_modified_at`, `device_id` (from `settings.device_id` / `location_registry`) — `application/core/MY_Model.php:100-115,154-178`; raw `$this->db` writes elsewhere (most controllers) bypass this.

### 8.3 Idempotency keys summary

| Concern | Key | Where |
|---|---|---|
| Daily charge once | `(student_id, charge_date midnight)` in `daily_charge_log` + early-exit on feeding/classes > 0 | `Daily_fee_model.php:391-404` |
| Water weekly once | scan `daily_charge_log` Mon–Sun for `water_charged > 0` | `:522-527` |
| Revenue journal once | `entry_number = JE-REV-<TYPE>-<Ymd>-<student>` | `:2161-2165` |
| Payment once/day | `(student_id, payment_date)` probe on `daily_fee_transactions` | `Attendance_enterprise_model.php:508-511`, `Fee_collection.php:714-717` |
| Bus boarding once/day | `(student_id, attendance_date)` on `bus_attendance` | `Daily_fee_model.php:2422-2425` |
| Auto-bill once | `(student_id, billing_date)` on `transport_auto_billing` | `Transport_auto_billing.php:33-38` |
| Daily choice once | `(student_id, choice_date)` on `daily_transport_choices` | `Daily_transport.php:133-136` |
| Sync record identity | table PK (`attendance_id`) + `last_modified_at` conflict check | `Sync_model.php:159-246` |

---

## 9. Legacy quirks to retire (parity-risk register)

1. **Four attendance surfaces** (portal / enterprise shell / legacy register / barcode) with divergent write paths; `Attendance_enterprise::save()` is broken (arg mismatch, §2.6) and `Attendance::sync()` is a fake success (§8.2).
2. **Timestamps as strings**: `attendance.timestamp/year/term/sem` are `longtext` storing unix timestamps (`schema:584-588`); `route_fare`/`number_of_vehicle` are `longtext` (`schema:6605,6607`).
3. **No DB uniqueness** on attendance business keys; dedupe is code-only (`_safe_insert_attendance`).
4. **No edit window** — backdating is unrestricted; correctness depends on charge-log delete/replay (§3.3).
5. **`mark_all_present()` bypasses charging** (`Attendance_enterprise_model.php:607-625`) while single-save charges — same intent, different money outcome.
6. **Charge-log update bug**: `total_charged = existing->transport_charged + total_charged` double-counts transport (`Daily_fee_model.php:620`).
7. **Bus_conductor rate keys don't exist** (`transport_in_rate/out_rate/both_rate` read from `get_class_rates()` which never returns them, `Bus_conductor.php:118-128` vs `Daily_fee_model.php:349-356`) → conductor marking charges nothing.
8. **Two transport-fare ledgers** (`bus_attendance` money vs legacy `transport_fare` vs `transport_daily_log` booleans) and **two vehicle/driver families** (`v_*` vs `vehicles/drivers`), all outside the authoritative schema.
9. **Route table naming drift**: `transport` vs `transport_routes` vs `transport_route` across controllers (§5.1/§7) — some endpoints hard-fail on missing tables.
10. **Assignment column drift**: `student.transport_id` (read by `Transport.php`, `Daily_transport.php`) vs `enroll.transport_id` (written by `assign_transport`, used by charging) — stale reads possible.
11. **`set_choice_and_collect` fakes a payment**: marks `bus_attendance.payment_status='paid'` without wallet deduction or transaction row (`Daily_transport.php:95-121`).
12. **Conductor identity confusion**: three conductor variants — `login_type='conductor'` (Bus_conductor), `admin.level==5` (Conductor/Daily_transport), and plain staff FK (`transport.driver_id` → non_teaching_staff). Driver role has zero operational endpoints (§5.3).
13. **Auto-billing unwired**: no cron; `Transport_billing_hook` recalculation fires via self-cURL (`Transport_billing_hook.php:20-27`); billing predicates live on the legacy yes/no log table.
14. **Legacy `transport_fare` writes in `Teacher::attendance_update`** alongside the modern wallet (§2.7) — dual-write drift.
15. **Offline JS + sync snippet** unsafe (`REPLACE` by client PK) and target endpoint missing (§8).
16. **Per-student status-6 (Excused) reachable only via API** — no marking UI; reason stored on `attendance.permission_reason` (`Attendance_enterprise_model.php:150-156`).
17. **`get_class_students()` is N+1** (per-student attendance + wallet + 4 discount queries, `Attendance_enterprise_model.php:55-79`) — a scalability liability inherited by the mark screen.
18. **Vestigial tables**: `emp_attendance` (no code), `water_charge_log` (no writer), `attendance_billing_log` (legacy ops log).
19. **Water "weekly" semantics** anchored to `monday this week` of the *attendance date*, not the payment week (`Daily_fee_model.php:519-527`).
20. **Mixed date handling**: `bus_attendance.attendance_date`/`daily_charge_log.charge_date` normalized to midnight ints, but `attendance.timestamp` accepts any time-of-day component of `strtotime($date)` → charge log vs attendance keys can diverge if a non-midnight timestamp is posted (mitigated by normalization at `Daily_fee_model.php:388-389` and `update_attendance_transport` matching on raw timestamp `:2656-2659`).

---

## 10. VERIFIED LEGACY BEHAVIOR vs RECOMMENDATION

| # | Area | VERIFIED LEGACY BEHAVIOR (evidence) | RECOMMENDATION for iEduPro |
|---|---|---|---|
| V1 | Status model | 0–5 canonical (+6 Excused API-only); late charges like present (`Attendance.php:282`; `Attendance_enterprise_model.php:162,293`; test `attendance-status-contract.test.js`) | Keep 6 statuses; make Excused first-class with reason + UI; encode "late = chargeable" as configurable rule, not code |
| V2 | Charge trigger | `status ∈ {1,3}` → `process_daily_charges` (4 call sites, §3.1) | Single service-level hook on attendance transition; event-sourced |
| V3 | Idempotency | `daily_charge_log` per (student, midnight-date) with feeding/classes gate (§3.1) | Unique constraint `(student_id, charge_date, fee_type)` in DB; keep replay-safe ledger |
| V4 | Order | feeding → breakfast → classes → water (weekly) → transport (per direction) (§3.1) | Preserve order for discount interplay; make water week-start configurable |
| V5 | Reversal | status→absent reverses arrears-first→prepaid; deletes charge log; keeps payment as prepaid (§2.3) | Keep "money never leaves on absence" semantics; use ledger entries instead of mutating balances |
| V6 | Discounts | percentage/fixed per fee type per date (`Discount_model::get_student_discount_for_date`), logged via `record_discount_safely` (§3.1) | Port profile system; attach discount evidence to each charge event |
| V7 | Revenue | JE-REV-* entries; DR 2040 (prepaid) or DR 1200 (arrears), CR 4200-4240 (§3.1) | Keep accrual mapping; make revenue accounts per fee type configurable |
| V8 | Wallet | per student/year/term `{fee}_balance` + `{fee}_arrears`; lazy create; auto-deduct pref (§3.2) | Single ledger with signed entries; term rollover as new ledger, not in-place mutation (`get_student_wallet:299-312` quirk) |
| V9 | Bus IN/OUT | 1 row/student/day; direction in/out/both; fare per leg (both = 2×); `none` reverses; re-direction reverses prior `amount_charged` (§5.2) | Model as two boarding events (IN, OUT) each priced once; derive direction from events |
| V10 | Who marks | conductor flags boarding (no fare on legacy paths), cashier/portal sets fare+charge, admin bulk marks flags only (§5.3) | Unify: conductor marks boarding events; charging service reacts; no direct wallet writes in controllers |
| V11 | Daily choice | `daily_transport_choices` intent + `set_choice_and_collect` dual-write (§5.4) | Keep parent intent as separate intent object; never mark paid without payment record |
| V12 | Auto-billing | daily job over presence + conductor log + unpaid → `transport_auto_billing` (§6.1) | Schedule properly (cron); emit charge via same charging service; reverse on state change |
| V13 | Permissions | teacher = own classes (`class.teacher_id`); admin L1/L2 mark; fee collection via mode + assignments + conductor transport-only (§2.1) | RBAC with class-ownership scope token; per-fee-type collection grants |
| V14 | Sync | sync stamps on rows via MY_Model; Gen2 push/pull by PK + timestamps; DELETE disabled; conflicts queued (§8.2) | Adopt business-key upsert (attendance: student+date+class), per-record vector clocks, tombstones |
| V15 | Offline | IndexedDB queue exists but endpoint missing; snippet uses REPLACE (§8) | Redesign: queue keyed by business key + client UUID; server upsert idempotent |
| V16 | Reports | role-scoped stats, per-status drill-down, CSV export, absent-day SMS (`Attendance.php:494-522`) | Keep surfaces; move aggregation to SQL views/service; async SMS |

---

## 11. Test coverage (attendance)

Four contract tests, all **static source assertions via `node:test`** (no DB/runtime). All 14 cases **pass** on this branch (verified run: `node --test tests/attendance-*.test.js` → 14 pass / 0 fail).

1. **`tests/attendance-status-contract.test.js`** (5 cases)
   - Status `<option>` values/labels 1-5 in `admin/manage_attendance_view.php` + shared `attendance/mark_attendance.php`; "Busy (B)" forbidden (`:12-38`).
   - Analytics labels "Sick at Home/Clinic" (`:40-45`).
   - Late-charging rule: view regex `isAbsent = status != '1' && status != '3'` + Admin controller `status == 1 || status == 3` within 700 chars of `process_daily_charges` (`:48-51`).
2. **`tests/attendance-teacher-scope-contract.test.js`** (4 cases)
   - `can_access_class` uses `login_type`/`login_user_id`/`class.teacher_id` (`:17-23`); guard before section load in `mark` + 403 (`:25-33`); AJAX guard in `get_student_data` (`:35-39`); guard before `save_attendance_and_fees` in `save` (`:41-49`).
3. **`tests/attendance-report-filter-contract.test.js`** (4 cases)
   - Exact status filter options incl. `'0' => 'Not Marked'` (`:19-33`); backend string-exact compare, no status grouping (`:35-40`); hidden year/term filters + daterangepicker (`:42-47`); sick-label wording (`:49-56`).
4. **`tests/attendance-report-assets-contract.test.js`** (2 cases)
   - Shared bundle loading (no local DataTables/Chart copies) and exactly-one local report assets (`:13-41`).

**Gaps:** no tests cover `process_daily_charges` math, reversal semantics, `mark_student_boarded`, transport auto-billing, or sync of attendance rows — behavior tests exist for sync generally (`tests/sync-batch-upsert-contract.test.js`, `tests/sync-device-auth-contract.test.js`, `tests/sync-device-lifecycle-contract.test.js`) but none assert attendance-specific payloads.

---

*End of evidence doc 03. Author: Explore-attendance agent, audit task 3-c. No code was modified for this audit.*
