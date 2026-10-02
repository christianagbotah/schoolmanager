# Page Audit — Admin Dashboard (dashboard.php + dashboard_cashier.php)

Date: 2026-10-03 · Wave 2, priority 2 ("Admin dashboard + role dashboards", 23 pages total in cluster)
Scope of this pass: `application/views/backend/admin/dashboard.php` (1488 lines) and its
inseparable delegate `application/views/backend/admin/dashboard_cashier.php` (452 lines).

## 1. Entry points & routing

| Route | Controller method | Notes |
|---|---|---|
| `admin/dashboard` | `Admin::dashboard('')` (Admin.php:135) | page_name=`dashboard`, title=`get_phrase('admin_dashboard')` |
| `admin/dashboard/search` | `Admin::dashboard('search')` | POST search variant; same view with filters applied |

POST fields (search form): `term`, `sem`, `year`, `date_sel` (dd-mm-yyyy datepicker).
Controller additionally prepares `location_stats` / `locations` (Task 5.4 multi-location sync
widget) — **verified NOT consumed by either view** (dead data preparation; flagged for a later
dedicated controller PR, not touched in this pass).

## 2. View dispatch & role branching

- Shell: `backend/main.php` → `include_main.php` → `admin/dashboard.php`.
- `main.php` body class: adds `sidebar-collapsed` when `$page_name=='dashboard' && $admin_level < 4`.
- **dashboard.php line 6-10**: `admin_level == 4` (cashier) → loads
  `backend/admin/dashboard_cashier` and returns. All other levels continue.
- Visibility rules inside dashboard.php:
  - Filter section: `account_type == 'admin' && admin_level == 1` (super admin only)
  - Financial overview row: `account_type == 'admin' && admin_level <= 3`
  - Quick Actions: `account_type == 'admin' && admin_level != 4`
  - Financial Summary block: `account_type == 'admin' && admin_level == 1`

## 3. Data computed in view (ALL preserved verbatim)

PHP blocks embedded in the view compute (must not be altered in this pass):
enroll→student_ids (mute=0, year/term) → parent ids; admin name/level re-query; currency;
Credit_model stats (guarded by file_exists + try/catch); Daily_fee_model daily revenue;
payment sums (income/expense, can_delete != trash) current vs previous term with year-rollover
math for term 1; invoice total billed → collection rate; active pending payments (unpaid
invoices joined enroll mute=0) vs bad debt (mute=1) — both raw SQL; class list. In the
Financial Summary block: unpaid invoice count/sum (all-time, mute=0, can_delete != trash);
year/term-filtered due; receipt count; income/expense sums; daily-fee branch on
`table_exists('daily_fee_transactions')` (feeding/classes/transport/water/breakfast paid +
wallet arrears joined to enroll) with legacy `feeding_fee` fallback; per-module today vs
yesterday change; unpaid items aggregation. Chart data: per-class counts (student
distribution, gender, residential with TOTAL columns) and 7-day attendance trend (status 1+3).

## 4. Interaction contracts (MUST be preserved exactly)

- `navigation(url)` — SPA page loading (used by Quick Actions).
- `showAjaxModal(url, id)` — modal system (modal.php:786): outstanding debt, bad debt,
  unpaid invoices, take payment.
- `showAjaxModal_alert(message, type)` — modal.php:971 (daily revenue modal loader).
- `showModalWithContent(id, title, html)` — modal.php:1790 (cashier fee details).
- `showDailyRevenueModal(timestamp)` — inline JS → AJAX `modal/popup_daily_revenue/{ts}` →
  injects into `#modal_alert .modal-body`, dialog sized 1200px/95%.
- `createOrUpdateChart(canvasId, config)` — chart-helper.js singleton (includes_bottom loads
  Chart.js 3.9.1 from `assets/cdn/js/chart-3.9.1.min.js` at view bottom).
- Cashier view: `showDetailsModal(type)` (console.log stub — preserved as-is),
  `showFeeDetails(feeType, category)` → POST `admin/get_fee_details` (Admin.php:535) with
  `{fee_type, category, cashier_id}`.
- jQuery UI datepicker on `.datepicker` (format dd-mm-yyyy), Bootstrap tooltip on
  `[data-toggle="tooltip"]`.

Canvas IDs: `studentDistributionChart`, `attendanceTrendChart`, `genderDistributionChart`,
`residentialDistributionChart`.

