(function () {
    'use strict';

    var scheduled = false;
    var pageObserver = null;

    function depthFrom(node, root) {
        var depth = 0;
        while (node && node !== root) {
            depth += 1;
            node = node.parentElement;
        }
        return node === root ? depth : 999;
    }

    function isPageShellCandidate(element) {
        if (!element || !element.className || typeof element.className !== 'string') return false;
        var classes = element.className.toLowerCase();
        if (classes.indexOf('workspace') !== -1) return true;
        if (/(^|\s)[a-z0-9_-]+-page(\s|$)/.test(classes)) return true;
        return false;
    }

    function isKpiHeading(heading, root) {
        var node = heading.parentElement;
        while (node && node !== root) {
            var classes = typeof node.className === 'string' ? node.className.toLowerCase() : '';
            if (/(^|[-_\s])(stat|kpi|metric|amount|total|tile)([-_\s]|$)/.test(classes)) return true;
            if (node.matches && (node.matches('.modal, .panel-body, table, thead, tbody, tfoot'))) return true;
            node = node.parentElement;
        }
        return false;
    }

    function isPageHeading(heading, root) {
        if (!heading || isKpiHeading(heading, root)) return false;
        if (heading.tagName === 'H1') return true;
        if (heading.tagName !== 'H2') return false;
        if (heading.parentElement === root) return true;

        var node = heading.parentElement;
        while (node && node !== root) {
            var classes = typeof node.className === 'string' ? node.className.toLowerCase() : '';
            if (/(^|[-_\s])(card|panel|widget|section|modal|stat|kpi|metric)([-_\s]|$)/.test(classes)) return false;
            if (/(page[-_\s]*(head|header|title)|workspace[-_\s]*head|hero|modern[-_\s]*header|enterprise[-_\s]*header|admission[-_\s]*header)/.test(classes)) return true;
            node = node.parentElement;
        }
        return false;
    }

    function markPageChrome() {
        var main = document.getElementById('main_page');
        if (!main) return;

        main.querySelectorAll('.sm-ui-page-root').forEach(function (el) {
            el.classList.remove('sm-ui-page-root');
        });
        main.querySelectorAll('.sm-ui-page-shell').forEach(function (el) {
            el.classList.remove('sm-ui-page-shell');
        });
        main.querySelectorAll('.sm-ui-page-title').forEach(function (el) {
            el.classList.remove('sm-ui-page-title');
        });
        main.querySelectorAll('.sm-ui-leading-rule').forEach(function (el) {
            el.classList.remove('sm-ui-leading-rule');
        });
        main.querySelectorAll('.sm-ui-inline-controls').forEach(function (el) {
            el.classList.remove('sm-ui-inline-controls');
        });

        var root = null;
        Array.prototype.forEach.call(main.children, function (child) {
            if (root) return;
            var tag = child.tagName;
            if (tag === 'STYLE' || tag === 'SCRIPT') return;
            if (tag === 'HR') {
                child.classList.add('sm-ui-leading-rule');
                return;
            }
            root = child;
        });

        if (root) {
            root.classList.add('sm-ui-page-root');

            var shell = isPageShellCandidate(root) ? root : null;
            if (!shell) {
                var topLevel = Array.prototype.slice.call(main.children, 0, 8);
                for (var i = 0; i < topLevel.length && !shell; i += 1) {
                    var block = topLevel[i];
                    if (isPageShellCandidate(block)) {
                        shell = block;
                        break;
                    }
                    var candidates = block.querySelectorAll ? block.querySelectorAll('[class*="workspace"], [class*="-page"]') : [];
                    for (var c = 0; c < candidates.length; c += 1) {
                        if (depthFrom(candidates[c], block) <= 3 && isPageShellCandidate(candidates[c])) {
                            shell = candidates[c];
                            break;
                        }
                    }
                }
            }
            if (shell) shell.classList.add('sm-ui-page-shell');

            var headingScope = shell || root;
            var headings = headingScope.querySelectorAll('h1, h2');
            for (var h = 0; h < headings.length; h += 1) {
                if (isPageHeading(headings[h], headingScope)) {
                    headings[h].classList.add('sm-ui-page-title');
                    break;
                }
            }
        }

        /*
         * Old selector pages typically have 2-5 Bootstrap columns, multiple
         * fields, no textarea, and one submit button in the same row. Mark
         * only those compact rows so field/button bottoms share a baseline.
         */
        main.querySelectorAll('form .row').forEach(function (row) {
            var directColumns = Array.prototype.filter.call(row.children, function (child) {
                return typeof child.className === 'string' && /(^|\s)col-(xs|sm|md|lg)-\d+/.test(child.className);
            });
            if (directColumns.length < 2 || directColumns.length > 6) return;
            if (row.querySelector('textarea')) return;
            var controls = row.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select');
            var submits = row.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
            if (controls.length >= 2 && submits.length >= 1) {
                row.classList.add('sm-ui-inline-controls');
            }
        });
    }

    function syncTopbarHeight() {
        var topbar = document.getElementById('top');
        if (!topbar) return;
        var height = Math.ceil(topbar.getBoundingClientRect().height || topbar.offsetHeight || 0);
        if (height > 0) {
            document.documentElement.style.setProperty('--sm-topbar-height-dynamic', height + 'px');
        }
    }

    function applyUiConsistency() {
        scheduled = false;
        syncTopbarHeight();
        markPageChrome();
    }

    function scheduleSync() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(applyUiConsistency);
    }

    document.addEventListener('DOMContentLoaded', function () {
        scheduleSync();
        var main = document.getElementById('main_page');
        if (main && window.MutationObserver) {
            pageObserver = new MutationObserver(scheduleSync);
            pageObserver.observe(main, { childList: true, subtree: true });
        }
    });
    window.addEventListener('load', scheduleSync);
    window.addEventListener('resize', scheduleSync, { passive: true });

    if (window.ResizeObserver) {
        document.addEventListener('DOMContentLoaded', function () {
            var topbar = document.getElementById('top');
            if (!topbar) return;
            var observer = new ResizeObserver(scheduleSync);
            observer.observe(topbar);
        });
    }

    if (window.jQuery) {
        window.jQuery(document).ajaxComplete(scheduleSync);
    }
})();
