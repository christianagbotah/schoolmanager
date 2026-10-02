<?php
/**
 * ENTERPRISE-GRADE CASHIER DASHBOARD
 * Modern professional UX with comprehensive KPIs
 */
$cashier_id = $this->session->userdata('admin_id');
$cashier_name = $this->db->get_where('admin', ['admin_id' => $cashier_id])->row()->name;
$today = strtotime(date('Y-m-d'));
$today_end = $today + 86400;
$currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;

// Check which fee modules are enabled
$feeding_enabled = is_fee_module_enabled('feeding');
$breakfast_enabled = is_fee_module_enabled('breakfast');
$classes_enabled = is_fee_module_enabled('classes');
$water_enabled = is_fee_module_enabled('water');
$transport_enabled = is_fee_module_enabled('transport');

// Today's collections
$today_collections = $this->db->query("
    SELECT 
        SUM(feeding_amount) as feeding,
        SUM(breakfast_amount) as breakfast,
        SUM(classes_amount) as classes,
        SUM(water_amount) as water,
        SUM(transport_amount) as transport,
        COUNT(*) as transaction_count,
        COUNT(DISTINCT student_id) as unique_students
    FROM daily_fee_transactions
    WHERE collected_by = ? AND payment_date >= ? AND payment_date < ?
", [$cashier_id, $today, $today_end])->row();

$total_collected = ($today_collections->feeding ?? 0) + ($today_collections->breakfast ?? 0) + 
                   ($today_collections->classes ?? 0) + ($today_collections->water ?? 0) + 
                   ($today_collections->transport ?? 0);

// Week & Month collections
$week_start = strtotime('monday this week');
$month_start = strtotime(date('Y-m-01'));
$week_collections = $this->db->query("SELECT SUM(feeding_amount + breakfast_amount + classes_amount + water_amount + transport_amount) as total FROM daily_fee_transactions WHERE collected_by = ? AND payment_date >= ?", [$cashier_id, $week_start])->row()->total ?? 0;
$month_collections = $this->db->query("SELECT SUM(feeding_amount + breakfast_amount + classes_amount + water_amount + transport_amount) as total FROM daily_fee_transactions WHERE collected_by = ? AND payment_date >= ?", [$cashier_id, $month_start])->row()->total ?? 0;

// This term collections
$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
$term_start = $this->db->get_where('terms', ['year' => $running_year, 'term' => $running_term])->row();
$term_start_date = $term_start ? strtotime($term_start->next_term_begins) : $month_start;
$term_collections = $this->db->query("SELECT SUM(feeding_amount + breakfast_amount + classes_amount + water_amount + transport_amount) as total FROM daily_fee_transactions WHERE collected_by = ? AND payment_date >= ?", [$cashier_id, $term_start_date])->row()->total ?? 0;

$avg_transaction = $today_collections->transaction_count > 0 ? $total_collected / $today_collections->transaction_count : 0;

// Total outstanding arrears across active enrolled students (mute = '0') and enabled modules only
$arrears_query_parts = [];
$arrears_select_parts = [];

if ($feeding_enabled) {
    $arrears_query_parts[] = "w.feeding_arrears > 0";
    $arrears_select_parts[] = "SUM(w.feeding_arrears)";
} else {
    $arrears_select_parts[] = "0";
}

if ($breakfast_enabled) {
    $arrears_query_parts[] = "w.breakfast_arrears > 0";
    $arrears_select_parts[] = "SUM(w.breakfast_arrears)";
} else {
    $arrears_select_parts[] = "0";
}

if ($classes_enabled) {
    $arrears_query_parts[] = "w.classes_arrears > 0";
    $arrears_select_parts[] = "SUM(w.classes_arrears)";
} else {
    $arrears_select_parts[] = "0";
}

if ($water_enabled) {
    $arrears_query_parts[] = "w.water_arrears > 0";
    $arrears_select_parts[] = "SUM(w.water_arrears)";
} else {
    $arrears_select_parts[] = "0";
}

if ($transport_enabled) {
    $arrears_query_parts[] = "w.transport_arrears > 0";
    $arrears_select_parts[] = "SUM(w.transport_arrears)";
} else {
    $arrears_select_parts[] = "0";
}

$arrears_where = count($arrears_query_parts) > 0 ? "AND (" . implode(" OR ", $arrears_query_parts) . ")" : "";
$arrears_select = "(" . implode(" + ", $arrears_select_parts) . ") as total";

$total_arrears = $this->db->query("
    SELECT $arrears_select
    FROM daily_fee_wallet w
    INNER JOIN enroll e ON w.student_id = e.student_id
    WHERE e.year = ? AND e.term = ? AND e.mute = '0'
    $arrears_where
", [$running_year, $running_term])->row()->total ?? 0;

// Arrears breakdown by fee type (active enrolled students and enabled modules only)
$breakdown_selects = [];
if ($feeding_enabled) $breakdown_selects[] = "SUM(w.feeding_arrears) as feeding";
else $breakdown_selects[] = "0 as feeding";

if ($breakfast_enabled) $breakdown_selects[] = "SUM(w.breakfast_arrears) as breakfast";
else $breakdown_selects[] = "0 as breakfast";

if ($classes_enabled) $breakdown_selects[] = "SUM(w.classes_arrears) as classes";
else $breakdown_selects[] = "0 as classes";

if ($water_enabled) $breakdown_selects[] = "SUM(w.water_arrears) as water";
else $breakdown_selects[] = "0 as water";

if ($transport_enabled) $breakdown_selects[] = "SUM(w.transport_arrears) as transport";
else $breakdown_selects[] = "0 as transport";

$breakdown_select = implode(", ", $breakdown_selects);

$arrears_breakdown = $this->db->query("
    SELECT $breakdown_select
    FROM daily_fee_wallet w
    INNER JOIN enroll e ON w.student_id = e.student_id
    WHERE e.year = ? AND e.term = ? AND e.mute = '0'
", [$running_year, $running_term])->row();

// Payment types
$payment_types = $this->db->query("SELECT payment_type, COUNT(*) as count, SUM(feeding_amount + breakfast_amount + classes_amount + water_amount + transport_amount) as total FROM daily_fee_transactions WHERE collected_by = ? AND payment_date >= ? AND payment_date < ? GROUP BY payment_type", [$cashier_id, $today, $today_end])->result_array();

// Recent transactions
$recent_transactions = $this->db->query("SELECT t.*, s.name as student_name, s.student_code FROM daily_fee_transactions t JOIN student s ON t.student_id = s.student_id WHERE t.collected_by = ? AND t.payment_date >= ? ORDER BY t.created_at DESC LIMIT 10", [$cashier_id, $today])->result_array();
?>

<style>
/* Cashier Dashboard - modern presentation layer (design-system tokens) */
.dash-cashier { padding: 4px; }
.dash-chip {
	display: inline-flex; align-items: center; gap: 6px; background: #fff;
	border: 1px solid #e5e7eb; border-radius: 999px; padding: 6px 14px;
	font-size: 13px; font-weight: 600; color: #374151;
	box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
.dash-chip .fa { color: var(--sm-primary-600, #2563eb); }

.dash-card {
	background: #fff; border: 1px solid var(--sm-border, #e5e7eb);
	border-radius: 16px; padding: 22px;
	box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
	transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
	animation: dashFadeUp .4s ease-out;
}
.dash-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 10px 24px rgba(16, 24, 40, 0.10);
	border-color: #cbd5e1;
}
.dash-card--click { cursor: pointer; }
.dash-card--click:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4); }
@keyframes dashFadeUp {
	from { opacity: 0; transform: translateY(12px); }
	to { opacity: 1; transform: translateY(0); }
}

.dash-stat-icon {
	width: 52px; height: 52px; border-radius: 13px;
	display: flex; align-items: center; justify-content: center;
	font-size: 24px; color: #fff;
	box-shadow: 0 2px 6px rgba(16, 24, 40, 0.14);
	transition: transform .18s ease;
}
.dash-card:hover .dash-stat-icon { transform: scale(1.06); }

.dash-kpi-label {
	font-size: 12px; font-weight: 700; color: var(--sm-gray-500, #6b7280);
	text-transform: uppercase; letter-spacing: 0.06em;
}
.dash-kpi-value {
	font-size: 32px; font-weight: 800; color: #111827; margin: 6px 0 4px;
	font-variant-numeric: tabular-nums; line-height: 1.1;
}
.dash-kpi-value sup { font-size: 15px; font-weight: 700; margin-right: 3px; }
.dash-kpi-hint { font-size: 12px; color: var(--sm-gray-500, #6b7280); margin: 0; }
.dash-kpi-hint .fa { margin-right: 4px; }

.dash-sec-title {
	font-size: 15px; font-weight: 700; color: #1f2937; margin: 0 0 16px;
	display: flex; align-items: center; gap: 8px;
}
.dash-sec-title .fa { color: var(--sm-primary-600, #2563eb); }

.dash-perf-value {
	font-size: 30px; font-weight: 800; margin: 12px 0 6px;
	font-variant-numeric: tabular-nums; line-height: 1.15;
}
.dash-perf-value sup { font-size: 15px; font-weight: 700; }
.dash-perf-sub { color: var(--sm-gray-500, #6b7280); margin: 0; font-size: 13px; }

.dash-sub-title {
	font-size: 13px; font-weight: 700; letter-spacing: 0.04em;
	text-transform: uppercase; margin: 0 0 14px; padding-bottom: 10px;
	display: flex; align-items: center; gap: 7px;
}
.dash-sub-title--collected { color: #047857; border-bottom: 2px solid #a7f3d0; }
.dash-sub-title--outstanding { color: #b91c1c; border-bottom: 2px solid #fecaca; }

.fee-breakdown-item {
	display: flex; align-items: center; justify-content: space-between;
	padding: 14px; background: #f8fafc; border: 1px solid #eef2f7;
	border-radius: 12px; margin-bottom: 10px;
	transition: all .18s ease; cursor: pointer;
}
.fee-breakdown-item:hover { background: #eef2f7; transform: translateX(4px); box-shadow: 0 2px 8px rgba(16, 24, 40, 0.08); }
.fee-breakdown-item:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4); }
.fee-breakdown-item--arrears { background: #fff7f7; border-color: #fdeaea; }
.fee-breakdown-item--arrears:hover { background: #fdeaea; }
.fee-icon {
	width: 44px; height: 44px; border-radius: 11px;
	display: flex; align-items: center; justify-content: center; font-size: 19px;
	flex-shrink: 0;
}
.fee-amount { font-size: 21px; font-weight: 700; font-variant-numeric: tabular-nums; }
.fee-amount sup { font-size: 11px; font-weight: 600; }

.dash-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.transaction-table { width: 100%; border-collapse: collapse; }
.transaction-table th {
	background: #f8fafc; padding: 11px 14px; text-align: left; font-weight: 600;
	color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;
	border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
.transaction-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.transaction-table tbody tr:hover { background: #f8fafc; }
.transaction-table tbody tr:last-child td { border-bottom: none; }

.badge-modern {
	padding: 5px 11px; border-radius: 20px; font-size: 11px; font-weight: 700;
	text-transform: uppercase; letter-spacing: 0.03em; display: inline-block;
}
.badge-success { background: #d1fae5; color: #065f46; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-warning { background: #fef3c7; color: #92400e; }

.dash-empty {
	text-align: center; color: #94a3b8; padding: 40px 0;
}
.dash-empty .fa { font-size: 26px; display: block; margin-bottom: 10px; }

@media (max-width: 768px) {
	.dash-cashier { padding: 0; }
	.dash-kpi-value { font-size: 26px; }
	.dash-perf-value { font-size: 25px; }
	.fee-breakdown-item { padding: 12px; flex-direction: column; text-align: center; gap: 10px; margin-bottom: 12px; }
	.fee-breakdown-item > div:first-child { flex-direction: column; gap: 10px !important; }
	.fee-icon { width: 40px; height: 40px; font-size: 18px; }
	.transaction-table { font-size: 13px; }
	.transaction-table th, .transaction-table td { padding: 9px 10px; }
}
</style>

<div class="dash-cashier">
	<!-- Welcome Header -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold text-gray-800 mb-1">Welcome back, <?php echo $cashier_name; ?></h2>
		<div class="flex flex-wrap items-center gap-2">
			<span class="dash-chip"><i class="fa fa-calendar" aria-hidden="true"></i> <?php echo date('l, F j, Y'); ?></span>
			<span class="dash-chip"><i class="fa fa-bolt" aria-hidden="true"></i> Here's your performance today</span>
		</div>
	</div>

	<!-- KPI Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		<div class="dash-card dash-card--click" tabindex="0" role="button" aria-label="Show details: today's total collections" onclick="showDetailsModal('total')" style="border-left: 5px solid #2563eb;">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
				<div class="flex flex-col items-start gap-2">
					<div class="dash-stat-icon" style="background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);">
						<i class="fa fa-money-bill-wave" aria-hidden="true"></i>
					</div>
					<div class="dash-kpi-label">Total Collected</div>
				</div>
				<div class="text-right ml-auto">
					<div class="dash-kpi-value"><sup><?php echo $currency; ?></sup><?php echo number_format($total_collected, 2); ?></div>
					<p class="dash-kpi-hint"><i class="fa fa-arrow-up" aria-hidden="true"></i>Today's collections</p>
				</div>
			</div>
		</div>
		<div class="dash-card dash-card--click" tabindex="0" role="button" aria-label="Show details: outstanding arrears" onclick="showDetailsModal('arrears')" style="border-left: 5px solid #e11d48;">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
				<div class="flex flex-col items-start gap-2">
					<div class="dash-stat-icon" style="background: linear-gradient(135deg, #fda4af 0%, #e11d48 100%);">
						<i class="fa fa-exclamation-circle" aria-hidden="true"></i>
					</div>
					<div class="dash-kpi-label">Outstanding</div>
				</div>
				<div class="text-right ml-auto">
					<div class="dash-kpi-value"><sup><?php echo $currency; ?></sup><?php echo number_format($total_arrears, 2); ?></div>
					<p class="dash-kpi-hint"><i class="fa fa-hand-holding-usd" aria-hidden="true"></i>Total unpaid fees</p>
				</div>
			</div>
		</div>
		<div class="dash-card dash-card--click" tabindex="0" role="button" aria-label="Show details: today's transactions" onclick="showDetailsModal('transactions')" style="border-left: 5px solid #059669;">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
				<div class="flex flex-col items-start gap-2">
					<div class="dash-stat-icon" style="background: linear-gradient(135deg, #6ee7b7 0%, #059669 100%);">
						<i class="fa fa-receipt" aria-hidden="true"></i>
					</div>
					<div class="dash-kpi-label">Transactions</div>
				</div>
				<div class="text-right ml-auto">
					<div class="dash-kpi-value"><?php echo $today_collections->transaction_count ?? 0; ?></div>
					<p class="dash-kpi-hint"><i class="fa fa-check-circle" aria-hidden="true"></i>Processed today</p>
				</div>
			</div>
		</div>
		<div class="dash-card dash-card--click" tabindex="0" role="button" aria-label="Show details: students served" onclick="showDetailsModal('students')" style="border-left: 5px solid #7c3aed;">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style="width: 100%;">
				<div class="flex flex-col items-start gap-2">
					<div class="dash-stat-icon" style="background: linear-gradient(135deg, #c4b5fd 0%, #7c3aed 100%);">
						<i class="fa fa-users" aria-hidden="true"></i>
					</div>
					<div class="dash-kpi-label">Students Served</div>
				</div>
				<div class="text-right ml-auto">
					<div class="dash-kpi-value"><?php echo $today_collections->unique_students ?? 0; ?></div>
					<p class="dash-kpi-hint"><i class="fa fa-user-check" aria-hidden="true"></i>Unique students</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Performance & Fee Breakdown -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
		<div class="flex flex-col gap-4">
			<div class="dash-card" style="border-left: 5px solid #059669;">
				<h4 class="dash-sec-title"><i class="fa fa-calendar-week" aria-hidden="true"></i> This Week</h4>
				<div class="dash-perf-value" style="color: #059669;"><sup><?php echo $currency; ?></sup><?php echo number_format($week_collections, 2); ?></div>
				<p class="dash-perf-sub">Total collections this week</p>
			</div>
			<div class="dash-card" style="border-left: 5px solid #2563eb;">
				<h4 class="dash-sec-title"><i class="fa fa-calendar-alt" aria-hidden="true"></i> This Month</h4>
				<div class="dash-perf-value" style="color: #2563eb;"><sup><?php echo $currency; ?></sup><?php echo number_format($month_collections, 2); ?></div>
				<p class="dash-perf-sub">Total collections this month</p>
			</div>
			<div class="dash-card" style="border-left: 5px solid #e11d48;">
				<h4 class="dash-sec-title"><i class="fa fa-calendar-check" aria-hidden="true"></i> This Term</h4>
				<div class="dash-perf-value" style="color: #e11d48;"><sup><?php echo $currency; ?></sup><?php echo number_format($term_collections, 2); ?></div>
				<p class="dash-perf-sub">Total collections this term</p>
			</div>
		</div>

		<div class="lg:col-span-2">
			<div class="dash-card" style="height: 100%;">
				<h4 class="dash-sec-title"><i class="fa fa-chart-bar" aria-hidden="true"></i> Fee Breakdown</h4>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Section 1: Collected Today -->
					<div>
						<h5 class="dash-sub-title dash-sub-title--collected"><i class="fa fa-check-circle" aria-hidden="true"></i> Collected Today</h5>
						<?php if($feeding_enabled): ?>
						<div class="fee-breakdown-item" tabindex="0" role="button" aria-label="Feeding fee collected today" onclick="showFeeDetails('feeding', 'collected')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #fee2e2; color: #c53030;"><i class="fa fa-utensils" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Feeding</div><div style="font-size: 12px; color: #718096;">Daily meals</div></div>
							</div>
							<div class="fee-amount" style="color: #c53030;"><sup><?php echo $currency; ?></sup><?php echo number_format($today_collections->feeding ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
						<?php if($breakfast_enabled): ?>
						<div class="fee-breakdown-item" tabindex="0" role="button" aria-label="Breakfast fee collected today" onclick="showFeeDetails('breakfast', 'collected')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #fef3c7; color: #c05621;"><i class="fa fa-coffee" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Breakfast</div><div style="font-size: 12px; color: #718096;">Morning meals</div></div>
							</div>
							<div class="fee-amount" style="color: #c05621;"><sup><?php echo $currency; ?></sup><?php echo number_format($today_collections->breakfast ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
						<?php if($classes_enabled): ?>
						<div class="fee-breakdown-item" tabindex="0" role="button" aria-label="Classes fee collected today" onclick="showFeeDetails('classes', 'collected')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #ede9fe; color: #6b46c1;"><i class="fa fa-book" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Classes</div><div style="font-size: 12px; color: #718096;">Class fees</div></div>
							</div>
							<div class="fee-amount" style="color: #6b46c1;"><sup><?php echo $currency; ?></sup><?php echo number_format($today_collections->classes ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
						<?php if($water_enabled): ?>
						<div class="fee-breakdown-item" tabindex="0" role="button" aria-label="Water fee collected today" onclick="showFeeDetails('water', 'collected')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #dbeafe; color: #2c5282;"><i class="fa fa-tint" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Water</div><div style="font-size: 12px; color: #718096;">Water fees</div></div>
							</div>
							<div class="fee-amount" style="color: #2c5282;"><sup><?php echo $currency; ?></sup><?php echo number_format($today_collections->water ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
						<?php if($transport_enabled): ?>
						<div class="fee-breakdown-item" tabindex="0" role="button" aria-label="Transport fee collected today" onclick="showFeeDetails('transport', 'collected')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #d1fae5; color: #22543d;"><i class="fa fa-bus" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Transport</div><div style="font-size: 12px; color: #718096;">Transport fees</div></div>
							</div>
							<div class="fee-amount" style="color: #22543d;"><sup><?php echo $currency; ?></sup><?php echo number_format($today_collections->transport ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
					</div>

					<!-- Section 2: Outstanding Arrears -->
					<div>
						<h5 class="dash-sub-title dash-sub-title--outstanding"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> Outstanding</h5>
						<?php if($feeding_enabled): ?>
						<div class="fee-breakdown-item fee-breakdown-item--arrears" tabindex="0" role="button" aria-label="Feeding fee arrears" onclick="showFeeDetails('feeding', 'arrears')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #fee2e2; color: #c53030;"><i class="fa fa-utensils" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Feeding</div><div style="font-size: 12px; color: #718096;">Unpaid feeding</div></div>
							</div>
							<div class="fee-amount" style="color: #c53030;"><sup><?php echo $currency; ?></sup><?php echo number_format($arrears_breakdown->feeding ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
						<?php if($breakfast_enabled): ?>
						<div class="fee-breakdown-item fee-breakdown-item--arrears" tabindex="0" role="button" aria-label="Breakfast fee arrears" onclick="showFeeDetails('breakfast', 'arrears')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #fef3c7; color: #c05621;"><i class="fa fa-coffee" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Breakfast</div><div style="font-size: 12px; color: #718096;">Unpaid breakfast</div></div>
							</div>
							<div class="fee-amount" style="color: #c05621;"><sup><?php echo $currency; ?></sup><?php echo number_format($arrears_breakdown->breakfast ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
						<?php if($classes_enabled): ?>
						<div class="fee-breakdown-item fee-breakdown-item--arrears" tabindex="0" role="button" aria-label="Classes fee arrears" onclick="showFeeDetails('classes', 'arrears')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #ede9fe; color: #6b46c1;"><i class="fa fa-book" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Classes</div><div style="font-size: 12px; color: #718096;">Unpaid classes</div></div>
							</div>
							<div class="fee-amount" style="color: #6b46c1;"><sup><?php echo $currency; ?></sup><?php echo number_format($arrears_breakdown->classes ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
						<?php if($water_enabled): ?>
						<div class="fee-breakdown-item fee-breakdown-item--arrears" tabindex="0" role="button" aria-label="Water fee arrears" onclick="showFeeDetails('water', 'arrears')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #dbeafe; color: #2c5282;"><i class="fa fa-tint" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Water</div><div style="font-size: 12px; color: #718096;">Unpaid water</div></div>
							</div>
							<div class="fee-amount" style="color: #2c5282;"><sup><?php echo $currency; ?></sup><?php echo number_format($arrears_breakdown->water ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
						<?php if($transport_enabled): ?>
						<div class="fee-breakdown-item fee-breakdown-item--arrears" tabindex="0" role="button" aria-label="Transport fee arrears" onclick="showFeeDetails('transport', 'arrears')">
							<div style="display: flex; align-items: center; gap: 14px;">
								<div class="fee-icon" style="background: #d1fae5; color: #22543d;"><i class="fa fa-bus" aria-hidden="true"></i></div>
								<div><div style="font-weight: 600; color: #2d3748;">Transport</div><div style="font-size: 12px; color: #718096;">Unpaid transport</div></div>
							</div>
							<div class="fee-amount" style="color: #22543d;"><sup><?php echo $currency; ?></sup><?php echo number_format($arrears_breakdown->transport ?? 0, 2); ?></div>
						</div>
						<?php endif; ?>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Transactions -->
	<div class="dash-card">
		<h4 class="dash-sec-title"><i class="fa fa-history" aria-hidden="true"></i> Recent Transactions</h4>
		<?php if (empty($recent_transactions)): ?>
			<p class="dash-empty"><i class="fa fa-info-circle" aria-hidden="true"></i> No transactions today</p>
		<?php else: ?>
			<div class="dash-table-wrap">
				<table class="transaction-table">
					<thead>
						<tr>
							<th>Time</th>
							<th>Student</th>
							<th>Receipt</th>
							<th style="text-align: right;">Amount</th>
							<th>Payment Method</th>
							<th>Type</th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ($recent_transactions as $txn):
							$amount = $txn['feeding_amount'] + $txn['breakfast_amount'] + $txn['classes_amount'] + $txn['water_amount'] + $txn['transport_amount'];
						?>
						<tr>
							<td style="color: #4a5568; font-weight: 600; white-space: nowrap;"><?php echo date('h:i A', $txn['created_at']); ?></td>
							<td>
								<div style="font-weight: 600; color: #2d3748;"><?php echo $txn['student_name']; ?></div>
								<div style="font-size: 12px; color: #a0aec0;"><?php echo $txn['student_code']; ?></div>
							</td>
							<td><code style="background: #edf2f7; padding: 4px 8px; border-radius: 4px; color: #4a5568;"><?php echo $txn['receipt_number']; ?></code></td>
							<td style="text-align: right; font-weight: 700; color: #2d3748; font-size: 15px; white-space: nowrap;"><sup style="font-size: 10px; color: #718096;"><?php echo $currency; ?></sup><?php echo number_format($amount, 2); ?></td>
							<td>
								<?php
								$payment_method = $this->db->get_where('payment_methods', ['id' => $txn['payment_method']])->row();
								if($payment_method) {
									echo '<i class="fa fa-' . $payment_method->icon . '" style="color: #718096; margin-right: 5px;"></i>';
									echo '<span style="color: #4a5568;">' . $payment_method->name . '</span>';
								} else {
									echo '<span style="color: #a0aec0;">N/A</span>';
								}
								?>
							</td>
							<td>
								<?php
								$badge_class = $txn['payment_type'] == 'advance' ? 'badge-success' : ($txn['payment_type'] == 'arrears' ? 'badge-danger' : 'badge-warning');
								?>
								<span class="badge-modern <?php echo $badge_class; ?>"><?php echo ucfirst($txn['payment_type']); ?></span>
							</td>
						</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			</div>
		<?php endif; ?>
	</div>
</div>

<script>
function showDetailsModal(type) {
    console.log('Show details for:', type);
}

function showFeeDetails(feeType, category) {
    const titles = {
        feeding: 'Feeding Fee',
        breakfast: 'Breakfast Fee',
        classes: 'Classes Fee',
        water: 'Water Fee',
        transport: 'Transport Fee'
    };
    
    const icons = {
        feeding: 'utensils',
        breakfast: 'coffee',
        classes: 'book',
        water: 'tint',
        transport: 'bus'
    };
    
    const title = titles[feeType] + (category === 'collected' ? ' - Collected Today' : ' - Outstanding');
    const icon = icons[feeType];
    
    showAjaxModal_alert('Loading details...', 'loading');
    
    $.ajax({
        url: '<?php echo site_url('admin/get_fee_details'); ?>',
        type: 'POST',
        data: { fee_type: feeType, category: category, cashier_id: <?php echo $cashier_id; ?> },
        dataType: 'json'
    }).done(function(response) {
        $('#modal_alert').modal('hide');
        if(response.status === 'success') {
            showModalWithContent('detailsModal', '<i class="fa fa-' + icon + '"></i> ' + title, response.html);
        } else {
            showAjaxModal_alert(response.message || 'Failed to load details', 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('An error occurred while loading details', 'error');
    });
}
</script>
