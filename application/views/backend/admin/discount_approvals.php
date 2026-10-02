<style>
:root {
	--primary: #667eea;
	--primary-dark: #5568d3;
	--success: #10b981;
	--danger: #ef4444;
	--warning: #f59e0b;
	--info: #3b82f6;
	--gray-50: #f9fafb;
	--gray-100: #f3f4f6;
	--gray-200: #e5e7eb;
	--gray-600: #4b5563;
	--gray-700: #374151;
	--gray-900: #111827;
}

.approvals-container {
	background: var(--gradient-bg);
	padding: 2rem;
	min-height: 100vh;
}

.approvals-card {
	background: white;
	border-radius: 16px;
	box-shadow: 0 20px 60px rgba(0,0,0,0.1);
	overflow: hidden;
}

.approvals-header {
	background: var(--gradient-bg);
	padding: 2rem;
	color: white;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.approvals-header h4 {
	margin: 0;
	font-size: 2rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: white;
}

.approvals-header h4 i {
	color: white;
	font-size: 2rem;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-bottom: 1.5rem;
}

.stat-card {
	background: linear-gradient(135deg, var(--bg-start), var(--bg-end));
	padding: 1.5rem;
	border-radius: 12px;
	color: white;
	box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	transition: transform 0.2s;
}

.stat-card:hover {
	transform: translateY(-4px);
}

.stat-card .stat-value {
	font-size: 2.5rem;
	font-weight: 700;
	margin: 0.5rem 0;
}

.stat-card .stat-label {
	font-size: 1rem;
	opacity: 0.9;
	font-weight: 600;
}

.filter-tabs {
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1.5rem;
	flex-wrap: wrap;
	padding: 1.5rem;
	background: var(--gray-50);
	border-bottom: 2px solid var(--gray-200);
}

.filter-tab {
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	border: 2px solid transparent;
	background: white;
	color: var(--gray-700);
	font-weight: 600;
	font-size: 1.05rem;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.filter-tab[data-status="pending"] {
	color: var(--warning);
}

.filter-tab[data-status="approved"] {
	color: var(--success);
}

.filter-tab[data-status="rejected"] {
	color: var(--danger);
}

.filter-tab[data-status="pending_removal"] {
	color: var(--gray-600);
}

.filter-tab:hover {
	background: var(--gray-100);
	transform: translateY(-2px);
}

.filter-tab.active {
	background: var(--gradient-bg);
	color: white;
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.bulk-actions-bar {
	background: var(--gradient-bg);
	padding: 1rem 1.5rem;
	border-radius: 12px;
	margin: 1.5rem;
	display: flex;
	align-items: center;
	gap: 1rem;
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.bulk-actions-bar .selected-count {
	color: white;
	font-weight: 600;
	font-size: 1.05rem;
	flex: 1;
}

.modern-btn {
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	border: none;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.modern-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modern-btn-success {
	background: var(--success);
	color: white;
}

.modern-btn-danger {
	background: var(--danger);
	color: white;
}

.modern-btn-white {
	background: white;
	color: var(--gray-700);
}

#approvals_table {
	width: 100%;
}

#approvals_table thead th {
	background: var(--gray-50);
	color: var(--gray-700);
	font-weight: 700;
	text-transform: uppercase;
	font-size: 1rem;
	letter-spacing: 0.05em;
	padding: 1rem;
	border-bottom: 2px solid var(--gray-200);
}

#approvals_table thead th:first-child {
	width: 40px;
	text-align: center;
}

#approvals_table thead th:nth-child(2) {
	text-align: left;
}

#approvals_table tbody tr {
	transition: all 0.2s;
}

#approvals_table tbody tr:hover {
	background: var(--gray-50);
	transform: scale(1.01);
	box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

#approvals_table tbody td {
	padding: 1rem;
	vertical-align: middle;
	font-size: 1.05rem;
}

#approvals_table tbody td:first-child {
	width: 40px;
	text-align: center;
}

#approvals_table tbody td:nth-child(2) {
	text-align: left;
	font-size: 1rem;
}

.student-name {
	font-size: 1.15rem;
	font-weight: 600;
}

.student-code {
	font-size: 1.05rem;
	color: var(--gray-600);
}

.discount-details {
	font-size: 1rem;
}

.badge {
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 600;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
}

