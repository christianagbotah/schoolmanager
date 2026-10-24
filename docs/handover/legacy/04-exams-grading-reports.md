# 04 — Exams, Grading & Report Cards (Legacy Evidence)

> Source repo: `schoolmanager` @ branch `zai/full-platform-reconciliation-20261024` (HEAD `ff96b2e`).
> Purpose: parity-matrix input for the iEduPro multi-tenant SaaS migration.
> All claims cite `file:line`. Schema citations refer to `schema/schoolmanager_schema_redacted.sql` (abbreviated `schema.sql`).

---

## 1. Overview

The exam domain has **three co-existing generations of code** that must be understood separately before migration:

| Generation | Tables | Entry points | State |
|---|---|---|---|
| **A. Legacy core (production)** | `exam`, `exam_category`, `mark`, `aggregation`, `grade`, `grade_2`, `grade_creche`, `raw_score_grade`, `portfolio_assessment`, `online_exam`, `question_bank`, `online_exam_result`, `terminal_reports` | `Admin.php`, `Teacher.php`, `Student.php`, `Parent.php`, `Verify.php` | Live; all report cards print from this |
| **B. "Enterprise" exams (half-built)** | `enterprise_exams`, `enterprise_exam_subjects`, `enterprise_student_marks`, `enterprise_terminal_reports`, `waec_grading_scale` | `controllers/Examination.php`, `controllers/Setup_examination.php`, `models/Examination_model.php`, `models/Exams_enterprise_model.php`, `libraries/Result_processor.php`, `libraries/Aggregate_calculator.php` | Scaffolding; `Setup_examination::create_tables` is a *runtime* table creator; only used by WAEC-style result screen |
| **C. AcademicAssessmentEngine (HMVC-style module)** | `portfolio_headers`, `portfolio_scores`, `portfolio_aggregates`, `portfolio_audit_trail`, `sba_components`, `sba_weight_config`, `result_approval_status`, `result_approval_audit` | `controllers/Portfolio_enterprise.php`, `application/modules/AcademicAssessmentEngine/{models,services,middleware}` | Partial; SBA auto-fill from portfolio works, approval service exists but not wired into legacy mark entry |

Structural conventions that drive everything:

- **Level discrimination is by class *name*, not a level table**: `class_name == 'JHSS'` switches JHS/semester behavior; `class_name == 'CRECHE'` switches KG/creche behavior (e.g. `application/controllers/Admin.php:9212`, `Admin.php:9413`, `models/Crud_model.php:594`, `Teacher.php:954`).
- **Term vs semester**: non-JHS keyed on `term` (settings `running_term`), JHS keyed on `sem` (settings `running_sem`) — `Admin.php:9813-9815`, `Admin.php:9195-9197`.
- **Global settings toggles**: `settings.raw_score` (`Yes`/`No`) enables the JHS/WAEC raw-score mode; `settings.terminal_report_style` (`style_1`/`style_2`/`style_3`) selects one of three different report-card layouts *and* which grade table is authoritative (`grade` vs `grade_2`) — `Teacher.php:288-317`, `Admin.php:10385`, `models/Crud_model.php:502-512`, `1108-1117`.
- **Sync-aware writes**: `Examination_model`, `Exams_enterprise_model`, `Lesson_note_model` extend `MY_Model` which stamps `sync_status/last_modified_at/device_id` on every write (`models/Examination_model.php:4-14`).

---

## 2. Exam setup & marks entry

### 2.1 Exam CRUD (legacy, production)

- `Admin::exam()` — `application/controllers/Admin.php:8031-8118`
  - **create** (`:8034-8049`): `name` forced `strtoupper`, `date` (free-text date, stored in longtext column), `year`/`term`/`sem` copied from current settings, `category_id` from POST → insert into `exam`.
  - **edit** (`:8051-8075`) same fields; DB cache deleted after each mutation.
  - **delete** (`:8076-8105`): transaction deletes from `exam`, `mark`, `aggregation` by `exam_id` (marks & aggregates are *hard-deleted*, no archive).
  - **listing** (`:8106-8113`): `where year=running AND term=running OR sem=running` — the `or_where` is not bracketed, so the `year` filter is bypassed for any exam whose `sem` matches (`Admin.php:8110-8112`). Same pattern in `Crud_model::get_exams()` (`models/Crud_model.php:388-398`).
- `exam` table columns — `schema.sql:2398-2426`: `exam_id, name, date, year, term, sem, category_id` + sync columns. `date` is `longtext`; there is **no start/end date**, no status, no class linkage on the exam itself.
- **Exam categories**: `exam_category` — `schema.sql:2427-2450`: only `category_id, category_name` (+sync). Used in the exam create form dropdown (`application/views/backend/admin/exam.php:455-462`) and shown in the exam list (`exam.php:402`) via `Crud_model::get_exam_category()` (`models/Crud_model.php:3880-3883`). No per-category weighting or rules — purely a label.
- Exam ↔ class/subject linkage: **an exam is not linked to classes or subjects at all**. The link materialises only when marks are seeded (see 2.3): each `mark` row carries `exam_id + class_id + section_id + subject_id`.

### 2.2 Enterprise exam setup (Generation B)

- `Setup_examination::create_tables()` — `application/controllers/Setup_examination.php:6-81` creates tables at runtime:
  - `enterprise_exams` (`:8-21`): `exam_type ENUM('mid_term','end_term','mock','waec')`, `class_id`, `year`, `term`, `start_date`, `end_date`, `status ENUM('draft','active','completed','published')`, `created_by`. Index `(class_id, year, term)`.
  - `enterprise_exam_subjects` (`:24-32`): `exam_id`, `subject_id`, `total_marks DEFAULT 100`, `pass_mark DEFAULT 50`, `weight_percentage DECIMAL(5,2) DEFAULT 100.00`, unique `(exam_id, subject_id)`.
  - `enterprise_student_marks` (`:35-50`): `class_score`, `exam_score`, `total_score` (generated column `class_score + exam_score` — also `schema.sql:2343-2360`), `grade VARCHAR(2)`, `remark`, `position`, unique `(exam_id, student_id, subject_id)`.
  - `waec_grading_scale` (`:53-61`) seeded A1→F9 (`:63-78`): A1 80-100 pt 1.00 "Excellent"; B2 70-79 2.00 "Very Good"; B3 65-69 3.00 "Good"; C4 60-64 4.00 "Credit"; C5 55-59 5.00 "Credit"; C6 50-54 6.00 "Credit"; D7 45-49 7.00 "Pass"; E8 40-44 8.00 "Pass"; F9 0-39 9.00 "Fail" (`is_pass=0` only for F9).
  - DDL duplicated (with FKs + `ON DELETE CASCADE`) in `application/migrations/001_create_examination_tables.sql:5-98`; note the seed uses plain `INSERT` there vs `INSERT IGNORE` in the controller.
- `Examination` controller — `application/controllers/Examination.php`:
  - `create_exam` (`:56-75`) → `Examination_model::create_exam` inserts into the **legacy `exam` table**, not `enterprise_exams` (`models/Examination_model.php:16-19`) — schema mismatch between controller payload (`exam_name`, `exam_type`, `start_date`…) and the `exam` table columns (only `name`,`date`,`year`,`term`,`sem`,`category_id`). Broken feature.
  - `get_exams($class_id,$year,$term)` calls `Examination_model::get_exams` whose signature is `($year=null,$term=null)` (`Examination.php:77-84` vs `Examination_model.php:21-30`) — class filter silently dropped.
  - `add_exam_subjects` (`:185-208`) inserts `enterprise_exam_subjects` rows with **hardcoded** `total_marks=100, pass_mark=50`. Identical orphan copy in `application/controllers/Examination_add_subjects_method.txt:1-24` (dead text file).
  - `broadsheet` (`:128-183`): sums `total_score` per student, average = total/subject-count (`:168`), positions by `usort` DESC + index+1 (`:172-175`) — **no tie handling, no rounding**.
  - `analytics` (`:232-290`): pass rate uses hardcoded `total_score >= 50` (`:244`).
  - `waec_result` (`:292-317`) builds the WAEC-style result sheet from `Aggregate_calculator::format_for_report`; `download_result_pdf` (`:319-336`) captures it with `ob_start()` and renders through the dompdf wrapper `libraries/Pdf.php`.
