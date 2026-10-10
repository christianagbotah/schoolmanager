const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const uiScript = fs.readFileSync(path.join(root, 'assets/js/ui-consistency.js'), 'utf8');
const uiCss = fs.readFileSync(path.join(root, 'assets/css/ui-consistency.css'), 'utf8');

test('AJAX navigation links suppress hash jumps through delegated click handling', () => {
    assert.match(uiScript, /function\s+isAjaxNavigationLink\s*\(/);
    assert.match(uiScript, /event\.preventDefault\s*\(\s*\)/);
    assert.match(uiScript, /addEventListener\s*\(\s*['"]click['"]/);
});

test('AJAX navigation synchronizes the active sidebar branch', () => {
    assert.match(uiScript, /function\s+syncSidebarActiveState\s*\(/);
    assert.match(uiScript, /classList\.add\s*\(\s*['"]active['"]\s*\)/);
    assert.match(uiScript, /classList\.add\s*\(\s*['"]opened['"]\s*\)/);
});

test('global interaction contract exposes pointer affordance and disabled fallback', () => {
    assert.match(uiCss, /#main-menu[\s\S]*cursor:\s*pointer/);
    assert.match(uiCss, /\[onclick\][\s\S]*cursor:\s*pointer/);
    assert.match(uiCss, /:disabled[\s\S]*cursor:\s*not-allowed/);
});
