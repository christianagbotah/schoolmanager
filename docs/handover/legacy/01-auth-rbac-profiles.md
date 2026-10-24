# Legacy Audit 01 — Authentication, RBAC, Profiles & Session Security

**Repository:** `schoolmanager` (CodeIgniter 3.x) · **Branch:** `zai/full-platform-reconciliation-20261024` · **Audit date:** 2026-10-24
**Agent:** Explore-auth (Task 3-a) · **Purpose:** authoritative parity-matrix input for the iEduPro multi-tenant SaaS migration.
**Audience:** migration architects. Every claim carries a `file:line` citation. Labels: **[VERIFIED LEGACY BEHAVIOR]** (how it works today, evidenced) and **[RECOMMENDATION]** (what iEduPro should do).

All paths are relative to the repo root unless prefixed `application/`. Line numbers refer to the branch HEAD (`ff96b2e`).

---

## 1. Overview

The legacy app is a **single-tenant, single-database CodeIgniter 3 application** with a **"one table per role" identity model**: `admin`, `teacher`, `student`, `parent`, `accountant`, `librarian` each hold their own credentials (`email`, `password`, `authentication_key`, `block_limit`, `active_status`), and each role has its own controller and dashboard. There is **no unified `users` table** — the `Login_model` referencing a `users` table is dead autoloaded code (`application/models/Login_model.php:10-73`; the `users` table does not exist in `schema/schoolmanager_schema_redacted.sql`).

Authorization is layered across **four generations** that all coexist:

1. **Coarse role routing** — one controller per role, gated by a dedicated session flag (`teacher_login`, `parent_login`, …) checked in each controller constructor.
2. **Admin level tiers** — `admin.level` 1–5 (Super Administrator, Administrator, Accountant, Cashier, Conductor) stored in the same `admin` table (`application/controllers/Admin.php:5330-5353`), used for navigation and daily-fee collection privileges.
3. **Role-based permission toggles** — legacy `user_permission` table with free-text `permission_title` ("Can send SMS"), `user_type`, `user_level`, `permission_status` (schema line 6693; managed at `Admin.php:20645-20681`).
4. **Per-user granular permissions** — newer `user_permissions` + `permission_modules` tables (schema lines 6713, 4937), managed through `User_permissions.php` and checked through `application/helpers/permission_helper.php` (used by only two controllers: `Teacher_remarks_templates.php` and `Head_teacher_remarks.php`).

Session state is **CodeIgniter database sessions** (`ci_sessions` table) with `sess_expiration=7200`, secure+httponly cookies, CSRF protection with a per-session static token, and an HTTPS-enforcing hook. The web login is a **two-step flow** gated by a 5-character `authentication_key` that is delivered to users by SMS/email in plaintext.

**[RECOMMENDATION]** iEduPro should collapse all six identity tables into a single `users` table with a `tenant_id`, a proper `roles`/`permissions` RBAC model (role + permission + user-permission override), bcrypt/argon2 hashing only, token-based password reset, server-side lockout, and session regeneration on login. Everything in this document marked as a *Legacy quirk* is a behavior to retire, not to port.

---

## 2. Role catalogue

**[VERIFIED LEGACY BEHAVIOR]**

| # | Role (business) | `login_type` session value | Credential table | Home controller (URL) | Dashboard redirect | Notes |
|---|---|---|---|---|---|---|
| 1 | Super Administrator | `admin` (+ `level`=1, `user_type`=level) | `admin` | `Admin.php` (`admin/*`) | `admin/dashboard` (`Login.php:184`) | Bypasses all granular permission checks (`permission_helper.php:47-49`) |
| 2 | Administrator | `admin` (+ `level`=2) | `admin` | `Admin.php` | `admin/dashboard` | Same controller; nav differs by level (`views/backend/admin/navigation.php:107,146,222,286`) |
| 3 | Accountant (admin tier) | `admin` (+ `level`=3) | `admin` | `Admin.php` | `admin/dashboard` | Distinct from the `accountant` login_type below (`Admin.php:5340-5343`) |
| 4 | Cashier | `admin` (+ `level`=4) | `admin` | `Admin.php` (+ `Cashier.php` portal) | `admin/dashboard` | Loads `navigation_cashier.php` when level==4 (`views/backend/admin/navigation.php:19-20`) |
| 5 | Conductor (bus) | `admin` (+ `level`=5) | `admin` | `Conductor.php` / `Daily_transport.php` | via `admin` nav | `Bus_conductor.php` gate is **dead** (see §4) |
| 6 | Teacher | `teacher` | `teacher` | `Teacher.php` (`teacher/*`) | `teacher/dashboard` (`Login.php:199`) | |
| 7 | Student | `student` | `student` (email **or** `username` login) | `Student.php` (`student/*`) | `student/dashboard` (`Login.php:219`) | Only role with username login (`Login.php:205-208`) |
| 8 | Parent / Guardian | `parent` | `parent` | `Parents.php` (`parents/*`) | `parents/dashboard` (`Login.php:234`) | URL prefix is `parents/` |
| 9 | Librarian | `librarian` | `librarian` | `Librarian.php` (`librarian/*`) | `librarian/dashboard` (`Login.php:249`) | |
| 10 | Accountant (portal) | `accountant` | `accountant` | `Accountant.php` (`accountant/*`) | `accountant/dashboard` (`Login.php:264`) | |
| 11 | HOD | *(none — teacher flag)* | `teacher` + rows in `hod_subjects` | `Hod.php` (`hod/*`) | `hod/dashboard` | HOD is a teacher with `hod_subjects` rows (`Hod.php:47-51`) |
| 12 | Employee (self-service payroll) | *(unreachable)* | `employee` | `Employee.php` | — | Requires session `employee_login==1`, **no code path ever sets it** (`Employee.php:24-26`; zero `set_userdata('employee_login'…)` matches repo-wide) |
| 13 | Driver | *(not a login role)* | `v_driver` (data only) | `Driver.php` (admin CRUD) | — | No constructor gate; individual methods require `admin_login==1` (`Driver.php:67,189,311`) |
| 14 | Flutter/mobile legacy app user | *(any)* | `flutter_user` | `Api.php::authenticateUser` | — | Plaintext password compare; **grants a full `admin` web session** (`Api.php:94-147`) |
| 15 | Mobile app (Mobile.php) | returned as `admin`/`teacher`/`student`/`parent` | `admin`/`teacher`/`student`/`parent` | n/a (API) | — | SHA-1 password compare; rotates `authentication_key` on each login (`Mobile.php:574-680`) |

