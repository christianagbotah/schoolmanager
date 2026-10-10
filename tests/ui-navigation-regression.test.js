const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const uiScript = fs.readFileSync(path.join(root, 'assets/js/ui-consistency.js'), 'utf8');

test('AJAX navigation links suppress hash jumps through delegated click handling', () => {
    assert.match(uiScript, /function\s+isAjaxNavigationLink\s*\(/);
    assert.match(uiScript, /event\.preventDefault\s*\(\s*\)/);
    assert.match(uiScript, /addEventListener\s*\(\s*['"]click['"]/);
});

test('AJAX navigation synchronizes one active leaf and opens its ancestors', () => {
    assert.match(uiScript, /function\s+syncSidebarActiveState\s*\(/);
    assert.match(uiScript, /querySelectorAll\s*\(\s*['"]li\.active['"]\s*\)/);
    assert.match(uiScript, /classList\.add\s*\(\s*['"]active['"]\s*\)/);
    assert.match(uiScript, /classList\.add\s*\(\s*['"]opened['"]\s*\)/);
});

test('global interaction contract exposes pointer affordance and disabled fallback', () => {
    assert.match(uiScript, /#main-menu a,/);
    assert.match(uiScript, /\[onclick\]:not\(\[aria-disabled="true"\]\)/);
    assert.match(uiScript, /cursor:\s*pointer\s*!important/);
    assert.match(uiScript, /cursor:\s*not-allowed\s*!important/);
});
