#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${SCHOOLMANAGER_APP_DIR:-/home/lightworld/webapps/schoolmanager}"
PHP_BIN="${SCHOOLMANAGER_PHP_BIN:-/usr/local/bin/php}"
LOG_FILE="${SCHOOLMANAGER_SMS_CRON_LOG:-${APP_DIR}/application/logs/sms-automation-cron.log}"
LOCK_FILE="${SCHOOLMANAGER_SMS_CRON_LOCK:-/run/lock/schoolmanager-sms-automation.lock}"
MARKER="schoolmanager-sms-automation"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "SchoolManager directory not found: ${APP_DIR}" >&2
  exit 1
fi

if [[ ! -x "${PHP_BIN}" ]]; then
  echo "PHP binary not executable: ${PHP_BIN}" >&2
  exit 1
fi

mkdir -p "$(dirname "${LOG_FILE}")"

TMP_CRON="$(mktemp)"
trap 'rm -f "${TMP_CRON}"' EXIT

crontab -l 2>/dev/null | grep -v "${MARKER}" > "${TMP_CRON}" || true
cat >> "${TMP_CRON}" <<EOF

# SchoolManager monthly SMS automation
CRON_TZ=Africa/Accra
0 8 1 * * cd ${APP_DIR} && flock -n ${LOCK_FILE} ${PHP_BIN} index.php cron monthly_bill_reminders >> ${LOG_FILE} 2>&1 # ${MARKER}
EOF

crontab "${TMP_CRON}"

echo "Installed SchoolManager SMS automation cron: 08:00 Africa/Accra on the 1st of each month."
echo "Command: ${PHP_BIN} index.php cron monthly_bill_reminders"