Session keys written at login (`Login.php:171-183` admin, and the analogous blocks at `Login.php:194-199, 214-219, 229-234, 244-249, 259-264`):

- Role flag: `admin_login`, `teacher_login`, `student_login`, `parent_login`, `librarian_login`, `accountant_login` (string `'1'`).
- Role id: `<role>_id` (e.g. `admin_id`, `teacher_id`, …).
- Generic: `login_user_id` (role id duplicated), `name`, `login_type`.
- **Admin-only extras:** `user_login_access`, `user_login_id`, `email`, `user_type` (= level), `level` (`Login.php:177-183`).
- Employee portal expects `employee_code`, `employment_category` (never written; `Employee.php:36-37`).

**[RECOMMENDATION]** Single authenticated identity + role model; drop the 15-role × table matrix. HOD becomes a role/permission assignment, not "has rows in `hod_subjects`". Cashier/Conductor become roles, not `admin.level` values. The `flutter_user`/`Mobile.php` API families must not exist in the target (they bypass the web auth model entirely).

---

## 3. Authentication flow (web)

**[VERIFIED LEGACY BEHAVIOR]** — step by step:

1. **Entry** — `application/config/routes.php:51` sets `default_controller = 'login'`. `Login::index` (`application/controllers/Login.php:46-67`) redirects any already-authenticated visitor to their role dashboard by probing each `*_login` flag in turn; otherwise renders `views/backend/login.php`.
2. **Step 1 — Authentication Key (pre-gate).** The login screen first asks for a 5-character "Authentication Key" (`views/backend/login.php:160-166`, `maxlength="5"`). `onkeyup` fires `auth_verification()` (`login.php:238-297`) which AJAX-GETs `login/auth_verification/{key}` (`login.php:242`) → `Login::auth_verification` (`Login.php:69-71`) → `Crud_model::auth_verification` (`application/models/Crud_model.php:2883-2919`). That method scans **all six credential tables** for a row with `authentication_key = {key}` and echoes `'true'`, `'true_student'` (key found in `student`), `'blocked'` (row has `block_limit==3`), or `'false'`.
   - Only after a `'true'`/`'true_student'` response does the JS reveal the email+password form (`login.php:253-275`); for students it switches the identifier field to "username" (`login.php:267-273`).
   - **Client-side failure counter only** (`fail_counter`, `login.php:236, 280-292`): after 3 wrong keys the UI shows a self-service **"block account"** form that posts any email to `login/block_account` (`login.php:299-313`) → `Login::block_account` (`Login.php:74-98`) sets `block_limit=3` on that email in **all six tables**. There is no captcha, no session requirement, no rate limit: **anyone can block any account** by knowing its email. **[Quirk to retire]**
   - Server side, `auth_verification` has no throttling either; each keystroke past 5 chars triggers 12 queries (2 per table).
3. **Step 2 — validate_login.** The visible form posts `email` (or `username`), `password`, and hidden `auth_key2` (the key from step 1) to `login/validate_login` (`login.php:169-188, 184`).
   `Login::validate_login` (`Login.php:110-271`):
   - Re-checks blocked status across all six tables (`email` match, falling back to `username` for `student`) — `block_limit==3` renders the "blocked" view (`Login.php:140-159`).
   - Then probes each table in order **admin → teacher → student → parent → librarian → accountant** with `credential = { email: $email, authentication_key: $auth_key2 }` (`Login.php:163, 166, 189, 205-208, 224, 239, 254`); the student probe matches `email OR username` AND `authentication_key` (`Login.php:205-208`).
   - For each hit, verifies the password with `password_verify($password, $row->password)` — **bcrypt** (`Login.php:170, 193, 213, 228, 243, 258`).
   - On success sets the session keys (§2) and `redirect()`s to the role dashboard; after all six probes fail, sets `login_error` flash and redirects back to `/login` (`Login.php:268-269`).
   - **No `active_status` check at login** — a deactivated account (`active_status='0'`) can still log in. **[Quirk to retire]**
   - **No session regeneration on login** (`sess_regenerate_destroy = FALSE`, config line 382; no `sess_regenerate()` call anywhere in the flow) → session fixation exposure. **[Quirk to retire]**
   - **No CSRF-protected login form nuance:** the form is a normal POST and CI CSRF applies; but `auth_verification` is an open GET oracle that leaks whether a key exists.
4. **Key generation** — `authentication_key` is created at account creation as `substr(sha1(md5(mt_rand(...))), 0, 5)` and **sent to the user in plaintext via SMS/email together with the password** (students: `Admin.php:2673, 2901, 3043`; parents: `Admin.php:3945, 3970-3977`; teachers: `Admin.php:4610-4651, 4719`; admins: `Admin.php:5368`). Teachers get uniqueness validation loops `t_auth_validation_insert` (`Admin.php:4648-4651`). 5 hex chars ≈ 1M combinations — a second weak password, permanently static. **[Quirk to retire]**
5. **Logout** — `Login::logout` (`Login.php:492-498`) calls `sess_destroy()` (twice, harmless) and redirects to `/login`. `MY_Session::sess_destroy` clears userdata first (`application/libraries/MY_Session.php:65-70`).
6. **Forgot password** — `Login::forgot_password` renders the view (`Login.php:280-283`); `Login::reset_password` (`Login.php:285-488`):
   - Generates `$new_password = substr(md5(rand(100000000,20000000000)), 0, 7)` (`Login.php:299`) — a 7-char password with no complexity guarantee.
   - Probes the same six tables **without breaking the loop**: one request resets **every** account with that email across all tables (`$counter` is only used for the not-found message, `Login.php:307-478, 480-485`). **[Quirk to retire]**
   - Stores `password_hash($new_password, PASSWORD_BCRYPT)` (`Login.php:311, 347, 375, 403, 432, 460`), then **emails and SMSes the new password in plaintext** (`Login.php:313-317` etc.); if SMS sending fails, the flash message **displays the new password on screen** (`Login.php:326, 362, 390, 418, 447, 475`). **[Quirk to retire]**
   - No reset token, no expiry, no confirmation step; reset is one-shot and unthrottled (account-lockout-by-reset DoS possible).
