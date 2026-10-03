# Dashboard Family — Modernization Report

**Date:** 2026-10-03 · **Baseline:** `4ed29d0` (admin + cashier dashboard views) · **Final SHA:** `1aff90f`

## 1. Dashboards audited

| Dashboard view | Route / loader | Verdict |
|---|---|---|
| `admin/sync_dashboard.php` (+ `sync_dashboard_ui.js`, `sync_dashboard.js`, shared `sync-design-system.css`) | `Sync_server::dashboard()` | Modernized |
| `admin/financial_dashboard_unified.php` | `Financial_integration::index()` | Modernized |
| `admin/dashboard_cashier.php` (cashier main view) | `Admin::dashboard()` level-4 branch | Modernized at `4ed29d0` (accepted) |
| `admin/cashier_dashboard_admin.php` | `Admin.php:192` | Modernized |
| `admin/cashier_dashboard_single.php` | `Admin.php:215` (AJAX fragment → `get_cashier_dashboard_data`) | Modernized |
| `admin/cashier_dashboard_all.php` | `Admin.php:243` (AJAX fragment → `get_all_cashiers_dashboard`) | Modernized |
| `admin/payroll_dashboard.php` | `Admin.php:30506` | Modernized (+ markup bug fixed) |
| `admin/income_dashboard.php` | `Admin.php:16498` | Modernized |
| `admin/expenditure_dashboard.php` | `Admin.php:16734` | Modernized |
| `admin/academic_control_dashboard.php` | `Academic_control.php:21` | Modernized (light touch — already family-shaped) |
| **Accountant role dashboard** | `Accountant::dashboard()` → `backend/accountant/dashboard.php` | **View does not exist** — see §7 |
| `admin/account_dashboard.php` | referenced nowhere | Orphaned — left untouched |
| `admin/attendance_dashboard_enterprise.php` | referenced nowhere | Orphaned — left untouched |
| `admin/dashboard_enterprise.php` | referenced nowhere | Orphaned — left untouched |
| `admin/sync_dashboard_old_backup.php` | referenced nowhere (backup copy) | Left untouched |

Role-specific views under `views/backend/{teacher,parent,student,hod,librarian,...}/dashboard.php` are
part of their respective page families (teacher/parent/student waves) and follow later in the
sequence, not the admin dashboard family.

## 2. Family design language applied

Every modernized page now shares the admin-dashboard system (`4ed29d0`):

- **Page canvas:** flat `#f9fafb`, 16/24px responsive padding (`p-4 md:p-6`)
- **Cards:** white, 1px `#e5e7eb` border, 16px radius, ambient elevation
  (`0 1px 2px rgba(16,24,40,.05)`), −2px hover lift, `fadeInUp` entrance
- **KPI values:** 800-weight ink numerals, 5px accent left edges, tinted watermark/icons
- **Hero headers:** family gradient or domain accent, 16px radius, decor circles,
  family elevation (domain accents retained: emerald = income, red = expenditure)
- **Buttons/inputs:** 42px height, 10px radius, 600 weight, family focus rings
- **Status pills/badges:** family pill treatment everywhere
- **Charts:** family card + 320px/260px responsive containers
- **Responsive:** verified stacking/grids at 1200/1024/768/480 and a new 400px tier
- **A11y:** focus-visible rings, aria-labels on icon-only controls, `for=`/label
  associations, `prefers-reduced-motion` guards, keyboard activation for
  click-delegated fee tiles

## 3. Files changed (this wave)

```
application/views/backend/admin/sync_dashboard.php
application/views/backend/admin/financial_dashboard_unified.php
application/views/backend/admin/cashier_dashboard_admin.php
application/views/backend/admin/cashier_dashboard_single.php
application/views/backend/admin/cashier_dashboard_all.php
application/views/backend/admin/payroll_dashboard.php
application/views/backend/admin/income_dashboard.php
application/views/backend/admin/expenditure_dashboard.php
application/views/backend/admin/academic_control_dashboard.php
docs/deployment/DEPLOYMENT_MANIFEST_REVIEW.md
```

## 4. Commits

| SHA | Content |
|---|---|
| `276b538` | docs(deploy): manifest review for the VPS pull deployment model |
| `c4aae17` | feat(ui): sync dashboard family alignment |
| `dc63edf` | feat(ui): unified finance dashboard family alignment |
| `eed60ee` | feat(ui): cashier dashboard trio family alignment |
| `1ef6da0` | fix(ui): sync dashboard uniform CRLF (follow-up) |
| `0fa7988` | feat(ui): payroll dashboard alignment + unclosed `<style>` fix |
| `1aff90f` | feat(ui): income / expenditure / academic-control alignment |

