<?php
$running_year = get_settings('running_year');
$running_term = get_settings('running_term');
?>
<style>
/* Direct UI/UX rebuild — Boarding Reports */
.boarding-reports-workspace { margin:0 !important; padding:24px 28px 40px !important; background:#f8fafc; min-height:100%; }
.boarding-reports-head { margin-bottom:18px; padding-bottom:18px; border-bottom:1px solid #e2e8f0; }
.boarding-reports-head h1 { margin:0; color:#0f172a !important; font-size:30px !important; line-height:1.2; font-weight:800 !important; letter-spacing:-.02em; }
.boarding-reports-head h1 i { margin-right:7px; color:#2563eb !important; }
.boarding-reports-head p { margin:7px 0 0 !important; color:#64748b !important; font-size:15px; line-height:1.5; }
.boarding-reports-workspace > .row { margin-left:-6px; margin-right:-6px; }
.boarding-reports-workspace > .row > [class*="col-"] { padding-left:6px; padding-right:6px; }
.report-card { min-height:156px; margin-bottom:12px; padding:17px; border:1px solid #e2e8f0; border-radius:14px; background:#fff !important; color:#334155 !important; box-shadow:0 1px 2px rgba(15,23,42,.05); cursor:pointer; transition:border-color .2s ease,box-shadow .2s ease; display:flex; flex-direction:column; justify-content:center; }
.report-card:hover { transform:none; border-color:#93c5fd; box-shadow:0 7px 18px rgba(15,23,42,.07); }
.report-card i { margin-bottom:10px !important; color:#2563eb !important; font-size:26px !important; }
.report-card h4 { margin:0 0 6px !important; color:#0f172a !important; font-size:16px !important; font-weight:800 !important; }
.report-card p { margin:0 !important; color:#64748b !important; font-size:13px !important; line-height:1.45; }
.boarding-report-shell { margin-top:4px; padding:0; border:1px solid #e2e8f0; border-radius:14px; background:#fff; box-shadow:0 1px 2px rgba(15,23,42,.05); overflow:hidden; }
.boarding-report-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid #e2e8f0; background:#f8fafc; }
.boarding-report-toolbar h3 { margin:0; color:#0f172a; font-size:17px; font-weight:800; }
.boarding-report-actions { display:flex; gap:8px; flex-wrap:wrap; }
.boarding-report-actions .btn { min-height:38px; padding:8px 11px !important; border-radius:8px !important; font-size:13px !important; font-weight:800 !important; }
#report_content { min-height:220px; padding:16px; color:#334155; font-size:14px; }
#report_content .table-responsive { overflow-x:auto; }
#report_content table { min-width:720px; margin:0; }
#report_content table th { padding:11px 12px !important; border-bottom:1px solid #e2e8f0 !important; background:#f8fafc; color:#475569; font-size:13px; font-weight:800; }
#report_content table td { padding:11px 12px !important; border-bottom:1px solid #eef2f7 !important; color:#334155; font-size:14px; line-height:1.45; }
.boarding-summary-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.boarding-summary-grid > div { padding:16px; border:1px solid #e2e8f0; border-radius:11px; background:#f8fafc; }
.boarding-summary-grid strong { display:block; color:#0f172a; font-size:28px; line-height:1.1; font-weight:800; }
.boarding-summary-grid span { display:block; margin-top:6px; color:#64748b; font-size:12px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }
@media print {.boarding-reports-head,.boarding-reports-workspace > .row,.boarding-report-actions{display:none !important}.boarding-reports-workspace{padding:0 !important;background:#fff}.boarding-report-shell{border:0;box-shadow:none}.boarding-report-toolbar{padding:0 0 12px;background:#fff}.boarding-report-toolbar h3{font-size:20px}}
@media(max-width:767px){.boarding-reports-workspace{padding:18px 14px 32px !important}.boarding-reports-head h1{font-size:26px !important}.boarding-reports-workspace > .row > .col-md-3{width:50%;float:left}.boarding-report-toolbar{display:block}.boarding-report-actions{margin-top:10px}.boarding-summary-grid{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.boarding-reports-workspace > .row > .col-md-3{width:100%;float:none}.boarding-summary-grid{grid-template-columns:1fr}}
</style>

<div class="container-fluid boarding-reports-workspace">
    <div class="boarding-reports-head">
        <h1><i class="fa fa-chart-bar"></i> Boarding Reports &amp; Analytics</h1>
        <p>Review occupancy, boarding students, available beds and overall boarding capacity.</p>
    </div>

    <!-- Report Cards -->
    <div class="row mb-4">
        <div class="col-md-3">
            <div class="report-card" onclick="generateReport('occupancy')">
                <i class="fa fa-chart-pie fa-3x mb-3"></i>
                <h4>Occupancy Report</h4>
                <p>View house and dormitory occupancy rates</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="report-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);" onclick="generateReport('students')">
                <i class="fa fa-users fa-3x mb-3"></i>
                <h4>Student List</h4>
                <p>List of all boarding students</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="report-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);" onclick="generateReport('available')">
                <i class="fa fa-bed fa-3x mb-3"></i>
                <h4>Available Beds</h4>
                <p>View all available beds</p>
            </div>
        </div>
        <div class="col-md-3">
            <div class="report-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);" onclick="generateReport('summary')">
                <i class="fa fa-file-alt fa-3x mb-3"></i>
                <h4>Summary Report</h4>
                <p>Complete boarding summary</p>
            </div>
        </div>
    </div>

    <!-- Report Display Area -->
    <div class="boarding-report-shell">
        <div class="boarding-report-toolbar">
            <h3 id="report_title">Select a report to view</h3>
            <div class="boarding-report-actions">
                <button class="btn btn-success" onclick="exportReport('excel')"><i class="fa fa-file-excel"></i> Export CSV</button>
                <button class="btn btn-primary" onclick="exportReport('pdf')"><i class="fa fa-file-pdf"></i> Print / PDF</button>
            </div>
        </div>
        <div id="report_content">
            <div class="text-center text-gray-500 py-5">
                <i class="fa fa-chart-bar fa-5x mb-3"></i>
                <p>Click on a report card above to generate a report</p>
            </div>
        </div>
    </div>
</div>

<script>
function generateReport(type) {
    $('#report_content').html('<div class="text-center py-5"><i class="fa fa-spinner fa-spin fa-3x"></i><p>Generating report...</p></div>');
    
    var titles = {
        'occupancy': 'Occupancy Report',
        'students': 'Boarding Students List',
        'available': 'Available Beds Report',
        'summary': 'Boarding Summary Report'
    };
    $('#report_title').text(titles[type]);
    
    $.ajax({
        url: '<?php echo site_url("admin/boarding_reports/"); ?>' + type,
        type: 'GET',
        timeout: 10000,
        success: function(data) {
            if(data && data.trim() !== '') {
                $('#report_content').html(data);
            } else {
                $('#report_content').html('<div class="text-center py-5"><i class="fa fa-exclamation-circle fa-3x text-warning mb-3"></i><p class="text-gray-600">No data available for this report</p></div>');
            }
        },
        error: function(xhr, status, error) {
            $('#report_content').html('<div class="text-center py-5"><i class="fa fa-times-circle fa-3x text-danger mb-3"></i><p class="text-gray-600">Error generating report.</p><p class="text-sm text-gray-500">Status: ' + status + '</p></div>');
        }
    });
}

function exportReport(format) {
    var reportType = $('#report_title').text();
    if(reportType === 'Select a report to view') {
        showAjaxModal_alert('Please generate a report first','warning');
        return;
    }

    if(format === 'pdf') {
        window.print();
        return;
    }

    var table = document.querySelector('#report_content table');
    if(!table) {
        showAjaxModal_alert('This report has no tabular data to export.','info');
        return;
    }

    var csv = [];
    table.querySelectorAll('tr').forEach(function(row) {
        var cols = [];
        row.querySelectorAll('th,td').forEach(function(cell) {
            var value = (cell.innerText || '').replace(/"/g, '""').trim();
            cols.push('"' + value + '"');
        });
        csv.push(cols.join(','));
    });
    var blob = new Blob([csv.join('\n')], {type: 'text/csv;charset=utf-8;'});
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = reportType.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '.csv';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
</script>