7. **Public no-login endpoint** — `Verify.php` (`routes.php:55` → `verify/(:any)/(:any)/(:any)`) renders a student report card from `student_code`+`exam_id`+`year` with **no authentication** (`application/controllers/Verify.php:10-135`). Documented as intentional (QR verification) but is an unauthenticated PII window (names, marks, class).
8. **Alternate mobile/API flows** (both bypass the web flow):
   - `Mobile::login` (`application/controllers/Mobile.php:574-680`) compares `sha1($password)` directly against the `password` column for `admin`, `teacher`, `student`, `parent` (`Mobile.php:578, 580-583, 601-604, 622-625, 654-657`) and then **rotates the account's `authentication_key`** to `md5(rand(10000,1000000))` (`Mobile.php:586-596` etc.), silently changing the web pre-gate key. `Mobile::reset_password` stores `sha1($new_password)` (`Mobile.php:698-699`) — a different hash era from the web's bcrypt. **[Quirk to retire]**
   - `Api::authenticateUser` (`application/controllers/Api.php:94-147`) compares **plaintext** password against `flutter_user` (`Api.php:106`) and on success sets a **full admin session** (`Api.php:115-119`: `admin_login=1`, `login_type='admin'`). **Critical quirk to retire.**

**[RECOMMENDATION]** Replace with: single POST `/auth/login` (identifier + password + optional tenant hint), server-side rate limiting/lockout, `session_regenerate_id(true)` on login, `active` flag enforcement, tokenized reset (single-use, 30–60 min, hashed at rest, notification-only messaging), retirement of `authentication_key`, `flutter_user`, and the sha1 mobile path.

---

## 4. Role → controller access boundaries

**[VERIFIED LEGACY BEHAVIOR]** — the common pattern is a **constructor check that redirects to `/login` when the role's session flag is absent**. There is no middleware, no ACL filter, no base-controller enforcement (the `MY_Controller` base adds sync-wrapping only, `application/core/MY_Controller.php:96-124`).

| Controller | Gate (file:line) | Mechanism |
|---|---|---|
| `Admin.php` | ctor `40-72`; `enforce_cross_role_route_boundary` `79-110`; allowlist `104-110`; `enforce_shared_record_scope` `118-144+` | **No `admin_login` check.** Redirects to login if `login_type == ''` (`Admin.php:66-69`). If not admin: teacher/parent/student must be on a hard-coded per-role method allowlist (`Admin.php:104-110`) **and** pass record ownership scope (student/invoice ids validated against session, `Admin.php:118-144`); any other authenticated role (accountant, librarian, …) gets **403** (`Admin.php:95-99`) |
| `Teacher.php` | `Teacher.php:49-52` | `teacher_login != 1 → redirect login` |
| `Parents.php` | `Parents.php:50-54` + `enforce_parent_record_scope()` `57-96` | `parent_login != 1 → redirect login`; then 13 sensitive methods have their student-id URI segment validated against `student.parent_id == session parent_id` (`Parents.php:58-96`), else 403 (`Parents.php:98-101`) |
| `Student.php` | `Student.php:45-48` + `enforce_student_record_scope()` `53-82` | `student_login != 1 → redirect login`; 10 report methods must reference the session's own `student_id`, else 403 (`Student.php:72-82`) |
| `Accountant.php` | `Accountant.php:43-46` | `accountant_login != 1 → redirect login` |
| `Librarian.php` | `Librarian.php:42-45` (re-checked in ~8 methods) | `librarian_login != 1 → redirect login` |
| `Cashier.php` | `Cashier.php:10-25` | Requires `admin_id` session **and** `Daily_fee_model->can_collect_daily_fees(null,'cashier_portal')` (DB-driven privilege, `application/models/Daily_fee_model.php:31-100`) **and** rejects `login_type == 'conductor'` (`Cashier.php:24-26`) |
| `Hod.php` | `Hod.php:23-34` | `teacher_login != 1 → redirect base_url()`; then `is_hod()` = teacher has rows in `hod_subjects` (`Hod.php:47-51`), else back to `teacher/dashboard` |
| `Employee.php` | `Employee.php:24-26` | `employee_login != 1 → redirect login` — **flag never set anywhere** ⇒ portal unreachable |
| `Bus_conductor.php` | `Bus_conductor.php:14-16` | Requires `admin_id` **and** `login_type == 'conductor'` — **`login_type` is never `'conductor'` in any code path** (only `Login.php:175-263` and `Api.php:119` write `login_type`) ⇒ controller dead; conductors actually work through `Conductor.php` and `Daily_transport.php` |
| `Conductor.php` | `Conductor.php:9-11` + per-method | `login_type == '' → redirect login`; `mark_boarding` additionally requires `admin.level == 5` (`Conductor.php:22-31`); `daily_log`/`save_daily_log` have **no role check beyond any-authenticated** (`Conductor.php:41-91`) |
| `Daily_transport.php` | `Daily_transport.php:16-19` | `login_type == '' → redirect login`; fee collection inside checks `admin.can_collect_daily_fees` / `teacher.can_collect_daily_fees` columns (`Daily_transport.php:26-46`) |
| `Attendance_daily_fees.php` | `Attendance_daily_fees.php:12-27` | `admin_id == '' → redirect login`; capability flags from `Daily_fee_model::can_collect_daily_fees()`; classroom attendance denied to `login_type=='conductor'` |
| `Attendance.php`, `Examination.php`, `Portfolio_enterprise.php`, `Conduct_items.php` | `Attendance.php:11`, `Examination.php:12`, `Portfolio_enterprise.php:19`, `Conduct_items.php:42-46` | Shared controllers: `login_type in ('admin','teacher')` (Conduct branches per parent/student/teacher) |
| `Driver.php` | `Driver.php:67, 189, 311` | **No constructor gate**; `add_driver`/`edit_driver`/`delete_driver` check `admin_login == 1` individually |
| `User_permissions.php` | `User_permissions.php:30-46` | `admin_login != 1 → redirect login`; then **super-admin only** (`admin.level == 1`, `User_permissions.php:39-46`) |
| `Teacher_remarks_templates.php` / `Head_teacher_remarks.php` | `Teacher_remarks_templates.php:25-32`, `Head_teacher_remarks.php:39` | Any authenticated (`login_type != ''`) + granular `has_admin_or_permission()`/`require_permission()` per method |
| `AcademicAssessmentEngine` middleware | `application/modules/AcademicAssessmentEngine/middleware/Portfolio_permission_middleware.php:12-49` | Admin level 1–2 = full access; teacher only via `teacher_subject_assignment` / `teacher_class_assignment` rows |

