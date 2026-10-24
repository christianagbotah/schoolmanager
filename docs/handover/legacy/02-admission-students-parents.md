# Legacy Evidence Pack 02 — Admissions, Students, Parents, Enrollment & Academic Setup

**Repo:** `schoolmanager` @ `zai/full-platform-reconciliation-20261024` (HEAD `ff96b2e`)
**Purpose:** Parity evidence for migrating to iEduPro (multi-tenant SaaS). Every claim is labeled
`VERIFIED LEGACY BEHAVIOR` (observed in code on this branch) or `RECOMMENDATION` (migration advice).
All citations are `file:line` relative to repo root. Audit performed without code changes (research only).

---

## 1. Overview

The student domain is organised around **one row per student in `student`** plus **one row per
student per academic-year-per-term (or -semester) in `enroll`**. There is no separate
"admissions" module; admission is the `Admin::student`/`student_add` create path which
side-effects into `parent`, `enroll`, `invoice`, `admission_logs`, barcodes and notifications.
Academic "session" is **not a table** — it is two/three scalar `settings` rows
(`running_year`, `running_term`, `running_sem`) plus per-row `year`/`term`/`sem` string columns on
`enroll`, `invoice`, `mark`, `subject`, etc. A special class name **`JHSS`** switches the whole code
base between *semester mode* (uses `sem`) and *term mode* (uses `term`) via string comparisons
(e.g. `Admin.php:2803`, `Admin.php:1033`, `Admin.php:6194`).

Key surfaces:

| Surface | Controller | Entry views |
|---|---|---|
| Admit single student (with billing preview + guardian picker) | `Admin::student_add` → `Admin::student/create` (`Admin.php:968`, `2547`) | `application/views/backend/admin/student_add.php` |
| Bulk admit via spreadsheet | `Admin::student_bulk_add` → `Admin::bulk_student_add_using_csv/import` (`Admin.php:978`, `22449`) | `student_bulk_add.php` |
| Class roster ("Student Information") | `Admin::student_information/{class_id}` (`Admin.php:1071`) | `student_information.php` |
| Student profile command center | `Admin::student_profile/{id}` (`Admin.php:996`), teacher twin `Teacher::student_profile` (`Teacher.php:118`) | `student_profile.php`, `student_profile_raw_score.php` |
| Promotion | `Admin::student_promotion` (`Admin.php:3719`) | `student_promotion.php`, `student_promotion_selector.php` |
| Parents CRUD | `Admin::parent` (`Admin.php:3897`) | `parent.php`, `modal_parent_add*.php` |
| Parent portal | `Parents` controller (`Parents.php:26`) | `views/backend/parent/*` |
| Student portal | `Student` controller (`Student.php:26`) | `views/backend/student/*` |
| Session/term/sem switch | `Admin::change_session` (`Admin.php:21039`), `change_term` (`21375`), `change_sem` (`21590`) | `session.php`, `year_term_selection.php` |
| Class/section/subject setup | `Admin::classes` (`6643`), `sections` (`6998`), `subject` (`6163`) | `class.php`, `section.php`, `subject_redesigned.php` |

`VERIFIED LEGACY BEHAVIOR`: role controllers are `Admin.php` (43917 lines), `Student.php` (1755),
`Parents.php` (1065). `Crud_model` (`application/models/Crud_model.php`, 4922 lines) is the
generic model; student-specific logic lives there as ad-hoc helpers (`delete_student` `Crud_model.php:1827`,
`termlyEnrollment` `Crud_model.php:4070`, `students_enrolled` `Crud_model.php:4123`,
`automateNextTerm` `Crud_model.php:3891`, `do_subjects_import_mass` `Crud_model.php:3191`).

---

## 2. Admission workflow (step-by-step, single student)

### 2.1 Entry & pre-population

1. **Route** `admin/student_add` renders `student_add` page (`Admin.php:968-976`); nav title
   `get_phrase('admit_student')` (`Admin.php:973`).
2. **Admission-readiness helper** (`assets/js/admission-readiness.js`) is injected by
   `application/views/backend/include_main.php` only when `$page_name === 'student_add'`
   (`tests/admission-readiness-panel.test.js:8-12` locks this). The helper computes a progress bar
   from `[required]` controls of `#student_single_add_form`, can scroll/focus the first missing
   field, and is contractually forbidden from submitting, using `FormData`, `ajax` or `fetch`
   (`tests/admission-readiness-panel.test.js:14-36`).
3. **Student ID is pre-generated server-side in the view** — `student_add.php:256-318` reads
   `settings.student_code_prefix` + `settings.student_code_format`, takes `MAX(student_code)`
   ordered desc (`student_add.php:262-266`), extracts the first numeric substring, +1, and re-pads.
   If the leading 4 digits ≠ current calendar year it resets to `prefix + format`
   (`student_add.php:294-298`). The field is rendered `readonly` (`student_add.php:319`).
   `VERIFIED LEGACY BEHAVIOR`: ID generation is duplicated in 3 places — the view
   (`student_add.php:256`), the CSV importer (`Admin.php:22520-22591`) and a broken helper view
   (`generate_id.php:1-60`, which references undefined `$s_query` and a different settings key
   `student_id_format` at `generate_id.php:5,7` — dead/broken code).
4. **Guardian picker**: `#parent_id` select2 with "➕ Register New Guardian" injection
   (`student_add.php:710-724`). Choosing `new` opens `modal/popup/modal_parent_add_st/`
   (`student_add.php:773`) which posts to `admin/parent/create/{page_name}`
   (`modal_parent_add_st.php:15`) collecting `guardian_is_the` (relationship), `guardian_gender`,
   password (`modal_parent_add_st.php:28,40,58`). After creation JS reloads the dropdown from
   `admin/get_parent_dropdown` (`student_add.php:862-875`; handler `Admin.php:4428-4450`).
5. **Bill preview**: changing class/residence triggers AJAX `admin/getAdmissionBillPreview`
   (`student_add.php:1019`); handler `Admin::getAdmissionBillPreview` (`Admin.php:28492-28560`)
   filters `bill_item` rows by 3-tier priority — specific `specific_class_ids`, else
   `class_category` match, else global — and skips boarding/day admission-fee items by title match
   (`Admin.php:28523-28533`). Items render as editable `bill_amounts[]`/`bill_titles[]` parallel
   arrays with remove buttons (`student_add.php:1043-1046`).
6. **Admission fee**: `#my_admission_fee` hidden input defaults to Day fee from
   `boarding_model->getAdmissionFeeByResidentialStatus('Day')` (`student_add.php:659`);
   residence change fetches `admin/getAdmissionFee/{val}` (`Admin.php:28481-28489`).

### 2.2 Submission — `Admin::student($param1='create')` (`Admin.php:2547-3053`)

7. **Form validation rules** (`Admin.php:2675-2687`): `first_name` trim|required;
   `last_name` trim|required; `student_code` trim|required with **min_length == max_length ==
   strlen(prefix.format)** (`Admin.php:2555`, `2677`); `sex` required; `section_id` required;
   others trim-only (`religion`, `blood_group`, `email`, `password`, `phone` min_length[10],
   `address`, `birthday`).
8. **Name normalisation**: first/middle/last uppercased, `name` rebuilt as
   `FIRST MIDDLE LAST` (`Admin.php:2558-2561`). Same normalisation on update (`Admin.php:3361-3364`).
9. **Uniqueness checks** before insert:
   - `code_validation_insert(student_code)` — no other `student.student_code` equal
     (`user_validation_helper.php:221-234`); on failure error `this_id_number_is_not_available`
     (`Admin.php:2650-2654`).
   - `email_validation(email)` — email must not exist in **any** of
     `admin, teacher, parent, student, accountant, librarian` (`user_validation_helper.php:54-69`;
     called `Admin.php:2756`).
   - **Guardian mandatory**: `parent_id` post is required else JSON error
     `invalid_parent_id` "No guardian was assigned…" (`Admin.php:2663-2668`).
   - Class & section required — checked again after the student insert (`Admin.php:2774-2787`)
     *after* the student row has already been inserted (see quirks §12).