- `Exams_enterprise_model::get_grade($score)` — `models/Exams_enterprise_model.php:16-21`: first row of `waec_grading_scale` where `min_score <= score AND max_score >= score`.

### 2.3 Marks entry (legacy core — the production flow)

**Selector / row seeding.** `Admin::marks_selector()` — `Admin.php:9187-9558`:
- POST `exam_id, class_id, section_id, subject_id`; year/term/sem from settings (`:9191-9197`).
- Missing subject → plain-text `no subject` (`:9201-9207`).
- JHSS branch (`:9212-9374`) keyed on `sem`; else non-JHS branch (`:9375-9548`) keyed on `term`.
- If no `mark` rows exist for the selection: one `mark` row per enrolled student is inserted (`:9239-9241`, `:9406-9408`). If rows exist, only newly-enrolled students get rows (`:9257-9313`, `:9424-9453`).
- **Side effect quirk**: on every selector run it sets `enroll.status='close'` for each student it touches (`:9243-9244`, `:9268-9269`, `:9410-9411`, `:9442-9443`).
- **Subject status propagation**: `mark.status` is overwritten with `subject.status` for the whole selection (`:9246-9253`, `:9304-9311`, `:9413-9420`, `:9445-9452`). `subject.status` acts as the *only* publish/lock flag for a subject's mark sheet (enum `'1'/'0'` in `mark` — `schema.sql:4172-4200`).
- A portfolio→marks auto-sync block (portfolio average → `mark.test1`, 20% weighting) exists but is **commented out** ("DISABLE FOR THOSE SCHOOLS THAT DON'T WANT TO USE PORTFOLIO ASSESSMENT") — `Admin.php:9317-9371` and `:9491-9545`; the live equivalent is in `portfolio_assessment_update` (see §4.3).

**Teacher-side selector (creche)**: `Teacher::marks_selector_creche()` — `application/controllers/Teacher.php:2799-2885`; same seeding but reads subject status from `subject_creche` (`:2840`) in the first branch and from `subject` (`:2868`) in the second (inconsistent), and routes to `marks_manage_view_creche2` when `category_id == 0` else `marks_manage_view_creche` (`:2879-2883`).
A standalone duplicate class file `application/controllers/Teacher_marks_selector_creche.php:1-93` declares **`class Teacher extends CI_Controller`** containing only `marks_selector_creche` — a name collision with the real `Teacher` controller (fatal if both ever load in one request). It is unreachable dead code.

**Marks grid & weighting (primary/JHS, non-creche).** `Admin::marks_manage_view()` (`Admin.php:8574-8587`) renders `views/backend/admin/marks_manage_view.php` (731 lines). Inputs per student (`marks_manage_view.php:408-457`):

| Column | Field | Max (HTML) | Editable |
|---|---|---|---|
| Class Work (test1) | `test1_{mark_id}` | 20 | yes |
| Group Work | `group_work_{mark_id}` | 10 | yes |
| Test 2 | `test2_{mark_id}` | 20 | yes |
| Project Work | `project_{mark_id}` | 10 | yes |
| Sub-Total (out of 60) | `sub_total_{mark_id}` | — | readonly (JS) |
| **A** Class Score (out of 50) | `class_score_{mark_id}` | 50 | readonly (JS) |
| Term Exam (raw, out of 100) | `term_exam_{mark_id}` | — | yes |
| **B** Exam Score (out of 50) | `exam_score_{mark_id}` | 50 | readonly (JS) |
| Total | `mark_obtained` | — | readonly (JS) |

Client-side formulas (JS, `marks_manage_view.php:579-645`):
- `sub_total = test1 + group_work + test2 + project` (max 60)
- `class_score = round(sub_total * 50/60, 2)` — continuous assessment scaled 60→50
- `exam_score = term_exam / 2` — raw exam out of 100 scaled to 50
- `total_score = class_score + exam_score` (max 100)

Submit-time validation is **JS only** (`marks_manage_view.php:648-680`): `class_score ≤ 50`; `project & group_work ≤ 10`; `test1 & test2 ≤ 20`; `exam_score ≤ 50`. **The server performs no range validation** — `Admin::marks_update` merely `floatval` + `round(...,2)` (`Admin.php:9845-9858`).

**Save.** `Admin::marks_update()` — `Admin.php:9809-9986`:
- Per student: `mark_obtained = class_score + exam_score` (rounded 2dp, `:9845`); batch `update_batch('mark', ..., 'mark_id')` (`:9928`).
- Recomputes `aggregation.aggregate_mark = SUM(mark_obtained)` for the student across the exam/class/section/year/term and inserts or updates `aggregation` (`:9864-9936`, batched at `:9931-9937`).
- **"to be deleted" correction block** (`:9941-9971`): for every `exam_id` the student has *any* mark in (no year/term filter), re-sums marks and overwrites `aggregation.aggregate_mark` — a cross-exam, cross-term aggregate corruption vector. The identical block exists in the teacher controller `Teacher.php:895-923` (also labelled "to be deleted").
- Teacher version: `Teacher::marks_update()` — `Teacher.php:796-945` (same logic, row-by-row, same correction block, JSON response).

**Creche/KG marks entry.** `Admin::marks_update_creche()` — `Admin.php:9773-9807` (teacher mirror `Teacher.php:754-794`): writes **only** `mark.test1 = assess_{mark_id}` where the posted value is a **`grade_creche` grade_id** (descriptive assessment, see §4.1). No numeric marks, no totals, no aggregation update.

**Marks via SMS.** `Admin::exam_marks_sms()` — `Admin.php:8121-8509`: single-parent or whole-class push of exam scores; JHS keyed on exam's `sem`, others `term` (`:8140-8155`); ~14 hardcoded subject abbreviations (R.M.E, ICT, Maths, …) at `:8211-8230` (duplicated in report views, §5.2).

### 2.4 Tabulation sheets

`Admin::tabulation_sheet()` — `Admin.php:10204-10254` and print `:10269-10300`: raw_score=Yes + JHSS → `tabulation_sheet_raw_score(_print_view)` views, else `tabulation_sheet(_print_view)`. JHS routes carry `sem` in the `term` URL segment (`:10225-10229`).

### 2.5 Edit locking / approvals

- Legacy core: **none**. Only `mark.status` (copied from `subject.status`) and the implicit mute flags. Any teacher/admin with route access can rewrite marks at any time.
- Generation C only: `result_approval_status` (`schema.sql:5425-5447`, enum `draft/submitted/approved/locked` per class+year+term) with `Result_approval_service` (`application/modules/AcademicAssessmentEngine/services/Result_approval_service.php`): `is_editable()` returns true only in `draft` (`:44-67`); transitions `submit` (`:69-99`), `approve` (`:105-134`), `lock` (`:140+`), audit rows in `result_approval_audit` (`schema.sql:5406-5423`). **Not wired into the legacy marks entry path.**

---

## 3. Result processing algorithms

### 3.1 Aggregation (term totals)

