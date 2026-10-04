# SchoolManager SMS Automation Cron

The SMS automation executor is intentionally **CLI-only**. Do not expose or schedule it through a public HTTP URL.

## Production schedule

Timezone: `Africa/Accra`

```cron
0 8 1 * * cd /home/lightworld/webapps/schoolmanager && flock -n /run/lock/schoolmanager-sms-automation.lock /usr/local/bin/php index.php cron monthly_bill_reminders >> /home/lightworld/webapps/schoolmanager/application/logs/sms-automation-cron.log 2>&1
```

This runs at 08:00 on the first day of each month. The controller also refuses a second non-forced run in the same calendar month.

## Safe verification

Run this only when no active `monthly_bill_reminder` rule exists, or when you intentionally want to execute the active rule:

```bash
cd /home/lightworld/webapps/schoolmanager
/usr/local/bin/php index.php cron monthly_bill_reminders
```

Expected result with no active rule:

```json
{"status":"skipped","message":"No active monthly bill reminder automation found"}
```

## Supported automation trigger

At present the only trigger with a production executor is:

- `monthly_bill_reminder`

Legacy rules with other trigger names remain visible for audit/history, but the admin UI marks them as not executable and prevents re-activation until a real workflow is implemented.