10. **Password** bcrypt-hashed (`Admin.php:2661`); **`username` = student_code** (`Admin.php:2658-2660`);
    **`authentication_key`** = 5-char `substr(sha1(md5(mt_rand(1034200000,1039999999))),0,5)`
    (`Admin.php:2673`) — used as a *second login factor* (§8).
11. **Insert student** `$this->db->insert('student', $data)` (`Admin.php:2769` or no-email branch
    `Admin.php:2920`).
12. **Insert enroll**: `enroll_code = substr(md5(rand(0,1000000)),0,7)` (`Admin.php:2773`),
    `class_id`, `section_id`, optional `roll`, `date_added = strtotime(now)`, `year = running_year`
    and — if the class name is exactly `JHSS` — `sem = running_sem` else `term = running_term`
    (`Admin.php:2799-2814`, no-email twin `2948-2963`). `residence_type` ('Day'/'Boarding') and
    boarding `house_id`/`dormitory_id`/`bed_id` ride along for boarders (`Admin.php:2606-2617`, `2950`).
13. **Parent denormalised update**: father/mother names, phones, occupations and guardian phone are
    written **back onto the `parent` row** (`Admin.php:2596-2603`, `2619-2623`,
    update at `2817-2819` / `2965-2967`).
14. **Photo & barcode**: upload moved to `uploads/student_image/{student_id}.jpg` (`Admin.php:2821`);
    `barcode_model->save_barcode(student_code)` writes `uploads/barcodes/students/{code}.png`
    (`Admin.php:2824`).
15. **Invoice creation**: invoice_code = `MAX(invoice.invoice_code) + 1` preserving leading zeros of
    the seed format `settings.invoice_number_format` (`Admin.php:2698-2732`). For each surviving
    bill item (amount > 0, rounded to 2dp) an `invoice` row is batch-inserted with
    `status='unpaid'`, `amount_paid=0`, `due=amount`, `year`, `term`, `class_id`, `residence_type`,
    `creation_timestamp=strtotime('today')` (`Admin.php:2833-2859`). The editable
    `my_admission_fee` is appended as a literal `ADMISSION FEE` item with description
    `Admission Fee (Day|Boarding)` (`Admin.php:2863-2878`). Batch insert at `Admin.php:2880` /
    `3027`.
16. **Discount profiles** (optional, from form): `apply_admission_discount_profiles(...)`
    (`Admin.php:2883`, implementation `Admin.php:36174-36238`) — an *invoice* profile creates a
    `pending` row in `invoice_discounts`; a *daily_fees* profile creates
    `student_discount_assignments`. Super admins (session `user_type == 1`, `Admin.php:2525-2526`)
    auto-approve; others trigger super-admin notification rows in `notifications` + optional
    SMS/email (`Admin.php:36219-36237`).
17. **Audit & notifications**: `log_admission(student_id, admin_id, class, section, residence_type,
    bill_items, total, admission_date)` (`Admin.php:2888`) writes `admission_logs`
    (schema `schema/schoolmanager_schema_redacted.sql:355-378`); `notify_admins_new_admission(...)`
    (`Admin.php:2889`); `sync_invoice_to_ledger(invoice_code, student_id)` posts invoices to the
    `student_ledger` financial trail (`Admin.php:2892`, `3039`).
18. **Response**: JSON `{done: 'success'}` (`Admin.php:2906-2907`). Account-opening SMS/email are
    **commented out** for students (`Admin.php:2895-2904`, `3041-3046`) —
    `VERIFIED LEGACY BEHAVIOR`: no credential message is sent to students at admission; parents
    still get welcome SMS/email when created via `Admin::parent/create` (`Admin.php:3968-3982`).

### 2.3 Update — `Admin::student/do_update` (`Admin.php:3359-3585`)

- Recomputes `name` from parts, all demographic/health fields, `parent_id` from post
  (`Admin.php:3361-3393`).
- Changing `student_code` runs `code_validation_update(code, student_id)` — duplicate check
  excluding self (`user_validation_helper.php:334-347`; call `Admin.php:3441-3446`) and then
  forces `username = student_code` (`Admin.php:3448`).
- Duplicate email check via `email_validation_for_edit` excluding self across the 7 user tables
  (`user_validation_helper.php:72-101`; call `Admin.php:3473`).
- Writes parent demographic fields back to `parent` (`Admin.php:3396-3407`, update `3490-3492`).
- Updates the **current enroll row** (`year`+`term`, or `year`+`sem` for JHSS) with new
  `section_id` and `roll` (`Admin.php:3517-3540`); note a duplicated term-keyed update follows the
  JHSS branch (`Admin.php:3535-3540`) — harmless but redundant.

---

## 3. Student ID (admission number) generation rules

`VERIFIED LEGACY BEHAVIOR`:

- **Source of truth**: two `settings` rows — `student_code_prefix` (editable in
  `system_settings.php:476`) and `student_code_format` (e.g. `2026001`). Combined length defines
  the required ID length: `$id_length = strlen(prefix . format)` (`Admin.php:2555`).
- **Seeding for a new year**: `Admin::update_student_code_format` (`Admin.php:26680-26691`)
  overwrites `student_code_format` with `date('Y') . '001'` (e.g. `2026001`) and force-marks the
  settings row `sync_status='SYNCED'`.
- **Increment algorithm** (identical in view `student_add.php:270-315` and importer
  `Admin.php:22520-22591`):
  1. `SELECT student_code FROM student ORDER BY student_code DESC LIMIT 1` — **string sort**,
     not numeric (`Admin.php:22520-22523`).
  2. Find the first numeric character in that string; take the substring from that position
     (`Admin.php:22528-22543`).
  3. `new = numeric + 1` (`Admin.php:22545`).
  4. If `substr(new,0,4) != date('Y')` → reset to `prefix + student_code_format`
     (`Admin.php:22549-22554`) — i.e. year rollover starts fresh at `2026001`.
  5. Else if the original ID had a leading zero before the number, re-pad to the original string
     length (`Admin.php:22556-22564`).
  6. If no students exist → `prefix + format` (`Admin.php:22570`).
- **Bulk import collision loop**: while `code_validation_insert` fails, re-derive from the newest
  `student_code` again (`Admin.php:22646-22685`); a second quirk re-prepends the prefix whenever
  the first numeric char wasn't `0` (`Admin.php:22687-22691`).
- **Validation helpers**: `code_validation_insert` returns *true when 0 rows match* and *false when
  >1 rows match* — note the gap: **exactly 1 duplicate returns `null` (falsy, treated as failure)**
  and 0-row returns true (`user_validation_helper.php:221-234`). Works in practice but is fragile.
- `RECOMMENDATION`: iEduPro should generate admission numbers from a per-tenant DB sequence with a
  unique index; never `ORDER BY student_code DESC` on a `longtext` (string sort breaks once codes
  pass 10 digits or contain prefixes), and never duplicate the algorithm in views.

---

## 4. Bulk admission (spreadsheet import)

`VERIFIED LEGACY BEHAVIOR`:

- **Page**: `Admin::student_bulk_add` (`Admin.php:978-994`) renders the 3-step wizard
  `student_bulk_add.php` (modern card UI, 736 lines).