- `aggregation` table — `schema.sql:381-428`: `aggregate_id, student_id, class_id, section_id, exam_id, aggregate_mark (double), raw_score (double), grand_total (varchar!), term, year, attitude, conduct, interest, c1…c15 (conduct item IDs), remarks, head_teacher_remarks, class_teacher_remarks, days_opened, days_present, sem` + `sync`.
- Written by `marks_update` (§2.3) as `SUM(mark.mark_obtained)` per exam; also `Terminal_report::generate_report` writes report metadata via `replace` (`controllers/Terminal_report.php:80-98`).
- `mark` table — `schema.sql:4172-4200`: `test1, group_work, test2, project, sub_total, term_exam, class_score, exam_score, mark_obtained, mark_total, comment, status enum('1','0'), mute, year, term, sem` + sync. `mark_total`/`subject_total` are only used by the verification page fallback (§8).

### 3.2 Positions (the ranking algorithm)

Two identical implementations of a **dense ranking** (1,2,2,3 — ties share a rank, no gap after ties) exist:

1. **Per-subject position**: `Crud_model::get_total_score(exam, class, subject, student, year, term)` — `models/Crud_model.php:593-772`. Loads the student's `mark` row(s) (`data1`) and all students' marks for that subject ordered `mark_obtained DESC` (`data2`, `:605-613` / `:688-696`), then walks the ordered list:
   - `counter++` per row; if `old_score != total_score`: `diff = counter - rank`; `rank = (tracker == diff) ? rank+1 : counter`; else `tracker++` (`:618-637`).
   - Trace on scores `[80,70,70,60]` → ranks `1,2,2,3` (dense ranking, not standard competition ranking).
   - Ordinal suffix: `ST/ND/RD/TH` with `11th/12th/13th` exceptions (`:639-650`).
   - Prints the position only when the row matches the student and the score is non-null (`:653-665`).
   - JHS branch keys on `sem`, others on `term` (`:594-600`, `:681-687`).
2. **Overall position**: `Crud_model::get_aggregate_marks(...)` — `models/Crud_model.php:773-1107`. Same algorithm applied to `aggregation.aggregate_mark` ordered DESC, restricted to exam+class+section+year(+term|sem). Three near-identical branches: `raw_score == 'Yes'` (keys on `sem` param — `:779-841`), JHSS non-raw (`:843-905`), non-JHS (`:907-1107`).

The enterprise `Result_processor` instead assigns **sequential** positions (no ties): `libraries/Result_processor.php:42-56` orders `enterprise_student_marks` by `total_score DESC` and writes `position = 1,2,3…` per subject; overall positions via SQL `SUM/AVG ... ORDER BY overall_total DESC` writing to `terminal_reports` with `out_of = COUNT(students)` (`:58-83`). Wrapped in a transaction (`:13-39`).

### 3.3 Grades & GPA

- **Grade lookup**: `Crud_model::get_grade($mark_obtained)` — `models/Crud_model.php:1108-1123`: reads **all** rows of `grade` (if `terminal_report_style == 'style_1'`) or `grade_2`, returns the first where `mark_from <= mark <= mark_upto`. There is **no seeding** of grade rows in the repo — ranges are school-configured at runtime via `Admin::grade()` (`Admin.php:10378-10618`).
- **Grade tables**: `grade` (`schema.sql:2909-2934`) and `grade_2` (`schema.sql:2938-2963`) are structurally identical: `name` (descriptive), `grade_point` (letter/abbrev), `grade_point_numeric (double, DEFAULT 0)`, `mark_from`, `mark_upto`, `comment`. Which one is authoritative is chosen by the **report-style setting**, not by class level (`Admin.php:10398-10402`, `Crud_model.php:502-512`).
- **GPA points**: `grade_point_numeric` is captured as "gpa" in the grade form (input step 0.1, min 0 max 5 — `views/backend/admin/modal_edit_grade.php:66`; persisted at `Admin.php:10392/10420/10447/10492`). It is consumed only by the cumulative report: `views/backend/admin/cummulative_reports.php:946` adds `grade_point_numeric` per subject to `$totalGpt`; per-term `GPA = totalGpt / subjectRows` (`cummulative_reports.php:1060`); `CGPA = (gpa + previousTermCgpa) / rowsCounter`, but when `rowsCounter > 1` it becomes `(gpa + previousTermCgpa) / 2` (`:1060-1067`) — i.e., a pairwise running average, mathematically inconsistent across 3+ terms (quirk). Started from `$cgpaArray = array(0)` (`:244`).
- **Level naming**: `Crud_model::get_grade_level()` maps letter `grade_point` to "LEVEL n - X" (A→1, P→2, AP→3, D→4, B→5 …) — `models/Crud_model.php:479-501` (KG-style proficiency levels).
- **Raw score grade (JHS/WAEC)**: `raw_score_grade` table (`schema.sql:5232-5258`, same columns as `grade`) managed only when `settings.raw_score == 'Yes'` (`Admin.php:10415-10440`, `10583-10617`); lookup `Crud_model::get_raw_score_grade()` — `models/Crud_model.php:1126-1133`.

### 3.4 JHS/WAEC raw-score aggregate (best-subjects rule)

Raw-score report: `views/backend/admin/student_raw_score_marksheet_print_view.php`:
- **Core 4**: first 4 `mark` rows with `status='1'` (core subjects, unordered — no ORDER BY before `LIMIT 4`, `:128-147`); `sum_core = Σ mark_obtained`.
- **Best 2 electives**: rows with `status='0'` ordered `mark_obtained DESC LIMIT 2` (`:150-172`); each contributes `get_raw_score_grade(...).grade_point` to `total_aggregate` (`:166-171`), plus core subjects contribute their grade points inside the subject loop (`:555-562`).
- `total_aggregate` rendered with red text if `>= 15`, else green (`:977-981`).
- Uses `Crud_model::get_aggregate_marks` for overall position (`:396`).

### 3.5 Enterprise aggregate (Generation B)

`Aggregate_calculator::format_for_report($student_id, $exam_id)` — `libraries/Aggregate_calculator.php:12-52`:
- Loads `enterprise_student_marks` joined to `subject` (ordered by `subject_type`, name).
- `aggregate = round(Σ grade_point / subject_count, 2)` where grade points come from `waec_grading_scale` via `get_grade_point()` (`:54-59`); also counts `core_subjects` vs `elective_subjects` by `subject.subject_type` (`:35-40`).
- Consumed by `Examination::waec_result` (`Examination.php:299`).

---

## 4. KG / Nursery (Creche) & portfolio assessment

### 4.1 Creche descriptive grading

- `grade_creche` — `schema.sql:2967-2989`: **only** `grade_id, full_name, abbrev` — no numeric boundaries at all. CRUD at `Admin::grade_creche()` — `Admin.php:10301-10375` (`create` stores `full_name = ucwords(name)`, `abbrev = strtoupper(grade_point)`).
- Marks entry: bulk dropdown of `grade_creche` rows (`views/backend/admin/marks_manage_view_creche.php:522-528`); stored as the `grade_id` in `mark.test1` (`Admin.php:9786-9794`).
- Creche report card renders each subject's assessment by looking up `grade_creche` by `mark.test1` → prints `abbrev` and legend of `full_name` (`views/backend/admin/student_marksheet_print_view_creche.php:465-511`).
- Aggregation rows for creche students are created **without** aggregate values (conducts/remarks/attendance only) — `Admin.php:8668-8679` (conducts_update) and `:8890-8916` (conducts_update_2 CRECHE insert).
- Dedicated creche screens: on-screen `student_marksheet_creche`, print `student_marksheet_print_view_creche`, bulk `student_marksheet_bulk_print_view_creche`, results sheet `student_results_sheet_print_view_creche` (`Teacher.php:328-476`, `Admin.php:2268-2517`).

