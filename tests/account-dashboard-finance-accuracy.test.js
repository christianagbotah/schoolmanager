const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dashboardPath = 'application/views/backend/admin/account_dashboard.php';
const dashboard = fs.readFileSync(path.join(root, dashboardPath), 'utf8');

test('account dashboard accumulates raw numeric income before formatting', () => {
  assert.doesNotMatch(
    dashboard,
    /\$total_income\s*\+=\s*number_format\s*\(/,
    'number_format() must not be used inside income arithmetic'
  );

  const numericAccumulations = dashboard.match(/\$total_income\s*\+=\s*\(float\)\s*\$row\['amount'\]/g) || [];
  assert.equal(numericAccumulations.length, 2, 'both filtered and current-term income paths must sum numeric amounts');

  const finalFormatting = dashboard.match(/\$total_income\s*=\s*numfmt_format_currency\s*\(/g) || [];
  assert.equal(finalFormatting.length, 2, 'currency formatting should remain after aggregation in both paths');
});

test('filtered feeding-fee lookup is safe when no rows exist', () => {
  assert.match(dashboard, /\$last_timestamp_result\s*=\s*\$this->db->get\('feeding_fee'\)/);
  assert.match(dashboard, /\$last_timestamp_result->num_rows\(\)\s*>\s*0/);
  assert.match(dashboard, /\?\s*\(int\)\s*\$last_timestamp_result->row\(\)->timestamp\s*:\s*\$timestamp/);
});

test('current-term feeding-fee lookup is safe when no rows exist', () => {
  assert.match(dashboard, /\$feeding_timestamp_result\s*=\s*\$this->db[\s\S]*?->get\('feeding_fee'\);/);
  assert.match(dashboard, /\$feeding_timestamp\s*=\s*\$feeding_timestamp_result->num_rows\(\)\s*>\s*0/);
  assert.match(dashboard, /\?\s*\(int\)\s*\$feeding_timestamp_result->row\(\)->timestamp\s*:\s*strtotime\(date\('d-m-Y'\)\)/);
});
