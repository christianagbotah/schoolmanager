<style>
/* Direct UI/UX rebuild — Transport Management */
.transport-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    background: #f8fafc;
    min-height: 100%;
}
.transport-workspace > .col-md-12 { padding: 0 !important; }
.transport-workspace .panel.panel-primary {
    margin: 0 !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}
.transport-workspace .panel-heading {
    padding: 0 0 18px !important;
    margin-bottom: 18px;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: transparent !important;
}
.transport-workspace .panel-heading > div {
    align-items: flex-end !important;
    gap: 14px !important;
}
.transport-workspace .panel-heading h4 {
    margin: 0 !important;
    color: #0f172a !important;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800 !important;
    letter-spacing: -.02em;
}
.transport-workspace .panel-heading h4 i {
    margin-right: 7px;
    color: #2563eb;
}
.transport-workspace .panel-body {
    padding: 0 !important;
    background: transparent !important;
}
.header-actions-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}
.transport-workspace .header-btn-mobile,
.transport-workspace .action-btn {
    min-height: 40px;
    padding: 8px 12px !important;
    margin: 0 !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    background: #fff !important;
    color: #334155 !important;
    box-shadow: none !important;
    transform: none !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    white-space: nowrap;
}
.transport-workspace .header-btn-mobile:hover,
.transport-workspace .action-btn:hover {
    border-color: #94a3b8 !important;
    background: #f8fafc !important;
    transform: none !important;
    box-shadow: none !important;
}
.transport-workspace .action-btn:first-child {
    border-color: #2563eb !important;
    background: #2563eb !important;
    color: #fff !important;
}
.transport-workspace .panel-body > .row {
    margin-left: -6px;
    margin-right: -6px;
}
.transport-workspace .panel-body > .row > [class*="col-"] {
    padding-left: 6px;
    padding-right: 6px;
}
.transport-stat-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 132px;
    margin-bottom: 12px;
    padding: 17px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
    cursor: pointer;
    transition: border-color .2s ease, box-shadow .2s ease;
}
.transport-stat-card:hover {
    transform: none;
    box-shadow: 0 7px 18px rgba(15,23,42,.08);
}
.transport-stat-card .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    border-radius: 11px;
    background: #eff6ff !important;
    color: #2563eb !important;
    font-size: 19px;
}
.transport-stat-card .stat-content { flex: 1; text-align: right; }
.transport-stat-card .stat-value {
    margin-bottom: 5px;
    color: #0f172a !important;
    font-size: 28px;
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: -.02em;
}
.transport-stat-card .stat-value sup { font-size: 12px !important; }
.transport-stat-card .stat-label {
    color: #64748b;
    font-size: 12px;
    line-height: 1.3;
    font-weight: 800;
    letter-spacing: .045em;
    text-transform: uppercase;
}
.transport-workspace hr {
    margin: 5px 0 16px;
    border-color: #e2e8f0;
}
.transport-workspace .no-print[style*="margin-bottom"] {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px !important;
}
.table-responsive-wrapper {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
    padding: 0 !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px !important;
    background: #fff !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
#transport_table {
    width: 100% !important;
    min-width: 940px;
    margin: 0 !important;
    border-collapse: collapse;
}
#transport_table thead th {
    position: static;
    padding: 12px 13px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    text-transform: uppercase;
}
#transport_table tbody td {
    padding: 12px 13px !important;
    border-bottom: 1px solid #eef2f7 !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle;
}
#transport_table tbody tr { background: #fff; }
#transport_table tbody tr:hover { background: #f8fbff !important; box-shadow: none; }
#transport_table tbody tr td:first-child { color: #2563eb !important; font-weight: 800; }
.transport-workspace .dataTables_wrapper {
    min-width: 940px;
    padding: 14px;
}
.transport-workspace .dataTables_length,
.transport-workspace .dataTables_filter,
.transport-workspace .dataTables_info,
.transport-workspace .dataTables_paginate {
    color: #475569;
    font-size: 14px;
}
.transport-workspace .dataTables_length select,
.transport-workspace .dataTables_filter input {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
}
.transport-workspace .dataTables_paginate .paginate_button {
    padding: 6px 10px !important;
    margin: 0 2px !important;
    border-radius: 7px !important;
}
.transport-workspace .dataTables_paginate .paginate_button.current {
    border-color: #2563eb !important;
    background: #2563eb !important;
    color: #fff !important;
}
.report-section {
    margin-top: 16px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
@media print {
    .no-print { display: none !important; }
    .transport-workspace { padding: 0 !important; background: #fff; }
    .report-section, .table-responsive-wrapper { box-shadow: none !important; }
}
@media (max-width: 767px) {
    .transport-workspace { padding: 18px 14px 32px !important; }
    .transport-workspace .panel-heading > div { display: block !important; }
    .transport-workspace .panel-heading h4 { font-size: 26px !important; }
    .header-actions-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: 100%;
        margin-top: 14px;
    }
    .transport-workspace .header-btn-mobile { width: 100%; text-align: center; }
    .transport-workspace .no-print[style*="margin-bottom"] {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
    .transport-workspace .action-btn { width: 100%; text-align: center; }
    .transport-stat-card { min-height: 116px; padding: 14px; }
    .transport-stat-card .stat-value { font-size: 24px; }
    .transport-workspace .dataTables_filter { float: none; text-align: left; margin-top: 10px; }
    .transport-workspace .dataTables_filter input { width: 220px; max-width: calc(100vw - 90px); font-size: 16px; }
}
@media (max-width: 480px) {
    .header-actions-container,
    .transport-workspace .no-print[style*="margin-bottom"] { grid-template-columns: 1fr; }
}
</style>
<div class="row transport-workspace">
    <div class="col-md-12">
        <div class="panel panel-primary">
            <div class="panel-heading" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <h4 style="margin: 0; color: white; font-weight: 700;">
                        <i class="fa fa-bus"></i> <?php echo get_phrase('transport_management'); ?>
                    </h4>
                    <div class="no-print header-actions-container">
                        <button onclick="navigation('<?php echo site_url('admin/transport_reports'); ?>')" class="btn header-btn-mobile" style="background: white; color: #3b82f6; font-weight: 600; font-size: 14px; padding: 10px 20px; margin-right: 10px; border: 2px solid #3b82f6; border-radius: 8px;">
                            <i class="entypo-chart-line"></i> <span class="hidden-xs">View Reports</span><span class="visible-xs">Reports</span>
                        </button>
                        <button onclick="exportTemplate()" class="btn header-btn-mobile" style="background: #8b5cf6; color: white; font-weight: 600; font-size: 14px; padding: 10px 20px; margin-right: 10px; border: none; border-radius: 8px;">
                            <i class="fa fa-download"></i> <span class="hidden-xs">Export Template</span><span class="visible-xs">Template</span>
                        </button>
                        <button onclick="showImportModal()" class="btn header-btn-mobile" style="background: #f59e0b; color: white; font-weight: 600; font-size: 14px; padding: 10px 20px; margin-right: 10px; border: none; border-radius: 8px;">
                            <i class="fa fa-upload"></i> <span class="hidden-xs">Import Excel</span><span class="visible-xs">Import</span>
                        </button>
                        <button onclick="window.print()" class="btn header-btn-mobile" style="background: rgba(255,255,255,0.2); color: white; font-weight: 600; font-size: 14px; padding: 10px 20px; margin-right: 10px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px;">
                            <i class="fa fa-print"></i> <span class="hidden-xs">Print</span><span class="visible-xs">Print</span>
                        </button>
                        <button onclick="exportToExcel()" class="btn header-btn-mobile" style="background: #10b981; color: white; font-weight: 600; font-size: 14px; padding: 10px 20px; border: none; border-radius: 8px;">
                            <i class="fa fa-file-excel"></i> <span class="hidden-xs">Export Excel</span><span class="visible-xs">Excel</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="panel-body" style="background: #f5f7fa;">
                <!-- Statistics Cards -->
                <div class="row">
                    <?php 
                    $total_routes = $this->db->count_all('transport');
                    $running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
                    $running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
                    $students_count = $this->db->where('transport_id IS NOT NULL', null, false)
                        ->where('year', $running_year)
                        ->where('term', $running_term)
                        ->from('enroll')->count_all_results();
                    $assigned_routes = $this->db->query("SELECT COUNT(DISTINCT transport_id) as count FROM enroll WHERE transport_id IS NOT NULL AND year = '$running_year' AND term = '$running_term'")->row()->count;
                    $total_collected = $this->db->query("SELECT COALESCE(SUM(transport_amount), 0) as total FROM daily_fee_transactions WHERE year = '$running_year' AND term = '$running_term'")->row()->total;
                    ?>
                    <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                        <div class="transport-stat-card" style="border-left-color: #3b82f6;" onclick="showStatModal('routes')">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white;">
                                <i class="fa fa-route"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" style="color: #3b82f6;"><?php echo $total_routes; ?></div>
                                <div class="stat-label"><?php echo get_phrase('total_routes'); ?></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                        <div class="transport-stat-card" style="border-left-color: #10b981;" onclick="showStatModal('students')">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                                <i class="fa fa-users"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" style="color: #10b981;"><?php echo $students_count; ?></div>
                                <div class="stat-label"><?php echo get_phrase('students'); ?></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                        <div class="transport-stat-card" style="border-left-color: #f59e0b;" onclick="showStatModal('assigned')">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                                <i class="fa fa-bus-alt"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" style="color: #f59e0b;"><?php echo $assigned_routes; ?></div>
                                <div class="stat-label"><?php echo get_phrase('active_routes'); ?></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12">
                        <div class="transport-stat-card" style="border-left-color: #8b5cf6;" onclick="showStatModal('collected')">
                            <div class="stat-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white;">
                                <i class="fa fa-money-bill-wave"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" style="color: #8b5cf6;"><sup style="font-size: 18px; font-weight: 600;">GHS</sup> <?php echo number_format($total_collected, 2); ?></div>
                                <div class="stat-label"><?php echo get_phrase('fare_collected/term'); ?></div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr>

                <!-- Action Buttons -->
                <div class="no-print" style="margin-bottom: 20px;">
                    <button onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_transport_add'); ?>')" class="action-btn" style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; margin-right: 10px;">
                        <i class="fa fa-plus"></i> <?php echo get_phrase('add_route'); ?>
                    </button>
                    <button onclick="navigation('<?php echo site_url('admin/assign_transport'); ?>')" class="action-btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; margin-right: 10px;">
                        <i class="fa fa-user-plus"></i> <?php echo get_phrase('assign_students'); ?>
                    </button>
                    <button onclick="navigation('<?php echo site_url('admin/transport_reports'); ?>')" class="action-btn" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; margin-right: 10px;">
                        <i class="entypo-chart-line"></i> <?php echo get_phrase('view_reports'); ?>
                    </button>
                    <button onclick="navigation('<?php echo site_url('fee_collection'); ?>')" class="action-btn" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                        <i class="fa fa-hand-holding-usd"></i> <?php echo get_phrase('collect_fare'); ?>
                    </button>
                </div>

                <!-- Transport Routes Table -->
                <div class="table-responsive-wrapper" style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow-x: auto;">
                    <table class="table table-bordered datatable" id="transport_table" style="width:100%; margin-bottom: 0;">
                        <thead>
                            <tr>
                                <th style="width: 80px; min-width: 60px;"><?php echo get_phrase('route_id'); ?></th>
                                <th style="min-width: 120px;"><?php echo get_phrase('route_name'); ?></th>
                                <th style="width: 100px; text-align: center; min-width: 80px;"><?php echo get_phrase('vehicles'); ?></th>
                                <th style="width: 120px; min-width: 90px;"><?php echo get_phrase('fare'); ?></th>
                                <th style="min-width: 150px;"><?php echo get_phrase('description'); ?></th>
                                <th style="width: 100px; text-align: center; min-width: 80px;"><?php echo get_phrase('students'); ?></th>
                                <th class="no-print" style="width: 120px; text-align: center; min-width: 100px;"><?php echo get_phrase('actions'); ?></th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>


<script src="<?php echo base_url(); ?>assets/cdn/js/xlsx.full.min.js"></script>
<script>
$(document).ready(function() {
    $('#transport_table').DataTable({
        processing: true,
        serverSide: true,
        ajax: { url: '<?php echo site_url("admin/get_transports"); ?>', type: 'POST' },
        columns: [
            { data: 'transport_id', className: 'font-semibold' },
            { data: 'route_name' },
            { data: 'number_of_vehicle', className: 'text-center' },
            { data: 'route_fare' },
            { data: 'description' },
            { data: 'students_count', className: 'text-center' },
            { data: 'options', orderable: false, className: 'text-center no-print' }
        ],
        pageLength: 25,
        order: [[0, 'asc']],
        language: {
            search: "Search routes:",
            lengthMenu: "Show _MENU_ routes",
            info: "Showing _START_ to _END_ of _TOTAL_ routes",
            paginate: {
                first: "First",
                last: "Last",
                next: "Next",
                previous: "Previous"
            }
        }
    });
});

function transport_edit_modal(transport_id) {
    showAjaxModal('<?php echo site_url("admin/modal_transport_edit/"); ?>' + transport_id);
}

function transport_delete_confirm(transport_id) {
    showConfirmModal(
        'Confirm Delete',
        'Are you sure you want to delete this transport route?',
        function() {
            showAjaxModal_alert('Deleting...', 'loading');
            $.ajax({
                url: '<?php echo site_url("admin/transport/delete/"); ?>' + transport_id,
                type: 'POST',
                dataType: 'json'
            }).done(function(response) {
                if (response.message == 'done') {
                    showAjaxModal_alert('Deleted successfully', 'success');
                    setTimeout(() => $('#transport_table').DataTable().ajax.reload(null, false), 2000);
                } else {
                    showAjaxModal_alert('Delete failed', 'error');
                }
            }).fail(function() {
                showAjaxModal_alert('An error occurred', 'error');
            });
        },
        'Delete',
        'danger'
    );
}

function showStatModal(type) {
    if(type === 'collected') {
        showCollectedFaresModal();
    } else {
        showAjaxModal('<?php echo site_url("admin/modal_transport_stats/"); ?>' + type, 'big');
    }
}

function showCollectedFaresModal() {
    showAjaxModal_alert('Loading data...', 'loading');
    $.ajax({
        url: '<?php echo site_url("admin/get_transport_collected_fares_by_term"); ?>',
        type: 'GET',
        dataType: 'json'
    }).done(function(response) {
        $('#modal_alert').modal('hide');
        if(response.status === 'success') {
            var html = '<div id="collectedFaresContent">';

            html += '<div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;" class="no-print">';
            html += '<h4 style="margin: 0; color: #1f2937; font-weight: 700;">Transport Fares Collected - <?php echo get_settings("running_term"); ?> Term, <?php echo get_settings("running_year"); ?></h4>';
            html += '<button onclick="printCollectedFares()" class="btn btn-primary" style="background: #3b82f6; border: none; padding: 10px 20px; border-radius: 8px;">';
            html += '<i class="fa fa-print"></i> Print</button></div>';
            html += '<div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">';
            html += '<div style="font-size: 24px; font-weight: 700; color: #10b981;">Total: GHS ' + parseFloat(response.total).toFixed(2) + '</div>';
            html += '<div style="color: #6b7280; margin-top: 4px;">' + response.students.length + ' students made payments</div></div>';
            html += '<table class="table table-bordered" style="background: white;"><thead style="background: #f3f4f6;"><tr>';
            html += '<th style="padding: 12px;">#</th><th style="padding: 12px;">Student Code</th><th style="padding: 12px;">Student Name</th>';
            html += '<th style="padding: 12px;">Class</th><th style="padding: 12px; text-align: right;">Amount Paid (GHS)</th></tr></thead><tbody>';
            
            response.students.forEach(function(student, index) {
                html += '<tr><td style="padding: 12px;">' + (index + 1) + '</td>';
                html += '<td style="padding: 12px; font-weight: 600;">' + student.student_code + '</td>';
                html += '<td style="padding: 12px;">' + student.student_name + '</td>';
                html += '<td style="padding: 12px;">' + student.class_name + (student.section_name ? ' ' + student.section_name : '') + '</td>';
                html += '<td style="padding: 12px; text-align: right; font-weight: 700; color: #10b981;">' + parseFloat(student.total_paid).toFixed(2) + '</td></tr>';
            });
            
            html += '</tbody></table></div>';
            
            showModalWithContent('detailsModal', '<i class="fa fa-money-bill-wave"></i> Transport Fares Collected This Term', html);
        } else {
            showAjaxModal_alert(response.message || 'Failed to load data', 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('An error occurred', 'error');
    });
}

function printCollectedFares() {
    var content = document.getElementById('collectedFaresContent').innerHTML;
    var printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write('<html><head><title>Transport Fares Collected</title>');
    printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }');
    printWindow.document.write('th { background: #f3f4f6; font-weight: 700; }');
    printWindow.document.write('.no-print { display: none !important; }');
    printWindow.document.write('h4 { color: #1f2937; }</style></head><body>');
    printWindow.document.write(content);
    printWindow.document.write('<script>window.print(); window.close();<\/script></body></html>');
    printWindow.document.close();
}

function exportToExcel() {
    showAjaxModal_alert('Preparing Excel export...', 'loading');
    $.ajax({
        url: '<?php echo site_url("admin/get_transport_report_data"); ?>',
        type: 'GET',
        dataType: 'json'
    }).done(function(data) {
        const wb = XLSX.utils.book_new();
        
        // Summary sheet
        const summaryData = [
            ['Transport Management Report'],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['Summary Statistics'],
            ['Total Routes', data.total_routes],
            ['Total Students', data.total_students],
            ['Active Routes', data.active_routes],
            ['Total Collected (GHS)', parseFloat(data.total_collected).toFixed(2)]
        ];
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
        
        // Routes sheet
        const routesData = [['Route Name', 'Vehicles', 'Fare (GHS)', 'Students', 'Description']];
        data.routes.forEach(route => {
            routesData.push([
                route.route_name,
                route.number_of_vehicle,
                parseFloat(route.route_fare).toFixed(2),
                route.students_count,
                route.description || '-'
            ]);
        });
        const routesWs = XLSX.utils.aoa_to_sheet(routesData);
        XLSX.utils.book_append_sheet(wb, routesWs, 'Routes');
        
        XLSX.writeFile(wb, 'Transport_Report_' + new Date().toISOString().split('T')[0] + '.xlsx');
        showAjaxModal_alert('Excel file downloaded successfully', 'success', false);
    }).fail(function() {
        showAjaxModal_alert('Failed to export to Excel', 'error');
    });
}

function exportTemplate() {
    showAjaxModal_alert('Generating template...', 'loading');
    window.location.href = '<?php echo site_url("admin/get_transport_template_data"); ?>';
    setTimeout(function() {
        showAjaxModal_alert('Template downloaded successfully!<br>Check your Downloads folder', 'success', false);
    }, 10000);
}

function showImportModal() {
    var content = '<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 8px;">';
    content += '<p style="margin: 0; color: #92400e; font-size: 14px;"><i class="fa fa-info-circle"></i> <strong>Instructions:</strong><br>';
    content += '1. Download template &rarr; 2. Fill data &rarr; 3. Upload file</p></div>';
    content += '<form id="importForm" enctype="multipart/form-data">';
    content += '<input type="hidden" name="<?php echo $this->security->get_csrf_token_name(); ?>" value="<?php echo $this->security->get_csrf_hash(); ?>">';
    content += '<div class="row"><div class="col-md-7"><div class="form-group">';
    content += '<label style="font-weight: 600; color: #374151;">Select Excel File (.xlsx)</label>';
    content += '<input type="file" name="excel_file" id="excel_file" accept=".xlsx" class="form-control" required style="padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">';
    content += '</div></div><div class="col-md-5"><div class="form-group">';
    content += '<label style="font-weight: 600; color: #374151; display: block; margin-bottom: 8px;">Options</label>';
    content += '<label style="display: flex; align-items: center; cursor: pointer; margin-top: 10px;">';
    content += '<input type="checkbox" name="create_routes" value="1" checked style="margin-right: 8px; width: 18px; height: 18px;">';
    content += '<span style="color: #374151;">Create new routes</span></label></div></div></div>';
    content += '<button type="button" onclick="processImport()" class="btn btn-primary btn-block" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; padding: 12px; font-size: 16px; font-weight: 600;">';
    content += '<i class="fa fa-upload"></i> Import Data</button></form>';
    showModalWithContent('createModal', '<i class="fa fa-upload"></i> Import Transport Data', content);
}

function processImport() {
    const fileInput = document.getElementById('excel_file');
    if (!fileInput.files.length) {
        showAjaxModal_alert('Please select a file', 'error');
        return;
    }
    
    $('.close').click();
    showAjaxModal_alert('Processing import...', 'loading');
    
    const formData = new FormData(document.getElementById('importForm'));
    
    $.ajax({
        url: '<?php echo site_url("admin/import_transport_data"); ?>',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json'
    }).done(function(response) {
        if (response.status === 'success') {
            $('#transport_table').DataTable().ajax.reload(null, false);
            showAjaxModal_alert(response.message + '<br>Routes: ' + response.routes_created + ' created, ' + response.routes_updated + ' updated<br>Students: ' + response.students_assigned + ' assigned', 'success');
            setTimeout(() => location.reload(), 3000);
        } else {
            showAjaxModal_alert(response.message || 'Import failed', 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('An error occurred during import', 'error');
    });
}
</script>


