(function () {
    'use strict';

    var scheduled = false;
    var pageObserver = null;
    var ADMIN_DASHBOARD_ROW_TWO = ['Collected for term', 'Fee arrears', 'Daily Revenue', 'Collection Rate'];
    var ADMIN_DASHBOARD_ROW_THREE = ['Students with outstanding bills', 'Bad debt / muted students', 'Total Income', 'Total Expenses'];

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

    function closestAnchor(target) {
        var node = target;
        while (node && node !== document) {
            if (node.tagName === 'A') return node;
            node = node.parentElement;
        }
        return null;
    }

    function closestListItem(node) {
        while (node && node !== document) {
            if (node.tagName === 'LI') return node;
            node = node.parentElement;
        }
        return null;
    }

    function isAjaxNavigationLink(anchor) {
        if (!anchor || !anchor.getAttribute) return false;
        var inlineHandler = anchor.getAttribute('onclick') || '';
        return /(^|[^A-Za-z0-9_$])navigation\s*\(/.test(inlineHandler);
    }

    function syncSidebarActiveState(anchor) {
        var menu = document.getElementById('main-menu');
        if (!menu || !anchor || !menu.contains(anchor)) return;

        var activeItem = closestListItem(anchor);
        if (!activeItem) return;

        Array.prototype.forEach.call(menu.querySelectorAll('li.active'), function (item) {
            item.classList.remove('active');
        });

        activeItem.classList.add('active');

        var ancestor = activeItem.parentElement;
        while (ancestor && ancestor !== menu) {
            if (ancestor.tagName === 'LI') {
                ancestor.classList.add('opened');
            }
            ancestor = ancestor.parentElement;
        }
    }

    function handleAjaxNavigationClick(event) {
        var anchor = closestAnchor(event.target);
        if (!isAjaxNavigationLink(anchor)) return;
        event.preventDefault();
        syncSidebarActiveState(anchor);
    }

    function ensureInteractionStyles() {
        if (document.getElementById('sm-ui-interaction-contract')) return;

        var style = document.createElement('style');
        style.id = 'sm-ui-interaction-contract';
        style.textContent = [
            '#main-menu a,',
            'a[href],',
            'a[onclick],',
            'button:not(:disabled),',
            'input[type="button"]:not(:disabled),',
            'input[type="submit"]:not(:disabled),',
            'input[type="reset"]:not(:disabled),',
            '[role="button"]:not([aria-disabled="true"]),',
            '[onclick]:not([aria-disabled="true"]) {',
            '    cursor: pointer !important;',
            '}',
            'button:disabled,',
            'input[type="button"]:disabled,',
            'input[type="submit"]:disabled,',
            'input[type="reset"]:disabled,',
            '[aria-disabled="true"] {',
            '    cursor: not-allowed !important;',
            '}',
            '#sm-dashboard-approved-summary .dashboard-card {',
            '    min-height: 156px !important;',
            '    height: 100% !important;',
            '    padding: 20px !important;',
            '    display: flex !important;',
            '    align-items: center !important;',
            '}',
            '#sm-dashboard-approved-summary .sm-dashboard-metric-link {',
            '    display: block;',
            '    height: 100%;',
            '    color: inherit;',
            '    text-decoration: none !important;',
            '}',
            '#sm-dashboard-approved-summary .sm-dashboard-metric-value {',
            '    font-size: 30px;',
            '    font-weight: 800;',
            '    line-height: 1.05;',
            '    color: #111827;',
            '    overflow-wrap: anywhere;',
            '}',
            '@media (max-width: 767px) {',
            '    #sm-dashboard-approved-summary .dashboard-card { min-height: 132px !important; }',
            '    #sm-dashboard-approved-summary .sm-dashboard-metric-value { font-size: 27px; }',
            '}'
        ].join('\n');
        (document.head || document.documentElement).appendChild(style);
    }

    function normalizeText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function findDashboardText(main, label) {
        var wanted = normalizeText(label);
        var nodes = main.querySelectorAll('h2, h3, h4, p, span');
        for (var i = 0; i < nodes.length; i += 1) {
            if (normalizeText(nodes[i].textContent) === wanted) return nodes[i];
        }
        return null;
    }

    function findDashboardMetric(main, label) {
        var labelNode = findDashboardText(main, label);
        if (!labelNode) return null;
        var card = labelNode.closest ? labelNode.closest('.dashboard-card') : null;
        if (!card) return { labelNode: labelNode, card: null, action: closestAnchor(labelNode) };
        var action = card.parentElement && card.parentElement.tagName === 'A' ? card.parentElement : closestAnchor(labelNode);
        return { labelNode: labelNode, card: card, action: action };
    }

    function firstValueElement(scope) {
        if (!scope || !scope.querySelector) return null;
        return scope.querySelector('.text-4xl, .text-3xl, .dash-hero-value, .text-2xl');
    }

    function dashboardMetricValue(metric, fallback) {
        var scope = metric && (metric.card || metric.action || metric.labelNode);
        var value = firstValueElement(scope);
        return value ? value.innerHTML : fallback;
    }

    function cloneActionShell(action) {
        var shell;
        if (action && action.tagName === 'A') {
            shell = action.cloneNode(false);
            shell.removeAttribute('id');
            shell.className = 'sm-dashboard-metric-link';
            shell.style.cssText = 'height:100%;text-decoration:none;color:inherit;';
            var handler = shell.getAttribute('onclick') || '';
            if (shell.getAttribute('href') === '#' && handler && handler.indexOf('showAjaxModal') !== -1) {
                shell.setAttribute('href', 'javascript:;');
            }
        } else {
            shell = document.createElement('div');
            shell.className = 'sm-dashboard-metric-link';
        }
        return shell;
    }

    function createDashboardSummaryCard(options) {
        var shell = cloneActionShell(options.action);
        var card = document.createElement('div');
        card.className = 'dashboard-card';
        card.style.borderLeft = '5px solid ' + options.accent;

        var body = document.createElement('div');
        body.className = 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3';
        body.style.width = '100%';

        var left = document.createElement('div');
        left.className = 'flex flex-col items-start gap-2';
        left.innerHTML = '<div class="stat-icon" style="background:' + options.gradient + ';width:56px;height:56px;font-size:26px;"><i class="' + options.icon + '"></i></div>' +
            '<h3 class="text-gray-700 font-medium" style="font-size:15px;">' + options.title + '</h3>';

        var right = document.createElement('div');
        right.className = 'text-right ml-auto';
        right.innerHTML = '<p class="sm-dashboard-metric-value mb-1">' + options.valueHtml + '</p>' +
            '<p class="text-gray-600" style="font-size:14px;">' + options.subtitle + '</p>';

        body.appendChild(left);
        body.appendChild(right);
        card.appendChild(body);
        shell.appendChild(card);
        return shell;
    }

    function dashboardGrid() {
        var grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6';
        return grid;
    }

    function composeAdminDashboardSummary() {
        var main = document.getElementById('main_page');
        if (!main || document.getElementById('sm-dashboard-approved-summary')) return;
        if (!findDashboardText(main, 'Dashboard Overview')) return;

        var totalStudents = findDashboardMetric(main, 'Total Students');
        var dailyRevenue = findDashboardMetric(main, 'Daily Revenue');
        var collectionRate = findDashboardMetric(main, 'Collection Rate');
        var studentCredits = findDashboardMetric(main, 'Student Credits');
        var outstanding = findDashboardMetric(main, 'Outstanding Debt');
        var unpaidInvoices = findDashboardMetric(main, 'Unpaid Invoices');
        var totalIncome = findDashboardMetric(main, 'Total Income');
        var totalExpenses = findDashboardMetric(main, 'Total Termly Expenses');
        var termlyFeesLabel = findDashboardText(main, 'Termly Fees Collection');
        var badDebtLabel = findDashboardText(main, 'Bad Debt (muted students)');

        // The complete approved finance summary is super-admin-only in the
        // legacy view. Other roles retain their existing role-specific layout.
        if (!totalStudents || !dailyRevenue || !collectionRate || !outstanding || !unpaidInvoices || !totalIncome || !totalExpenses) return;

        var firstRow = totalStudents.card && totalStudents.card.parentElement && totalStudents.card.parentElement.tagName === 'A' ? totalStudents.card.parentElement.parentElement : null;
        if (!firstRow) return;

        var oldFinanceGrid = dailyRevenue.card ? dailyRevenue.card.parentElement : null;
        if (oldFinanceGrid && oldFinanceGrid.tagName === 'A') oldFinanceGrid = oldFinanceGrid.parentElement;
        if (!oldFinanceGrid || oldFinanceGrid === firstRow) return;

        var termlyHero = termlyFeesLabel && termlyFeesLabel.closest ? termlyFeesLabel.closest('.dash-hero') : null;
        var termlyValue = termlyHero ? termlyHero.querySelector('.dash-hero-value') : null;
        var dailyFeeAction = main.querySelector('.dash-fee-tile') ? closestAnchor(main.querySelector('.dash-fee-tile')) : null;

        var outstandingAction = outstanding.card ? outstanding.card.querySelector('a[onclick*="modal_outstanding_debt"]') : null;
        var outstandingValue = outstandingAction ? firstValueElement(outstandingAction) : null;
        var badDebtAction = badDebtLabel ? closestAnchor(badDebtLabel) : null;
        var badDebtValue = badDebtAction ? firstValueElement(badDebtAction) : null;

        var summary = document.createElement('div');
        summary.id = 'sm-dashboard-approved-summary';
        summary.setAttribute('data-row-two', ADMIN_DASHBOARD_ROW_TWO.join(' | '));
        summary.setAttribute('data-row-three', ADMIN_DASHBOARD_ROW_THREE.join(' | '));

        var rowTwo = dashboardGrid();
        rowTwo.setAttribute('aria-label', 'Finance KPI row two');
        rowTwo.appendChild(createDashboardSummaryCard({
            title: 'Collected for term',
            valueHtml: termlyValue ? termlyValue.innerHTML : '<span class="currency-symbol">₵</span>0.00',
            subtitle: 'Daily-fee modules this term',
            accent: '#10b981', gradient: 'linear-gradient(135deg,#34d399 0%,#059669 100%)', icon: 'fa fa-wallet', action: dailyFeeAction
        }));
        rowTwo.appendChild(createDashboardSummaryCard({
            title: 'Fee arrears',
            valueHtml: dashboardMetricValue(unpaidInvoices, '<span class="currency-symbol">₵</span>0.00'),
            subtitle: 'Unpaid billed fees',
            accent: '#8b5cf6', gradient: 'linear-gradient(135deg,#c4b5fd 0%,#7c3aed 100%)', icon: 'fa fa-credit-card', action: unpaidInvoices.action
        }));
        rowTwo.appendChild(createDashboardSummaryCard({
            title: 'Daily Revenue',
            valueHtml: dashboardMetricValue(dailyRevenue, '<span class="currency-symbol">₵</span>0.00'),
            subtitle: 'Selected day collections',
            accent: '#43e97b', gradient: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)', icon: 'entypo-chart-line', action: dailyRevenue.action
        }));
        rowTwo.appendChild(createDashboardSummaryCard({
            title: 'Collection Rate',
            valueHtml: dashboardMetricValue(collectionRate, '0%'),
            subtitle: 'Collected against billed fees',
            accent: '#667eea', gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', icon: 'entypo-gauge', action: collectionRate.action
        }));

        var rowThree = dashboardGrid();
        rowThree.setAttribute('aria-label', 'Finance KPI row three');
        rowThree.appendChild(createDashboardSummaryCard({
            title: 'Students with outstanding bills',
            valueHtml: outstandingValue ? outstandingValue.innerHTML : '0',
            subtitle: 'Active students',
            accent: '#f59e0b', gradient: 'linear-gradient(135deg,#fbbf24 0%,#f97316 100%)', icon: 'entypo-credit-card', action: outstandingAction
        }));
        rowThree.appendChild(createDashboardSummaryCard({
            title: 'Bad debt / muted students',
            valueHtml: badDebtValue ? badDebtValue.innerHTML : '0',
            subtitle: 'Muted student accounts',
            accent: '#ef4444', gradient: 'linear-gradient(135deg,#fb7185 0%,#dc2626 100%)', icon: 'fa fa-ban', action: badDebtAction
        }));
        rowThree.appendChild(createDashboardSummaryCard({
            title: 'Total Income',
            valueHtml: dashboardMetricValue(totalIncome, '<span class="currency-symbol">₵</span>0.00'),
            subtitle: 'Received this term',
            accent: '#10b981', gradient: 'linear-gradient(135deg,#6ee7b7 0%,#059669 100%)', icon: 'fa fa-wallet', action: totalIncome.action
        }));
        rowThree.appendChild(createDashboardSummaryCard({
            title: 'Total Expenses',
            valueHtml: dashboardMetricValue(totalExpenses, '<span class="currency-symbol">₵</span>0.00'),
            subtitle: 'Spent this term',
            accent: '#f97316', gradient: 'linear-gradient(135deg,#fdba74 0%,#ea580c 100%)', icon: 'fa fa-tags', action: totalExpenses.action
        }));

        summary.appendChild(rowTwo);
        summary.appendChild(rowThree);

        if (studentCredits && studentCredits.action) {
            var secondary = document.createElement('div');
            secondary.className = 'sm-dashboard-secondary-finance grid grid-cols-1 mb-6';
            var creditClone = studentCredits.action.cloneNode(true);
            creditClone.classList.add('sm-dashboard-credit-widget');
            var creditCard = creditClone.querySelector('.dashboard-card');
            if (creditCard) creditCard.style.minHeight = '128px';
            secondary.appendChild(creditClone);
            summary.appendChild(secondary);
        }

        firstRow.insertAdjacentElement('afterend', summary);
        oldFinanceGrid.style.display = 'none';
        oldFinanceGrid.setAttribute('aria-hidden', 'true');
        oldFinanceGrid.setAttribute('data-sm-dashboard-source-grid', 'true');
    }

    function markPageChrome() {
        var main = document.getElementById('main_page');
        if (!main) return;

        main.querySelectorAll('.sm-ui-page-root').forEach(function (el) { el.classList.remove('sm-ui-page-root'); });
        main.querySelectorAll('.sm-ui-page-shell').forEach(function (el) { el.classList.remove('sm-ui-page-shell'); });
        main.querySelectorAll('.sm-ui-page-title').forEach(function (el) { el.classList.remove('sm-ui-page-title'); });
        main.querySelectorAll('.sm-ui-leading-rule').forEach(function (el) { el.classList.remove('sm-ui-leading-rule'); });
        main.querySelectorAll('.sm-ui-inline-controls').forEach(function (el) { el.classList.remove('sm-ui-inline-controls'); });

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

        main.querySelectorAll('form .row').forEach(function (row) {
            var directColumns = Array.prototype.filter.call(row.children, function (child) {
                return typeof child.className === 'string' && /(^|\s)col-(xs|sm|md|lg)-\d+/.test(child.className);
            });
            if (directColumns.length < 2 || directColumns.length > 6) return;
            if (row.querySelector('textarea')) return;
            var controls = row.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select');
            var submits = row.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
            if (controls.length >= 2 && submits.length >= 1) row.classList.add('sm-ui-inline-controls');
        });
    }

    function syncTopbarHeight() {
        var topbar = document.getElementById('top');
        if (!topbar) return;
        var height = Math.ceil(topbar.getBoundingClientRect().height || topbar.offsetHeight || 0);
        if (height > 0) document.documentElement.style.setProperty('--sm-topbar-height-dynamic', height + 'px');
    }

    function applyUiConsistency() {
        scheduled = false;
        ensureInteractionStyles();
        syncTopbarHeight();
        markPageChrome();
        composeAdminDashboardSummary();
    }

    function scheduleSync() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(applyUiConsistency);
    }

    document.addEventListener('click', handleAjaxNavigationClick, true);

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

    if (window.jQuery) window.jQuery(document).ajaxComplete(scheduleSync);
})();
