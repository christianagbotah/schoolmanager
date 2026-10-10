#!/usr/bin/env python3
from pathlib import Path

path = Path('application/views/backend/admin/dashboard.php')
raw = path.read_bytes()
text = raw.decode('utf-8')
nl = '\r\n' if '\r\n' in text else '\n'

calc_anchor = "$total_revenue = floatval($total_revenue); // Ensure numeric value"
if '$fee_arrears =' not in text:
    insert_at = text.index(calc_anchor) + len(calc_anchor)
    calculations = nl.join([
        '',
        '',
        '// Dashboard KPI contract: active invoice arrears for the selected term',
        "$this->db->select_sum('due');",
        "$this->db->where('year', $un_year);",
        "$this->db->where('term', $un_term);",
        "$this->db->where('mute', '0');",
        "$this->db->where('can_delete !=', 'trash');",
        "$this->db->where('due >', 0);",
        "$fee_arrears = $this->db->get('invoice')->row()->due ?? 0;",
        '$fee_arrears = floatval($fee_arrears);',
        '',
        '// Total income keeps the existing current-term income definition.',
        '$total_income = $total_revenue;',
        '',
        '// Total expenses mirrors the existing Financial Summary expense calculation.',
        "$this->db->select_sum('amount');",
        "$this->db->where('year', $un_year);",
        "$this->db->where('term', $un_term);",
        "$this->db->where('payment_type', 'expense');",
        "$this->db->where('can_delete !=', 'trash');",
        "$total_expenses = $this->db->get('payment')->row()->amount ?? 0;",
        '$total_expenses = floatval($total_expenses); // Ensure numeric value',
    ])
    text = text[:insert_at] + calculations + text[insert_at:]

start_marker = '<!-- Financial Overview (Super Admin, Accountant, and Admin Level 2) -->'
end_marker = '<!-- Charts Section -->'
start = text.index(start_marker)
start = text.rfind(nl, 0, start) + len(nl)
end = text.index(end_marker, start)
end = text.rfind(nl, 0, end) + len(nl)