- **Template download**: `Admin::generate_bulk_student_csv/{class}/{section}` (`Admin.php:22317-22332`)
  returns base64 of `Admin::generate_excel_template()` (`Admin.php:22334-22373`) — an
  **XML Spreadsheet 2003 (.xls)** with 40 fixed columns (headers at `Admin.php:22351`):
  `Student Code, First Name*, Middle Name, Last Name*, Gender*, DOB(YYYY-MM-DD)*, Blood Group,
  Nationality, Ghana Card ID, Place of Birth, Hometown, Tribe, Religion, Student Phone, Email,
  Address, Admission Date, Former School, Class Reached, Guardian Name*, Guardian Phone*,
  Parent Email, Emergency Contact, Father Name, Father Phone, Father Occupation, Mother Name,
  Mother Phone, Mother Occupation, Allergies, Medical Conditions, NHIS Number, NHIS Status,
  Disability Status, Special Needs, Learning Support, Digital Literacy, Home Technology Access,
  Special Diet, Special Diet Details` and 60 blank styled rows.
- **Parent pre-validation**: `Admin::uploaded_csvfile_parent_validate` (`Admin.php:22377-22447`)
  re-parses the uploaded file from `uploads/tmp/`, checks parent name+phone uniqueness via
  `parent_full_validation_insert` (`user_validation_helper.php:175-196`), flags invalid emails, and
  rewrites `&` in guardian names to `-` to dodge the validator.
- **Import**: `Admin::bulk_student_add_using_csv/import` (`Admin.php:22449-22815`) with class+section
  from POST (`Admin.php:22462-22476`):
  - Parses with **raw `array_map('str_getcsv', file(...))`** on a file moved into `uploads/`
    (`Admin.php:22480-22481`); empty rows filtered (`Admin.php:22483-22487`); header row skipped.
  - Default passwords for student and guardian are the literal `'123456'` (`Admin.php:22498-22499`,
    hashes at `22610`, `22625`).
  - Missing guardian email falls back to `'0' + guardian phone` (`Admin.php:22502-22507`).
  - Student ID auto-generated per §3 when column 0 empty; collision loop §3.
  - Row → `student` insert (`Admin.php:22700` / `22729`), `enroll` insert keyed by class name
    (`Admin.php:22703-22718` — JHSS branch uses `sem`, else `term`; note the *valid-email* branch at
    `22732-22741` **always sets `term`, even for JHSS** — a verified bug for JHSS bulk imports),
    barcode save, account-opening email attempts (`22723`, `22746`).
  - Guardian dedupe by exact `name`+`phone` (`parent_full_validation_insert`); if new → `parent`
    insert (`Admin.php:22789`) then `student.parent_id` back-filled by looking the parent up
    **by name** (`Admin.php:22778-22782`, `22794-22798`) — same-named guardians collide silently.
- **Library note**: `application/libraries/Csvimport.php` exists (338 lines) but a repo-wide grep
  shows **zero usages** — bulk import is hand-rolled. `VERIFIED LEGACY BEHAVIOR` (dead library).
- A separate PhpSpreadsheet-based generator `application/controllers/generate_student_template.php`
  (22 columns, different order, includes `Password`) is a bare function file with **no class** —
  unreachable by CI routing (dead code).
- `RECOMMENDATION`: replace with a streaming CSV parser, transactional import, per-row error report,
  unique email/phone constraint, and no default passwords.

---

## 5. Student profile surfaces (per role)

### 5.1 Admin — `Admin::student_profile/{id}` (`Admin.php:996-1064`)

- Resolves the student's **latest enroll row for running year+term with `mute='0'`** ordered by
  `enroll_id DESC LIMIT 1` (`Admin.php:1009-1017`); `class_id` from it; `section_id` from enroll
  (sem-keyed query for JHSS `Admin.php:1025-1027`, term-keyed otherwise `1035-1037`); `exam_id`
  from the student's `mark` rows (defaults `0` when none, `Admin.php:1038-1039`).
- Class name `JHSS` + settings `raw_score == 'Yes'` switches to the raw-score profile page
  (`student_profile_raw_score`) (`Admin.php:1044-1053`).
- `other_students` (class peers for the "Switch Student" selector) are filtered through
  `filter_shared_report_students` (`Admin.php:1060`, helper `Admin.php:197-209`) so parents/students
  only ever see their own records in that dropdown.
- `is_teacher_view = false` (`Admin.php:1062`).

### 5.2 View — `application/views/backend/admin/student_profile.php` (2788 lines)

Tabs (buttons at `student_profile.php:119-137`; hidden for `$is_teacher_view`):

| Tab | data-tab | id | Content |
|---|---|---|---|
| Basic info | `basic_info` | tab1 (`:119`, pane `:143`) | demographics, enrollment status card via `crud_model->getStudentCurrentEnrollmentStatusRow` (`:143+`) |
| Parent info | `parent_info` | tab2 (`:123`, pane `:328`) | guardian card from `parent` by `student.parent_id` (`:337-360`), father/mother blocks |
| Exam marks | `exams` | tab3 (`:127`, panes `:620/:907/:1568`) | per-exam marksheets / results sheets |
| Login | `login` | tab4 (`:131`, pane `:2048`) | shows `authentication_key` and `username`; password deliberately masked (`:2066-2074`) |
| Accounts | `account` | tab6 (`:134`, pane `:2090`) | receivables/payables split by `invoice.due` sign excluding `can_delete='trash'` (`:2094-2104`), `daily_fee_wallet` balances (`:2107+`) |

- Left rail: photo (`get_image_url`), class/section link to `admin/student_information/{class_id}`
  (`:100-107`), **Edit Profile** button (`:110-114` → `modal_student_edit`).
- Sticky "Switch Student" select `#other_students` (`:51-60`) — the command-center JS drives this.

### 5.3 Contract test — `tests/student-profile-command-center-contract.test.js`

Locked contracts (9 assertions across 4 tests):

1. `includes_bottom.php` loads `assets/js/student-profile-command-center.js` **only** when
   `$page_name === 'student_profile'` (`:10-13`).
2. The JS must reference `data-student-command-center`, reuse the existing
   `student_information/` route and existing tabs `data-tab="parent_info"`, `"exams"`, `"account"`
   (`:15-23`) — i.e. **no new endpoints**.
3. Progressive enhancement: DOM-ready bootstrapping, `@media (max-width: 767px)` block, and
   **must not contain `fetch(`/`ajax(`/`XMLHttpRequest`** — read-only, no data mutations (`:25-31`).
4. Previous/Next student navigation buttons (`data-command="previous-student"|"next-student"`)
   operate purely on `studentSelector.selectedIndex` + re-dispatch `change` (`:33-41`), with
   disabled state at list bounds and a `student-command-action:disabled` style (`:43-48`).

### 5.4 Teacher view — `Teacher::student_profile/{id}` (`Teacher.php:118-191`)

- 404s if the student has no active enroll for the running year/term (`Teacher.php:137-140`);
  same raw_score switch (`:169-179`); sets `is_teacher_view = true` (`Teacher.php:188`) which hides
  the parent-info, login and accounts tabs (view guards at `student_profile.php:121-122, 130-137`).

### 5.5 Class roster — `Admin::student_information/{class_id}` (`Admin.php:1071-1104`)

- Empty `class_id` → renders `student_information_selector` with a class picker ordered by
  `name, name_numeric` (`Admin.php:1074-1083`) — this is the "My Students" metro tile target
  (`tests/student-information-entry-contract.test.js:50-52` locks `site_url('admin/student_information')`
  in `metro_menu.php`).
- Missing class → flash `class_not_found` + redirect (`Admin.php:1085-1090`); missing section no
  longer null-derefs (`$section_name = $section ? ... : ''` `Admin.php:1092-1093`) — locked by
  `tests/student-information-entry-contract.test.js:35-42`.
- Stores `class_id_for_result_archives` in session for archived result pages (`Admin.php:1096`).
- Roster rows come from `enroll` for `class_id`+running year+term (or `sem` for JHSS) with
  `mute='0'` (`student_information.php:517-527`), joined per-row to `student` (`:539`).
- Per-row account status options derive from `student.block_limit` (3 = blocked) and
  `student.mute` (1 = muted) — block/unblock, mute/unmute buttons (`student_information.php:561-608`);
  checkbox column for bulk actions (`:607`).

