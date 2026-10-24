const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const viewPath = 'application/views/backend/cashier/daily_fee_collection.php';
const view = fs.readFileSync(viewPath, 'utf8');

function renderRecentBody() {
  const start = view.indexOf('function renderRecent(history)');
  assert.ok(start >= 0, 'missing renderRecent(history)');
  const end = view.indexOf('function renderPreferences', start);
  assert.ok(end > start, 'could not isolate renderRecent(history)');
  return view.slice(start, end);
}

test('recent cashier payments expose a direct printable receipt action', () => {
  const body = renderRecentBody();
  assert.match(body, /row\.transaction_code/);
  assert.match(body, /cashier\/print_daily_fee_receipt\//);
  assert.match(body, /recent-receipt-link/);
  assert.match(body, /Reprint receipt/i);
  assert.match(body, /target=["']_blank["']/);
  assert.match(body, /rel=["']noopener["']/);
});

test('recent receipt action is only rendered when a transaction code exists', () => {
  const body = renderRecentBody();
  assert.match(body, /if\s*\(\s*transactionCode\s*\)/);
  assert.match(body, /encodeURIComponent\(transactionCode\)/);
});

test('recent receipt action has a visible compact control style', () => {
  assert.match(view, /\.recent-receipt-link\s*\{/);
  assert.match(view, /\.recent-payment-meta\s*\{/);
});