**Role switching / impersonation:** none found. Repo-wide search for `impersonate|login_as|switch_user|act_as` returns no matches. The only cross-role session writer is the legacy `Api::authenticateUser` quirk above.

**Boundary tests** pin this down (see §9): `tests/role-controller-auth-boundaries.test.js` and `tests/admin-cross-role-boundary.test.js` assert the exact constructor regexes and the Admin allowlist contents.

**[RECOMMENDATION]** Port the *intent* (role flag + allowlist + record scope) into uniform framework middleware: authenticate → resolve role/permissions → route-level authorization → resource-level ownership checks. Retire the per-controller copy-paste gates, the dead `Bus_conductor.php`/`Employee.php` controllers, and the unguarded `Conductor::daily_log`/`save_daily_log`.

---

## 5. Session & CSRF mechanics

**[VERIFIED LEGACY BEHAVIOR]**

**Session configuration** (`application/config/config.php`):

- Driver **database**, save path (table) `ci_sessions` (`config.php:376, 379`); table DDL at `schema/schoolmanager_schema_redacted.sql:1193-1199` (`id varchar(40)`, `ip_address`, `timestamp`, `data blob`).
- Cookie name `ci_session` (`config.php:377`); expiration **7200 s / 2 h** (`config.php:378`); `sess_match_ip = FALSE` (`config.php:380`); `sess_time_to_update = 300` (`config.php:381`); **`sess_regenerate_destroy = FALSE`** (`config.php:382`) — the session ID is not rotated on login or update.
- Cookie flags: **`cookie_secure = TRUE`**, **`cookie_httponly = TRUE`** (`config.php:402-403`), empty prefix/domain, path `/` (`config.php:399-401`). Asserted by `tests/session-cookie-security.test.js:11-14`.
- `global_xss_filtering = FALSE` (`config.php:431`) — input XSS filtering is off; escaping is per-view.

**MY_Session override** (`application/libraries/MY_Session.php`): `sess_update()` is a **no-op for AJAX requests** (`MY_Session.php:43-53`) to prevent the 300 s session update from racing concurrent AJAX calls; `sess_destroy()` empties userdata before parent destroy (`MY_Session.php:65-70`).

**CSRF** (`config.php:447-452`): `csrf_protection = TRUE`; token name `agbotah_essuon`; cookie name `joana_vic`; `csrf_expire = 7200`; **`csrf_regenerate = FALSE`** (one static token per session); `csrf_exclude_uris = ['api.*+', 'sync/push', 'sync/pull']` (the API/sync surface is CSRF-exempt).

- Delivery: the backend layout emits `<meta name="csrf-name">`/`csrf-token` and JS globals (`application/views/backend/main.php:36-41`) and registers a global jQuery `$.ajaxSetup` that appends the token to every request (`application/views/backend/header.php:1443-1449`).
- The sync dashboard reads CSRF from the rendered page, never from the cookie — asserted by `tests/session-cookie-security.test.js:16-27` (explicitly forbids `document.cookie`, `getCookie`, and the literal token names in JS).

**Transport & headers:**

