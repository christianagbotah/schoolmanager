# UI Modernization Inventory — SchoolManager CI3

Wave 0 baseline. Generated 2026-10-03 from `main` @ `249ff7a`.
Authoritative companion: `docs/ZAI_MODERNIZATION_PROMPT.md`.

This is the living inventory required by the implementation brief. Every routed user-facing
view is classified by module, controller, and role. Status column is updated as waves complete.

---

## 1. Application architecture (how pages render)

| Layer | File(s) | Notes |
|---|---|---|
| Entry | `index.php` | CI3 front controller |
| Default route | `login` | `routes.php` |
| Master shell | `application/views/backend/main.php` | Loads settings from DB (system_name, skin_colour, running year/term/sem), includes `css.php`, `includes_top.php`, `{role}/navigation.php`, `header.php`, `include_main.php`, `modal.php`, `includes_bottom.php` |
| Page dispatcher | `application/views/backend/include_main.php` | Includes `{account_type}/{page_name}.php`; `attendance/` and `examination/` prefixes map to those subdirectories. **Contains per-teacher DB queries (legacy, preserved)** |
| Header/topbar | `views/backend/header.php` (2,110 lines) | Inline CSS/JS; login guard; settings lookups; notification bell; session/term context |
| Navigation | `{role}/navigation.php` per role | admin (1,481 lines), teacher (incl. `navigation_modern.php`), student, parent, hod, librarian, `navigation_cashier.php` |
| Flash messages | `includes_bottom.php` → toastr from `flash_message` / `error_message` session keys | **Contract: must keep these keys** |
| Modals | `views/backend/modal.php`, `em_modal.php`, `views/backend/modal/` (10 partials) | Bootstrap 3 modals; jQuery `$.fn.modal` monkey-patched for error resistance |
| Print views | many `*_print_view.php`, `*_print.php` | Must remain untouched by shell changes |

### Page loading contract (must not change)
Controllers set `$page_data['page_name']` then `$this->load->view('backend/main', $page_data)`.
`main.php` derives `$account_type` from `session->userdata('login_type')` and includes the role
navigation; `include_main.php` includes the page body by name. **No route, method, or posted-field
changes are permitted during UI modernization.**

---

## 2. Scale of the system

| Metric | Count |
|---|---|
| Controllers (routed, excluding backups/junk) | ~93 |
| Models | 61 |
| Views (`views/backend`) | 1,039 |
| Views (`views/frontend`) | 18 (public site: home/about/contact/gallery/notices) |
| Views (`views/install`) | 11 (setup wizard) |
| Views (`views/email_templates`) | 4 |
| Views (`views/errors`) | 10 |
| Distinct `page_name` assignments (in-portal pages) | 399 |
| Role shells | admin, teacher, student, parent, hod, librarian, accountant, cashier, employee, conductor, examination, attendance, modal |
| DB tables (authoritative schema 2026-10-02) | 282 |

## 3. Shared shell assets (Wave 1 surface)

| Asset | Location | Framework | Notes |
|---|---|---|---|
| Bootstrap 3 | `optimum/bootstrap/dist/css/bootstrap.css` | Bootstrap (neon theme on top) | Base styling for nearly all views |
| Neon theme | `assets/css/neon-core.css`, `neon-theme.css`, `neon-forms.css` | Legacy | Sidebar/page-container/menu classes |
| Tailwind CSS | `assets/tailwindcss/output.css` + runtime `tailwindcss.js` | Tailwind 3.4 | Already used in newer pages; runtime script disabled on `fee_collection_portal` |
| Flowbite | `node_modules/flowbite/dist/*` | 2.5 | CSS loaded; JS **disabled** due to Bootstrap modal conflict |
| jQuery | 3.4.1 | — | `$.fn.select2`, `$.fn.modal`, `$.fn.dataTable` initializers in shell |
| DataTables | CDN builds + export buttons | — | `#table_export` global init; `datatables-layout-fix.css` |
| Select2 | v3.5.2 | — | `select.select2` global init with classic theme |
| Toastr | local | — | flash messages |
| SweetAlert2 | local | — | `showCustomConfirm()` |
| Charts | AmCharts (conditional), Chart.js 3.9.1 | — | AmCharts only on chart pages |
| Fonts | Open Sans, Orbitron, FontAwesome 6.7.2, Entypo | — | Orbitron used for branding |
| Skeleton loader | inline in `main.php` | — | Fades on window load |
| Offline/service worker | `assets/js/service-worker.js` (28 lines), offline-db/offline-sync/offline-crud/sync-manager JS | — | Fragmented; see `docs/sync-gap-analysis.md` |

