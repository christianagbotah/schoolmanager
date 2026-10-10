const test = require('node:test');
const assert = require('node:assert/strict');

const expectedRows = [
  ['Active Students', 'Active Teachers', 'Active Parents', 'Attendance'],
  ['Collected for Term', 'Fee Arrears', 'Daily Revenue', 'Collection Rate'],
  ['Students with Outstanding Bills', 'Bad Debt / Muted Students', 'Total Income', 'Total Expenses']
];

test('admin dashboard exposes the approved three-row KPI order', () => {
  const layout = require('../assets/js/admin-dashboard-layout.js');
  assert.deepEqual(layout.DASHBOARD_CARD_ORDER, expectedRows);
});

test('dashboard source mapping preserves live finance sources without recalculation', () => {
  const layout = require('../assets/js/admin-dashboard-layout.js');
  assert.equal(layout.sourceKeyFor('Collected for Term'), 'Total Income');
  assert.equal(layout.sourceKeyFor('Fee Arrears'), 'Unpaid Invoices');
  assert.equal(layout.sourceKeyFor('Daily Revenue'), 'Daily Revenue');
  assert.equal(layout.sourceKeyFor('Collection Rate'), 'Collection Rate');
  assert.equal(layout.sourceKeyFor('Students with Outstanding Bills'), 'Outstanding Debt');
  assert.equal(layout.sourceKeyFor('Bad Debt / Muted Students'), 'Outstanding Debt');
  assert.equal(layout.sourceKeyFor('Total Income'), 'Total Income');
  assert.equal(layout.sourceKeyFor('Total Expenses'), 'Total Termly Expenses');
});
