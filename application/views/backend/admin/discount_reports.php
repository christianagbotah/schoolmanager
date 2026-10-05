<style>
.reports-container, .reports-container * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; }
.reports-container { padding: 0 0 32px; background: #f8fafc; min-height: 100%; }
.reports-header { background: #2563eb; color: white; padding: 18px 20px; border-radius: 14px; margin-bottom: 16px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3); }
.reports-header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 700; color: white; }
.reports-header p { margin: 0; opacity: 0.9; font-size: 14px; }
.reports-container .report-tabs { background: white; border-radius: 12px; padding: 8px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; gap: 8px; }
.reports-container .tab-btn { flex: 1; padding: 16px; border: none; background: transparent; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.3s; color: #6b7280; }
.reports-container .tab-btn.active { background: #2563eb; color: white; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }
.reports-container .tab-btn:hover:not(.active) { background: #f3f4f6; }
.reports-container .filters-card { background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.reports-container .filters-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
.reports-container .filter-group { flex: 1; min-width: 200px; }
.reports-container .filter-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.reports-container .filter-select { width: 100%; padding: 9px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; height: var(--sm-ui-control-height, 42px); }
.reports-container .btn-generate { min-height: var(--sm-ui-control-height, 42px); height: var(--sm-ui-control-height, 42px); padding: 9px 14px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.reports-container .btn-generate:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); }
.reports-container .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
@media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }
.reports-container .stat-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid; }
.stat-card.purple { border-color: #667eea; }
.stat-card.green { border-color: #10b981; }
.stat-card.orange { border-color: #f59e0b; }
.stat-card.blue { border-color: #3b82f6; }
.reports-container .stat-value { font-size: 28px; font-weight: 700; margin: 8px 0; }
.reports-container .stat-label { color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; word-wrap: break-word; }
.reports-container .report-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.reports-container .report-card h3 { margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #1a202c; }
.reports-container .table { width: 100%; border-collapse: collapse; }
.reports-container .table thead { background: #f9fafb; }
.reports-container .table th { padding: 16px; text-align: left; font-weight: 600; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
.reports-container .table td { padding: 16px; border-bottom: 1px solid #f3f4f6; }
.reports-container .table tbody tr:hover { background: #f9fafb; }
.reports-container .badge { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; }
.reports-container .badge-purple { background: #ede9fe; color: #5b21b6; }
.reports-container .badge-green { background: #d1fae5; color: #065f46; }
.reports-container .badge-orange { background: #fef3c7; color: #92400e; }
.reports-container .badge-blue { background: #dbeafe; color: #1e40af; }
.reports-container .empty-state { text-align: center; padding: 60px 20px; color: #9ca3af; }
.reports-container .empty-state i { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
.reports-container .chart-container { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }
.reports-container .export-btn { min-height: var(--sm-ui-control-height, 42px); height: var(--sm-ui-control-height, 42px); padding: 9px 14px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; }
.reports-container .export-btn:hover { background: #059669; }
</style>
<style>
@media screen {

  .reports-container { padding: 0 0 32px; background: #f8fafc; }
  .reports-header {
    padding: 18px 20px; margin-bottom: 16px; border-radius: 14px;
    background: #0f172a; box-shadow: 0 8px 22px rgba(15,23,42,.14);
  }
  .reports-header h1 { font-size: 24px; line-height: 1.2; font-weight: 800; letter-spacing: -.02em; }
  .reports-header p { font-size: 14px; line-height: 1.5; color: #cbd5e1; opacity: 1; }

  .reports-container .report-tabs {
    gap: 5px; padding: 5px; margin-bottom: 14px;
    border: 1px solid #e2e8f0; border-radius: 11px;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
  }
  .reports-container .tab-btn {
    min-height: 40px; padding: 8px 12px; border-radius: 7px;
    font-size: 14px; font-weight: 700;
  }
  .reports-container .tab-btn.active { background: #2563eb; box-shadow: 0 2px 7px rgba(37,99,235,.16); }

  .reports-container .filters-card {
    padding: 14px 16px; margin-bottom: 14px;
    border: 1px solid #e2e8f0; border-radius: 12px;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
  }
  .reports-container .filters-card > div {
    display: grid !important; grid-template-columns: repeat(2,minmax(150px,1fr)) auto auto;
    gap: 10px !important; align-items: end !important;
  }
  .reports-container .filter-group label {
    margin-bottom: 6px; color: #334155; font-size: 13px; font-weight: 800; letter-spacing: .035em;
  }
  .reports-container .filter-select {
    min-height: var(--sm-ui-control-height, 42px); height: var(--sm-ui-control-height, 42px); padding: 8px 10px;
    border: 1px solid #cbd5e1; border-radius: 8px; color: #0f172a; font-size: 14px;
  }
  .reports-container .btn-generate, .reports-container .export-btn {
    min-height: var(--sm-ui-control-height, 42px); height: var(--sm-ui-control-height, 42px); padding: 8px 14px;
    border-radius: 8px; font-size: 14px; font-weight: 800;
  }
  .reports-container .btn-generate:hover { transform: none; box-shadow: 0 3px 8px rgba(37,99,235,.15); }

  .reports-container .stats-grid { gap: 12px; margin-bottom: 14px; }
  .reports-container .stat-card {
    min-height: 96px; padding: 14px 16px;
    border: 1px solid #e2e8f0; border-left-width: 4px;
    border-radius: 12px; box-shadow: 0 1px 2px rgba(15,23,42,.05);
  }
  .reports-container .stat-value { margin: 4px 0 0; color: #0f172a; font-size: 25px; line-height: 1.2; font-weight: 800; }
  .reports-container .stat-label { color: #64748b; font-size: 13px; line-height: 1.35; font-weight: 800; }

  .reports-container .report-card {
    padding: 16px 18px; border: 1px solid #e2e8f0; border-radius: 12px;
    box-shadow: 0 1px 2px rgba(15,23,42,.05); overflow-x: auto;
  }
  .reports-container .report-card h3 { margin-bottom: 14px; color: #0f172a; font-size: 17px; font-weight: 800; }
  .reports-container .report-card .table { min-width: 860px; }
  .reports-container .report-card .table th {
    padding: 11px 12px; background: #f8fafc; color: #475569;
    font-size: 13px; font-weight: 800; border-bottom: 1px solid #e2e8f0;
  }
  .reports-container .report-card .table td { padding: 11px 12px; color: #334155; font-size: 14px; line-height: 1.45; }
  .reports-container .report-card .badge { padding: 4px 8px; border-radius: 999px; font-size: 12.5px; font-weight: 700; }
  .reports-container .empty-state { padding: 34px 18px !important; font-size: 14px; }
  .reports-container .empty-state i { font-size: 38px; margin-bottom: 10px; }

  @media (max-width: 700px) {
    .reports-container { padding: 0 0 28px; }
    .reports-header { padding: 18px 16px; }
    .reports-header h1 { font-size: 22px; }
    .reports-container .report-tabs { overflow-x: auto; }
    .reports-container .tab-btn { min-width: max-content; }
    .reports-container .filters-card > div { grid-template-columns: 1fr !important; }
    .reports-container .btn-generate, .reports-container .export-btn { width: 100%; justify-content: center; }
    .reports-container .stats-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  }

}
</style>


<div class="reports-container">
    <div class="reports-header">
        <h1><i class="fa fa-chart-bar"></i> <?php echo get_phrase('discount_reports'); ?></h1>
        <p><?php echo get_phrase('comprehensive_discount_analytics_and_insights'); ?></p>
    </div>

    <div class="report-tabs">
        <button class="tab-btn active" onclick="switchTab('by_class')">
            <i class="fa fa-school"></i> <?php echo get_phrase('by_class'); ?>
        </button>
        <button class="tab-btn" onclick="switchTab('by_profile')">
            <i class="fa fa-tags"></i> <?php echo get_phrase('by_profile'); ?>
        </button>
        <button class="tab-btn" onclick="switchTab('by_student')">
            <i class="fa fa-user-graduate"></i> <?php echo get_phrase('by_student'); ?>
        </button>
    </div>

    <div class="filters-card">
        <div class="filters-row">
            <div class="filter-group">
                <label><?php echo get_phrase('academic_year'); ?></label>
                <select id="filterYear" class="filter-select">
                    <?php 
                    $years = populate_academic_year();
                    if($years && is_array($years)):
                        foreach($years as $year): 
                    ?>
                        <option value="<?php echo $year; ?>" <?php echo $year == get_settings('running_year') ? 'selected' : ''; ?>><?php echo $year; ?></option>
                    <?php 
                        endforeach;
                    else:
                    ?>
                        <option value="<?php echo get_settings('running_year'); ?>" selected><?php echo get_settings('running_year'); ?></option>
                    <?php endif; ?>
                </select>
            </div>
            <div class="filter-group">
                <label><?php echo get_phrase('term'); ?></label>
                <select id="filterTerm" class="filter-select">
                    <option value="1" <?php echo get_settings('running_term') == 1 ? 'selected' : ''; ?>><?php echo get_phrase('term_1'); ?></option>
                    <option value="2" <?php echo get_settings('running_term') == 2 ? 'selected' : ''; ?>><?php echo get_phrase('term_2'); ?></option>
                    <option value="3" <?php echo get_settings('running_term') == 3 ? 'selected' : ''; ?>><?php echo get_phrase('term_3'); ?></option>
                </select>
            </div>
            <button class="btn-generate" onclick="generateReport()">
                <i class="fa fa-sync"></i> <?php echo get_phrase('generate_report'); ?>
            </button>
            <button class="export-btn" onclick="exportReport()">
                <i class="fa fa-download"></i> <?php echo get_phrase('export'); ?>
            </button>
        </div>
    </div>

    <div class="stats-grid" id="statsGrid" style="display:none;">
        <div class="stat-card purple">
            <div class="stat-label"><?php echo get_phrase('total_records'); ?></div>
            <div class="stat-value" id="stat-total">0</div>
        </div>
        <div class="stat-card green">
            <div class="stat-label"><?php echo get_phrase('total_students'); ?></div>
            <div class="stat-value" id="stat-students">0</div>
        </div>
        <div class="stat-card orange">
            <div class="stat-label"><?php echo get_phrase('avg_discount'); ?></div>
            <div class="stat-value" id="stat-avg">0%</div>
        </div>
        <div class="stat-card blue">
            <div class="stat-label"><?php echo get_phrase('total_discount'); ?></div>
            <div class="stat-value" id="stat-sum">0%</div>
        </div>
    </div>

    <div class="report-card">
        <h3 id="reportTitle"><?php echo get_phrase('select_report_type_and_generate'); ?></h3>
        <div id="reportContent">
            <div class="empty-state">
                <i class="fa fa-chart-line"></i>
                <div><?php echo get_phrase('click_generate_to_view_report'); ?></div>
            </div>
        </div>
    </div>
</div>

<script>
let currentTab = 'by_class';
let reportData = [];

function switchTab(tab) {
    currentTab = tab;
    $('.tab-btn').removeClass('active');
    event.target.closest('.tab-btn').classList.add('active');
    $('#reportContent').html(`
        <div class="empty-state">
            <i class="fa fa-chart-line"></i>
            <div><?php echo get_phrase('click_generate_to_view_report'); ?></div>
        </div>
    `);
    $('#statsGrid').hide();
}

function generateReport() {
    showAjaxModal_alert('<?php echo get_phrase('generating_report'); ?>...', 'loading');
    
    $.ajax({
        url: '<?php echo site_url('admin/discount_reports/get_data'); ?>',
        type: 'GET',
        data: {
            type: currentTab,
            year: $('#filterYear').val(),
            term: $('#filterTerm').val()
        },
        dataType: 'json'
    }).done(function(response) {
        if(response.status === 'success') {
            reportData = response.data;
            renderReport();
            $('.close').click();
        } else {
            showAjaxModal_alert('<?php echo get_phrase('failed_to_generate_report'); ?>', 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('<?php echo get_phrase('error_occurred'); ?>', 'error');
    });
}

function renderReport() {
    if(reportData.length === 0) {
        $('#reportContent').html(`
            <div class="empty-state">
                <i class="fa fa-inbox"></i>
                <div><?php echo get_phrase('no_data_found'); ?></div>
            </div>
        `);
        $('#statsGrid').hide();
        return;
    }

    if(currentTab === 'by_class') {
        renderClassReport();
    } else if(currentTab === 'by_profile') {
        renderProfileReport();
    } else if(currentTab === 'by_student') {
        renderStudentReport();
    }
    
    $('#statsGrid').show();
}

function renderClassReport() {
    $('#reportTitle').html('<i class="fa fa-school"></i> <?php echo get_phrase('discount_report_by_class'); ?>');
    
    let totalStudents = reportData.reduce((sum, item) => sum + parseInt(item.student_count), 0);
    let avgDiscount = reportData.reduce((sum, item) => sum + parseFloat(item.avg_discount), 0) / reportData.length;
    let totalDiscount = reportData.reduce((sum, item) => sum + parseFloat(item.total_discount), 0);
    
    $('#stat-total').text(reportData.length);
    $('#stat-students').text(totalStudents);
    $('#stat-avg').text(avgDiscount.toFixed(1) + '%');
    $('#stat-sum').text(totalDiscount.toFixed(0) + '%');
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th><?php echo get_phrase('class'); ?></th>
                    <th><?php echo get_phrase('students_with_discount'); ?></th>
                    <th><?php echo get_phrase('average_discount'); ?></th>
                    <th><?php echo get_phrase('total_discount'); ?></th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.forEach(item => {
        html += `
            <tr>
                <td><span class="badge badge-purple">${item.class_name} ${item.name_numeric}</span></td>
                <td><strong>${item.student_count}</strong></td>
                <td><span class="badge badge-green">${parseFloat(item.avg_discount).toFixed(1)}%</span></td>
                <td><span class="badge badge-orange">${parseFloat(item.total_discount).toFixed(0)}%</span></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    $('#reportContent').html(html);
}

function renderProfileReport() {
    $('#reportTitle').html('<i class="fa fa-tags"></i> <?php echo get_phrase('discount_report_by_profile'); ?>');
    
    let totalStudents = reportData.reduce((sum, item) => sum + parseInt(item.student_count || 0), 0);
    let totalAssignments = reportData.reduce((sum, item) => sum + parseInt(item.assignment_count || 0), 0);
    let avgDiscount = reportData.reduce((sum, item) => sum + parseFloat(item.discount_value || 0), 0) / reportData.length;
    
    $('#stat-total').text(reportData.length);
    $('#stat-students').text(totalStudents);
    $('#stat-avg').text(avgDiscount.toFixed(1) + '%');
    $('#stat-sum').text(totalAssignments);
    $('.stat-card.blue .stat-label').text('<?php echo get_phrase('total_assignments'); ?>');
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th><?php echo get_phrase('profile_name'); ?></th>
                    <th><?php echo get_phrase('discount_type'); ?></th>
                    <th><?php echo get_phrase('category'); ?></th>
                    <th><?php echo get_phrase('discount_value'); ?></th>
                    <th><?php echo get_phrase('students'); ?></th>
                    <th><?php echo get_phrase('assignments'); ?></th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.forEach(item => {
        let category = item.discount_category ? item.discount_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
        let discountType = item.discount_type ? item.discount_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-';
        let discountValue = item.discount_method === 'percentage' 
            ? parseFloat(item.discount_value).toFixed(1) + '%'
            : 'GHS ' + parseFloat(item.discount_value).toFixed(2);
        
        html += `
            <tr>
                <td><strong>${item.profile_name}</strong></td>
                <td><span class="badge badge-blue">${discountType}</span></td>
                <td><span class="badge badge-purple">${category}</span></td>
                <td><span class="badge badge-green">${discountValue}</span></td>
                <td><strong>${item.student_count || 0}</strong></td>
                <td><strong>${item.assignment_count || 0}</strong></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    $('#reportContent').html(html);
}

function renderStudentReport() {
    $('#reportTitle').html('<i class="fa fa-user-graduate"></i> <?php echo get_phrase('discount_report_by_student'); ?>');
    
    let uniqueStudents = [...new Set(reportData.map(item => item.student_id))].length;
    let avgDiscount = reportData.reduce((sum, item) => sum + parseFloat(item.discount_value), 0) / reportData.length;
    let totalBenefitAmount = reportData.reduce((sum, item) => sum + parseFloat(item.total_benefit_amount || 0), 0);
    
    $('#stat-total').text(reportData.length);
    $('#stat-students').text(uniqueStudents);
    $('#stat-avg').text(avgDiscount.toFixed(1) + '%');
    $('#stat-sum').text(totalBenefitAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
    $('#stat-sum').prepend('<sup style="font-size: 14px; vertical-align: super;">GHS</sup> ');
    $('.stat-card.blue .stat-label').text('<?php echo get_phrase('total_benefit'); ?>');
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>#</th>
                    <th><?php echo get_phrase('student'); ?></th>
                    <th><?php echo get_phrase('class'); ?></th>
                    <th><?php echo get_phrase('profile'); ?></th>
                    <th><?php echo get_phrase('category'); ?></th>
                    <th><?php echo get_phrase('discount_type'); ?></th>
                    <th><?php echo get_phrase('discount_value'); ?></th>
                    <th><?php echo get_phrase('total_benefit'); ?></th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportData.forEach((item, index) => {
        let category = item.discount_category ? item.discount_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
        let discountType = (category === 'Invoice' || !item.discount_type || item.discount_type === '-') 
            ? '-' 
            : item.discount_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        let discountValue = item.discount_method === 'percentage' 
            ? parseFloat(item.discount_value).toFixed(1) + '%'
            : 'GHS ' + parseFloat(item.discount_value).toFixed(2);
        
        html += `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>
                    <div style="font-weight: 600;">${item.student_name}</div>
                    <div style="font-size: 12px; color: #6b7280;">${item.student_code}</div>
                </td>
                <td><span class="badge badge-purple">${item.class_name}</span></td>
                <td><strong>${item.profile_name}</strong></td>
                <td><span class="badge badge-blue">${category}</span></td>
                <td><span class="badge badge-purple">${discountType}</span></td>
                <td><span class="badge badge-green">${discountValue}</span></td>
                <td><span class="badge badge-orange">GHS ${parseFloat(item.total_benefit_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
            <tfoot>
                <tr style="background: #f9fafb; font-weight: 700;">
                    <td colspan="7" style="text-align: right; padding: 16px;">GRAND TOTAL:</td>
                    <td><span class="badge badge-orange" style="font-size: 14px;">GHS ${totalBenefitAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></td>
                </tr>
            </tfoot>
        </table>
    `;
    $('#reportContent').html(html);
}

function exportReport() {
    if(reportData.length === 0) {
        showAjaxModal_alert('<?php echo get_phrase('no_data_to_export'); ?>', 'error');
        return;
    }
    
    showAjaxModal_alert('<?php echo get_phrase('generating_excel'); ?>...', 'loading');
    
    $.ajax({
        url: '<?php echo site_url('admin/discount_reports_export'); ?>',
        type: 'POST',
        data: {
            type: currentTab,
            data: JSON.stringify(reportData),
            year: $('#filterYear').val(),
            term: $('#filterTerm').val()
        },
        xhrFields: {
            responseType: 'blob'
        }
    }).done(function(blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `discount_report_${currentTab}_${new Date().getTime()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        $('.close').click();
        showAjaxModal_alert('<?php echo get_phrase('report_exported_successfully'); ?>', 'success', false);
    }).fail(function() {
        showAjaxModal_alert('<?php echo get_phrase('export_failed'); ?>', 'error');
    });
}
</script>