- SSL hook: `application/config/hooks.php:15-19` registers `redirect_ssl` on `post_controller_constructor`; `application/hooks/ssl.php:3-16` rewrites `base_url` to https and redirects when port ≠ 443 for every controller except `client`.
- Front-controller security headers (`index.php:64-77`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security: max-age=31536000` **only on HTTPS** (no `includeSubDomains`, no `preload`) — asserted by `tests/security-response-headers.test.js:9-19`.

**Idle logout:** a client-side 10-minute idle timer with a "you were logged out" modal **exists but is entirely commented out** (`application/views/backend/header.php:1377-1432`, including the redirect to `login/logout` at 1427-1429). The modal plumbing is still live (`Modal::popup_idle_user`, `application/controllers/Modal.php:144-162`; view `application/views/backend/idle_user_logged_out.php`). **Effective idle control is only the 7200 s session expiration.** The background "is my account blocked?" poll (`login/account_status`, `Login.php:101-108`) is likewise commented out (`header.php:1620-1642`) — blocking only bites at next login.

**Account blocking (session-relevant):** `block_limit == 3` in any of the six credential tables blocks the login (checked at `Login.php:140-159`; admin UI toggles it for student/parent/teacher/admin at `Admin.php:3057/3072, 4099/4110, 5087/5098, 5479/5490`). Sessions already established are **not** invalidated when an account is blocked.

**[RECOMMENDATION]** Keep DB/redis sessions + secure/httponly/samesite=Lax cookies; enable session-ID regeneration on login (fix `sess_regenerate_destroy`), bind sessions to a user record (not role flags), invalidate sessions on block/password change server-side, add real idle timeout, rotate CSRF tokens per request or at least per login, and move token names away from personal names (`agbotah_essuon`/`joana_vic`).

---

## 6. Permission system (granular permissions)

**[VERIFIED LEGACY BEHAVIOR]** — four mechanisms, oldest to newest:

### 6.1 Coarse `admin.level`
Level is set at admin creation (`Admin.php:5330-5353`): 1 = Super Administrator, 2 = Administrator, 3 = Accountant, 4 = Cashier, 5 = Conductor; levels 3–5 also set `can_collect_daily_fees`, `collection_point` (`office`/`bus`) and `transport_only`. Stored in `admin.level` + `admin.can_collect_daily_fees`/`collection_point`/`transport_only` columns (schema `admin` DDL, line 283+). Consumed by navigation (`views/backend/admin/navigation.php:2,19-20,118,133,245,261,542,608`) and by `Daily_fee_model::can_collect_daily_fees()` (`application/models/Daily_fee_model.php:31-100`).

### 6.2 Legacy role-toggle table `user_permission`
- Columns (`schema/schoolmanager_schema_redacted.sql:6693-6700`): `permission_id`, `permission_title` (free text, e.g. *"Can send SMS"*, *"Can view admins list"*, *"Can admit students"*), `user_type` (`admin`|`teacher`), `user_level` (nullable int), `permission_status` enum('0','1').
- Managed in `Admin::permission_settings` (`Admin.php:20645-20681`) — toggles `permission_status` by `permission_id`; lists admin + teacher rows. SMS sending checks it inline (`Admin.php:19900`).
- Consumed by helpers `getAdminPermissions($admin_level, $field)` and `getTeacherPermissions($field)` (`application/helpers/manager_helper.php:200-237`).
  - **Bug/quirk:** non-super-admin admins are always checked against `user_level = '2'` regardless of actual level (`manager_helper.php:214`); `getTeacherPermissions` has **no level/teacher filter** — one global toggle for all teachers (`manager_helper.php:232`). **[Quirk to retire]**

### 6.3 Per-user granular system `user_permissions` + `permission_modules`
- `permission_modules` (schema lines 4937-4950): `module_id`, `module_name` (unique key), `module_display_name`, `module_description`, **`available_permissions` CSV** (default `view,add,edit,delete`), `is_active`, `created_at`. Seeded at runtime (no seed rows in the redacted dump; no `INSERT INTO permission_modules` found in `application/sql/` or `database/migrations/`).
- `user_permissions` (schema lines 6713-6734): `permission_id`, `user_id` (polymorphic — `teacher_id`/`admin_id`/`accountant_id`), `user_type`, `module_name`, `permission_type` (`view|add|edit|delete|manage`, also `approve`/`monitor` in helper badges `permission_helper.php:366-401`), `status` enum(`active`,`revoked`), `granted_by`/`granted_at`, `revoked_by`/`revoked_at`, `notes`, `created_at`, `updated_at`. The table **is its own audit log** (`permission_helper.php:587-594`).
- Management UI: `User_permissions` controller (`application/controllers/User_permissions.php`) — super-admin only (§4); grant/revoke single (`:158-199`), bulk grant/revoke (`:204-239`), grant/revoke-all-module (`:244-329`), AJAX check (`:393-410`), CSV/JSON export (`:447-461`). Grantable user types: teacher, admin (levels 2-4 only), accountant (`User_permissions_model::get_grantable_users`, `application/models/User_permissions_model.php:452-478`).
- Model semantics (`User_permissions_model.php`): `grant_permission` validates module active + permission type ∈ module CSV + not already active; **reactivates** previously revoked rows instead of duplicating (`:81-104`); `revoke_permission` flips status to `revoked` with revoker stamps (`:138-170`); `check_permission` = active-row lookup (`:181-191`); audit query joins grantor/revoker admin names (`:348-383`); statistics (`:415-444`).
- **Permission keys** are therefore composite strings: `module_name` (registry row) × `permission_type` (verb), stored per `user_id`+`user_type` row.

### 6.4 Checking logic — `application/helpers/permission_helper.php`
- `user_has_permission($user_id,$user_type,$module,$type)` (`:31-67`): admins with `level==1` **always true** (`:40-49`); else falls back to the legacy role table via `check_role_based_permission` (`:81-97`), then to the per-user table via `User_permissions_model::check_permission` (`:66`).
- `check_role_based_permission` maps module+verb to candidate `permission_title` strings via `generate_permission_titles` (`:109-133`: verb synonym expansion, e.g. `add` → "Can add/create/insert <module readable>") and looks for an active `user_permission` row for that `user_type`+`user_level`.
- Session convenience: `current_user_has_permission` (`:144-156`) reads `login_type` + `login_user_id` from the session; wrappers `user_can_view/add/edit/delete/manage` (`:166-216`) and `can_view/add/edit/delete/manage` (`:224-266`); `has_any_permission`/`has_all_permissions` (`:277-302`).
- Enforcement helper `require_permission($module,$type,$ajax)` (`:414-444`): redirects to login if not authenticated; on denial redirects to `{login_type}/dashboard` with a flash error (or JSON + `exit` for AJAX).
- `has_admin_or_permission($module,$type,$required_admin_level=1)` (`:539-558`): admin with `level <= $required_admin_level` passes, else granular check — the backward-compat bridge used by the two consuming controllers.
- `is_super_admin()` / `can_grant_permissions()` (`:452-481`): `admin.level == 1`.
- `get_module_permissions` (`:511-526`): falls back to `['view','add','edit','delete']` when module not registered.

**Where granular checks are actually invoked:** only `Teacher_remarks_templates.php` (`:39, 50-53, 132, 167, 218, 229, 241, 263, 285`) and `Head_teacher_remarks.php` (`:39-52, 85, 122, 177, 188, 200, 251`). Everything else relies on role flags, `admin.level`, and ad-hoc inline checks.

**[RECOMMENDATION]** iEduPro should implement a single permission engine: `roles`, `permissions` (`module.action` keys), `role_permissions`, and optional `user_permissions` overrides with deny support. Port the *module × verb* key vocabulary (`view/add/edit/delete/manage/approve/monitor`) as the canonical permission naming. Do **not** port the free-text `user_permission.permission_title` table or the super-admin hard-bypass (make it a role, audited like everything else).

---

## 7. Profile management

**[VERIFIED LEGACY BEHAVIOR]**

Every role controller has a `manage_profile` method with the same `param1` protocol (`update_profile_info` | `change_password`):

| Role | Method (file:line) | Editable fields | Avatar | Change-password behavior |
|---|---|---|---|---|
| Admin | `Admin.php:21852-21940+` | `name` (uppercased), `email` (lowercased, validated) | `uploads/admin_image/{admin_id}.jpg` via raw `move_uploaded_file` (`Admin.php:21874`) | bcrypt verify current + confirm; **emails+SMSes the new password in plaintext**; **destroys session + redirects to login** (`Admin.php:21924-21925`) |
| Teacher | `Teacher.php:1073-1154` | `name`, `email` | `uploads/teacher_image/{teacher_id}.jpg` (`Teacher.php:1091`) | same, plus **`sess_destroy()`** (`Teacher.php:1137`) |
| Student | `Student.php:1134-1200+` | `name`, `email` | `uploads/student_image/{student_id}.jpg` (`Student.php:1168`) | bcrypt; session kept |
| Parent | `Parents.php:746-799` | `name`, `email` (no avatar write in controller) | — (view offers file input, `views/backend/parent/manage_profile.php:72`) | bcrypt; session kept (`Parents.php:770-787`) |
| Accountant | `Accountant.php:1587-1630` | `name`, `email` | — | bcrypt |
| Librarian | `Librarian.php:278-330` | `name`, `email` | — | bcrypt |

- Form fields are identical across roles: `name`, `email`, avatar `userfile` (accept `image/*`), `password`, `new_password`, `confirm_new_password` (`views/backend/admin/admin_manage_profile.php:282-338`, `views/backend/student/manage_profile.php:57-112`, `views/backend/parent/manage_profile.php:57-112`).
- **Avatar upload has zero validation** — `move_uploaded_file($_FILES['userfile']['tmp_name'], 'uploads/<role>_image/'.{id}.'.jpg')` with no extension/MIME/size check (Teacher `:1091`, Student `:1168`, Admin `:21874`). **[Quirk to retire]**
- Email uniqueness is enforced **across all role tables** by `email_validation` / `email_validation_for_edit` (`application/helpers/user_validation_helper.php:52-98`; the edit variant scans 7 tables including `non_teaching_staff`). Legacy quirk: `email_validation_for_edit` returns success based on "not more than 1 row" in *other* tables — sloppy but functional.
- **Change-password messaging quirk:** after a successful change, the app sends the *new plaintext password* by SMS and email ("Your current password is: …", `Teacher.php:1113-1132`, `Admin.php:21901+`). **[Quirk to retire]**
- Admin can reset any user's password during edit flows with `password_hash(..., PASSWORD_BCRYPT)` (`Admin.php:4798, 5405, 5644, 21978, 22131, 22610`); parent creation falls back to default password `123456` hashed (`Admin.php:3915-3917`). **[Quirk to retire]**
- Profile pictures are read back via `Crud_model::get_image_url` style helpers (e.g. `Mobile.php:445`).

**[RECOMMENDATION]** Unified profile service: validated avatar pipeline (MIME sniffing, resize, object storage), password change that invalidates other sessions and never transmits the password, unique email per tenant.

---

## 8. Password & account security summary

**[VERIFIED LEGACY BEHAVIOR]**

| Concern | Legacy behavior | Evidence |
|---|---|---|
| Web hashing | bcrypt (`password_hash(..., PASSWORD_BCRYPT)` / `password_verify`) | create: `Admin.php:2661, 3915, 4610, 4798, 5289, 5405, 5644`; verify: `Login.php:170-258`; change: `Teacher.php:1101-1111`, `Admin.php:21888-21899`; reset: `Login.php:311-460` |
| Mobile hashing | **SHA-1** compare/store (incompatible with bcrypt rows) | `Mobile.php:578, 698-699` |
| Flutter API hashing | **plaintext** compare | `Api.php:99-106` |
| Reset flow | 7-char `md5(rand())` password, emailed+SMSed plaintext; on SMS failure printed to screen; loops all six tables; no token/expiry/rate-limit | `Login.php:285-488` (esp. `299, 313-317, 326, 480-485`) |
| Account blocking | `block_limit == 3` flag; admin-set per table; **self-service block endpoint open to anonymous users**; checked only at login; logged-in sessions unaffected | `Login.php:74-98, 140-159`; `Admin.php:3057-5490`; polling disabled `header.php:1620-1642` |
| Brute-force defense | none server-side; cosmetic JS counter on auth-key step | `views/backend/login.php:236-292` |
| Deactivation | `active_status` enum('1','0') column exists on all six tables but is **never checked at login** | schema (e.g. `admin` line 322); absence in `Login.php:110-271` |
| Password policy | only `min_length[6]` on login validation; none on change/create | `Login.php:123` |
| Default credentials | parent accounts default to `123456` when unspecified | `Admin.php:3915-3917` |
| Session fixation | no regeneration on login (`sess_regenerate_destroy=FALSE`; no `sess_regenerate` call) | `config.php:382` |
| Encryption key | CI `encryption_key` from env `IEDUPRO_ENCRYPTION_KEY` or `config/local_secrets.php` | `config.php:316-326` |
| Transport | forced HTTPS hook + HSTS/nosniff/referrer headers | `hooks/ssl.php:3-16`; `index.php:64-77` |

**[RECOMMENDATION]** Argon2id or bcrypt cost ≥ 12, zxcvbn-style policy, server-side lockout with backoff, single-use reset tokens, no password transmission over SMS/email ever, deactivate = immediate session revocation, retire default passwords.

---

## 9. Tables & columns (identity / access surface)

**[VERIFIED LEGACY BEHAVIOR]** — from `schema/schoolmanager_schema_redacted.sql` (line = `CREATE TABLE` line):

### Credential-bearing tables (the six login roles)
- **`admin`** (line 283): `admin_id` PK, `admin_code`, `name`, gender, `first_name/other_name/last_name`, `phone`, `ssnit_id`, `ghana_card_id`, `email`, **`password`** (bcrypt), **`level`** (1–5), **`authentication_key`** (5-char), `read_notice_ids`, **`block_limit`**, `active_status` enum('1','0'), `online_status`, payroll fields (`account_number`, `tier2_provider_id`, `tier2_member_id`, `account_details`), fee-collection privilege columns `can_collect_daily_fees`, `collection_point` enum('classroom','office','bus'), `transport_only`, plus sync columns (`sync`, `sync_status`, `last_modified_at`, `last_modified_by`, `device_id`, `version`, `retry_count`, `sync_error`).
- **`teacher`** (line 6398): `teacher_id`, `name`, name parts, `teacher_code`, demographics, `phone`, `email`, **`password`**, payroll fields, **`authentication_key`**, `designation`, `social_links`, `show_on_website`, `read_notice_ids`, **`block_limit`**, `active_status`, `online_status`, `can_collect_daily_fees`, `collection_point`, sync columns.
- **`student`** (line 5774): `student_id`, `student_code`, `name`, name parts, demographics, medical (`allergies`, `medical_conditions`, `nhis_number`, `disability_status`, …), `phone`, `student_phone`, **`username`** (unique login), `email`, **`password`**, `parent_id` FK, `dormitory_room_number`, **`authentication_key`**, `read_notice_ids`, **`block_limit`**, `active_status`, `mute`, `special_diet`, welfare fields, deletion-governance columns (`can_delete`, `can_edit`, `delete_request_issuer_id`, `edit_request_issuer_id`), sync columns.
- **`parent`** (line 4481): `parent_id`, `name`, `guardian_gender`, `guardian_is_the`, `email`, **`password`**, `phone`, `address`, `profession`, `designation`, **`authentication_key`**, `read_notice_ids`, **`block_limit`**, `active_status`, `online_status`, `father_name/phone/occupation`, `mother_name/phone/occupation`, sync columns.
- **`accountant`** (line 160): `accountant_id`, `name`, `phone`, `email`, **`password`**, **`authentication_key`**, `read_notice_ids`, **`block_limit`**, `active_status`, `online_status`, sync columns.
- **`librarian`** (line 4044): `librarian_id`, `name`, `phone`, `email`, **`password`**, **`authentication_key`**, `read_notice_ids`, **`block_limit`**, `active_status`, `online_status`.

### Other identity-adjacent tables
- **`employee`** (line 2056): HR-staff table with its own `em_email`/**`em_password`** (varchar 512) and `em_role` enum('ADMIN','EMPLOYEE','SUPER ADMIN'), `status` enum('ACTIVE','INACTIVE') — **not wired to any login** (dead `employee_login` path).
- **`non_teaching_staff`** (line 4282): `staff_id`, `staff_code`, name parts, demographics, `email`, **`password`** ("Hashed password for portal access"), pension IDs (`ssnit_id`, `ghana_card_id`, `petra_id`, `tin`) — no controller logs it in.
- **`flutter_user`** (line 2804, MyISAM): `flutter_id`, `flutter_name`, `flutter_phone`, `flutter_email`, **`flutter_password`** (plaintext in practice via `Api.php`).
- **`v_driver` / `v_vehicle`**: transport staff used by `Driver_model` (`application/models/Driver_model.php:39-146`) — **not present in the schema dump** (created out-of-band); drivers do not log in.

### Permission / authorization tables
- **`user_permission`** (line 6693): `permission_id`, `permission_title` (free text), `user_type`, `user_level`, `permission_status` enum('0','1'), `sync`. Legacy role-toggle registry.
- **`user_permissions`** (line 6713): `permission_id`, `user_id`, `user_type`, `module_name`, `permission_type`, `status` enum('active','revoked'), `granted_by`, `granted_at`, `revoked_by`, `revoked_at`, `notes`, `created_at`, `updated_at`. Per-user granular grants + audit.
- **`permission_modules`** (line 4937): `module_id`, `module_name`, `module_display_name`, `module_description`, `available_permissions` CSV (default `view,add,edit,delete`), `is_active`, `created_at`. Module registry.
- **`hod_subjects`** (line 3062): `id`, `teacher_id`, `subject_id`, `assigned_at`, `assigned_by` — HOD designation.
- **`teacher_privileges`** (line 6450): `id`, `teacher_id`, `privilege_type` (default `attendance_monitoring`), `granted_by`, `granted_at`, `status` enum('active','revoked'), `revoked_by`, `revoked_at`, `notes`.
- **`fee_collection_assignments`** (line 2545): per-teacher/term daily-fee collection rights (`can_collect_feeding`, `can_collect_breakfast`, `can_collect_classes`, `can_collect_water`, `can_collect_transport`) consumed by `Daily_fee_model.php:70-99`.

### Session / tenancy infrastructure
- **`ci_sessions`** (line 1193): `id` varchar(40), `ip_address`, `timestamp`, `data` blob.
- **`settings`** (line 5589): MyISAM key/value (`type`, `description`) — single-school configuration (system_name, running_year, sms keys, `daily_fee_collection_mode`, etc.).
- **`location_registry`** (line 4107): `location_name`, `device_id`, `api_endpoint`, `status`, `priority`, sync metadata — **multi-campus *device sync* registry, not a tenant model**.
- **`sync_devices`** (line 6206): `device_id`, `device_name`, `school_id` (nullable), `last_sync_at`, `status` enum('ACTIVE','INACTIVE','BLOCKED') — the only `school_id` column in the entire schema.

---

## 10. Multi-school / multi-tenant behavior

**[VERIFIED LEGACY BEHAVIOR]** — **single school per deployment.** All data tables lack a `tenant_id`/`branch_id`; there is exactly one `settings` row-set (system name, running year/term, SMS/email credentials). The only multi-site concepts are:

1. **Offline-first device sync**: `location_registry` (schema:4107) + `sync_devices.school_id` (schema:6210, nullable) + `MY_Controller::get_device_id` (`application/core/MY_Controller.php:130-162`, default `'local-server-001'`) + `device_id`/`last_modified_by`/`version` sync columns replicated across dozens of tables — this synchronizes **one school's data between campus servers**, it does not partition users or records per school.
2. The admin dashboard renders a "multi-location sync" widget from `location_registry` (`Admin.php:245-278`).

**[RECOMMENDATION]** For iEduPro, tenancy must be introduced from scratch (tenant_id on the unified users table and every domain table, tenant-scoped settings replacing the global `settings` key/value, per-tenant branding). The sync `location_registry` should map to campus/site entities inside a tenant.

---

## 11. Test coverage summary (auth-relevant, `tests/`)

All are **static contract tests** (Node `node:test`) that read the PHP source and assert patterns/absences — they do not execute PHP. Strength: they lock in the current boundaries; limitation: regex-based, no runtime validation.

| Test file | What it asserts |
|---|---|
| `tests/role-controller-auth-boundaries.test.js` | For `Parents.php`, `Student.php`, `Teacher.php`, `Accountant.php`, `Librarian.php`: the **constructor** must contain `userdata('<role>_login') != 1` **and** `redirect(site_url('login'…))`, and must **not** gate on `login_type ==` comparisons (`:34-47`). Parents must not emit `Access-Control-Allow-Origin: *` (`:49-52`). |
| `tests/admin-cross-role-boundary.test.js` | Admin ctor must call `enforce_cross_role_route_boundary` (`:21-24`); boundary checks `admin_login`/`teacher_login`/`parent_login`/`student_login`, uses `fetch_method()` and 403 (`:26-34`); parent/student allowlist must exclude `conducts_update` and `deleted_messages_id` (`:36-46`); teacher allowlist must exclude destructive admin methods (`bulk_students_delete`, `student_add`, `student_promotion`, `section_subject_edit`, `update_subjects_creche`) while including `attendance_update`, `marks_update`, `conducts_update` (`:48-59`); unknown roles denied with 403 (`:61-65`); parent/student **views** must not post conduct changes or legacy message-file routes (`:68-93`); every `admin/…` URL referenced from role views must be in that role's allowlist (`:96-121`); obsolete message-file handlers removed (`:123-126`). |
| `tests/session-cookie-security.test.js` | `cookie_secure = TRUE` and `cookie_httponly = TRUE` in config (`:11-14`); sync dashboard obtains CSRF via `get_csrf_token_name()`/`get_csrf_hash()` into `iEduProSyncCsrf`, and the sync JS must not read cookies or embed token names (`:16-27`). |
| `tests/security-response-headers.test.js` | `index.php` emits `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` (`:9-12`); HSTS `max-age=31536000` on HTTPS detection (incl. `HTTP_X_FORWARDED_PROTO`) without `includeSubDomains`/`preload` (`:14-19`). |
| `tests/portal-record-ownership.test.js` | Parent ctor keeps `parent_login` + `enforce_parent_record_scope` (`:19-23`); the 13 scoped parent routes + `current_parent_owns_student` binding (`:25-36`); student ctor + self-scope covering 10 routes against `student_id` (`:38-52`); legacy portal payment settlement methods (`paypal_checkout`, `stripe_checkout`, `pay`, `pay_with_payumoney`, `bank_checkout`) retired (`:54-61`); invoice methods Hubtel-only/read-only (`:63-68`); payment view files deleted (`:70-85`); denials fail closed with HTTP 403 (`:87-90`); PayUMoney controller + hard-coded secret `GQs7yium` eradicated (`:93-105`). |
| `tests/runtime-encryption-secret.test.js` | `encryption_key` must come from env/`local_secrets` (companion to `config.php:316-326`). |
| `tests/shared-report-ownership.test.js` | Teacher-facing shared Admin report routes respect record scope (companion to `Admin::enforce_shared_record_scope`). |
| Other boundary tests in the suite (pattern-identical) | `invoice-delivery-auth-boundary.test.js`, `bank-reconciliation-auth-boundary.test.js`, `expenditure-auth-boundary.test.js`, `budget-management-auth-boundary.test.js`, `expense-management-auth-boundary.test.js`, `bulk-receipts-auth-boundary.test.js`, `sync-setup-security-boundary.test.js`, `sync-locations-security-boundary.test.js`, `sync-conflicts-security-boundary.test.js`, `transaction-recovery-boundary.test.js`, `teacher-online-exam-ownership-boundary.test.js` — each pins controller-level role gates for its module. |

**Gaps:** no tests for the login flow itself (`validate_login`), password reset, block/unblock, CSRF enforcement (only delivery), session expiry, or the granular `user_permissions` engine; nothing covers `Conductor`/`Driver`/`Employee`/`Bus_conductor` dead gates.

---

## 12. Legacy quirks to retire (consolidated, with evidence)

1. **Six-table identity sprawl** with duplicated session keys and per-role controllers — §2, §4.
2. **5-char static `authentication_key` pre-gate**, plaintext-circulated at signup, rotated unpredictably by the mobile API — `Admin.php:2673,3945,4610`; `views/backend/login.php:160-188`; `Mobile.php:586-596`.
3. **Anonymous self-service account blocking** (`block_limit=3`) — trivial DoS — `Login.php:74-98`, `views/backend/login.php:299-313`.
4. **No server-side brute-force/lockout**; cosmetic JS counter only — `views/backend/login.php:236-292`.
5. **Password reset that resets every matching account in all six tables**, sends the password by SMS/email, and **prints the new password on screen when SMS fails** — `Login.php:285-488`.
6. **Plaintext password transmission on change** (SMS + email) — `Teacher.php:1113-1132`, `Admin.php:21901+`; account-opening emails carry the raw password — `Admin.php:5368`.
7. **Mixed hash eras**: bcrypt (web), **SHA-1** (mobile), **plaintext** (flutter_user) — `Login.php:170` vs `Mobile.php:578` vs `Api.php:106`.
8. **`Api::authenticateUser` grants a full admin web session from a plaintext `flutter_user` login** — `Api.php:115-119`.
9. **No session regeneration on login**; sessions not IP-bound; not invalidated on block/password change (except Teacher's own change) — `config.php:380-382`, `Login.php:110-271`.
10. **Idle logout & block-polling code fully commented out** — `header.php:1377-1432, 1620-1642`.
11. **Dead portals/gates**: `Employee.php` (`employee_login` never set), `Bus_conductor.php` (`login_type=='conductor'` never set), `Conductor::daily_log/save_daily_log` (any-authenticated), `Driver.php` (no ctor gate) — §4.
12. **`active_status` never enforced at login** — §8.
13. **Default password `123456`** for parents — `Admin.php:3915-3917`.
14. **Role-toggle table bugs**: admin permission checks pinned to `user_level=2`; teacher toggles global, not per-teacher — `manager_helper.php:203-237`.
15. **Granular permission engine used by only 2 controllers**; super-admin hard-bypass inside the checker — `permission_helper.php:31-67`; consumers §6.4.
16. **Avatar upload without any validation** (`move_uploaded_file` straight to web-accessible `uploads/`) — `Teacher.php:1091`, `Student.php:1168`, `Admin.php:21874`.
17. **Unauthenticated public report verification** exposing student PII by guessable codes — `Verify.php:27-135`, `routes.php:55`.
18. **CSRF token names are personal names** (`agbotah_essuon` / `joana_vic`), never regenerate — `config.php:447-452`.
19. **`user_type`/`level` session confusion** for admins (`user_type` holds the numeric level, `Login.php:182-183`).
20. **Dead autoloaded `Login_model`** referencing a non-existent `users` table with SQL-injection-prone string queries — `application/models/Login_model.php:19-72` (unreachable, but should not be migrated).

---

## 13. Parity-matrix quick reference (VERIFIED → RECOMMENDED)

| Legacy | Evidence | iEduPro recommendation |
|---|---|---|
| Role = table + controller + session flags | §2, §4 | Single `users` + `roles`; route middleware |
| `login_type` / `<role>_login` / `<role>_id` session keys | `Login.php:171-263` | `user_id` + role claims; no role-flags |
| bcrypt web / sha1 mobile / plaintext flutter | §8 | One hash algorithm; migrate & force reset |
| `authentication_key` pre-gate | §3.2-4 | Remove (use MFA if a second factor is wanted) |
| `block_limit=3` blocking | §5, §8 | Server-side lockout counters + admin suspend |
| `admin.level` 1-5 | §6.1 | Role hierarchy in RBAC tables |
| `user_permission` (title toggles) | §6.2 | `permissions` keyed `module.action` |
| `user_permissions`+`permission_modules` (2 consumers) | §6.3-6.4 | Same vocabulary, framework-enforced, all controllers |
| Record scoping in Parents/Student/Admin ctors | §4 | Policy layer / query scopes per tenancy |
| DB sessions 2 h, secure+httponly, CSRF static | §5 | Redis sessions, rotate ID, SameSite, rotating CSRF |
| Idle logout disabled | §5 | Real idle timeout + server-side revocation |
| Single school, device-sync "locations" | §10 | True multi-tenant schema |

---

*End of audit document. Companion audits: see `docs/handover/legacy/` index (this is file 01).*