### 4.2 Weekly portfolio (strand) assessment — legacy table

- `portfolio_assessment` — `schema.sql:4978-5000` (MyISAM): `assessment_id, exam_id, student_id, class_id, section_id, code (longtext, NOT NULL), subject_id, strand_score (double), week (longtext), timestamp (longtext — unix ts per day), year, term, sem, sync`. One row **per student per day (Mon–Fri)** per week.
- Seeding: `Admin::portfolio_assessment_selector()` — `Admin.php:9561-9769`: explodes the posted week (`Y-m-d-...` format) and inserts 5 rows/student (one per weekday) for JHS (`sem`) or term-based classes; guards on existing rows; requires attendance/enrollment first (`:9613-9617`, `:9693-9697`).
- Grid entry/save: `Admin::portfolio_assessment_update($timestamps, $st_ids, $ass_ids)` — `Admin.php:9988-10163`:
  - Posted IDs are dash-separated lists; validates grid completeness and row order/student/date alignment (`:10002-10059`).
  - Score validation: numeric, `0 ≤ score ≤ 100`, else JSON error (`:10063-10077`); stored `round(score,2)` (`:10083`); batch `update_batch` inside a transaction (`:10089-10090`).
  - **Sync to marks**: computes `percentage_average = round(((Σ strand_score where >0) × 10 / count(distinct days with score>0)) × 0.2, 2)` and writes it to `mark.test1` for the terminal exam (`:10104-10150`). Interpretation: strand scores are recorded out of 10; ×10 → percentage; ×0.2 → 20 % class-score contribution. Skipped (with `mark_sync=0` message) when the `mark` sheet hasn't been seeded yet (`:10092-10103`, `:10159-10162`).
- Graphing: `models/Graphassessment_model.php` — `getPortfolioAssessmentData` (week BETWEEN filters, `:15-52`), `getTotalStrandScore` (SUM, `:54-64`), `getPortfolioAssessmentRow` (distinct scored-day count, `:73-93`), enrollment/subject helpers (`:103-152`), and random hex color generator for Chart.js (`:192-207`). Views: `application/views/backend/admin/assessment_graph/` (`graphsheet.php`, per-student/per-subject variants).

### 4.3 Enterprise portfolio / SBA (Generation C)

- Tables: `portfolio_headers` (`schema.sql:5020-5047`: class/subject/teacher, week_number, strand_topic + strand/sub-strand/indicator FKs, `assessment_date`, `max_score DEFAULT 10.00`, `status ENUM('draft','published','locked')`, soft delete), `portfolio_scores` (`schema.sql:5080-5099`: score + remarks + soft delete), `portfolio_aggregates` (`schema.sql:4958-4976`: `weekly_average`, `term_average`, `total_assessments`, term enum 1-3 / semester enum 1-2), `portfolio_audit_trail` (`schema.sql:5001-5018`), view `portfolio_headers_with_curriculum` (`schema.sql:5048-5078`).
- Controller `Portfolio_enterprise` — `application/controllers/Portfolio_enterprise.php`: bootstraps module classes by `require_once` (`:9-16`); JHS detection via **`class.category == 'JHS'`** (different from legacy's `class.name == 'JHSS'`!) (`:37-47`, `:157-158`); `create_header` defaults `max_score` 10 and `status=draft` (`:61-79`); `save_scores` saves then recomputes term average + SBA sync per student in a transaction (`:81-109`); `batch_sync_sba` (`:151-163`).
- Computation service `Portfolio_computation_service` — `application/modules/AcademicAssessmentEngine/services/Portfolio_computation_service.php`:
  - Weights from `sba_weight_config` keyed by `class_category`+year+term; **defaults when unconfigured: class_test 30 %, project 10 %, exam 60 %, `portfolio_as_class_test = true`** (`:15-40`).
  - `compute_weekly_average = round((Σ score / Σ max_score) × 100, 2)` over published headers for a week (`:45-67`).
  - `compute_term_average` = same formula across the term (published headers only), stored via `replace` into `portfolio_aggregates` (`:72-112`).
  - `sync_to_sba`: `class_test = round(term_average × class_test_weight / 100, 2)`; upserts `sba_components` (auto_filled=1, applied weights snapshot) and logs to `sba_score_sources` with the literal formula string (`:117-211`). `batch_sync_class` iterates enrollment (`:216-229`).
  - A v2 service exists: `modules/AcademicAssessmentEngine/services/Portfolio_computation_service_v2.php`.
- KG/Nursery vs primary/JHS summary: **KG/creche = descriptive-only marks** (`grade_creche`, stored in `mark.test1`) with the weekly portfolio grid as an *additional* activity tracker; **primary/JHS = numeric** 50/50 CA/exam split with optional 20 % portfolio contribution; **enterprise SBA** = configurable 30/10/60 weights.

---

## 5. Report cards

### 5.1 Style selection matrix

Chosen at `Teacher::student_marksheet_print_view` — `Teacher.php:256-322` (admin equivalents `Admin.php:2058-2136`, parent/student mirrored views):

| `settings.raw_score` | `class_name` | `settings.terminal_report_style` | View rendered |
|---|---|---|---|
| Yes | JHSS | any | `backend/teacher/student_raw_score_marksheet_print_view` |
| Yes | other | style_1 | `backend/admin/student_marksheet_print_view` |
| Yes | other | style_2 | `backend/admin/student_marksheet_print_view_2` |
| Yes | other | else | `backend/admin/student_marksheet_print_view_3` |
| No | any | style_1/2/else | same three `student_marksheet_print_view[_2|_3]` |

Bulk variants: `Teacher::student_marksheet_bulk_print_view` — `Teacher.php:2670-2719`; creche always loads `student_marksheet_print_view_creche` (`Teacher.php:373-411`) / bulk (`:414-443`). Year/term are re-resolved **from the exam row** rather than settings (`Teacher.php:263-267`).

### 5.2 Report card content (style_1 as canonical)

`views/backend/admin/student_marksheet_print_view.php` (2264 lines; JHS + term variants in one file):
- Header: school name/location/address from settings (`:10-23`); term ending & next-term-begin from `terms` table (via `getArchivedTermStartsEndsDate`, `helpers/manager_helper.php:182-187`) falling back to settings and finally today's date (`:27-56`).
- JHS: `$no_on_roll` = enrolled count (`:83`); remark row from `aggregation` (`:65-67`).
- **Auto head-teacher remark**: if `aggregation.head_teacher_remarks` empty, `student_percentage = round(aggregation.student_percentage)` → `Head_teacher_remarks_model::find_by_percentage` (`:69-86`).
- Attendance: `days_opened` from `terms.days_opened`; `days_present` = `COUNT(attendance WHERE status IN (1,3))` (1=Present, 3=Late) (`:96-104`).
- Grading legend table rendered from `grade` rows (`:110`, `:492-508`).
- Subject rows: class_score & exam_score columns accumulated into totals (`:541-599`); grade letter (`get_grade().grade_point`) and descriptor (`get_grade().name`) per subject (`:630-645`); per-subject **position** via `get_total_score` (`:655-660`); ~14 hardcoded subject abbreviations (R.M.E → 'R.M.E', Mathematics → 'Maths', Our World → 'O.W.O.P', …) at `:651-680`.
- TOTAL row: class_score_total / exam_score_total / total_marks (`:729-734`).
- Remarks block: **"Class Teacher's Remark"** = `aggregation.remarks`; **"Principal's Remark"** = `aggregation.head_teacher_remarks` (`:861-868`). (Terminology drifts: "Principal" in style_1, "Head Teacher"/"Headmaster" elsewhere; DB column is `head_teacher_remarks`, plus a separate `class_teacher_remarks` column written by `conducts_update_2` — `Admin.php:8852`, `:8968`.)
- On-screen marksheet (`views/backend/admin/student_marksheet.php:618-620` and `:698`) previews the auto remark by computing `student_percentage = total_marks / (subjects_with_marks × 100) × 100` (rounded) — note this differs from the stored-aggregate route in `conducts_update_2` (§5.4) only by construction (same math, different source).

### 5.3 Remarks engines

**a) Head-teacher percentage ranges** (config-driven):
- Table `head_teacher_remarks_ranges` — `schema.sql:3040-3057`: `min_percentage, max_percentage (DECIMAL 5,2), remark_text (255), display_order, is_active`, timestamps.
- Model `Head_teacher_remarks_model` — `models/Head_teacher_remarks_model.php`:
  - `find_by_percentage($p)` — `:111-126`: first **active** range (ordered by `display_order`) where `min ≤ p ≤ max` (inclusive both ends); `null` = gap.
  - `create/update` validation: min ≤ max, 0-100 bounds (`:146-159`, `:232-248`); **overlap rule**: `A.min < B.max AND B.min < A.max` — touching boundaries are NOT overlaps (`check_overlap` `:335-349`, doc `:327-333`).
  - Defaults (5 ranges) — `initialize_defaults()` `:491-531`: 0-50 "Poor performance…", 51-60 "Fair…", 61-70 "Good…", 71-80 "Very good…", 81-100 "Excellent…".
  - 10-minute file cache of active ranges, invalidated on write (`:26-31`, `:538-540`).