### Known shell-level quirks to preserve or carefully handle
- `main.php` hardcodes `sidebar-collapsed` for ~25 high-density pages and `admin_level < 4` dashboards.
- `include_main.php` repeats CSS links (duplicate `<link>` set inside body — browser tolerates; consolidate later only with visual regression check).
- jQuery-UI is disabled to protect Bootstrap modals; `selectboxit` disabled likewise.
- `header.php` clears `flash_message`/`error_message` session data on load — **order matters**: page content must read flashdata before header inclusion if it renders inline messages.
- `nav` active-state logic is duplicated between PHP conditionals and `includes_bottom.php` JS.

## 4. Page inventory by module (399 pages)

> Format: `Controller/page_name` — role shell resolved at runtime by `login_type`.

### Dashboard (23)
Admin/dashboard, Admin/cashier_dashboard_admin, Admin/expenditure_dashboard, Admin/income_dashboard,
Admin/payroll_dashboard, Accountant/dashboard, Accounts/accounts/dashboard, Attendance_enterprise/attendance/dashboard,
Academic_control/academic_control_dashboard, Bus_conductor/conductor_dashboard, Cashier/cashier_dashboard,
Examination/examination/dashboard, Financial_integration/financial_dashboard_unified, Hod/dashboard,
Inventory/inventory/dashboard, Librarian/dashboard, Parents/dashboard, Portfolio_enterprise/portfolio_assessment/dashboard,
Student/dashboard, Sync_server/sync_dashboard, Teacher/dashboard, Teacher_completion/teacher_completion_dashboard,
admin_sync_methods/sync_dashboard

### Students & Admissions (51)
Admin/student_add, student_bulk_add, all_students, student_information, student_information_print,
student_ledger, student_marksheet (+_2, _creche, _print, bulk print variants), student_credits,
promotion_status_checker, bulk_student_id, muted_students, alumni, assign_student_discount,
boarding/student_assignment, Accountant/student_payment, plus student/parent profile & document pages.

