# Deployment Manifest Review — VPS pull model

**Date:** 2026-10-03 · **Repo SHA:** `e45bfa7` · **Mechanism under review:** VPS-side Git pull deployer (`schoolmanager-deploy.service`/`.timer`), per `docs/DEPLOYMENT.md`

This review fulfils the pre-deployment manifest requirement against the
deployed mechanism: what each deployment will create, update and delete, what
it can never touch, and how it was verified. It supersedes the earlier
push/rsync workflow design (`ee4c06f`, withdrawn) — the pull model is simpler
and structurally safer.

## 1. Why the pull model satisfies the protection requirements

Deployment is a **Git fast-forward of the existing VPS working tree**. Git
only ever writes paths that are **tracked in the repository**. Untracked
server content cannot be created, modified or deleted by a `git pull`, so the
entire "server-generated content" protection list is preserved by
construction, not by exclusion rules:

| Protected server content | Protected how |
|---|---|
| `uploads/` — school logo, student photos, staff/driver/vehicle images, gallery/news media, lesson notes, signatures, barcodes | untracked (`.gitignore`: `uploads/*` + `.gitkeep` exceptions) → never touched |
| `application/config/database.php`, `email.php`, `emailerror.php` | untracked → never touched |
| `.env`, `.env.*` | untracked (`.env.example` tracked, harmless) |
| `application/logs/`, `application/cache/` | untracked |
| root `error_log`, `.user.ini`, `*.log` anywhere | untracked |
| `backups/`, `backup/`, `*_backups/`, `*.zip`, `*.tar`, `*.tar.gz` | untracked |
| docroot `.htaccess`, `.well-known/`, server-only runtime files | untracked → never touched |
| deployment state under `/home/lightworld/deployments/schoolmanager` | outside the application tree |

Additional deployer safeguards (per its documented contract): refuses to run
if tracked VPS files have local modifications; requires strict fast-forward
(no history rewrites); lints changed PHP/JS before switching; health-checks
the vhost and **rolls back to the previous commit on failure**; records
manifest, SHAs and timestamps under `/home/lightworld/deployments/schoolmanager/`.

`/home/lightworld/webapps/rochas` is never read, written, compared or
executed against, and the deploy target is hard-asserted in CI.

## 2. What a deployment changes (manifest)

Against the earliest sanitized baseline (`cb1487b`) as a representative
"behind" state — the VPS deployer's `last_manifest.txt` records the real,
exact manifest for each run:

- **Created (8):** `assets/css/design-system.css`, `assets/css/shell-modern.css`,
  and 6 `docs/**` files added since the baseline.
- **Updated (15):** modernized views/controllers/styles added during Waves 0–2
  (shell reskin, error pages, sync hardening, dashboard modernization).
- **Deleted (≤23):** only files that are **tracked and were removed from the
  repository** — i.e. the owner-verified retired integration fragments
  (`Student_termly_bill.php`, `Finance_model_extended.php`,
  `Admin_credit_methods.php`, `Admin_credit_integration.php`,
  `transaction_sync_handlers.php`, `api/Sync_additional_methods.php`,
  `credit_integration_hooks.php`) and the junk/backup files
  (`Admin.php.backup`, `Admin.php.bak`, `Admin_backup.php`,
  `Fee_collection.php.backup_*`, `get_bulk_invoices_function.php`,
  `getValue())`, `result_array()`, view `.backup` copies, `payments/receivables_MODERNIZED.php`,
  `app.js.orig`, `application/schoolmanager.sql`). All were removed in the
  repo by owner-verified commits (`2554715`, `11497df`) — deletion on the VPS
  is the intended cleanup.

There is no `rsync --delete` and no directory-level destructive sync anywhere
in the pipeline.

## 3. Verification performed (repo side; no server access)

- `.gitignore` audited line-by-line against the protection list — complete
  coverage (see table in §1).
- Confirmed the tracked tree contains no secrets, credentials, keys or
  archives (CI secret-scan + repo audit; `schema/` redacted SQL only).
- Deployment handoff workflow (`.github/workflows/deploy.yml`) validated:
  YAML parses, push trigger targets `main`, PHP-lints changed files, asserts
  the schoolmanager target, never references `rochas` as a target.
- Confirmed tracked-but-inert directories (`docs/`, `schema/`, `database/`,
  `update/`, `update_pack/`, `optimum/`, `bootstrap-temp/`) deploy with the
  tree — identical to the existing git-based VPS state, so no new exposure is
  introduced. (Optional future hardening: serve or exclude `/docs` at the
  webserver level; not a code concern.)

## 4. Owner observability

- Deploy history: `tail -100 /home/lightworld/deployments/schoolmanager/deploy.log`
- Exact per-run manifest: `/home/lightworld/deployments/schoolmanager/last_manifest.txt`
- Deployed SHA: `/home/lightworld/deployments/schoolmanager/last_successful_sha`
- Force a check: `systemctl start schoolmanager-deploy.service`
- Timer status: `systemctl status schoolmanager-deploy.timer`
- Rollback is automatic on health-check failure; manual code rollback is
  `git -C /home/lightworld/webapps/schoolmanager checkout <previous_sha>` if
  ever needed (runtime files are unaffected either way).

## 5. Residual notes

- The VPS working-tree SHA is not readable from the repo side; the first
  deployer run after this commit reports the true delta in `last_manifest.txt`.
  GitHub `main` is ahead of the VPS by design until the timer catches up.
- No GitHub SSH secrets are required; the deployer polls `origin/main`
  read-only over HTTPS using the VPS-side credential.
- The normal CI workflow (`.github/workflows/ci.yml`) remains the full-tree
  quality gate; the handoff workflow is a lighter per-release validation.
