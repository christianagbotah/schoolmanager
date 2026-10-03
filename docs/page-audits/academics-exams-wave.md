# Academics & Exams Wave — Modernization Report

**Wave:** Academics & exams UI/UX modernization (full functional parity)
**Baseline:** `a54bf2f` (attendance wave close)
**Head:** `b344cc1` (8 view commits) + this report
**Date:** 2026-10-03
**Method:** Audit-first, presentation-only changes, machine-verified
equivalence per file, one logical family per commit, each commit pushed →
CI green → Deployment Handoff green → VPS pull-deployer → live health
(`/` and `/login` HTTP 200 verified after every family).

## 1. Scope and sequence coverage

Routed surface resolved from controllers (`page_name` assignments in
Admin/Teacher/Student/Parents + the dedicated Examination, Academic_control,
Setup_examination, Head_teacher_remarks, Teacher_remarks_templates,
Teacher_completion, Teacher_marks_selector_creche, Portfolio_enterprise and
Terminal_report controllers) and the `include_main.php` `examination/`
prefix mapping. Role variants share `page_name` via the
`$account_type/` directory mechanism.

| # | Family | Files | Commit |
|---|---|---|---|
| 1 | academic config / master data (subjects, class, creche subjects) | 5 views | `2f76af4` |
| 2 | grading configuration (grade, grade_creche, raw_score_grade + 3 modals) | 6 views | `62575d2` |
| 3 | exam setup + examination module screens | 5 views | `133383e` |
| 4 | marks entry (creche sheet) — high-risk, minimal scope | 1 view | `474e29e` |
| 5 | result/report screens + tabulation CSS blocks | 6 views | `9373eac` |
| 6 | portfolio / SBA / exam analytics | 3 views | `ae0431c` |
| 7 | promotion & remarks (both roles) | 5 views | `a3ddaf6` |
| 8 | curriculum master data, remarks modals, bulk teacher-assignment | 7 views | `b344cc1` |

## 2. Change totals

- **38 view files** touched across 8 commits (all additive or
  byte-replacement-only changes).
- **136 gradient sites** flattened to solid family tokens (darker-end
  convention; light translucent washes keep their light end; school
  theme_color-derived `var(--theme-dark)` sites keep the PHP color
  derivation).
- **4 scoped family CSS blocks** prepended (subject_creche admin+teacher,
  tabulation_sheet + tabulation_sheet_raw_score) — every byte after each
  block identical to the previous version; line-ending style (CRLF/LF)
  preserved per file.

## 3. Preserved contracts (verification method)

Every changed file passed `scripts/verify_equivalence.py`: PHP segments
multiset-identical, element contracts (`id`/`name`/`onclick`/`onchange`/
`oninput`/`for`, JS `function` names, `site_url()`/`base_url()` routes)
identical, brace balance/BOM/line endings preserved, plus PHP 8.3 lint.

Explicitly audited and untouched (no calculation changes anywhere):
raw marks, continuous assessment, exam scores, totals, percentages, GPA,
grades, remarks, class averages, rankings/positions, promotion rules,
subject weighting, KG/Nursery (creche) grading, JHS/WAEC (raw-score)
scoring, academic year/term/semester relationships, teacher/class/subject
permissions, result approval/release state, parent/student visibility,
AJAX contracts, exports, sync fields.

High-risk marks-entry family (4) was deliberately minimal: 7 pure-CSS
background swaps only; score inputs (mark_id-keyed POST names), max
bounds, `update_sub_total()`/`bulkAssessment()` handlers and both form
actions (`admin/marks_selector_creche`,
`admin/marks_update_creche/...`) byte-identical.

## 4. Deferred (print-output sub-wave)

All `*_print_view*`, `*_bulk_print*` files, `terminal_report_print*`,
`terminal_report_print_enhanced`, `terminal_report_bulk_print`,
`terminal_bill_print`, `waec_result.php` (screen + PDF download path),
`online_exam_questions_print_view`, `class_routine_print_view`,
`tabulation_sheet_print_view*`. None were modified.

## 5. Remaining follow-up mini-family (routed, deferred for whitelist review)

`teacher/manage_online_exam.php` (5 sites), `teacher/class_routine.php`
(1), `teacher/class_routine_view.php` (5): Tailwind gradient classes sit
**inside PHP ternary class switches** (exam active/expired status chips,
`$day_colors[$day]` day chips, `$is_my_subject` ownership chips), so
flattening them requires editing strings inside `<?php echo ...?>`
segments — allowed only with explicit per-site whitelisting, not mixed
into bulk UI commits.

## 6. Orphan candidates (zero controller references; owner-verify before removal)

`admin/`: `marks2.php`, `subject_backup.php`, `subject_redesigned.php`,
`student_marksheet.php.broken_backup`, `grade_enterprise.php`,
`exam_marks_offline.php`, non-`_modern` curriculum variants
(`curriculum_strands.php`, `curriculum_sub_strands.php`,
`curriculum_content_standards.php` — only `_modern` variants are routed).
`teacher/`: `marks_manage_modern.php`, `student_marksheet_modern.php`.
`student/`: `student_marksheet_modern.php`.

## 7. Skipped-as-coherent (audited, no changes needed)

`class.php`, `hod_subject_assignments.php`, `academic_control_dashboard.php`,
`marks_manage.php` + `marks_manage_view.php` (admin/teacher),
`marks_manage_view_creche2.php` (admin/teacher),
`teacher/marks_manage_view_creche.php`, `marks_get_subject.php`,
`marks_get_subject_creche.php`, all online-exam question editor views
(add/edit/manage/update/results, question-type forms),
`student_promotion*.php` (family-styled in earlier waves), all role
`marks.php` screens and result sheets/marksheets (legacy shell-styled,
gradient-free, dense chart layouts left to the shell).

## 8. Technical debt and pre-existing issues (documented, deliberately not changed)

- `Admin::tabulation_sheet()` auth check is commented out (any logged-in
  role hitting the URL renders their role-directory variant) — owner
  attention recommended; no behavior change made.
- Per-row DB lookups (classic N+1) in tabulation/result sheet views —
  performance debt, out of scope for presentation-only commits.
- `subject_creche` role variants: teacher copy duplicates admin copy
  (drift risk if edited independently).
- Role-directory `tabulation_sheet*.php` variants (teacher/student/parent)
  are reachable only via the shared `admin/tabulation_sheet` URL.

## 9. Deployment verification per family

Push → CI `success` → Deployment Handoff `success` → VPS pull-deployer →
`/` and `/login` HTTP 200 confirmed after each of the 8 families
(timestamped 12:16–12:55 UTC window). No force-pushes; every push was a
clean fast-forward. Exact VPS SHA confirmable by the owner in
`/home/lightworld/deployments/schoolmanager/last_manifest.txt`.