### Fees & Finance (52)
Admin/invoice(s) (+edit, summary, all_invoices), fee_collection (+portal under Fee_collection controller),
fee_structure, fee_collection_settings/permissions, daily_fee_rates, apply_discount,
discount_management/profiles/approvals/assignments/reports (+amount reports), cashier dashboards/summaries,
handover reports, classes_feeding_trs_fees, expenditure_reports, payment_settings,
receipt_invoice_modification_requests, Accounts/accounts/* (chart of accounts, bank accounts,
reconciliation, budgets, journal entries, fiscal year, reports, audit trail, dashboard),
Bank_reconciliation/bank_reconciliation, Budget_management/budget_management,
Cashier/daily_fee_collection + daily_fee_rates + discount_profiles,
Fee_collection/fee_collection_portal + statistics + conductor_collection_portal,
Discount/*, Discount_modification/*, Sync_daily_fees/daily_fee_sync_status,
Teacher/daily_payment_report, Parents/invoice, Student/invoice,
Payment_gateway/payment_gateway/pay_invoice + transactions.

### Exams & Academics (67)
Admin/exam, grade, grade_creche, raw_score_grade, marks_manage (+_view, _view_creche, _view_creche2),
exam_marks_sms, exam_reports, search_result, tabulation_sheet, tabulation_sheet_raw_score,
portfolio_assessment_manage (+_view), online exam family (add/manage/edit/question/results),
curriculum family (strands/sub_strands/content_standards/learning_indicators/import — modern variants),
lesson-note family (pending/compliance/review/notifications), academic_syllabus,
Examination/examination/{analytics,broadsheet,record_marks,setup_exam},
Portfolio_enterprise/portfolio_assessment/{manage,sba_management},
Hod/lesson_note_*, Teacher/lesson_note_*, Student/{online_exam*,lesson_notes,lesson_note_view},
Teacher/{marks pages via teacher controller}, Parents/marks (+raw_score).

### Attendance (18)
Admin/manage_attendance (+_view), attendance_report (+_view), barcode_scanner_attendance,
transport_attendance, Attendance_daily_fees/attendance_register_with_fees,
Attendance_enterprise/attendance/{mark_attendance,barcode_scanner},
Bus_conductor/bus_attendance_report, Teacher/manage_attendance (+_view),
Teacher/attendance_report (+_view), Parents/attendance_report (+_view),
Student/{manage_attendance,attendance_report_view}.

### Transport (13)
Admin/transport, transport_enhanced, transport_fare_report, transport_reports,
assign_transport, morning_transport_collection, Transport/{transport_management,
morning_transport_collection_enhanced}, Fee_collection/conductor_collection_portal,
Loading/transporter_claim, Parents/transport, Student/transport, Teacher/transport.

### Library (5), Inventory & POS (10), Hostel & Boarding (7)
Admin/book + role variants; Inventory/inventory/{products,categories,pos,sales,returns,
return_details,purchase_orders,suppliers,stock_movements,reports}; boarding family
(boarding_house, dormitory, dormitory_bed, reports, student_assignment), Admin/dormitory + role variants.

### HR/Payroll (5), Teachers & Staff (10)
Admin/payroll_system, payroll_register, payroll_approvals, payroll_statutory_settings,
department_payroll; Admin/teacher, teacher_attendance_privileges, non_teaching_staff_list,
Head_teacher_remarks/*, Teacher_remarks_templates/*, role variants of teacher pages.

### Academic Setup (19)
Admin/class, section, subject, subject_creche, class_routine_view/add,
hod_subject_assignments, terminal_bills_selection, Terminal_report/terminal_report_builder,
role variants (Parents/Student/Teacher class routine & subject pages), Home/terms_conditions.

### Sync Administration (11)
Sync_server/sync_dashboard + sync_settings, Sync_setup/sync_setup, Sync_config/sync_config,
Sync_audit/{sync_audit_list,sync_audit_detail}, Sync_conflicts/{sync_conflict_list,
sync_conflict_detail,sync_conflict_merge}, Sync_locations/{sync_locations,sync_location_view,sync_location_edit}.

### System & Settings (10), Reports & Audit (10)
Admin/admin_list, system_settings_modern, theme_settings, alert_settings,
permission_settings, User_permissions/* (4), Teacher/backup_restore;
Admin/{audit_log_viewer,audit_trail,aging_report,financial_reports,statutory_reports},
Advanced_reports/advanced_reports, Cashier/daily_collection_report, Conductor/daily_log,
Loading/{printFuelUsageReport,printSalesReport}.

### Communications, Visitors, Frontend, Install & misc (remaining)
Noticeboard/message/group_message per role; Sms_automation; Approval_requests;
Locations/{locations_list,locations_form}; Admin/frontend_pages/frontend_themes,
manage_language, drive_list_page, cron_setup, tracker, test_gra_paye; Home/* public pages
(about/contact/event/gallery/gallery_view/home/privacy_policy/teacher/terms_conditions);
Install/step0–4 + finalizing_setup + success; Login flow (views/backend/login.php,
forgot_password.php, authentication_key_verification.php, account_blocked.php, etc.);
Miscellaneous operational pages (Alerts, benefits, reconciliation, debtors, print views).

## 5. Modernization status tracker

| Module | Wave | Status |
|---|---|---|
| Design system (tokens/components) | 0 | planned |
| Login/forgot/auth screens | 1 | planned |
| Global shell (header/sidebar/footer) | 1 | planned |
| Academic setup | 2 | planned |
| People & admissions | 3 | planned |
| Attendance & daily ops | 4 | planned |
| Fees/finance/cashier | 5 | planned |
| Academics/exams | 6 | planned |
| Operations (library/inventory/hostel/transport) | 7 | planned |
| Reports & audit | 8 | planned |
| Sync UX | 9 | planned |

## 6. Priorities (risk × visibility)

1. **Wave 1 shell** — every page inherits it; must be deployed first and verified on all roles.
2. **Dashboards** (23) — highest visibility, most fragile (charts, conditional assets).
3. **Fees & Finance** (52) — highest business risk; requires strict query-equivalence proof.
4. **Attendance** (18) — sync-critical; UI must not alter posting semantics.
5. **Exams/marks** (67) — many print views; print output must remain identical.
6. Remaining modules follow wave order.

## 7. Inventory maintenance rule

Update §5 status after each page/workflow conversion (commit message convention:
`refactor(ui): <page> — modernize without behavior changes`).