### 5.6 Contract test — `tests/student-information-entry-contract.test.js`

Locks: selector fallback when `$class_id` empty (`:21-33`); no null-dereference of section
(`:35-42`); the view must resolve the signed-in admin **by `admin_id` from
`session->userdata('login_user_id')`, never by display name**, and must not re-query `section`
(`:44-48`); metro tile route (`:50-52`).

---

## 6. Parent/guardian linking & family dashboard

### 6.1 Data model of the link

- `student.parent_id int NULL` → `parent.parent_id` (`schema/schoolmanager_schema_redacted.sql:5798`,
  `4481-4519`). **One guardian per student**; there is no junction table. Multiple children of one
  guardian = several `student` rows pointing at the same `parent_id`.
- Guardian "type" metadata lives on the parent row: `guardian_gender` (varchar 10) and
  `guardian_is_the` (varchar 50, relationship string) (`schema:4484-4485`), plus denormalised
  `father_name/phone/occupation`, `mother_name/phone/occupation` longtext columns
  (`schema:4504-4509`) written from the admission/edit forms (`Admin.php:2596-2603`, `3396-3407`).
- Creating a parent without email **uses the phone number as the email/login**
  (`Admin.php:3907-3911`, `3956-3961`); missing password defaults to bcrypt('123456')
  (`Admin.php:3914-3918`).
- `Admin::parent/delete` is a **hard delete with no cascade and no reassignment** —
  `$this->db->delete('parent')` (`Admin.php:4083-4095`). Orphaned students keep dangling
  `parent_id`s. `VERIFIED LEGACY BEHAVIOR`.

### 6.2 Parent portal — `controllers/Parents.php`

- Auth gate: `parent_login` session flag (`Parents.php:50-53`).
- **Record-scoping guard** `enforce_parent_record_scope` (`Parents.php:58-85`) maps sensitive
  methods → URI segment holding `student_id` (e.g. `marks`→3, `invoice`→3, `attendance_report`→3,
  `get_marksheet`→5) and 403s unless `current_parent_owns_student` — i.e. a `student` row with both
  `student_id` and the session `parent_id` exists (`Parents.php:87-101`). Locked by
  `tests/portal-record-ownership.test.js:16-29`.
- **Family command center dashboard** (`Parents::dashboard` `Parents.php:113-124`; view
  `views/backend/parent/dashboard.php`, 519 lines):
  - Safe default counters initialised **before** any conditional query so an empty family renders
    (`dashboard.php:6-19`) — locked by `tests/parent-dashboard-command-center.test.js:18-23`.
  - Children split into `$active_students` (mute 0) and `$inactive_students` (mute 1) plus
    `$allChildren` (`dashboard.php:21-43`).
  - Enrollments joined to `class`+`section` for running year/term (`dashboard.php:55-65`);
    class masters = distinct `class.teacher_id` (`dashboard.php:77-90`); subject teachers = distinct
    `subject.teacher_id` for those classes in year/term (`dashboard.php:92-108`).
  - "Present today" = `attendance` rows with `status='1'` for today's timestamp, year/term
    (`dashboard.php:111-122`) and attendance rate (`dashboard.php:150`).
  - Markup contract: `data-parent-command-center="true"`, `data-parent-child-summary`,
    `data-parent-quick-actions`, `data-parent-attendance-summary` (`dashboard.php:154+`,
    `352`, `358`, `418`) — locked by `tests/parent-dashboard-command-center.test.js:25-30`.
  - Per-child quick actions: `parents/attendance_report/{id}`, `parents/marks/{id}`,
    `parents/invoice/{id}` (`dashboard.php:402-404`); primary-child shortcuts (`:421-424`);
    Messages/Notices/My account (`:430-432`). Shortcut routes locked by
    `tests/parent-dashboard-command-center.test.js:32-39`.
  - FullCalendar notice + birthday calendar (`id="notice_calendar"`, `fullCalendar(`,
    `noticeboard`) locked at `tests/parent-dashboard-command-center.test.js:45-49`;
    implementation `dashboard.php:440-499`.
  - "All children" modal posts the **entire `$allChildren` array through POST to
    `parents/children_list`** (`dashboard.php:502-518`; handler `Parents.php:1051-1062`) — data
    round-trips through the browser (quirk, §12).
- **What parents can see/do** (full navigation `views/backend/parent/navigation.php`):
  dashboard, class masters (`Parents::class_master` `1013`), subject teachers
  (`Parents::subject_teacher` `1026`), per-child academic syllabus (`148`), class routine (`510`),
  attendance report (`801`, selector `815`, view `838`, print `858`), results/marks with fee-block
  (`Parents::marks` `224-370` — denies transcript when `total_amount_due > 0` for current or past
  terms), invoices/fees (`536`), book list (`545`), transport (`561`), dormitory (`577`),
  noticeboard (`594`), documents (`611`), private messages (`628`), group messages (`698`),
  profile/password (`746`).
- Legacy payment settlement methods were removed from the portals; the retirement is locked by
  `tests/portal-record-ownership.test.js:52-58` (no `paypal_checkout`/`stripe_checkout`/`pay`/
  `pay_with_payumoney`/`bank_checkout` functions).

### 6.3 Admin-side parents CRUD

- List pages with DataTables JSON: `Admin::get_parents` (`4149`), `get_active_parents` (`4241`),
  `get_inactive_parents` (`4334`). Active/inactive is defined **via enrollment**: parents whose
  children have a `mute='0'` enroll in the running year/term vs the rest
  (`Ajaxdataload_model.php:178-258`).
- Row actions: send SMS, edit modal, delete, block/unblock (`Admin.php:4191-4204`).
- Block = `parent.block_limit = 3` (`Admin.php:4097-4106`); unblock resets to 0 and re-sends the
  `authentication_key` by SMS+email (`Admin.php:4108-4141`).

---

## 7. Enrollment & promotion mechanics

### 7.1 `enroll` semantics

`VERIFIED LEGACY BEHAVIOR` — `enroll` (schema `schema/schoolmanager_schema_redacted.sql:2254-2291`)
is the **per-session class membership fact table**:

- `enroll_code` — 7-char `md5(rand())` token (not unique-enforced) (`Admin.php:2773`).
- `student_id`, `class_id`, `section_id`, `transport_id`, `roll`, `date_added` (unix ts string).
- `year` (e.g. `'2025-2026'`), `term` (`1|2|3` as string), `sem` (`1|2`) — **mutually exclusive
  grain**: term-schools fill `term`, JHSS fills `sem`. Queries always filter
  `year + term` or `year + sem` (`Admin.php:1012-1014`, `Crud_model.php:4559-4563`).
- `status` ('open'/'close'), `status_attendance` ('open'/'close') — set to `close` for every row of
  a student once attendance is taken for the new session (`Crud_model.php:4111-4112`,
  `Admin.php:3202-3203`), so "open" flags lagging enrollments for the attendance job
  (`Admin.php:11073-11075`).
- `mute enum('0','1','2')` — `0` active, `1` muted/inactive, **`2` = graduated**
  (set only by `graduate_students`, `Admin.php:27405`).
- `residence_type` enum('Day','Boarding') + boarding `house_id/dormitory_id/bed_id` copied forward
  on promotion (`Admin.php:3782-3786`) and termly enrollment (`Crud_model.php:4094-4098`).
- Duplicate prevention is **application-side only** (checks before insert, e.g. promotion
  `Admin.php:3743-3749`); there is **no unique key** on (`student_id`,`year`,`term`/`sem`).

### 7.2 Promotion — `Admin::student_promotion/promote` (`Admin.php:3719-3872`)

- **UI gate**: promotion page shows a blocking warning unless `running_term == 3`
  (`student_promotion.php:4-27`); "promote to session" is hardcoded to
  `{yearA+1}-{yearB+1}` and `next_term = next_sem = 1` (`student_promotion.php:69-73`).
