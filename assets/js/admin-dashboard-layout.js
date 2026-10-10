(function (root, factory) {
    var api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.SchoolManagerAdminDashboard = api;
    }
})(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    var DASHBOARD_CARD_ORDER = [
        ['Active Students', 'Active Teachers', 'Active Parents', 'Attendance'],
        ['Collected for Term', 'Fee Arrears', 'Daily Revenue', 'Collection Rate'],
        ['Students with Outstanding Bills', 'Bad Debt / Muted Students', 'Total Income', 'Total Expenses']
    ];

    var SOURCE_KEY_BY_LABEL = {
        'Active Students': 'Total Students',
        'Active Teachers': 'Active Teachers',
        'Active Parents': 'Active Parents',
        'Attendance': 'Attendance',
        'Collected for Term': 'Total Income',
        'Fee Arrears': 'Unpaid Invoices',
        'Daily Revenue': 'Daily Revenue',
        'Collection Rate': 'Collection Rate',
        'Students with Outstanding Bills': 'Outstanding Debt',
        'Bad Debt / Muted Students': 'Outstanding Debt',
        'Total Income': 'Total Income',
        'Total Expenses': 'Total Termly Expenses'
    };

    var CARD_PRESENTATION = {
        'Active Students': { accent: '#667eea', gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', icon: 'fa fa-users', subtitle: 'Currently enrolled' },
        'Active Teachers': { accent: '#f5576c', gradient: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)', icon: 'entypo-users', subtitle: 'Teaching staff' },
        'Active Parents': { accent: '#00f2fe', gradient: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)', icon: 'entypo-user', subtitle: 'Registered guardians' },
        'Attendance': { accent: '#fee140', gradient: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)', icon: 'entypo-chart-bar', subtitle: 'Present today' },
        'Collected for Term': { accent: '#10b981', gradient: 'linear-gradient(135deg,#34d399 0%,#059669 100%)', icon: 'fa fa-wallet', subtitle: 'Collected this term' },
        'Fee Arrears': { accent: '#8b5cf6', gradient: 'linear-gradient(135deg,#c4b5fd 0%,#7c3aed 100%)', icon: 'fa fa-credit-card', subtitle: 'Unpaid billed fees' },
        'Daily Revenue': { accent: '#43e97b', gradient: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)', icon: 'entypo-chart-line', subtitle: 'Selected day collections' },
        'Collection Rate': { accent: '#667eea', gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', icon: 'entypo-gauge', subtitle: 'Collected against billed fees' },
        'Students with Outstanding Bills': { accent: '#f59e0b', gradient: 'linear-gradient(135deg,#fbbf24 0%,#f97316 100%)', icon: 'entypo-credit-card', subtitle: 'Active students' },
        'Bad Debt / Muted Students': { accent: '#ef4444', gradient: 'linear-gradient(135deg,#fb7185 0%,#dc2626 100%)', icon: 'fa fa-ban', subtitle: 'Muted student accounts' },
        'Total Income': { accent: '#10b981', gradient: 'linear-gradient(135deg,#6ee7b7 0%,#059669 100%)', icon: 'fa fa-wallet', subtitle: 'Received this term' },
        'Total Expenses': { accent: '#f97316', gradient: 'linear-gradient(135deg,#fdba74 0%,#ea580c 100%)', icon: 'fa fa-tags', subtitle: 'Spent this term' }
    };

    function sourceKeyFor(label) {
        return SOURCE_KEY_BY_LABEL[label] || label;
    }

    function normalizeText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function closestAnchor(node) {
        while (node && node !== document) {
            if (node.tagName === 'A') return node;
            node = node.parentElement;
        }
        return null;
    }

    function findExactText(root, label) {
        var wanted = normalizeText(label);
        var nodes = root.querySelectorAll('h1, h2, h3, h4, p, span');
        for (var i = 0; i < nodes.length; i += 1) {
            if (normalizeText(nodes[i].textContent) === wanted) return nodes[i];
        }
        return null;
    }

    function findMetric(root, sourceLabel) {
        var labelNode = findExactText(root, sourceLabel);
        if (!labelNode) return null;

        var card = labelNode.closest ? labelNode.closest('.dashboard-card') : null;
        var action = card && card.parentElement && card.parentElement.tagName === 'A'
            ? card.parentElement
            : closestAnchor(labelNode);

        return {
            labelNode: labelNode,
            card: card,
            action: action
        };
    }

    function firstValueElement(scope) {
        if (!scope || !scope.querySelector) return null;
        return scope.querySelector('.text-4xl, .text-3xl, .text-2xl, .dash-hero-value, .sm-dashboard-metric-value');
    }

    function valueHtml(metric, fallback) {
        var scope = metric && (metric.card || metric.action || metric.labelNode);
        var value = firstValueElement(scope);
        return value ? value.innerHTML : fallback;
    }

    function copyActionShell(action) {
        if (!action || action.tagName !== 'A') {
            var div = document.createElement('div');
            div.className = 'sm-dashboard-metric-link';
            return div;
        }

        var shell = document.createElement('a');
        Array.prototype.forEach.call(action.attributes || [], function (attribute) {
            if (attribute.name === 'id' || attribute.name === 'class' || attribute.name === 'style') return;
            shell.setAttribute(attribute.name, attribute.value);
        });
        shell.className = 'sm-dashboard-metric-link';
        shell.style.cssText = 'height:100%;text-decoration:none;color:inherit;';

        if (shell.getAttribute('href') === '#' && shell.getAttribute('onclick')) {
            shell.setAttribute('href', 'javascript:;');
        }

        return shell;
    }

    function buildCard(label, value, action, subtitleOverride) {
        var presentation = CARD_PRESENTATION[label];
        var shell = copyActionShell(action);
        var card = document.createElement('div');
        card.className = 'dashboard-card';
        card.setAttribute('data-dashboard-card', label);
        card.style.borderLeft = '5px solid ' + presentation.accent;

        var body = document.createElement('div');
        body.className = 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3';
        body.style.width = '100%';

        var left = document.createElement('div');
        left.className = 'flex flex-col items-start gap-2';
        left.innerHTML = '<div class="stat-icon" style="background:' + presentation.gradient + ';width:56px;height:56px;font-size:26px;">' +
            '<i class="' + presentation.icon + '"></i></div>' +
            '<h3 class="text-gray-700 font-medium" style="font-size:15px;">' + label + '</h3>';

        var right = document.createElement('div');
        right.className = 'text-right ml-auto';
        right.innerHTML = '<p class="sm-dashboard-metric-value mb-1">' + value + '</p>' +
            '<p class="text-gray-600" style="font-size:14px;">' + (subtitleOverride || presentation.subtitle) + '</p>';

        body.appendChild(left);
        body.appendChild(right);
        card.appendChild(body);
        shell.appendChild(card);
        return shell;
    }

    function buildGrid(rowName) {
        var grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6';
        grid.setAttribute('data-dashboard-row', rowName);
        return grid;
    }

    function gridForMetric(metric) {
        if (!metric || !metric.card) return null;
        var wrapper = metric.card.parentElement;
        if (wrapper && wrapper.tagName === 'A') wrapper = wrapper.parentElement;
        return wrapper || null;
    }

    function nestedOutstandingSource(outstandingMetric, kind) {
        if (!outstandingMetric || !outstandingMetric.card) return null;
        var selector = kind === 'bad-debt'
            ? 'a[onclick*="modal_bad_debt"]'
            : 'a[onclick*="modal_outstanding_debt"]';
        var action = outstandingMetric.card.querySelector(selector);
        if (!action) return null;
        return {
            action: action,
            value: firstValueElement(action)
        };
    }

    function installStyles() {
        if (document.getElementById('sm-admin-dashboard-layout-styles')) return;

        var style = document.createElement('style');
        style.id = 'sm-admin-dashboard-layout-styles';
        style.textContent = [
            '#sm-dashboard-approved-summary .dashboard-card{min-height:156px!important;height:100%!important;padding:20px!important;display:flex!important;align-items:center!important;}',
            '#sm-dashboard-approved-summary .sm-dashboard-metric-link{display:block;height:100%;color:inherit;text-decoration:none!important;}',
            '#sm-dashboard-approved-summary .sm-dashboard-metric-value{font-size:30px;font-weight:800;line-height:1.05;color:#111827;overflow-wrap:anywhere;}',
            '#sm-dashboard-approved-summary [data-dashboard-row]{align-items:stretch;}',
            '#sm-dashboard-approved-summary [data-dashboard-row]>*{height:100%;}',
            '.sm-dashboard-source-hidden{display:none!important;}',
            '@media(max-width:767px){#sm-dashboard-approved-summary .dashboard-card{min-height:132px!important;}#sm-dashboard-approved-summary .sm-dashboard-metric-value{font-size:27px;}}'
        ].join('\n');
        (document.head || document.documentElement).appendChild(style);
    }

    function composeDashboard(root) {
        if (typeof document === 'undefined') return false;

        var main = root || document.getElementById('main_page');
        if (!main || main.querySelector('#sm-dashboard-approved-summary')) return false;
        if (!findExactText(main, 'Dashboard Overview')) return false;

        var metrics = {
            students: findMetric(main, 'Total Students'),
            teachers: findMetric(main, 'Active Teachers'),
            parents: findMetric(main, 'Active Parents'),
            attendance: findMetric(main, 'Attendance'),
            dailyRevenue: findMetric(main, 'Daily Revenue'),
            collectionRate: findMetric(main, 'Collection Rate'),
            credits: findMetric(main, 'Student Credits'),
            outstanding: findMetric(main, 'Outstanding Debt'),
            unpaidInvoices: findMetric(main, 'Unpaid Invoices'),
            totalIncome: findMetric(main, 'Total Income'),
            totalExpenses: findMetric(main, 'Total Termly Expenses')
        };

        var required = [
            metrics.students, metrics.teachers, metrics.parents, metrics.attendance,
            metrics.dailyRevenue, metrics.collectionRate, metrics.outstanding,
            metrics.unpaidInvoices, metrics.totalIncome, metrics.totalExpenses
        ];
        for (var i = 0; i < required.length; i += 1) {
            if (!required[i]) return false;
        }

        var outstandingSource = nestedOutstandingSource(metrics.outstanding, 'outstanding');
        var badDebtSource = nestedOutstandingSource(metrics.outstanding, 'bad-debt');
        if (!outstandingSource || !badDebtSource) return false;

        installStyles();

        var summary = document.createElement('div');
        summary.id = 'sm-dashboard-approved-summary';
        summary.setAttribute('data-dashboard-contract', 'approved-three-row-kpis');

        var identityRow = buildGrid('identity');
        identityRow.appendChild(buildCard('Active Students', valueHtml(metrics.students, '0'), metrics.students.action));
        identityRow.appendChild(buildCard('Active Teachers', valueHtml(metrics.teachers, '0'), metrics.teachers.action));
        identityRow.appendChild(buildCard('Active Parents', valueHtml(metrics.parents, '0'), metrics.parents.action));
        identityRow.appendChild(buildCard('Attendance', valueHtml(metrics.attendance, '0'), metrics.attendance.action));

        var financeRow = buildGrid('finance');
        financeRow.appendChild(buildCard('Collected for Term', valueHtml(metrics.totalIncome, '<span class="currency-symbol">₵</span>0.00'), metrics.totalIncome.action));
        financeRow.appendChild(buildCard('Fee Arrears', valueHtml(metrics.unpaidInvoices, '<span class="currency-symbol">₵</span>0.00'), metrics.unpaidInvoices.action));
        financeRow.appendChild(buildCard('Daily Revenue', valueHtml(metrics.dailyRevenue, '<span class="currency-symbol">₵</span>0.00'), metrics.dailyRevenue.action));
        financeRow.appendChild(buildCard('Collection Rate', valueHtml(metrics.collectionRate, '0%'), metrics.collectionRate.action));

        var riskRow = buildGrid('risk');
        riskRow.appendChild(buildCard('Students with Outstanding Bills', outstandingSource.value ? outstandingSource.value.innerHTML : '0', outstandingSource.action));
        riskRow.appendChild(buildCard('Bad Debt / Muted Students', badDebtSource.value ? badDebtSource.value.innerHTML : '0', badDebtSource.action));
        riskRow.appendChild(buildCard('Total Income', valueHtml(metrics.totalIncome, '<span class="currency-symbol">₵</span>0.00'), metrics.totalIncome.action));
        riskRow.appendChild(buildCard('Total Expenses', valueHtml(metrics.totalExpenses, '<span class="currency-symbol">₵</span>0.00'), metrics.totalExpenses.action));

        summary.appendChild(identityRow);
        summary.appendChild(financeRow);
        summary.appendChild(riskRow);

        var firstGrid = gridForMetric(metrics.students);
        var overviewFinanceGrid = gridForMetric(metrics.dailyRevenue);
        var financialSummaryGrid = gridForMetric(metrics.totalIncome);
        if (!firstGrid || !overviewFinanceGrid || !financialSummaryGrid) return false;

        firstGrid.parentNode.insertBefore(summary, firstGrid);
        firstGrid.classList.add('sm-dashboard-source-hidden');
        firstGrid.setAttribute('aria-hidden', 'true');

        if (overviewFinanceGrid !== firstGrid) {
            Array.prototype.forEach.call(overviewFinanceGrid.children || [], function (child) {
                if (metrics.credits && metrics.credits.card && child.contains(metrics.credits.card)) return;
                child.classList.add('sm-dashboard-source-hidden');
                child.setAttribute('aria-hidden', 'true');
            });
            overviewFinanceGrid.setAttribute('data-sm-dashboard-secondary', 'student-credits');
        }

        if (financialSummaryGrid !== firstGrid && financialSummaryGrid !== overviewFinanceGrid) {
            financialSummaryGrid.classList.add('sm-dashboard-source-hidden');
            financialSummaryGrid.setAttribute('aria-hidden', 'true');
        }

        return true;
    }

    function boot() {
        if (typeof document === 'undefined') return false;
        return composeDashboard(document.getElementById('main_page'));
    }

    var api = {
        DASHBOARD_CARD_ORDER: DASHBOARD_CARD_ORDER,
        SOURCE_KEY_BY_LABEL: SOURCE_KEY_BY_LABEL,
        sourceKeyFor: sourceKeyFor,
        composeDashboard: composeDashboard,
        boot: boot
    };

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot, { once: true });
        } else {
            window.setTimeout(boot, 0);
        }
    }

    return api;
});