## 5. Verification per dashboard

Each modernization ran a machine-checked equivalence battery against the
pre-change file:

- PHP statement multiset (whitespace-normalized, comments excluded) — identical
- `site_url()` / `base_url()` route and `href` multisets — identical
- Element `id=` multisets (all JS binding targets) — identical
- `onclick` / `onchange` handler multisets — identical
- `<script src>` / stylesheet includes — identical
- `data-*` attribute multisets (cashier fee-card contracts) — identical
- Canvas IDs (charts) — identical
- PHP tag balance, `<div>` balance, CSS brace balance — PASS
- CI on every commit: PHP syntax / secret scan / JS spot check / CSS brace
  sanity / deployment-handoff validation — **all green** (1aff90f's last two
  checks were in progress at report time, all others green)

Responsive behaviour verified at the CSS level (grid stacking tiers,
container heights, 400px hardening); visual spot-check pending the owner's
inspection at `https://schoolmanager.lightworldtech.com`.

## 6. Preserved role differences

- **Cashier variants** keep their distinct semantics: combined-vs-single views,
  fee-module enable flags, arrears vs collected breakdowns, per-collector
  performance table with role badges.
- **Payroll** keeps month/year reload, GH¢ formatting, DataTable top-earners,
  payment-status highlighting (`.bg-danger` toggle retained and restyled).
- **Income/expenditure** retain domain accents and their distinct
  filter/AJAX contracts (`get_income_stats`, `get_expenditure_stats`,
  `get_revenue_sources`).
- **Sync dashboard** keeps the full monitoring surface (realtime indicator,
  connection badge, pending/deletion/conflict KPIs, collapsible error/failed
  sections, location health, charts) — no IDs, hooks or scripts changed; the
  shared `sync-design-system.css` was untouched (6 other pages depend on it).
- **Academic control** keeps status-coloured class cards, audit modal, and
  submit/approve/lock/unlock flows.

## 7. Backend issues discovered but intentionally deferred

1. **Accountant role dashboard view missing (functional bug).**
   `Accountant::dashboard()` sets `page_name = 'dashboard'`, and the layout
   includes `backend/accountant/dashboard.php` — which does not exist in the
   tree or in git history. Any accountant login renders an empty content area
   (silent include failure). Fixing requires a product decision (build the
   view vs retire the role), not a presentation pass. **Deferred for owner
   direction.**
2. **Orphaned dashboard views:** `account_dashboard.php`,
   `attendance_dashboard_enterprise.php`, `dashboard_enterprise.php` are
   referenced by no controller/route. Candidates for owner-verified
   retirement (grep-refs alone are not proof — not deleted).
3. **`admin_sync_methods.php` is a "copy into Admin.php" fragment** (sync
   dashboard route inside it is not live; `Sync_server::dashboard()` is).
   Same class of file as the retired fragments — flagged, not deleted.
4. **Debug residue in cashier fragments:** `error_log()` debug lines and an
   HTML-comment debug dump in `cashier_dashboard_single.php` (query + params
   rendered into page source). Harmless but noisy; removal is a small
   behavioural cleanup for a dedicated PR if desired.
5. **Native `prompt()` dialogs** for submit/approve notes in academic
   control — functional but below the family's UX bar; modal-based flow is a
   behaviour change, deferred.
6. **Payroll unclosed `<style>` tag** — found and FIXED in `0fa7988` (not
   deferred; zero rendering change).
7. **Legacy global CSS side-effects** in income/expenditure views
   (`* { margin:0; padding:0 }` + tinted `body` background in a view) —
   existing identity, kept except for the body canvas which is now the
   family gray. Structural cleanup of the reset is deferred (would shift
   shell spacing).

## 8. Deployment state

- **Current GitHub `main`:** `1aff90f`
- **VPS SHA:** not readable from the repo side. The VPS-side pull deployer
  polls `origin/main` every minute and records
  `/home/lightworld/deployments/schoolmanager/last_successful_sha`. With the
  timer active, the VPS should be at `1aff90f` (or the SHA of the last green
  run) within minutes of this push — confirm with
  `cat /home/lightworld/deployments/schoolmanager/last_successful_sha`.
- **Automated deployment operational?** The mechanism is the owner's VPS-side
  pull deployer (`schoolmanager-deploy.timer`), now documented and reviewed
  in `docs/deployment/DEPLOYMENT_MANIFEST_REVIEW.md` + `docs/DEPLOYMENT.md`.
  It requires no GitHub secrets and preserves all runtime content by
  construction. The earlier push/rsync workflow design was withdrawn in
  favour of it.