- **Selection UI**: `Admin::get_students_to_promote` (`Admin.php:3874-3894`) renders
  `student_promotion_selector.php` per class pair.
- **Mechanics** (both branches identical except sem/term):
  1. Load all `enroll` rows for `class_id=from`, `year=running_year`, `mute='0'`,
     `term|sem=running_term|sem` (`Admin.php:3732-3734`, `3793-3795`).
  2. Per student, `promotion_status_{student_id}` POST field = target class (same class = repeat).
  3. Target section = **first** `section` row of the target class
     (`$this->db->get_where('section', array('class_id'=>...))->row_array()` `Admin.php:3738-3739`,
     `3799-3800`) — sections beyond the first are ignored at promotion.
  4. If an enroll row for (`student_id`, `promotion_year`, `next_term|sem`) already exists →
     **UPDATE** it (class/section/transport/residence/boarding) but only when the promotion year's
     first part equals the running year's second part (guards against editing stale promotions,
     `Admin.php:3749-3771`, `3810-3832`).
  5. Else **INSERT** a new `enroll` row with a fresh `enroll_code`, target class/section,
     `promotion_year` + `next_term|sem`, copying `transport_id`, `residence_type`, `house_id`,
     `dormitory_id`, `bed_id` (`Admin.php:3772-3789`, `3833-3850`).
- **No roll cleanup**: the old-year enroll row stays as-is (history), `roll` is not renumbered, and
  no invoice/fee roll-forward happens here.
- **Session rollover** (`Admin::change_session` `Admin.php:21039-21370`) then:
  - Refuses to enroll into the new year while any previous Term-3 class has zero students enrolled
    in the new year — `Crud_model::students_enrolled` returns the offending class_ids
    (`Crud_model.php:4123-4190`; usage `Admin.php:21058-21076`, `21177-21212`) with a
    "Proceed anyway" escape hatch (`$confirm='yes'`).
  - `Crud_model::automateNextTerm` (`Crud_model.php:3891-3995`) validates the selected year is
    consecutive (`'invalid year'`), exists (`'year not found'`), and that the previous year's last
    term is 3 (`'year not allowed'`); sets `settings.running_term = 1`.
  - `settings.running_year` updated (`Admin.php:21181-21184`); if no enroll rows exist for
    year+term, running_term is derived from the last enroll row (`Admin.php:21186-21190`).
  - **Termly auto-enrollment** `Crud_model::termlyEnrollment($term,$year)` (`Crud_model.php:4070-4121`):
    skips if enroll rows already exist for year+term; for `term != 1` copies every
    `mute='0'` enroll from `term-1` of the same year into a new enroll row (same class/section,
    transport/residence/boarding copied), seeds a placeholder `attendance` row for today, and marks
    the student's enroll rows `status_attendance='close'`. Term 1 of a new year is created **only by
    promotion**.
  - **Subject roll-forward** `do_subjects_import_mass` / `..._creche` (`Crud_model.php:3191`,
    `3336`) duplicate the previous term's `subject` rows into the new term/year.
  - **Exam scaffolding** `Crud_model::addExams` (`Crud_model.php:4031-4068`) inserts an `exam` row
    per `exam_category` named `TERM {n} EXAMINATION - {year}` (category 1 =
    `TERM {n} PORTFOLIO ASSESSMENT - {year}`).
  - **Daily fee rates copy** from previous year Term 3 when absent (`Admin.php:21253-21310`).
- **Term-only change** `Admin::change_term` (`Admin.php:21375-21588`) performs the same
  enrollment/subject/exam pipeline within the year; **semester change** `change_sem`
  (`Admin.php:21590-21598`) merely flips `settings.running_sem` — semester enrollment is instead
  lazily created by the attendance scanner (`enrollment_updator`, §7.3).

### 7.3 Lazy enrollment via attendance — `Admin::enrollment_updator` (`Admin.php:10967-11100`)

- Called by the attendance selector flow (`Admin.php:11231` + `Crud_model::attendance_selector`
  `Crud_model.php:3619`).
- For JHSS/sem mode: if no attendance exists for class/section/year/sem and no enroll rows exist
  for that sem, it **clones enroll rows from `sem-1` into `sem`** (new `enroll_code`s), seeds
  attendance rows, and closes prior `status_attendance` (`Admin.php:11020-11048`); blocks with
  `promotion error sem` if someone tries to open sem 1 of a year without promotion
  (`Admin.php:11004-11013`). Term-mode twin in the same method (`Admin.php:11100+`).

### 7.4 In-term class move — `Admin::student_move_to_another_class` (`Admin.php:26712-27383`)

`VERIFIED LEGACY BEHAVIOR` — moving students between classes **in the same year+term**:

1. Bills of the from/to classes are compared (`getTermlyClassBillsForStudent`,
   `Admin.php:26738-26743`); invoice rows are updated, inserted or deleted so the student's invoice
   matches the target class bill set, with `amount_paid` reset then re-credited from the summed
   previous payments (`Admin.php:26888-26960`, `27005-27040`); overpayment sets
   `invoice.status='overpaid'` (`Admin.php:27240-27244`).
2. **Class-pointer sweep** across `enroll, aggregation, attendance, invoice, mark, payment,
   portfolio_assessment`: `UPDATE ... SET class_id={to}, section_id={to-section}` for the student's
   rows in `running_year`+`running_term` (section skipped for payment/invoice)
   (`Admin.php:27249-27259`).
3. Existing `invoice_discounts`/`invoice_discount_items` for the invoice are deleted and rebuilt
   from active `student_discount_assignments` (`Admin.php:27261-27360`).
4. `sync_invoice_to_ledger` re-syncs (`Admin.php:27381`).

### 7.5 Graduation — `Admin::graduate_students` (`Admin.php:27387-27419`)

- Called from `modal_move_student.php:62` (`admin/graduate_students/{from_class}/{year_batch}/{ids}`).
- For each student: take `MAX(enroll_id)`, set that enroll row's `mute = 2` (graduated), and insert
  into **`alumni`** (`student_id`, `class_id`, `year_batch`) — schema comment: *"Alumni, list of
  completed students"* (`schema:449-456`).
- Alumni listing page `Admin::alumni` (`Admin.php:1122`) + `load_alumni` (`1369`).

---

## 8. Student status lifecycle

`VERIFIED LEGACY BEHAVIOR` — there is **no single status column**; status is the combination of:

| Aspect | Column(s) | Values | Where enforced |
|---|---|---|---|
| Active vs muted/inactive | `student.mute` + mirrored `mute` on `enroll`, `attendance`, `invoice`, `mark` | `0` active, `1` muted | Mute sets the flag on **all 5 tables** (`Admin.php:3108-3124`); unmute reverses and, if the student has no current enroll, re-enrolls them (with class from param) or re-points the current enroll to the chosen class (`Admin.php:3131-3228`). Muted list: `Admin::muted_students` (`1114`), `Ajaxdataload_model.php:2671-2701` |
| Graduated | `enroll.mute = 2` + `alumni` row | — | `Admin.php:27387-27419` |
| Login blocked | `student.block_limit` / `parent.block_limit` | `0` normal, `3` blocked | Block at `Admin.php:3055-3068` / `4097-4106`; login refuses when any table row has `block_limit==3` (`Login.php:128-160`); unblock re-sends the 5-char auth key (`Admin.php:3070-3103`, `4108-4141`) |
| Deletion workflow | `student.can_delete` / `student.can_edit` (+ issuer ids) | `default, request, approved, declined, trash` | Approval workflow (`Approval_requests.php:67,195,240`); most financial queries exclude `can_delete='trash'` invoices (e.g. `Admin.php:153`, `7161`) |
| Account active (portal) | `student.active_status` enum('1','0') | default '1' | schema `:5805`; not surfaced in flows audited |
| Online presence | `online_status` | '0'/'1' | schema `:5807` |

