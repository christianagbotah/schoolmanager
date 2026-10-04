# SMS Automation Operations

## Current supported scheduled workflow

SchoolManager currently has one scheduled SMS automation workflow that is connected end-to-end:

- **Trigger:** `monthly_bill_reminder`
- **Recipients:** parents/guardians with students who have outstanding invoice balances in the current academic year and term
- **Schedule:** **08:00 Africa/Accra on the 1st day of every month**
- **Execution:** CLI-only via `index.php cron monthly_bill_reminders`
- **Provider:** the active SMS provider configured in SchoolManager (currently expected to be Hubtel where configured)

Legacy automation records with other trigger names may still exist in the database. They are visible for audit/history, but they must not be treated as executable until a real workflow is implemented for that trigger.

## Security model

The monthly automation endpoint is intentionally **CLI-only**. It must not be exposed as a public URL capable of sending bulk SMS.

The `Sms_automation` controller requires an authenticated admin session. Status changes and destructive actions use POST endpoints. Test sends are explicit admin actions and send a real provider SMS, so they may consume SMS credit.

## Install or restore the scheduler

From the repository root:

```bash
chmod +x scripts/install-sms-automation-cron.sh
./scripts/install-sms-automation-cron.sh
```

Default runtime values:

```text
Application: /home/lightworld/webapps/schoolmanager
PHP:         /usr/local/bin/php
Log:         application/logs/sms-automation-cron.log
Lock:        /run/lock/schoolmanager-sms-automation.lock
Timezone:    Africa/Accra
```

The installer is idempotent: it removes any existing crontab line carrying the `schoolmanager-sms-automation` marker before installing the canonical schedule.

Environment overrides are available when required:

```bash
SCHOOLMANAGER_APP_DIR=/path/to/app \
SCHOOLMANAGER_PHP_BIN=/path/to/php \
SCHOOLMANAGER_SMS_CRON_LOG=/path/to/log \
SCHOOLMANAGER_SMS_CRON_LOCK=/path/to/lock \
./scripts/install-sms-automation-cron.sh
```

## Safe verification

Check the installed cron:

```bash
crontab -l | grep schoolmanager-sms-automation
```

Run the CLI command manually only when you understand whether an active monthly rule exists:

```bash
/usr/local/bin/php index.php cron monthly_bill_reminders
```

If there is no active supported rule, the command should report `skipped` and send nothing. The cron executor also prevents a normal monthly run from running twice within the same month.

Do **not** use the optional `force` argument in routine operations; it is intended only for controlled diagnostics because it bypasses the monthly duplicate-run check.

## Logs

Cron stdout/stderr is appended to:

```text
application/logs/sms-automation-cron.log
```

Individual delivery attempts are recorded in `sms_automation_logs` with `pending`, `sent`, or `failed` status. The admin SMS Automation page should be used to review these logs.

## Operational checklist

Before activating a monthly bill reminder:

1. Confirm the SMS provider is enabled and funded.
2. Review the message template and placeholders.
3. Use **Send Real Test SMS** to a controlled phone number.
4. Confirm the test delivery and log entry.
5. Activate only one `monthly_bill_reminder` rule.
6. Confirm the scheduler is installed.
7. After the first scheduled run, verify the cron log and automation delivery logs.