.action-btn {
	padding: 0.5rem 0.75rem;
	border-radius: 6px;
	border: none;
	cursor: pointer;
	transition: all 0.2s;
	margin: 0 0.25rem;
}

.action-btn:hover {
	transform: scale(1.1);
	box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

input[type="checkbox"] {
	width: 18px;
	height: 18px;
	cursor: pointer;
	accent-color: var(--primary);
}

.table-container {
	padding: 1.5rem;
}

@media (max-width: 768px) {
	.stats-grid {
		grid-template-columns: 1fr;
	}
	
	.filter-tabs {
		flex-direction: column;
	}
	
	.bulk-actions-bar {
		flex-direction: column;
	}
}
</style>

<div class="approvals-container">
	<div class="approvals-card">
		<div class="approvals-header">
			<h4><i class="mdi mdi-shield-check"></i> <?php echo get_phrase('discount_approvals'); ?></h4>
		</div>
		
		<div style="padding: 1.5rem;">
			<div class="stats-grid" id="stats_grid">
				<div class="stat-card" style="--bg-start: #f59e0b; --bg-end: #d97706;">
					<i class="fa fa-clock" style="font-size: 1.5rem;"></i>
					<div class="stat-value" id="pending_count">0</div>
					<div class="stat-label">Pending</div>
				</div>
				<div class="stat-card" style="--bg-start: #10b981; --bg-end: #059669;">
					<i class="fa fa-check-circle" style="font-size: 1.5rem;"></i>
					<div class="stat-value" id="approved_count">0</div>
					<div class="stat-label">Approved</div>
				</div>
				<div class="stat-card" style="--bg-start: #ef4444; --bg-end: #dc2626;">
					<i class="fa fa-times-circle" style="font-size: 1.5rem;"></i>
					<div class="stat-value" id="rejected_count">0</div>
					<div class="stat-label">Rejected</div>
				</div>
				<div class="stat-card" style="--bg-start: #3b82f6; --bg-end: #2563eb;">
					<i class="fa fa-list" style="font-size: 1.5rem;"></i>
					<div class="stat-value" id="total_count">0</div>
					<div class="stat-label">Total</div>
				</div>
			</div>
		</div>
		
		<div class="filter-tabs">
			<button class="filter-tab active" data-status="all" onclick="filterByStatus('all')">
				<i class="fa fa-list"></i> <?php echo get_phrase('all'); ?>
			</button>
			<button class="filter-tab" data-status="pending" onclick="filterByStatus('pending')">
				<i class="fa fa-clock"></i> <?php echo get_phrase('pending'); ?>
			</button>
			<button class="filter-tab" data-status="approved" onclick="filterByStatus('approved')">
				<i class="fa fa-check-circle"></i> <?php echo get_phrase('approved'); ?>
			</button>
			<button class="filter-tab" data-status="rejected" onclick="filterByStatus('rejected')">
				<i class="fa fa-times-circle"></i> <?php echo get_phrase('rejected'); ?>
			</button>
			<button class="filter-tab" data-status="pending_removal" onclick="filterByStatus('pending_removal')">
				<i class="fa fa-trash-alt"></i> <?php echo get_phrase('pending_removal'); ?>
			</button>
		</div>
		
		<div class="bulk-actions-bar" id="bulk_actions" style="display: none;">
			<div class="selected-count">
				<i class="fa fa-check-square"></i> <span id="selected_count">0</span> selected
			</div>
			<button class="modern-btn modern-btn-success" onclick="bulkApprove()">
				<i class="fa fa-check"></i> Approve Selected
			</button>
			<button class="modern-btn modern-btn-danger" onclick="bulkReject()">
				<i class="fa fa-times"></i> Reject Selected
			</button>
			<button class="modern-btn modern-btn-white" onclick="deselectAll()">
				<i class="fa fa-times-circle"></i> Clear Selection
			</button>
		</div>
		
		<div class="table-container">
			<table id="approvals_table" class="table table-hover dt-responsive nowrap" style="width:100%">
				<thead>
					<tr>
						<th><input type="checkbox" id="select_all" onclick="toggleSelectAll()"></th>
						<th><?php echo get_phrase('date'); ?></th>
						<th><?php echo get_phrase('description'); ?></th>
						<th><?php echo get_phrase('status'); ?></th>
						<th><?php echo get_phrase('actions'); ?></th>
					</tr>
				</thead>
				<tbody></tbody>
			</table>
		</div>
	</div>
</div>

<script>
var currentStatus = 'all';

// Get system theme color
var themeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#667eea';
var themeColorDark = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark') || '#5568d3';
document.documentElement.style.setProperty('--gradient-bg', 'linear-gradient(135deg, ' + themeColor + ' 0%, ' + themeColorDark + ' 100%)');

$(document).ready(function() {
	$('#approvals_table').DataTable({order: [[1, 'desc']]});
	loadApprovals('all');
	updateStats();
});

function updateStats() {
	$.ajax({
		url: '<?php echo site_url('admin/discount_approvals/get_data'); ?>?status=all',
		type: 'GET',
		dataType: 'json'
	}).done(function(response) {
		if(response.status === 'success') {
			const data = response.data;
			const pending = data.filter(i => i.status === 'pending').length;
			const approved = data.filter(i => i.status === 'approved').length;
			const rejected = data.filter(i => i.status === 'rejected').length;
			
			$('#pending_count').text(pending);
			$('#approved_count').text(approved);
			$('#rejected_count').text(rejected);
			$('#total_count').text(data.length);
		}
	});
}

function filterByStatus(status) {
	currentStatus = status;
	$('.filter-tab').removeClass('active');
	$('.filter-tab[data-status="'+status+'"]').addClass('active');
	loadApprovals(status);
}

function loadApprovals(status) {
	$.ajax({
		url: '<?php echo site_url('admin/discount_approvals/get_data'); ?>?status=' + status,
		type: 'GET',
		dataType: 'json'
	}).done(function(response) {
		if(response.status === 'success') {
			var table = $('#approvals_table').DataTable();
			table.clear();
			
			response.data.forEach(function(item) {
				var checkbox = '<input type="checkbox" class="row-checkbox" data-id="'+item.id+'" data-source="'+item.source+'" onclick="updateBulkActions()">';
				
				var typeBadge = item.source === 'profile_assignment' ? 
					'<span class="badge" style="background: #3b82f6; color: white;"><i class="fa fa-user"></i> Assignment</span>' : 
					'<span class="badge" style="background: #f59e0b; color: white;"><i class="fa fa-file-invoice"></i> Invoice</span>';
				
				var discountText = '';
				if(item.profile_name) {
					discountText = item.profile_name + ' (' + (item.discount_category || '').replace('_', ' ') + ')';
				} else {
					if(item.source === 'invoice_discount' && item.discount_amount) {
						discountText = '<?php echo get_settings('currency'); ?>' + parseFloat(item.discount_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ' + (item.discount_category || '').replace('_', ' ') + ' discount';
					} else {
						var discountValue = '';
						if(item.discount_method === 'percentage') {
							discountValue = parseFloat(item.discount_value).toFixed(2) + '%';
						} else {
							discountValue = '<?php echo get_settings('currency'); ?>' + parseFloat(item.discount_value).toFixed(2);
						}
						discountText = discountValue + ' ' + (item.discount_category || '').replace('_', ' ') + ' discount';
					}
				}
				
				var invoiceInfo = '';
				if(item.source === 'invoice_discount' && item.invoice_code) {
					invoiceInfo = ' <small class="text-muted">(Invoice: ' + item.invoice_code + ')</small>';
				}
				
				var description = '<div><strong class="student-name">' + item.student_name + '</strong> <small class="student-code">(' + item.student_code + ')</small>' + invoiceInfo + '<br>' +
					'<small class="discount-details">' + typeBadge + ' • ' + discountText + '</small></div>';
				
				var statusBadge = '';
				if(item.status === 'pending') statusBadge = '<span class="badge" style="background: #f59e0b; color: white;"><i class="fa fa-clock"></i> Pending</span>';
				else if(item.status === 'approved') statusBadge = '<span class="badge" style="background: #10b981; color: white;"><i class="fa fa-check-circle"></i> Approved</span>';
				else if(item.status === 'rejected') statusBadge = '<span class="badge" style="background: #ef4444; color: white;"><i class="fa fa-times-circle"></i> Rejected</span>';
				else if(item.status === 'pending_removal') statusBadge = '<span class="badge" style="background: #6b7280; color: white;"><i class="fa fa-trash-alt"></i> Pending Removal</span>';
				
				var actions = '<button class="action-btn" style="background: #3b82f6; color: white;" onclick="viewDetails('+item.id+', \''+item.source+'\')" title="View Details"><i class="fa fa-eye"></i></button> ';
				if(item.status === 'pending') {
					actions += '<button class="action-btn" style="background: #10b981; color: white;" onclick="approveDiscount('+item.id+', \''+item.source+'\')" title="Approve"><i class="fa fa-check"></i></button> '+
							  '<button class="action-btn" style="background: #ef4444; color: white;" onclick="rejectDiscount('+item.id+', \''+item.source+'\')" title="Reject"><i class="fa fa-times"></i></button>';
				} else if(item.status === 'approved') {
					actions += '<button class="action-btn" style="background: #ef4444; color: white;" onclick="revokeDiscount('+item.id+', \''+item.source+'\')" title="Revoke"><i class="fa fa-ban"></i></button>';
				} else if(item.status === 'rejected') {
					actions += '<button class="action-btn" style="background: #10b981; color: white;" onclick="approveDiscount('+item.id+', \''+item.source+'\')" title="Approve"><i class="fa fa-check"></i></button>';
				}
				
				table.row.add([
					checkbox,
					item.created_at,
					description,
					statusBadge,
					actions
				]);
			});
			
			table.draw();
		}
	});
}

var isProcessing = false;

function approveDiscount(id, source) {
	if(isProcessing) return;
	
	showConfirmModal('<?php echo get_phrase('confirm_approval'); ?>', '<?php echo get_phrase('approve_discount_confirm'); ?>', function() {
		if(isProcessing) return;
		isProcessing = true;
		
		showAjaxModal_alert('<?php echo get_phrase('processing'); ?>...', 'loading');
		$.ajax({
			url: '<?php echo site_url('admin/discount_approvals/approve'); ?>',
			type: 'POST',
			data: {id: id, source: source},
			dataType: 'json'
		}).done(function(response) {
			isProcessing = false;
			if(response.status === 'success') {
				showAjaxModal_alert(response.message, 'success', false);
				setTimeout(() => { $('.close').click(); loadApprovals(currentStatus); updateStats(); }, 1500);
			} else {
				showAjaxModal_alert(response.message, 'error');
			}
		}).fail(function() {
			isProcessing = false;
			showAjaxModal_alert('<?php echo get_phrase('error_occurred'); ?>', 'error');
		});
	}, '<?php echo get_phrase('approve'); ?>', 'success');
}

function rejectDiscount(id, source) {
	if(isProcessing) return;
	
	showConfirmModal('<?php echo get_phrase('confirm_rejection'); ?>', '<?php echo get_phrase('reject_discount_confirm'); ?>', function() {
		if(isProcessing) return;
		isProcessing = true;
		
		showAjaxModal_alert('<?php echo get_phrase('processing'); ?>...', 'loading');
		$.ajax({
			url: '<?php echo site_url('admin/discount_approvals/reject'); ?>',
			type: 'POST',
			data: {id: id, source: source},
			dataType: 'json'
		}).done(function(response) {
			isProcessing = false;
			if(response.status === 'success') {
				showAjaxModal_alert(response.message, 'success', false);
				setTimeout(() => { $('.close').click(); loadApprovals(currentStatus); }, 1500);
			} else {
				showAjaxModal_alert(response.message, 'error');
			}
		}).fail(function() {
			isProcessing = false;
			showAjaxModal_alert('<?php echo get_phrase('error_occurred'); ?>', 'error');
		});
	}, '<?php echo get_phrase('reject'); ?>', 'danger');
}

function viewDetails(id, source) {
	showAjaxModal_alert('<?php echo get_phrase('loading'); ?>...', 'loading');
	$.ajax({
		url: '<?php echo site_url('admin/get_details'); ?>',
		type: 'POST',
		data: {assignment_id: id, source: source},
		dataType: 'json'
	}).done(function(response) {
		$('.close').click();
		if(response.status === 'success') {
			showModalWithContent('detailsModal', '<i class="fa fa-info-circle"></i> Discount Approval Details', response.html);
		} else {
			showAjaxModal_alert(response.message || 'Failed to load details', 'error');
		}
	}).fail(function() {
		showAjaxModal_alert('<?php echo get_phrase('error_occurred'); ?>', 'error');
	});
}

function revokeDiscount(id, source) {
	if(isProcessing) return;
	
	showConfirmModal('<?php echo get_phrase('confirm_revoke'); ?>', 'Are you sure you want to revoke this approved discount?', function() {
		if(isProcessing) return;
		isProcessing = true;
		
		showAjaxModal_alert('<?php echo get_phrase('processing'); ?>...', 'loading');
		$.ajax({
			url: '<?php echo site_url('admin/discount_approvals/reject'); ?>',
			type: 'POST',
			data: {id: id, source: source},
			dataType: 'json'
		}).done(function(response) {
			isProcessing = false;
			if(response.status === 'success') {
				showAjaxModal_alert(response.message, 'success', false);
				setTimeout(() => { $('.close').click(); loadApprovals(currentStatus); }, 1500);
			} else {
				showAjaxModal_alert(response.message, 'error');
			}
		}).fail(function() {
			isProcessing = false;
			showAjaxModal_alert('<?php echo get_phrase('error_occurred'); ?>', 'error');
		});
	}, '<?php echo get_phrase('revoke'); ?>', 'danger');
}

function toggleSelectAll() {
	var checked = $('#select_all').prop('checked');
	$('.row-checkbox').prop('checked', checked);
	updateBulkActions();
}

function updateBulkActions() {
	var count = $('.row-checkbox:checked').length;
	$('#select_all').prop('checked', count > 0 && count === $('.row-checkbox').length);
	$('#bulk_actions').toggle(count > 0);
	$('#selected_count').text(count);
}

function deselectAll() {
	$('.row-checkbox').prop('checked', false);
	$('#select_all').prop('checked', false);
	updateBulkActions();
}

function bulkApprove() {
	if(isProcessing) return;
	
	var items = [];
	$('.row-checkbox:checked').each(function() {
		items.push({id: $(this).data('id'), source: $(this).data('source')});
	});
	
	if(items.length === 0) {
		showAjaxModal_alert('Please select at least one item', 'error');
		return;
	}
	
	showConfirmModal('Confirm Bulk Approval', 'Approve ' + items.length + ' discount(s)?', function() {
		if(isProcessing) return;
		isProcessing = true;
		
		showAjaxModal_alert('Processing...', 'loading');
		$.ajax({
			url: '<?php echo site_url('admin/discount_approvals/bulk_approve'); ?>',
			type: 'POST',
			data: {items: items},
			dataType: 'json'
		}).done(function(response) {
			isProcessing = false;
			if(response.status === 'success') {
				showAjaxModal_alert(response.message, 'success', false);
				setTimeout(() => { $('.close').click(); loadApprovals(currentStatus); updateStats(); deselectAll(); }, 1500);
			} else {
				showAjaxModal_alert(response.message, 'error');
			}
		}).fail(function() {
			isProcessing = false;
			showAjaxModal_alert('An error occurred', 'error');
		});
	}, 'Approve', 'success');
}

function bulkReject() {
	if(isProcessing) return;
	
	var items = [];
	$('.row-checkbox:checked').each(function() {
		items.push({id: $(this).data('id'), source: $(this).data('source')});
	});
	
	if(items.length === 0) {
		showAjaxModal_alert('Please select at least one item', 'error');
		return;
	}
	
	showConfirmModal('Confirm Bulk Rejection', 'Reject ' + items.length + ' discount(s)?', function() {
		if(isProcessing) return;
		isProcessing = true;
		
		showAjaxModal_alert('Processing...', 'loading');
		$.ajax({
			url: '<?php echo site_url('admin/discount_approvals/bulk_reject'); ?>',
			type: 'POST',
			data: {items: items},
			dataType: 'json'
		}).done(function(response) {
			isProcessing = false;
			if(response.status === 'success') {
				showAjaxModal_alert(response.message, 'success', false);
				setTimeout(() => { $('.close').click(); loadApprovals(currentStatus); updateStats(); deselectAll(); }, 1500);
			} else {
				showAjaxModal_alert(response.message, 'error');
			}
		}).fail(function() {
			isProcessing = false;
			showAjaxModal_alert('An error occurred', 'error');
		});
	}, 'Reject', 'danger');
}
</script>