- Controller `Head_teacher_remarks` — `application/controllers/Head_teacher_remarks.php`: CRUD + `check_overlap` (`:220-243`) and **`test_percentage`** (`:271-300`) AJAX testers; JSON export/import (`:305-364`); permission-gated via `has_admin_or_permission('head_teacher_remarks', …)` (`:39-52`); admin-facing routes forced via `config/routes.php:123-137` (`admin/head_teacher_remarks/*`).

**b) Persistence of head remarks**: `Admin::conducts_update_2()` — `Admin.php:8826-9037`: after saving class-teacher/creche remarks it loops **every non-creche student** in the school (`crud_model->getAllStudentsIdsExCreche()`), computes `percentage_score = (aggregate_mark × 100) / (total_subjects × 100)` where `total_subjects = COUNT(DISTINCT subject_id in mark for class+exam+year+term)` (`:8932-8950`), resolves the range remark, and writes `aggregation.head_teacher_remarks` (clears it when no range matches, `:8957-8966`). `Admin::conducts_update()` — `:8588-8825` saves teacher remarks, interest (ID or legacy text), conduct IDs into `aggregation.c1..c15`, attendance; head-remark posted value accepted **only when admin session** (`:8646-8654`); `terminal_report_style == 'style_3'` skips conduct validation and clears conducts (`:8614-8616`, `:8714-8726`).

**c) Teacher remark templates**:
- Table `teacher_remarks_templates` — `schema.sql:6473-6490`: `remark_text, display_order, is_active, category (positive/neutral/negative)`.
- Model `Teacher_remarks_templates_model` — `models/Teacher_remarks_templates_model.php`: cached active list w/ category filter (`:73-102`), `get_by_category` grouping (`:126-139`), CRUD (`:147+`).
- Controller `Teacher_remarks_templates` — `application/controllers/Teacher_remarks_templates.php`: same permission pattern (`:38-53`), modal form `modal_teacher_remark_template_form`.

**d) terminal_reports table**: `schema.sql:6512-6535`: `student_id, year, term, attendance_present/total, conduct, attitude, interest, teacher_remark, headmaster_remark, generated_at` + sync. Written by `Terminal_report::generate_report` via `replace` (`Terminal_report.php:80-98`) and by `Result_processor::calculate_overall_positions` (`Result_processor.php:58-83`).

### 5.4 Terminal Report Builder (Generation C UI)

`controllers/Terminal_report.php` (admin-only, `:10-17`):
- `get_student_report` (`:28-75`): per-subject `total_score = COALESCE(portfolio_aggregates.term_average,0) + COALESCE(sba_components.total_sba,0) + COALESCE(exam_marks.total_score,0)` — joins `class_subject` (a **class_subject** table that belongs to the engine schema, not the legacy `subject` table) — divergent from every other consumer.
- `print_report` → `backend/admin/terminal_report_print_enhanced` (`:103-108`); `bulk_print` → `terminal_report_bulk_print` (`:123-132`); builder page `backend/admin/terminal_report_builder.php`.
- `get_student_bill` (`:137-187`): arrears = old invoices − all payments (floored at 0) + current-term invoice.

---

## 6. Online exam subsystem

- Tables: `online_exam` — `schema.sql:4409-4438` (`code`, `title`, class/section/subject ids, `exam_date` int unix ts, `time_start/time_end`, `duration` (seconds, computed), `minimum_percentage`, `instruction`, `status` default `'pending'`, `running_year`, `term`/`sem`); `question_bank` — `schema.sql:5198-5214` (`online_exam_id`, `question_title`, `type`, `number_of_options`, `options` JSON, `correct_answers` JSON, `mark` **varchar**); `online_exam_result` — `schema.sql:4442-4470` (`answer_script` JSON, `obtained_mark`, `status`, `exam_started_timestamp`, `result`).
- Authoring (teacher): `Teacher::manage_online_exam` — `Teacher.php:2451-2505` (create/edit validated for class+section+subject>0; delete by GET); question add flows `:2549-2613` delegate to `Crud_model`:
  - `create_online_exam()` — `models/Crud_model.php:2090-2118`: `code = substr(md5(uniqid(rand()),true),0,7)`; `duration = strtotime(date.' '.time_end) − strtotime(date.' '.time_start)`; JHSS → `sem` else `term`.
  - Question CRUD: multiple choice (options JSON, blank-option guard, `:2149-2204`), true/false (`:2207-2224`), fill-in-the-blanks (comma list lowercased+trimmed JSON, `:2227-2254`); delete `:2255-2260`; status update `manage_online_exam_status` `:2261-2272`.