**Hard delete** — `Admin::delete_student` (`Admin.php:3713-3716`) →
`Crud_model::delete_student` (`Crud_model.php:1827-1935`) inside a transaction deletes the student's
rows from 16 tables (`enroll, attendance, mark, aggregation, invoice, payment,
student_discount_assignments, invoice_discounts, invoice_discount_items, daily_fee_wallet,
daily_fee_transactions, online_exam_result, book_request, beneficiary_list, admission_logs,
student_ledger` — `Crud_model.php:1842-1872`), removes every message thread where the student is a
participant (`Crud_model.php:1882-1893`), unlinks `uploads/student_image/{id}.jpg` and
`uploads/barcodes/students/{code}.png` (`Crud_model.php:1895-1905`), then deletes the `student` row
(`Crud_model.php:1907-1909`) and logs `student_deletion` (`Crud_model.php:1918-1924`).
**Financial history is destroyed irreversibly** (no soft-delete for the student row itself).

**Transfer** = in-term class move (§7.4) + enrollment re-pointing; there is no "transfer out to
another school" object beyond `former_school` (inbound only).

**Login model** (`Login.php:110-273`): identity = email (or `username` for students),
password bcrypt-verified, **plus `authentication_key` (5 chars) as a mandatory second input**
(`Login.php:161-163`, student branch `207-230`, parent branch `231-247`). Sessions set
`student_login`/`parent_login`/`login_type` and `student_id`/`parent_id`.

---

## 9. Academic setup entities

### 9.1 Classes & sections

- `class` (schema `:1211-1234`): `name` (varchar 11, e.g. `JHSS`, `JSS`), `category`
  (default 'Pre-School' — used for bill targeting), `name_numeric` (varchar 3 — the class "number",
  also part of display names), `teacher_id` (**class master/class teacher**).
- `Admin::classes` CRUD (`Admin.php:6643-6733`): create **auto-creates a first section 'A'** with
  the same teacher (`Admin.php:6657-6662`); update overwrites the class and **all its sections'**
  name+teacher (`Admin.php:6686-6691`); delete removes `daily_fee_rates` then the class
  (`Admin.php:6708-6725`) — sections/enrolls are **not** cleaned (orphan risk).
- Bulk class upload CSV (`Admin::bulk_upload_classes` `Admin.php:6735-6815`; template
  `download_class_template` `6817-6851`) — columns Name, Category, Name Numeric, Teacher ID,
  optional fee columns + Section; also seeds `daily_fee_rates` per enabled fee mode.
- `section` (schema `:5538-5560`): `name`, `nick_name`, `class_id`, `teacher_id`
  (**section teacher**). CRUD `Admin::sections` (`Admin.php:6998-7058`) with
  `duplication_of_section_on_create/edit` (unique per class+name,
  `user_validation_helper.php:104-145`).
- Display convention: full class name = `{name}{name_numeric}{section}` built ad-hoc, e.g.
  `Admin.php:22478`, `getFullClassName` (`Crud_model.php:294-302`).

### 9.2 Subjects & teachers

- `subject` (schema `:6023-6049`): `name`, `subject_type` enum('core','elective') (added by
  `application/migrations/002_add_subject_type.sql`), `status` int (1=active, marks visibility),
  `class_id`, **`teacher_id` = subject teacher**, and per-occurrence `year` + `term` **or** `sem`.
- **Subject creation fans out across the remaining terms/semesters**: creating a subject in term 1
  inserts rows for terms 1-3; in term 2 → terms 2-3; term 3 → term 3 only; JHSS analog with
  `sem` (`Admin.php:6164-6235`). Bulk create `subject/create_bulk` dedupes per
  name+class+year+term/sem inside a transaction (`Admin.php:6241-6297`).
- Editing a subject re-propagates its `status` into matching `mark` rows (`Admin.php:6318-6345`).
- Excel subject import: `generate_subject_template` (`Admin.php:6429`) +
  `bulk_subject_import_excel` (`Admin.php:6515`).
- Creche parallel universe: `subject_creche` + `subject_category_creche` tables
  (`schema:6054-6101`), `Admin::subject_creche` (`Admin.php:6075`), marks/marksheets have `_creche`
  twins throughout (e.g. `Admin.php:2268-2519`).
- **Teacher role resolution** (who sees what):
  - Class master: `class.teacher_id` (dashboard count `dashboard.php:77-90`; teacher class list via
    `getFullClassList(teacher_id)` `student_promotion.php:107`).
  - Section teacher: `section.teacher_id` (`Admin.php:7002`).
  - Subject teacher: `subject.teacher_id` filtered queries, e.g. teacher marks selector
    (`Teacher.php:494`, `642-651`); `hod_subjects` table (`schema:3062`) scopes HODs.
- `class_routine` (timetable; schema `:1238-1263`): class/section/subject + `time_start/end` ints +
  `day`, `year`, `term` — duplicated-on-create guard `duplication_of_class_routine_on_create/edit`
  (`user_validation_helper.php:148-172`); CRUD `Admin::class_routine` (`Admin.php:10621`).
- `academic_syllabus` (schema `:139-156`): file uploads per class/subject/year with
  `academic_syllabus_code`; portal download via `Parents::download_academic_syllabus`
  (`Parents.php:163`) / `Student::download_academic_syllabus` (`Student.php:887`).

### 9.3 Academic calendar — years, terms, semesters

- **No `academic_year` table.** Current context = `settings` rows `running_year`
  (format `YYYY-YYYY`), `running_term` (1|2|3), `running_sem` (1|2)
  (`Admin.php:2533-2543` reads; `system_settings.php:287-319` displays read-only).
- `terms` (schema `:6540-6561`): one row per (year, term) with `term_ending`, `next_term_begins`,
  `full_payment_date`, `days_opened` ("Total number of days school was open during this term").
  Upserted from system settings save (`Admin.php:20440-20461`); the `sems` twin upsert is
  **commented out** (`Admin.php:20426-20437`) — semesters don't get calendar rows in practice.
- `sems` (schema `:5565-5586`): same shape for semesters (MyISAM engine).
- Term/sem changer UI: `Admin::get_session_changer` (`21027`), `get_term_changer` (`21031`),
  `get_sem_changer` (`21035`); view `year_term_selection.php`.
- Engine note: `terms`, `sems`, `parent`, `document` are **MyISAM** while most newer tables are
  InnoDB (schema headers at each CREATE TABLE); a prior migration converted only
  enabled-sync tables (`application/migrations/20261022_convert_enabled_sync_myisam_to_innodb.sql`).

---

## 10. Tables & columns (domain subset of `schema/schoolmanager_schema_redacted.sql`)

Line refs are the `CREATE TABLE` starts.

### `student` (schema:5774, InnoDB)
`student_id` PK; `student_code` longtext (admission number); `name` NOT NULL; `first_name`,
`middle_name`, `last_name` varchar(100); `birthday` longtext (string dates!); `sex`, `religion`,
`blood_group` longtext; `nationality` varchar(50) default 'Ghanaian'; `ghana_card_id` varchar(20);
`address`; `admission_date` date; `allergies`, `medical_conditions` text; `emergency_contact`
varchar(20); `parent_email` varchar(100); `phone`, `student_phone` varchar(20); `username` NOT NULL
(= student_code); `email`; `password` (bcrypt); `parent_id` int NULL → parent; `dormitory_room_number`;
`authentication_key` (5-char login factor); `read_notice_ids` varchar(255) default '0';
`block_limit` int default 0; `active_status` enum('1','0') default '1'; `mute` enum('0','1')
default '0'; `online_status` enum('1','0'); `special_diet` enum('0','1'); `tribe`, `former_school`,
`student_health`, `student_special_diet_details`, `class_reached` longtext; `can_delete`
enum('default','request','approved','declined','trash') default 'default'; `can_edit`
enum('default','request','approved','declined'); `delete_request_issuer_id`, `edit_request_issuer_id`;
Ghana-education extras: `place_of_birth`, `hometown`, `nhis_number`, `nhis_status`,
`disability_status`, `learning_support`, `digital_literacy`, `home_technology_access`,
`special_needs` varchar(255); offline-sync columns `sync_status`
enum('SYNCED','PENDING','CONFLICT'), `last_modified_at`, `last_modified_by`, `device_id`, `version`,
`retry_count`, `sync_error`.