Links on cards (all `target`/onclick preserved): `admin/all_students/{y}/{t}/{s}`,
`admin/teacher`, `admin/parent`, `admin/students_att/{ts}` (_blank), `admin/student_credits`,
`admin/financial_reports/payments` (_blank), `admin/expense` (_blank),
`admin/cashier_dashboard_admin` (_blank, fee + unpaid-balance cards), Quick Actions →
`admin/student_add`, `admin/manage_attendance`, `admin/student_invoice`,
`modal_take_payment/0` (AJAX modal), `admin/message`, `admin/send_bill_reminder`.

## 5. Findings (flagged, NOT changed in this pass)

1. `location_stats`/`locations` prepared in controller but unused by the view (dead queries
   on every dashboard load) → candidate for controller-side cleanup PR.
2. `$fmt = new NumberFormatter(...)` declared (line 620) but never used.
3. `$daily_fees[...]['modal_url'/'modal_id']` computed but markup links to
   `admin/cashier_dashboard_admin` instead → modal URL unused.
4. Chart data blocks run N+1 queries per class (3 charts × classes + residential per-type
   counts). Optimization only with proven equivalence → dedicated later PR.
5. Cashier recent-transactions table queries `payment_methods` per row (N+1) → same rule.
6. `dashboard_cashier.php` inline `showDetailsModal` is a console.log stub (keep behavior).
7. Tailwind build is a static committed `output.css`; new utilities are constrained to the
   verified existing set (responsive grid variants sm/md/lg verified present;
   `md:grid-cols-6` absent — dynamic grids already cap at 5).

## 6. Modernization plan (presentation-only)

- Keep: every PHP block verbatim, all visibility conditions, all links/onclick/target,
  canvas IDs + chart data/config semantics, form action/field names, both `<script>` tails
  (chart library tag, chart builders, datepicker/tooltip init, daily-revenue modal fn).
- Change (markup/CSS only): unified token-based card system replacing ~20 ad-hoc gradient
  cards and inline styles; consistent KPI pattern (label/value/hint); semantic palette
  (primary/positive/warning/danger) with soft icon chips instead of saturated gradients;
  accessible markup (aria-labels, focus-visible rings, tabindex on clickable divs);
  responsive hardening to 360px; RTL-aware logical CSS in page-scoped stylesheet;
  chart card headers unified; cashier table gets sticky-safe horizontal scroll.
- CSS approach: page-scoped `.dash-*` classes built on design-system tokens
  (`var(--sm-*)`) + the existing Tailwind utility set already present in these views.

## 7. Implementation record (2026-10-03)

Executed as a presentation-only pass; assembly + equivalence verification via
`scripts/assemble_dashboards.py` (line-exact PHP transplants + multiset diffs).

**Preserved verbatim (byte-identical, verified by diff hunk placement):**
- PHP data-prep block (original lines 1–162), financial-summary PHP (617–777),
  module-breakdown PHP (858–896), daily-fees PHP (954–1101), unpaid-items PHP (1130–1163)
- Filter section, KPI row, financial overview row, charts section, quick actions
  (original lines 313–611) — reskinned purely via the new page-scoped stylesheet
- Full script tail (chart library tag, 4 chart builders with their PHP data blocks,
  datepicker/tooltip init, `showDailyRevenueModal`) — lines 1191–1488
- Cashier view: PHP query block (1–133) and JS block (409–452)

**Rewritten (markup/CSS only, every echo/link/onclick preserved):**
- Page head (+ term/year context chip), financial summary 4 cards (white cards with
  accent borders + gradient icon chips replacing full-gradient cards),
  Termly Fees Collection hero (decorative inline JS hover handlers replaced by CSS
  `:hover`; decorative circle divs replaced by pseudo-elements), daily-fee module
  tiles, unpaid-balances alert card
- Cashier view: Bootstrap row/col grid → Tailwind grid; KPI cards unified with the
  dashboard card language; fee-breakdown and transactions table restyled;
  `tabindex`/`role`/`aria-label` added to clickable tiles; KPI/fee tiles keyboard-focusable

**Equivalence verification (all PASS):**
- PHP statement multiset: identical (whitelist: `$un_year`/`$un_term`/`$fee['name']`
  echoes for the new context chip and an aria-label)
- site_url() route multiset: identical
- onclick handler multiset: identical
- echo-variable multiset: identical
- Structure: PHP tags balanced (short-echo accounted), divs 122/122, anchors 13/13
- CRLF line endings preserved (dashboard.php); cashier stays LF
- CSS brace balance 59/59 and 54/54; Tailwind utilities constrained to the verified
  existing set in the static `output.css` build

**Not changed (flagged for later PRs):** controller dead location queries, `$fmt`,
  `modal_url`/`modal_id` unused keys, chart/query N+1 patterns.
