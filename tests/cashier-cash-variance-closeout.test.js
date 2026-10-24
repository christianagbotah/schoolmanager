const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const reportPath = 'application/views/backend/cashier/daily_collection_report.php';
const report = fs.readFileSync(reportPath, 'utf8');

test('cashier daily closeout exposes a counted-cash variance helper', () => {
  assert.match(report, /Cash drawer closeout/i);
  assert.match(report, /id=["']systemCash["']/);
  assert.match(report, /id=["']countedCash["']/);
  assert.match(report, /id=["']cashVariance["']/);
  assert.match(report, /data-system-cash=/);
  assert.match(report, /function\s+updateCashVariance\s*\(/);
  assert.match(report, /counted\s*-\s*expected|counted cash minus system cash/i);
});

test('cash variance helper remains display-only and does not introduce a closeout mutation endpoint', () => {
  assert.doesNotMatch(report, /cashier\/(save|submit|post|process)[^"']*(variance|closeout|reconciliation)/i);
  assert.doesNotMatch(report, /method=["']post["'][^>]*[^>]*(variance|closeout)/i);
});

test('cash variance helper has accessible status messaging and mobile layout support', () => {
  assert.match(report, /aria-live=["']polite["']/);
  assert.match(report, /id=["']cashVarianceStatus["']/);
  assert.match(report, /@media\s*\(max-width:\s*767px\)/);
});