### `parent` (schema:4481, **MyISAM**)
`parent_id` PK; `name`; `guardian_gender` varchar(10); `guardian_is_the` varchar(50);
`email` (often = phone); `password`; `phone` (comma-separated possible); `address`; `profession`;
`designation`; `authentication_key`; `read_notice_ids`; `block_limit`; `active_status`;
`online_status`; `father_name`, `father_phone`, `father_occupation`, `mother_name`, `mother_phone`,
`mother_occupation`; sync columns (`sync_status` enum PENDING/SYNCED/FAILED/MANUAL_REVIEW, etc.).
No tenant/school column — single-tenancy by database.

### `enroll` (schema:2254, InnoDB)
`enroll_id` PK; `enroll_code`; `student_id`; `class_id`; `section_id`; `transport_id`; `roll`;
`date_added`; `year` longtext; `term` longtext; `status` enum('open','close') default 'open';
`status_attendance` enum('open','close') default 'open'; `sem` longtext; `mute` enum('0','1','2')
NOT NULL; `residence_type` enum('Day','Boarding') NOT NULL default 'Day'; `house_id`, `dormitory_id`,
`bed_id`; sync columns.

### `class` (schema:1211, InnoDB)
`class_id` PK; `name` varchar(11); `category` varchar(50) default 'Pre-School'; `name_numeric`
varchar(3); `teacher_id` (class master); sync columns.

### `section` (schema:5538, InnoDB)
`section_id` PK; `name`; `nick_name`; `class_id`; `teacher_id` (section teacher); sync columns.

### `subject` (schema:6023, InnoDB)
`subject_id` PK; `name`; `subject_type` enum('core','elective') default 'elective'; `status` int;
`class_id`; `teacher_id` (subject teacher); `year`; `term`; `sem`; sync columns.
Twins: `subject_creche` (schema:6080, adds `category_id`) and `subject_category_creche`
(schema:6054).

### `class_routine` (schema:1238, InnoDB)
`class_routine_id`; `class_id`; `section_id`; `subject_id`; `time_start`/`time_end` (hour ints);
`time_start_min`/`time_end_min`; `day`; `year`; `term`; sync columns.

### `academic_syllabus` (schema:139, InnoDB)
`academic_syllabus_id`; `academic_syllabus_code`; `title`; `description`; `class_id`;
`uploader_type`; `uploader_id`; `year`; `timestamp`; `file_name`; `subject_id`; `sync`.

### `terms` (schema:6540, **MyISAM**)
`term_id`; `term_ending`; `next_term_begins`; `full_payment_date`; `days_opened` int; `year`; `term`;
sync columns.

### `sems` (schema:5565, **MyISAM**)
`sem_id`; `sem_ending`; `next_sem_begins`; `full_payment_date`; `days_opened`; `year`; `sem`; sync
columns.

### Supporting entities
- `admission_category` (schema:331) — id + name only (no FK usage found in audited flows).
- `admission_logs` (schema:355) — `student_id`, `admitted_by`, `class_id`, `section_id`,
  `residence_type`, `bill_items` (JSON text), `total_bill_amount` decimal(10,2), `admission_date`
  int, `created_at` int, sync columns.
- `alumni` (schema:449) — `alumni_id`, `student_id`, `year_batch`, `class_id` ("completed students").
- `document` (schema:1945, **MyISAM**) — study material per class/subject with approval status.
- `mark` (schema:4172) — per student/subject/exam score components incl. `test1`, `group_work`,
  `test2`, `project`, `sub_total`, `term_exam`, `class_score`, `exam_score`, `mark_obtained`,
  `status`, `comment`, year/term/sem, `mute`.
- `invoice` (schema:3463) — line-item billing: `invoice_code` bigint, `student_id`, `title`,
  `amount` double, `discount`, `amount_paid`, generated columns `original_due`/`net_due`, `due`,
  `status`, `residence_type`, `year` varchar(20), `term` int, `sem` int, `class_id`, `mute`,
  `can_delete`/`can_edit` approval enums, lock + approval columns, ledger sync columns.
- `dormitory`/`boarding_*` (schema:1973, 957-1013) — boarding allocation targets of
  `enroll.house_id/dormitory_id/bed_id`.
- **`classroom` table does not exist.** Room/physical-space modelling is absent; the closest
  concept is `section` and the boarding `dormitory`. `VERIFIED LEGACY BEHAVIOR` (grep for
  `classroom` across controllers/models: zero hits).

---

## 11. Validation rules catalogue

`VERIFIED LEGACY BEHAVIOR` (form_validation + custom helpers):

| Rule | Where | Detail |
|---|---|---|
| Student create: first/last name required; student_code required & exact length; sex required; section_id required; phone min_length 10 | `Admin.php:2675-2687` | CI form_validation |
| Student update: same minus student_code/section; `phone[]` trim | `Admin.php:3450-3459` | |
| `code_validation_insert` | `user_validation_helper.php:221-234` | student_code uniqueness (off-by-one truthiness quirk) |
| `code_validation_update` | `user_validation_helper.php:334-347` | uniqueness excluding self |
| `email_validation` | `user_validation_helper.php:54-69` | email not present in any of 6 role tables |
| `email_validation_for_edit` | `user_validation_helper.php:72-101` | excludes self; includes non_teaching_staff |
| `parent_full_validation_insert` | `user_validation_helper.php:175-196` | parent (name,phone) pair uniqueness; truthiness quirk: returns true when both empty |
| `auth_validation_insert` / `g_auth_validation_insert` | `user_validation_helper.php:253-266`, `285-298` | 5-char authentication_key collision loop for student/parent |
| `date_format_converter` | `user_validation_helper.php:380+` | accepts DD/MM/YYYY & DD-MM-YYYY, rejects 2-digit years with HTML error strings; output format `d M Y` |
| Parent create: name required only; email format checked if provided | `Admin.php:3934-3954` | password optional → '123456' |
| Section create/edit: `duplication_of_section_on_create/edit` | `Admin.php:7006`, `7026`; helper `user_validation_helper.php:104-145` | unique section name per class |
| Class routine duplication guard | `Admin.php:10839+`; helper `user_validation_helper.php:148-172` | |
| Invoice/debt write-off requires student_id+year+term | `Admin.php:3239-3245` | transactional, audited |
| Login: email/username required, password min_length 6, auth key required | `Login.php:113-124`, `161-163` | block_limit==3 refusal `Login.php:128-160` |
| Admission readiness (client) | `assets/js/admission-readiness.js` per `tests/admission-readiness-panel.test.js` | required-field progress; no submission side effects |

---

## 12. Legacy quirks to retire

All `VERIFIED LEGACY BEHAVIOR` unless labeled:

1. **Session context is global mutable settings** — `running_year/term/sem` in `settings` + string
   columns everywhere; changing session mutates system state and triggers mass enrollment/subject/
   exam/fee copying (`Admin.php:21039-21370`). iEduPro should use explicit academic-year/term
   entities and per-record year/term FKs.
2. **JHSS magic string** — dozens of `if ($class_name == 'JHSS')` branches switch term↔sem
   (`Admin.php:2803`, `1033`, `3731`, `6194`, `10971`…). Migrate to a school/programme-level
   calendar-type attribute.
3. **`enroll` has no unique constraint** on (student, year, term/sem) — duplicate enrollments are
   possible; dedupe is ad-hoc (`Admin.php:3743-3749`).