- Student flow (`application/controllers/Student.php`):
  - List: `available_exams()` — `Crud_model.php:2274-2292` (`status='published'` + year + sem/term + student's class/section).
  - Gate: `take_online_exam` — `Student.php:1513-1555`: **blocks the exam when `invoice.due > 0` for the current year/term** (`:1522-1528`) — fees gate embedded in academics; marks result row `attended` with start timestamp (`Crud_model.php:2294-2310`).
  - Submit: `Student::submit_online_exam` — `Student.php:1558-1605` builds `answer_script` JSON (fill-in-blanks lowercased; MC lowercased JSON array); empty questions recorded with empty answers.
- **Auto-scoring**: `Crud_model::calculate_exam_mark` — `models/Crud_model.php:2329-2368`: `obtained_mark = Σ question.mark` for rows where the submitted-answer string **exactly equals** the `correct_answers` JSON string (`:2348-2352`) — i.e., multi-select MC only scores on a perfect, order-sensitive match (no partial credit, case-sensitive on MC since only fill-ins are lowercased at submit — quirk). Pass/fail: `required = total_mark × minimum_percentage / 100`; `result = 'fail'` if `obtained < required` else `'pass'` (`:2355-2365`). `total_mark = Σ question.mark` (`:2370-2379`).
- Results: teacher `view_online_exam_result` (`Teacher.php:2639-2644` → `backend/teacher/view_online_exam_results.php` workspace); student `online_exam_result` (`Student.php:1496-1511`).
- **Ownership hardening layer**: `controllers/Teacher_online_exam.php` (extends `Teacher`, `:15`): `can_manage_exam` = teacher is class teacher **or** subject teacher for the exam's class/subject (`:66-104`); `can_manage_selection` for create/edit (`:106-135`); POST-only enforcement for delete/status/question-delete (405 w/ `Allow: POST`, `:22-46`); status whitelist `['published','expired']` (`:201-205`); 403 JSON/plain denials (`:48-64`); question mutations resolve the parent exam via `question_exam_id()` (`:137-144`). All sensitive URLs are remapped in `config/routes.php:164-176`.

---

## 7. Lesson notes (GES)

- **Core table** `lesson_notes` — `schema.sql:3888-3926`: `teacher_id, class_id, subject_id, strand_id, sub_strand_id, content_standard_id` (curriculum FKs), `title, description, week_number TINYINT (1-12), term TINYINT (1-3), lesson_date, lesson_objectives, lesson_activities, lesson_content`, file upload fields, `status ENUM('draft','pending','hod_reviewed','revision_requested','approved','declined') DEFAULT 'pending'`, `feedback`, `hod_id/hod_review_date/hod_feedback`, `admin_id/admin_review_date`, `source_lesson_note_id`, `version`, soft delete (`deleted_at`).
- **Child tables** (`schema.sql`): `lesson_note_assessments` (`:3927-3940` method_name/notes/is_custom), `lesson_note_competencies` (`:3941-3952` → core_competencies), `lesson_note_indicators` (`:3953-3964` → curriculum_learning_indicators), `lesson_note_notifications` (`:3965-3982`), `lesson_note_references` (`:3983-4000` author/publisher/year/pages/url/type primary|supplementary), `lesson_note_resources` (`:4001-4015` name/details/quantity/is_custom), `lesson_note_revisions` (`:4016-4034` action create→…→approve/decline/request_revision + JSON changed_fields).
- **Curriculum reference data** created by `database/migrations/ges_lesson_note_system.sql`: `curriculum_strands` (subject-scoped + `class_level`, `:38-52`), `curriculum_sub_strands` (`:55-68`), `curriculum_content_standards` (code e.g. **B4.1.1.1**, `:71-84`), `curriculum_learning_indicators` (code e.g. **B4.1.1.1.1**, `:87-100`), `core_competencies` (`:103-112`), `teaching_resources_master`, `assessment_methods_master`, `hod_subjects`. (Also `database/migrations/create_curriculum_tables_complete.sql`, `create_curriculum_indicators_table.sql`.)
- **GES structure captured per note**: week, period date, strand → sub-strand → content standard (code) → learning indicators (codes), core competencies, objectives, activities, content, TLR resources (with quantity), assessment methods, references. (No explicit "period/remarks" columns — remarks live in `feedback`.)
- **Approval flow** (`models/Lesson_note_model.php`):
  - create: required fields + week 1-12 + term 1-3; default status `pending` (`:48-102`); revision row written (`:93-99`).
  - `submit_for_review`: `draft|revision_requested → pending` (`:356-390`).
  - HOD `endorse_lesson_note`: `pending → hod_reviewed` + admin notification (`:517-547`); HOD `request_revision`: `pending → revision_requested` + `hod_feedback` (`:549+`).
  - Admin `approve_lesson_note`: `pending|hod_reviewed → approved` (+teacher notification, `:403-437`); `decline_lesson_note` requires feedback → `declined` (`:439-475`).
  - Every transition writes `lesson_note_revisions` and (most) `lesson_note_notifications`; update bumps `version` (`:144-159`).
- **Teacher UX**: `Teacher.php` — list `lesson_notes` (`:2896`), progress `:2955`, create `:2991`, edit `:3097`, delete `:3176` (soft), copy `:3217` (sets `source_lesson_note_id`), curriculum cascades `get_curriculum_strands/sub_strands/content_standards/learning_indicators` (`:3259-3335`), save `_save_lesson_note` (`:3336-3402`: `save_action == 'submit'` → `pending` else `draft`; file upload to `uploads/lesson_notes/`, allowed pdf/doc/ppt/xls/images, 10 MB, encrypted name — `:3403-3432`), print `lesson_note_print` (`:3556`).
- **Student/parent visibility**: `Student::lesson_notes` — `Student.php:1625+`; model `get_lesson_notes_by_class` filters `status='approved'` only (`Lesson_note_model.php:278-296`).
- **Templates**: `models/Lesson_note_template_model.php` (get/create/update/delete/duplicate/favorite/tags/stats, `:21-355`) + **two conflicting migrations**: `database/migrations/ges_lesson_note_templates.sql` (keys `teacher_id`; JSON content columns; tags/favorites tables, `:9-100+`) vs `database/migrations/add_lesson_note_templates.sql` (keys `school_id` + `created_by`, references a **`schools`** table and `class.id` that don't exist in this schema, `:1-70`) — only one can run; migration-parity trap. Teacher template UI `Teacher.php:3819-4233` (create/edit/use/duplicate/favorite/apply-to-note).

---

## 8. Report-card verification (public QR route)

- Route: `config/routes.php:55` — `$route['verify/(:any)/(:any)/(:any)'] = 'verify/index/$1/$2/$3'`.
- Controller `application/controllers/Verify.php` — **no login required** (`:4-9`):
  - `index($student_code, $exam_id, $year)` (`:27-135`): 400 if any param empty (`:30-33`); 404 unknown student (`:36-41`) or exam (`:44-49`); class resolved from `enroll` for that year (limit 1, `:52-63`); first section (`:66`).
  - Marks: `mark` joined `subject` filtered by student+exam+year (`:75-82`); `total_marks += mark_obtained`; `total_possible = mark_total || subject_total || fallback 100/subject` (`:85-109`); `percentage = round(total/possible × 100, 2)` (`:111`).
  - "Published" badge when any marks exist, else "Processing" (`views/verify_report.php:314-321`).
- View `application/views/verify_report.php` (435 lines): verification badge ("authentic and issued by …"), student/class/exam info, overall total + avg percentage (green ≥ 50, red < 50, `:349-351`), per-subject `mark_obtained` rendered **with a literal `%` suffix** (`:383`, and the per-subject percentage calc is commented out `:377-387` — mislabeled), print button, "Verification Method: QR Code Scan" (`:419`).
- QR generation: only the **style_3** print views embed a QR whose payload is plain `base_url()."verify/{student_code}/{exam_id}/{year}"` — `views/backend/admin/student_marksheet_print_view_3.php:883`, `student_marksheet_bulk_print_view_3.php:959`, and the teacher/parent/student mirrors (`teacher/...:888/963`, `parent/...:888/963`, `student/...:888/963`). **No signature/HMAC**: payload is fully guessable from a student code.

---

## 9. Tables & columns (exam domain)

| Table | Key columns (non-sync) | schema.sql |
|---|---|---|
| `exam` | exam_id; name; date; year; term; sem; category_id | 2398-2426 |
| `exam_category` | category_id; category_name | 2427-2450 |
| `mark` | mark_id; student_id; subject_id; class_id; section_id; exam_id; test1; group_work; test2; project; sub_total; term_exam; class_score; exam_score; mark_obtained; mark_total; status(1/0); comment; year; term; sem; mute | 4172-4200 |
| `aggregation` | aggregate_id; student_id; class_id; section_id; exam_id; aggregate_mark; raw_score; grand_total; term; year; attitude; conduct; interest; c1…c15; remarks; head_teacher_remarks; class_teacher_remarks; days_opened; days_present; sem | 381-428 |
| `grade` / `grade_2` | grade_id; name; grade_point; grade_point_numeric(double); mark_from; mark_upto; comment | 2909-2934 / 2938-2963 |
| `grade_creche` | grade_id; full_name; abbrev | 2967-2989 |
| `raw_score_grade` | same shape as `grade` | 5232-5258 |
| `portfolio_assessment` (MyISAM) | assessment_id; exam_id; student_id; class_id; section_id; code; subject_id; strand_score; week; timestamp; year; term; sem | 4978-5000 |
| `enterprise_exams` | exam_id; exam_name; exam_type enum(mid_term,end_term,mock,waec); class_id; year; term; start_date; end_date; status enum(draft,active,completed,published); created_by; created_at | 2294-2320 |
| `enterprise_exam_subjects` | id; exam_id; subject_id; total_marks(100); pass_mark(50); weight_percentage(100.00) | 2321-2342 |
| `enterprise_student_marks` | mark_id; exam_id; student_id; subject_id; class_score; exam_score; **total_score GENERATED (class_score+exam_score) STORED**; grade(2); remark(50); position; recorded_by | 2343-2370 |
| `enterprise_terminal_reports` | report_id; student_id; exam_id; class_id; year; term; total_score; average_score; aggregate; position; out_of; attendance; conduct; interest; head_teacher_remarks; status(draft,published) | 2371-2397 |
| `terminal_reports` | report_id; student_id; year; term; attendance_present/total; conduct; attitude; interest; teacher_remark; headmaster_remark | 6512-6535 |
| `online_exam` | online_exam_id; code; title; class_id; section_id; subject_id; exam_date(int); time_start; time_end; duration(sec); minimum_percentage; instruction; status; running_year; term; sem | 4409-4438 |
| `question_bank` | question_bank_id; online_exam_id; question_title; type; number_of_options; options(JSON); correct_answers(JSON); mark(varchar) | 5198-5214 |
| `online_exam_result` | online_exam_result_id; online_exam_id; student_id; answer_script; obtained_mark; status; exam_started_timestamp; result | 4442-4470 |
| `head_teacher_remarks_ranges` | id; min_percentage; max_percentage; remark_text(255); display_order; is_active | 3040-3057 |
| `teacher_remarks_templates` | id; remark_text; display_order; is_active; category(positive/neutral/negative) | 6473-6490 |
| `lesson_notes` (+7 child tables) | see §7 | 3888-4034 |
| `portfolio_headers` / `portfolio_scores` / `portfolio_aggregates` / `portfolio_audit_trail` | see §4.3 | 5020-5047 / 5080-5099 / 4958-4976 / 5001-5018 |
| `result_approval_status` / `result_approval_audit` | id; class_id; academic_year; term; status enum(draft,submitted,approved,locked); submitted/approved/locked by+at; notes / audit rows | 5425-5447 / 5406-5423 |
| `waec_grading_scale` (created at runtime, not in dump) | id; grade(2); min_score; max_score; grade_point(3,2); remark(50); is_pass | Setup_examination.php:53-61 |

---

## 10. Legacy quirks to retire

1. **Three competing exam schemas** (legacy `exam`/`mark` vs `enterprise_*` vs engine tables). `Examination::create_exam` even targets the wrong table (`Examination.php:56-75` + `Examination_model.php:16-19`).
2. **Class-level discrimination by magic names**: `'JHSS'` and `'CRECHE'` string compares scattered across ~30 sites (`Admin.php:9212/9413`, `Crud_model.php:594`, `Teacher.php:954`, …); the engine instead uses `class.category == 'JHS'` (`Portfolio_enterprise.php:41`) — two different discriminators for the same concept.
3. **Settings-driven report style & grade table**: `terminal_report_style` picks both the layout *and* whether `grade` or `grade_2` is authoritative (`Admin.php:10398-10402`); `raw_score` is a single global toggle, not per-class/per-level.
4. **Client-side-only marks validation** (`marks_manage_view.php:648-680`); server accepts any float (`Admin.php:9845-9858`).
5. **`marks_selector` unbracketed OR** leaks exams from other years into listings (`Admin.php:8110-8112`, `Crud_model.php:388-398`).
6. **Enrollment mutation side-effect**: selector sets `enroll.status='close'` for whole cohorts on every run (`Admin.php:9243-9244` etc.).
7. **"to be deleted" aggregate-correction block** re-sums and overwrites aggregates across *all* years/terms of a student (`Admin.php:9941-9971`, `Teacher.php:895-923`).
8. **Dense-ranking position algorithm copy-pasted 3×** in `get_total_score` and `get_aggregate_marks` (`Crud_model.php:593-1107`) — O(n²) nested loops executed per report row; tie semantics (1,2,2,3) must be preserved or consciously changed.
9. **Hardcoded subject abbreviations duplicated** in SMS (`Admin.php:8211-8230`) and each marksheet view (`student_marksheet_print_view.php:651-680`).
10. **Dead/orphan code**: `Examination_add_subjects_method.txt`, `Teacher_marks_selector_creche.php` (duplicate `class Teacher` — fatal if autoloaded), commented portfolio-sync blocks (`Admin.php:9317-9371`, `:9491-9545`).
11. **Runtime DDL in controllers**: `Setup_examination::create_tables` creates tables + seeds WAEC grades from an HTTP route (`Setup_examination.php:6-81`).
12. **Two conflicting lesson-template migrations** (`ges_lesson_note_templates.sql` vs `add_lesson_note_templates.sql` — the latter references non-existent `schools`/`class.id`).
13. **CGPA math inconsistency** (`cummulative_reports.php:1060-1067`): `/rowsCounter` for the first term, `/2` afterwards.
14. **Verification QR unsigned & guessable** (`Verify.php:27-135`; payload built at `student_marksheet_print_view_3.php:883`); per-subject value mislabeled as `%` (`verify_report.php:383`).
15. **Online exam scoring is exact-string JSON equality** — no partial credit, case-sensitive MC answers (`Crud_model.php:2346-2352`); `code` is a 7-char md5 slice (`:2091`); exam taking is gated on fee arrears (`Student.php:1522-1528`).
16. **`mark.status` doubles as subject publish flag** copied from `subject.status` (`Admin.php:9246-9253`); no real edit-locking in the legacy path (approval workflow exists only in the unwired engine service, §2.5).
17. **Creche subject-status lookup inconsistency** in `Teacher::marks_selector_creche` — first branch uses `subject_creche`, second uses `subject` (`Teacher.php:2840` vs `:2868`).
18. **Raw-score core-4 selection unordered** (`LIMIT 4` without ORDER BY, `student_raw_score_marksheet_print_view.php:128-147`) — arbitrary core subset.

---

## 11. VERIFIED LEGACY BEHAVIOR vs RECOMMENDATION

| # | Verified legacy behavior (evidence) | Recommendation for iEduPro |
|---|---|---|
| 1 | Marks split: CA components 20+10+20+10=60 → `class_score = sub_total×50/60`; `exam_score = term_exam/2`; total = CA50+Exam50 (`marks_manage_view.php:579-645`, `:648-680`) | Make weights configurable per level/tenant (50/50 default), compute server-side; keep 60→50 and 100→50 scaling as data-driven formulas |
| 2 | Grade ranges live in DB (`grade`/`grade_2`/`raw_score_grade`) with inclusive `mark_from..mark_upto`, first match wins (`Crud_model.php:1108-1133`) | One `grading_scales` table per level (KG/Primary/JHS-WAEC) per tenant; ranges checked for full coverage & overlaps at save time |
| 3 | WAEC seed A1 80-100 … F9 0-39, points 1-9 (`Setup_examination.php:63-78`) | Adopt as the default JHS/WAEC scale template |
| 4 | KG/creche: descriptive scale only (`grade_creche.full_name/abbrev`), stored as `mark.test1` grade_id (`Admin.php:9773-9807`, view `:522-528`) | Native "descriptive assessment" type on assessments (no numeric coercion); keep grade-id reference integrity |
| 5 | Positions: dense ranking with ST/ND/RD/TH + 11-13 exceptions, per subject and overall (`Crud_model.php:593-1107`) | Preserve dense-ranking semantics by default (schools expect 1,2,2,3); make tie policy a setting; compute in one service |
| 6 | Overall aggregate = Σ subject totals; % = Σ/(subjects×100) (`conducts_update_2` `Admin.php:8932-8950`) | Store computed percentage alongside aggregate; single source of truth |
| 7 | Head-teacher remarks: % ranges with overlap guard (inclusive bounds, touching allowed), auto-assign + admin tester endpoints (`Head_teacher_remarks_model.php:111-126,335-349`; `Head_teacher_remarks.php:220-300`) | Port as configurable range table incl. `check_overlap` + `test_percentage` UX; seed the same 5 default ranges |
| 8 | Teacher remark templates with categories positive/neutral/negative (`teacher_remarks_templates`, model `:49-139`) | Port as remark library; allow per-class-teacher personalization |
| 9 | Class-teacher remark in `aggregation.remarks`, head remark `aggregation.head_teacher_remarks`, conduct items `c1..c15`, attitude/interest columns (`schema.sql:381-428`; `Admin.php:8588-8825`) | Normalize into `report_card_remarks` (role, text, source: manual/template/auto) instead of 15 conduct columns |
| 10 | Result approval workflow draft→submitted→approved→locked exists only in engine service (`Result_approval_service.php:44-153`) | Promote to first-class feature gating ALL marks edits; legacy has none |
| 11 | Portfolio: Mon-Fri weekly rows, strand_score out of 10, sync `test1 = ((Σ×10)/days)×0.2` (`Admin.php:9561-9769`, `:9988-10163`) | Replace with the engine model (headers/scores/aggregates, max_score, published-only) and configurable SBA weights (default 30/10/60, `Portfolio_computation_service.php:15-40`) |
| 12 | Online exams: 3 question types, timed window, min-% pass, exact-match auto-scoring, fee-gated access (`Crud_model.php:2090-2403`, `Student.php:1513-1605`) | Rebuild with partial credit for multi-select, server-side timing, per-question marks as decimal, decouple from fee arrears (or make it a tenant policy), signed exam codes |
| 13 | Public QR verification `verify/{code}/{exam}/{year}` unsigned (`Verify.php`, `routes.php:55`) | Sign payloads (HMAC + expiry), show subject percentages correctly, add nonce/audit |
| 14 | Lesson notes: GES strand→sub-strand→content-standard→indicator chain, week 1-12, HOD endorse → admin approve/decline with revisions+notifications (`Lesson_note_model.php:48-560`) | Keep the GES structure & workflow; drop the duplicate template migration; multi-tenant curriculum library |
| 15 | SMS results push with hardcoded abbreviations (`Admin.php:8121-8230`) | Template-driven messaging; abbreviations as data |
| 16 | Exam delete hard-deletes marks+aggregation (`Admin.php:8076-8105`) | Soft-delete/archive with restore window |

---

## 12. Test coverage (tests/)

Exam-domain tests are **static contract tests** (Node `node:test` reading source files, no runtime DB):

| Test file | Asserts | Key source |
|---|---|---|
| `tests/teacher-online-exam-command-center.test.js` (52 ln) | manage view keeps create workflow, builds `$visible_exams`/`$exam_counts` before render (no inline `->row()->` derefs), KPI grid, legacy routes intact, `html_escape` on labels, mobile CSS | `views/backend/teacher/manage_online_exam.php` |
| `tests/teacher-online-exam-form-workflow.test.js` (50 ln) | add/edit forms use `teacher_class_options` (not `$classes_`), safe section rows, shell/grid CSS, preserve fields class/section/subject/exam_date/time_start/time_end/minimum_percentage/instruction, min-% number input min 0 max 100, escaped labels | `add_online_exam.php`, `edit_online_exam.php` |
| `tests/teacher-online-exam-mutation-safety.test.js` (53 ln) | `require_post` + 405/Allow header; status & delete & question-delete require POST then ownership then `parent::`; forms are CSRF `form_open` POSTs (no `confirm_modal` GET links) while keeping confirm UX | `Teacher_online_exam.php`, `manage_online_exam.php`, `manage_online_exam_question.php` |
| `tests/teacher-online-exam-ownership-boundary.test.js` (81 ln) | controller extends legacy `Teacher`; `can_manage_exam` fails closed on class/subject/section teacher match; create/edit/delete validate; status whitelist published/expired; question mutations derive exam via `question_exam_id`; all 8 sensitive routes remapped to `teacher_online_exam`; explicit 403 | `Teacher_online_exam.php`, `config/routes.php` |
| `tests/teacher-online-exam-results-workspace.test.js` (37 ln) | results workspace KPIs (enrolled/attempted/passed/absent/average), single `online_exam_result` query mapped by student, export table + status classes, a11y + responsive | `view_online_exam_results.php` |
| `tests/shared-report-ownership.test.js` | parent/student allowlists **exclude** class-wide `tabulation_sheet`; tabulation views retired for those roles; record scope binds student/parent sessions to their own students incl. marksheet & results-sheet routes | `Admin.php:104-217` |

**Coverage gaps**: no tests for marks entry/update math, ranking, grade lookup, remarks ranges, portfolio sync, verification route, or lesson notes. The only PHP behavior test in the suite (`sync_device_lifecycle_behavior_test.php`) is sync-domain, not exam-domain.

---

## Appendix A — Where each report artifact lives

| Artifact | Controller | View |
|---|---|---|
| On-screen marksheet (student) | `Admin::student_marksheet` `Admin.php:1670`; `Teacher::student_marksheet` `Teacher.php:204` | `backend/{admin,teacher}/student_marksheet.php` (1839 ln) |
| Print marksheet style 1/2/3 | `Admin.php:2058-2136`; `Teacher.php:256-322` | `backend/admin/student_marksheet_print_view{,_2,_3}.php` (2264/1738/903 ln) |
| Raw-score marksheet (JHS) | same switch | `backend/admin/student_raw_score_marksheet_print_view.php` (1104 ln) |
| Creche marksheet | `Admin.php:2268-2517`; `Teacher.php:328-476` | `student_marksheet_print_view_creche.php` (1385 ln) |
| Bulk print | `Admin.php:2137-2202` (+creche `:2425`); `Teacher.php:2670-2719`, `:414-443` | `student_marksheet_bulk_print_view{,_2,_3}.php`, `..._creche*.php` |
| Results sheet | `Admin::student_results_sheet*` `Admin.php:1804-2517` | `student_results_sheet*.php` |
| Tabulation | `Admin.php:10204-10300` | `tabulation_sheet*.php`, `tabulation_sheet_raw_score*.php` |
| Cumulative (GPA/CGPA) | `Admin.php:26693-26708` | `cummulative_reports.php` (1182 ln), `cummulative_reports_bulk.php` |
| Terminal report builder | `Terminal_report.php` | `terminal_report_builder.php`, `terminal_report_print_enhanced.php`, `terminal_report_bulk_print.php` |
| Verification | `Verify.php` | `application/views/verify_report.php` |

*Report generated by Explore-exams agent, Task 3-d.*