block = '''\t<!-- Financial Overview (Super Admin, Accountant, and Admin Level 2) -->
\t<?php if (($account_type == 'admin' && ($admin_level <= 3))): ?>
\t<!-- Approved KPI Row 2: collection performance -->
\t<div data-dashboard-kpi-row="financial-performance" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
\t\t<a href="<?php echo site_url('admin/financial_reports/payments'); ?>" class="block" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
\t\t\t<div class="dashboard-card" style="border-left: 5px solid #10b981; padding: 20px; min-height: 180px; display: flex; align-items: center;">
\t\t\t\t<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
\t\t\t\t\t<div class="flex flex-col items-start gap-2">
\t\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);"><i class="fa fa-money"></i></div>
\t\t\t\t\t\t<h3 class="text-gray-700 font-medium" style="font-size: 15px;">Collected for Term</h3>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="text-right ml-auto">
\t\t\t\t\t\t<p class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none mb-1"><span class="currency-symbol"><?php echo $currency; ?></span><?php echo number_format($total_revenue, 2); ?></p>
\t\t\t\t\t\t<p class="text-gray-600" style="font-size: 14px;">Payments received this term</p>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</a>

\t\t<a href="javascript:;" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_unpaid_invoices/'.$un_term .'/'. $un_year.'/'. $un_sem);?>', 'modal_unpaid_invoices');" class="block" style="text-decoration: none; color: inherit;">
\t\t\t<div class="dashboard-card" style="border-left: 5px solid #f59e0b; padding: 20px; min-height: 180px; display: flex; align-items: center;">
\t\t\t\t<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
\t\t\t\t\t<div class="flex flex-col items-start gap-2">
\t\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);"><i class="fa fa-exclamation-circle"></i></div>
\t\t\t\t\t\t<h3 class="text-gray-700 font-medium" style="font-size: 15px;">Fee Arrears</h3>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="text-right ml-auto">
\t\t\t\t\t\t<p class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none mb-1"><span class="currency-symbol"><?php echo $currency; ?></span><?php echo number_format($fee_arrears, 2); ?></p>
\t\t\t\t\t\t<p class="text-gray-600" style="font-size: 14px;">Active-student balance due</p>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</a>

\t\t<a href="javascript:;" onclick="showDailyRevenueModal(<?php echo $timestamp; ?>)" class="block" style="text-decoration: none; color: inherit;">
\t\t\t<div class="dashboard-card" style="border-left: 5px solid #14b8a6; padding: 20px; min-height: 180px; display: flex; align-items: center;">
\t\t\t\t<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
\t\t\t\t\t<div class="flex flex-col items-start gap-2">
\t\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%);"><i class="entypo-chart-line"></i></div>
\t\t\t\t\t\t<h3 class="text-gray-700 font-medium" style="font-size: 15px;">Daily Revenue</h3>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="text-right ml-auto">
\t\t\t\t\t\t<p class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none mb-1"><span class="currency-symbol"><?php echo $currency; ?></span><?php echo number_format($daily_revenue, 2); ?></p>
\t\t\t\t\t\t<p class="text-gray-600" style="font-size: 14px;"><?php echo ($timestamp == strtotime(date('d-m-Y'))) ? 'Today' : date('M d, Y', $timestamp); ?></p>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</a>

\t\t<div class="dashboard-card" style="border-left: 5px solid #3b82f6; padding: 20px; min-height: 180px; display: flex; align-items: center;">
\t\t\t<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
\t\t\t\t<div class="flex flex-col items-start gap-2">
\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);"><i class="entypo-gauge"></i></div>
\t\t\t\t\t<h3 class="text-gray-700 font-medium" style="font-size: 15px;">Collection Rate</h3>
\t\t\t\t</div>
\t\t\t\t<div class="text-right ml-auto">
\t\t\t\t\t<p class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none mb-1"><?php echo $collection_rate; ?>%</p>
\t\t\t\t\t<p class="text-gray-600" style="font-size: 14px;">Collected vs billed this term</p>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</div>

\t<!-- Approved KPI Row 3: finance risk and P&L -->
\t<div data-dashboard-kpi-row="financial-risk" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
\t\t<a href="javascript:;" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_outstanding_debt/'.$un_term .'/'. $un_year);?>', 'modal_outstanding_debt');" class="block" style="text-decoration: none; color: inherit;">
\t\t\t<div class="dashboard-card" style="border-left: 5px solid #f97316; padding: 20px; min-height: 180px; display: flex; align-items: center;">
\t\t\t\t<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
\t\t\t\t\t<div class="flex flex-col items-start gap-2">
\t\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);"><i class="fa fa-file-text-o"></i></div>
\t\t\t\t\t\t<h3 class="text-gray-700 font-medium" style="font-size: 15px;">Students with Outstanding Bills</h3>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="text-right ml-auto">
\t\t\t\t\t\t<p class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none mb-1"><?php echo $active_pending_payments; ?></p>
\t\t\t\t\t\t<p class="text-gray-600" style="font-size: 14px;">Active students with unpaid bills</p>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</a>

\t\t<a href="javascript:;" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_bad_debt/'.$un_term .'/'. $un_year);?>', 'modal_bad_debt');" class="block" style="text-decoration: none; color: inherit;">
\t\t\t<div class="dashboard-card" style="border-left: 5px solid #dc2626; padding: 20px; min-height: 180px; display: flex; align-items: center;">
\t\t\t\t<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
\t\t\t\t\t<div class="flex flex-col items-start gap-2">
\t\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #f87171 0%, #b91c1c 100%);"><i class="fa fa-user-times"></i></div>
\t\t\t\t\t\t<h3 class="text-gray-700 font-medium" style="font-size: 15px;">Bad Debt / Muted Students</h3>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="text-right ml-auto">
\t\t\t\t\t\t<p class="text-3xl md:text-4xl font-extrabold text-red-700 leading-none mb-1"><?php echo $bad_debt_count; ?></p>
\t\t\t\t\t\t<p class="text-gray-600" style="font-size: 14px;">Muted students with unpaid bills</p>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</a>

\t\t<a href="<?php echo site_url('admin/financial_reports/payments'); ?>" class="block" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
\t\t\t<div class="dashboard-card" style="border-left: 5px solid #16a34a; padding: 20px; min-height: 180px; display: flex; align-items: center;">
\t\t\t\t<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
\t\t\t\t\t<div class="flex flex-col items-start gap-2">
\t\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #4ade80 0%, #15803d 100%);"><i class="fa fa-line-chart"></i></div>
\t\t\t\t\t\t<h3 class="text-gray-700 font-medium" style="font-size: 15px;">Total Income</h3>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="text-right ml-auto">
\t\t\t\t\t\t<p class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none mb-1"><span class="currency-symbol"><?php echo $currency; ?></span><?php echo number_format($total_income, 2); ?></p>
\t\t\t\t\t\t<p class="text-gray-600" style="font-size: 14px;">Income recorded this term</p>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</a>

\t\t<a href="<?php echo site_url('admin/expense'); ?>" class="block" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
\t\t\t<div class="dashboard-card" style="border-left: 5px solid #7c3aed; padding: 20px; min-height: 180px; display: flex; align-items: center;">
\t\t\t\t<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
\t\t\t\t\t<div class="flex flex-col items-start gap-2">
\t\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%);"><i class="fa fa-tags"></i></div>
\t\t\t\t\t\t<h3 class="text-gray-700 font-medium" style="font-size: 15px;">Total Expenses</h3>
\t\t\t\t\t</div>
\t\t\t\t\t<div class="text-right ml-auto">
\t\t\t\t\t\t<p class="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none mb-1"><span class="currency-symbol"><?php echo $currency; ?></span><?php echo number_format($total_expenses, 2); ?></p>
\t\t\t\t\t\t<p class="text-gray-600" style="font-size: 14px;">Expenses recorded this term</p>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</a>
\t</div>

\t<!-- Auxiliary finance insight retained from the legacy dashboard. -->
\t<a href="<?php echo site_url('admin/student_credits'); ?>" class="block mb-6" style="text-decoration: none; color: inherit;">
\t\t<div class="dashboard-card" style="border-left: 5px solid #0ea5e9; padding: 18px 20px;">
\t\t\t<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
\t\t\t\t<div class="flex items-center gap-3">
\t\t\t\t\t<div class="stat-icon" style="background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); width: 48px; height: 48px; font-size: 22px;"><i class="fa fa-gift"></i></div>
\t\t\t\t\t<div><h3 class="text-gray-800 font-semibold" style="font-size: 15px; margin: 0;">Student Credits</h3><p class="text-gray-600" style="font-size: 14px; margin: 3px 0 0;">Billed-invoice credit balances remain separate from daily-fee wallets.</p></div>
\t\t\t\t</div>
\t\t\t\t<div class="text-right"><p class="text-2xl font-extrabold text-gray-900" style="margin: 0;"><span class="currency-symbol"><?php echo $currency; ?></span><?php echo number_format($total_active_credits, 2); ?></p><p class="text-gray-600" style="font-size: 14px; margin: 3px 0 0;"><?php echo $students_with_credits; ?> students</p></div>
\t\t\t</div>
\t\t</div>
\t</a>
\t<?php endif; ?>

'''.replace('\n', nl)

text = text[:start] + block + text[end:]
path.write_bytes(text.encode('utf-8'))
print('Updated', path)