4. **Duplicated, view-resident ID generation** (`student_add.php:256-318`) — plus a broken twin
   `generate_id.php` (undefined `$s_query`, wrong settings key `student_id_format`). String-sorted
   `MAX(student_code)` breaks ordering as numbers grow.
5. **Student insert happens before class/section validation completes** — errors after
   `insert('student')` echo JSON but the student row persists without an enroll row when class or
   section missing (`Admin.php:2769` then `2774-2787` bail). No transaction around admission.
6. **Bulk import bugs**: valid-email branch always writes `term` even for JHSS (`Admin.php:22739`);
   guardian back-fill matches parent **by name only** (`Admin.php:22778`, `22794`); default
   password `123456` for both student and guardian (`Admin.php:22498-22499`); files left in
   `uploads/` (`Admin.php:22480`).
7. **`code_validation_insert` truthiness gap** — returns `null` (not false) for exactly-1 duplicate
   (`user_validation_helper.php:221-234`).
8. **authentication_key is a 5-char second password** printed in the admin profile tab
   (`student_profile.php:2052-2056`) and re-sent in plaintext by SMS/email on unblock
   (`Admin.php:3089-3091`).
9. **Parent delete orphans students** (`Admin.php:4083-4095`); no guardian reassignment tool.
10. **Student hard delete destroys invoices/payments** (`Crud_model.php:1842-1872`) — financial
    records are not retained, contrary to audit expectations.
11. **Mute is a cross-table denormalised flag** — mute/unmute writes 5 tables
    (`Admin.php:3108-3124`, `3175-3224`); any new table with student rows must remember to join the
    ritual. `enroll.mute=2` means graduated, undocumented outside `graduate_students`.
12. **Promotion assigns only the first section of the target class** (`Admin.php:3738-3739`) and
    leaves `roll` unchanged in the new year.
13. **"Proceed anyway" override** lets session rollover skip the all-classes-promoted gate
    (`Admin.php:21073`, `21196-21212`).
14. **Parent data is duplicated**: guardian fields on `parent` AND `student.parent_email` /
    `student.phone` copies, updated in two code paths (§2.2 step 13, §2.3).
15. **"All children" modal posts the full child dataset via the browser** to
    `parents/children_list` (`dashboard.php:502-518`) — trust-the-client pattern to replace with a
    server-side query.
16. **Dead code to retire**: `application/libraries/Csvimport.php` (unused),
    `application/controllers/generate_student_template.php` (no class),
    `student_add_backup.php`, `student_bulk_add_backup.php`, `student_add_new.php`,
    `student_bulk_add_modern.php`, `modal_student_edit-OLD.php`, `student_marksheet.php.broken_backup`
    (also flagged in `docs/page-audits/student-workflow.md` §6).
17. **Engine inconsistency**: `parent`, `terms`, `sems`, `document` remain MyISAM
    (schema:4499, 6561, 5586, 1969) — no transactions for parent writes.
18. **No `classroom` entity**; if iEduPro needs rooms, model them fresh.
19. **Fee-block on results** — parents can't see marks when any debt exists
    (`Parents.php:251-283`); parity decision needed for SaaS.
20. **Frontend "admission form" is a printable blank form only** (`Home.php:124-128`,
    `views/frontend/default/admission.php` — empty form fields, no POST handler); online admission
    applications do not exist.

---

## 13. Student & parent portals (summary of capabilities)

### Student portal (`controllers/Student.php`, auth `student_login`)
Self-scoping guard `enforce_student_record_scope` (`Student.php:53-82`) 403s any student_id
param ≠ session student (locked by `tests/portal-record-ownership.test.js:31-44`).
Capabilities: dashboard (`94`), teacher list (`109`), subjects for own class (`133-158`),
own marksheets/results sheets + print views (`162-837`, incl. creche twins), class routine (`839`),
syllabus + downloads (`872-917`), invoices (`919`), book list + requests (`932`, `1256-1294`),
transport (`948`), dormitory (`964`), noticeboard (`981`), documents (`998`), private messages
(`1015`), group messages (`1086`), profile/password (`1134`), study materials (`1206-1254`),
own attendance (`1296-1359`), online exams take/submit (`1479-1612`), lesson notes (`1625-1755`).
`VERIFIED LEGACY BEHAVIOR`: students authenticate with `username (=student_code)` or email +
password + 5-char `authentication_key` (`Login.php:207-230`).

### Parent portal (`controllers/Parents.php`, auth `parent_login`)
As enumerated in §6.2 — read-mostly: children, class/subject teachers, syllabus, routine,
attendance, results (fee-gated), invoices, books, transport, dormitory, noticeboard, documents,
messages, profile. Payment settlement is retired from the portal
(`tests/portal-record-ownership.test.js:52+`); collections moved to dedicated fee modules.

---

## 14. Test coverage (this domain)

| Test file | What it locks |
|---|---|
| `tests/admission-readiness-panel.test.js` | admission-readiness.js loads only on `student_add`; progress derives from `[required]` of `#student_single_add_form`; jump-to-first-missing without submit/FormData/ajax/fetch; a11y (`aria-live`, progressbar role) + mobile breakpoint (`:8-36`) |
| `tests/student-profile-command-center-contract.test.js` | student-profile-command-center.js loads only on `student_profile`; reuses existing tabs/routes; no network calls; prev/next student navigation via existing selector with bound-disabled states (`:10-48`) |
| `tests/student-information-entry-contract.test.js` | `student_information` selector fallback; section null-safety; admin identity resolved by `admin_id` not name; metro tile route (`:21-52`) |
| `tests/parent-dashboard-command-center.test.js` | parent dashboard pre-initialised counters; command-center data attributes; shortcut routes (`allChildren()`, `parents/attendance_report`, `marks`, `invoice`, `message`); teacher-birthday query guarded; notice calendar contract (`:18-49`) |
| `tests/portal-record-ownership.test.js` | parent constructor + per-method student-ownership scope map; student self-scope map; portal payment methods retired (`:16-58`) |
| `tests/role-controller-auth-boundaries.test.js` / `tests/admin-cross-role-boundary.test.js` | general role-gate boundaries (adjacent coverage) |
| `tests/ui-navigation-regression.test.js` | navigation sanity across roles (adjacent coverage) |

Coverage gaps for migration: no automated tests exist for student ID generation, CSV import,
promotion/session rollover, mute semantics, or graduation — those behaviors are pinned only by
this document. `RECOMMENDATION`: port the four command-center contract tests as UI/e2e specs and
add golden-file tests for ID generation and import before cutover.

---

## 15. Quick parity checklist for iEduPro

- [ ] Admission number: per-tenant sequence + unique index; year-based reset policy configurable (§3).
- [ ] Admission transaction: student + guardian-link + enroll + invoices + admission log atomic (§2.2).
- [ ] Guardian model: multi-guardian junction table, relationship + custody fields, soft delete w/ reassignment (§6.1, §12.9).
- [ ] Enrollment: unique (student, academic_year, term) with term/sem as calendar rows not strings (§7.1, §12.1).
- [ ] Promotion: explicit promotion run object, section-aware, roll renumbering, repeat/graduate flags (§7.2, §12.12).
- [ ] Status: single lifecycle status enum (active/muted/graduated/transferred/withdrawn) replacing `mute` 5-table ritual (§8, §12.11).
- [ ] Deletion: soft-delete + financial retention (§12.10).
- [ ] Bulk import: transactional CSV with row-level errors; no default passwords (§4, §12.6).
- [ ] Calendar: academic_years/terms/semesters tables with days_opened (§9.3).
- [ ] Class/section/subject with unique names per year; teacher assignment roles (class master vs subject teacher) as first-class relations (§9.1-9.2).
- [ ] Portals: keep parent family command center + per-child quick actions; keep student self-scope guard (§5, §6.2, §13).
