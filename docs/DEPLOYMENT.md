# SchoolManager deployment

SchoolManager uses a VPS-side pull deployment model.

## Source and target

- GitHub branch: `main`
- VPS application: `/home/lightworld/webapps/schoolmanager`
- Live URL: `https://schoolmanager.lightworldtech.com`
- Out-of-scope live legacy directory: `/home/lightworld/webapps/rochas`

The `rochas` directory must never be read, modified, deployed to, or used by the SchoolManager deployment process.

## How deployment works

The VPS runs:

- `schoolmanager-deploy.service`
- `schoolmanager-deploy.timer`

The timer checks GitHub `origin/main` once per minute.

When a newer fast-forward commit exists, the deployer:

1. refuses to deploy if tracked VPS files have local modifications;
2. fetches `origin/main`;
3. requires a strict fast-forward from the deployed commit;
4. creates a temporary archive of the candidate commit;
5. records a changed-file manifest;
6. PHP-lints changed PHP files;
7. Node syntax-checks changed JavaScript files when Node is available;
8. fast-forwards the existing SchoolManager Git working tree;
9. preserves ignored/runtime files;
10. checks the local SchoolManager vhost;
11. rolls code back to the previous commit if the health check fails;
12. records the successfully deployed SHA.

There is no `rsync --delete` deployment.

## Runtime data preserved

The Git repository ignores runtime/server-specific content including:

- `application/config/database.php`
- `application/config/email.php`
- `application/config/emailerror.php`
- `.env`
- `uploads/*`
- `application/cache/*`
- `application/logs/*`
- root `error_log`
- backups and package archives

Because deployment is a Git fast-forward rather than a destructive directory sync, ignored runtime files are left in place.

## Deployment state

Runtime deployment state is stored outside the application tree at:

`/home/lightworld/deployments/schoolmanager`

Important files include:

- `deploy.log`
- `last_manifest.txt`
- `previous_sha`
- `candidate_sha`
- `last_successful_sha`
- `last_successful_at`
- `last_health.html`

## Manual VPS commands

Check the timer:

```bash
systemctl status schoolmanager-deploy.timer
```

Run a deployment check immediately:

```bash
systemctl start schoolmanager-deploy.service
```

Review deployment history:

```bash
tail -100 /home/lightworld/deployments/schoolmanager/deploy.log
```

The installed deploy script is:

`/home/lightworld/bin/schoolmanager-deploy.sh`

## GitHub Actions

`.github/workflows/deploy.yml` is a deployment handoff/validation workflow.

GitHub does not SSH into the VPS and does not require an SSH private key in repository secrets. The VPS independently polls `origin/main` and deploys validated fast-forward commits.

The normal CI workflow remains the authoritative full-tree repository quality gate.
