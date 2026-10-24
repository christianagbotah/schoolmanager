const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const workflow = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');

test('deployment handoff lets the latest main release replace stale work', () => {
  assert.match(workflow, /concurrency:\s*[\s\S]*group:\s*schoolmanager-deployment-handoff/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
});

test('deployment validation cannot occupy the handoff lane indefinitely', () => {
  const match = workflow.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(match, 'deployment handoff job must define timeout-minutes');
  const timeout = Number(match[1]);
  assert.ok(timeout > 0 && timeout <= 10, `expected deployment timeout <= 10 minutes, got ${timeout}`);
});

test('deployment handoff keeps the protected VPS target contract', () => {
  assert.match(workflow, /\/home\/lightworld\/webapps\/schoolmanager/);
  assert.match(workflow, /rochas/);
  assert.match(workflow, /VPS-side Git pull deployer/);
});
