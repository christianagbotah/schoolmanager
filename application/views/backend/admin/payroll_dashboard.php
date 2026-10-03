<!-- Payroll Dashboard -->
<div class="row">
    <div class="col-md-12">
        <div class="panel panel-primary" data-collapsed="0">
            <div class="panel-heading">
                <div class="panel-title">
                    <i class="entypo-chart-bar"></i>
                    <?php echo get_phrase('payroll_dashboard'); ?>
                </div>
                <div class="panel-options">
                    <a href="<?php echo base_url(); ?>index.php?admin/payroll" class="btn btn-sm btn-info">
                        <i class="entypo-back"></i> <?php echo get_phrase('back_to_payroll'); ?>
                    </a>
                </div>
            </div>
            <div class="panel-body">
                
                <!-- Month/Year Selector and Process Button -->
                <div class="row" style="margin-bottom: 20px;">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label><?php echo get_phrase('select_period'); ?>:</label>
                            <div class="input-group">
                                <select name="dashboard_month" id="dashboard_month" class="form-control">
                                    <?php for ($m = 1; $m <= 12; $m++): ?>
                                        <option value="<?php echo $m; ?>" <?php echo ($m == date('n')) ? 'selected' : ''; ?>>
                                            <?php echo date('F', mktime(0, 0, 0, $m, 1)); ?>
                                        </option>
                                    <?php endfor; ?>
                                </select>
                                <select name="dashboard_year" id="dashboard_year" class="form-control">
                                    <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
                                        <option value="<?php echo $y; ?>" <?php echo ($y == date('Y')) ? 'selected' : ''; ?>>
                                            <?php echo $y; ?>
                                        </option>
                                    <?php endfor; ?>
                                </select>
                                <span class="input-group-btn">
                                    <button type="button" class="btn btn-primary" id="load_dashboard_btn">
                                        <i class="entypo-search"></i> <?php echo get_phrase('load'); ?>
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8 text-right">
                        <a href="<?php echo base_url(); ?>index.php?admin/payroll" class="btn btn-success btn-lg">
                            <i class="entypo-plus"></i> <?php echo get_phrase('process_payroll'); ?>
                        </a>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="row" id="summary_cards">
                    <div class="col-lg-3 col-md-6">
                        <div class="tile-stats tile-green">
                            <div class="icon"><i class="entypo-chart-area"></i></div>
                            <div class="num" data-start="0" data-end="0" data-postfix="" data-duration="1500" data-delay="0" id="total_gross">
                                GH¢ 0.00
                            </div>
                            <h3><?php echo get_phrase('total_gross_salary'); ?></h3>
                        </div>
                    </div>
                    
                    <div class="col-lg-3 col-md-6">
                        <div class="tile-stats tile-red">
                            <div class="icon"><i class="entypo-down"></i></div>
                            <div class="num" data-start="0" data-end="0" data-postfix="" data-duration="1500" data-delay="600" id="total_deductions">
                                GH¢ 0.00
                            </div>
                            <h3><?php echo get_phrase('total_deductions'); ?></h3>
                        </div>
                    </div>
                    
                    <div class="col-lg-3 col-md-6">
                        <div class="tile-stats tile-primary">
                            <div class="icon"><i class="entypo-wallet"></i></div>
                            <div class="num" data-start="0" data-end="0" data-postfix="" data-duration="1500" data-delay="1200" id="total_net">
                                GH¢ 0.00
                            </div>
                            <h3><?php echo get_phrase('total_net_salary'); ?></h3>
                        </div>
                    </div>
                    
                    <div class="col-lg-3 col-md-6">
                        <div class="tile-stats tile-aqua">
                            <div class="icon"><i class="entypo-users"></i></div>
                            <div class="num" data-start="0" data-end="0" data-postfix="" data-duration="1500" data-delay="0" id="staff_paid">
                                0
                            </div>
                            <h3><?php echo get_phrase('staff_paid'); ?></h3>
                        </div>
                    </div>
                </div>

                <!-- Payment Status Widget -->
                <div class="row" style="margin-top: 20px;">
                    <div class="col-md-12">
                        <div class="panel panel-info">
                            <div class="panel-heading">
                                <div class="panel-title">
                                    <i class="entypo-credit-card"></i>
                                    <?php echo get_phrase('payment_status'); ?>
                                </div>
                            </div>
                            <div class="panel-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="info-box">
                                            <div class="info-box-icon bg-green">
                                                <i class="entypo-check"></i>
                                            </div>
                                            <div class="info-box-content">
                                                <span class="info-box-text"><?php echo get_phrase('paid'); ?></span>
                                                <span class="info-box-number" id="status_paid">0</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4">
                                        <div class="info-box">
                                            <div class="info-box-icon bg-yellow">
                                                <i class="entypo-clock"></i>
                                            </div>
                                            <div class="info-box-content">
                                                <span class="info-box-text"><?php echo get_phrase('pending'); ?></span>
                                                <span class="info-box-number" id="status_pending">
                                                    <a href="<?php echo base_url(); ?>index.php?admin/payroll_approvals">0</a>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-md-4">
                                        <div class="info-box">
                                            <div class="info-box-icon bg-red">
                                                <i class="entypo-attention"></i>
                                            </div>
                                            <div class="info-box-content">
                                                <span class="info-box-text"><?php echo get_phrase('overdue'); ?> (>5 days)</span>
                                                <span class="info-box-number" id="status_overdue">0</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Employment Category Breakdown -->
                <div class="row" style="margin-top: 20px;">
                    <div class="col-md-12">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                <div class="panel-title">
                                    <i class="entypo-users"></i>
                                    <?php echo get_phrase('employment_category_breakdown'); ?>
                                </div>
                            </div>
                            <div class="panel-body">
                                <div class="table-responsive">
                                    <table class="table table-bordered table-striped" id="category_breakdown_table">
                                        <thead>
                                            <tr>
                                                <th><?php echo get_phrase('category'); ?></th>
                                                <th><?php echo get_phrase('staff_count'); ?></th>
                                                <th><?php echo get_phrase('gross_salary'); ?></th>
                                                <th><?php echo get_phrase('deductions'); ?></th>
                                                <th><?php echo get_phrase('net_salary'); ?></th>
                                            </tr>
                                        </thead>
                                        <tbody id="category_breakdown_body">
                                            <tr>
                                                <td colspan="5" class="text-center">
                                                    <i class="entypo-spinner spin"></i> <?php echo get_phrase('loading'); ?>...
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="row" style="margin-top: 20px;">
                    <!-- Month-over-Month Bar Chart -->
                    <div class="col-md-6">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                <div class="panel-title">
                                    <i class="entypo-chart-bar"></i>
                                    <?php echo get_phrase('month_over_month_comparison'); ?>
                                </div>
                            </div>
                            <div class="panel-body">
                                <canvas id="month_comparison_chart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Category Breakdown Donut Chart -->
                    <div class="col-md-6">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                <div class="panel-title">
                                    <i class="entypo-chart-pie"></i>
                                    <?php echo get_phrase('category_distribution'); ?>
                                </div>
                            </div>
                            <div class="panel-body">
                                <canvas id="category_donut_chart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Payroll Trend Line Chart -->
                <div class="row" style="margin-top: 20px;">
                    <div class="col-md-12">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                <div class="panel-title">
                                    <i class="entypo-chart-line"></i>
                                    <?php echo get_phrase('payroll_trend'); ?> (<?php echo get_phrase('last_12_months'); ?>)
                                </div>
                            </div>
                            <div class="panel-body">
                                <canvas id="payroll_trend_chart" height="100"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top Earners Table -->
                <div class="row" style="margin-top: 20px;">
                    <div class="col-md-12">
                        <div class="panel panel-primary">
                            <div class="panel-heading">
                                <div class="panel-title">
                                    <i class="entypo-trophy"></i>
                                    <?php echo get_phrase('top_10_earners'); ?>
                                </div>
                            </div>
                            <div class="panel-body">
                                <div class="table-responsive">
                                    <table class="table table-bordered table-striped datatable" id="top_earners_table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th><?php echo get_phrase('staff_name'); ?></th>
                                                <th><?php echo get_phrase('staff_code'); ?></th>
                                                <th><?php echo get_phrase('category'); ?></th>
                                                <th><?php echo get_phrase('net_salary'); ?></th>
                                            </tr>
                                        </thead>
                                        <tbody id="top_earners_body">
                                            <tr>
                                                <td colspan="5" class="text-center">
                                                    <i class="entypo-spinner spin"></i> <?php echo get_phrase('loading'); ?>...
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>

<!-- Include Chart.js -->
<script src="<?php echo base_url(); ?>assets/cdn/js/chart-3.9.1.min.js"></script>

<!-- Dashboard JavaScript -->
<script type="text/javascript">
$(document).ready(function() {
    
    // Chart instances
    let monthComparisonChart = null;
    let categoryDonutChart = null;
    let payrollTrendChart = null;
    
    // Load dashboard data
    function loadDashboardData() {
        const month = $('#dashboard_month').val();
        const year = $('#dashboard_year').val();
        
        // Show loading state
        $('#load_dashboard_btn').html('<i class="entypo-spinner spin"></i> Loading...');
        $('#load_dashboard_btn').prop('disabled', true);
        
        // Fetch dashboard data
        $.ajax({
            url: '<?php echo base_url(); ?>index.php?admin/payroll_dashboard_data',
            type: 'POST',
            data: { month: month, year: year },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    updateSummaryCards(response.data.summary);
                    updatePaymentStatus(response.data.payment_status);
                    updateCategoryBreakdown(response.data.category_breakdown);
                    updateMonthComparisonChart(response.data.month_comparison);
                    updateCategoryDonutChart(response.data.category_distribution);
                    updatePayrollTrendChart(response.data.payroll_trend);
                    updateTopEarnersTable(response.data.top_earners);
                } else {
                    toastr.error(response.message || 'Failed to load dashboard data');
                }
            },
            error: function() {
                toastr.error('An error occurred while loading dashboard data');
            },
            complete: function() {
                $('#load_dashboard_btn').html('<i class="entypo-search"></i> <?php echo get_phrase('load'); ?>');
                $('#load_dashboard_btn').prop('disabled', false);
            }
        });
    }
    
    // Update summary cards
    function updateSummaryCards(summary) {
        $('#total_gross').text('GH¢ ' + formatNumber(summary.total_gross));
        $('#total_deductions').text('GH¢ ' + formatNumber(summary.total_deductions));
        $('#total_net').text('GH¢ ' + formatNumber(summary.total_net));
        $('#staff_paid').text(summary.staff_count);
    }
    
    // Update payment status
    function updatePaymentStatus(status) {
        $('#status_paid').text(status.paid);
        $('#status_pending a').text(status.pending);
        $('#status_overdue').text(status.overdue);
        
        // Highlight overdue in red
        if (status.overdue > 0) {
            $('#status_overdue').parent().parent().addClass('bg-danger');
        }
    }
    
    // Update category breakdown table
    function updateCategoryBreakdown(categories) {
        let html = '';
        $.each(categories, function(index, cat) {
            html += '<tr>';
            html += '<td>' + cat.category + '</td>';
            html += '<td>' + cat.staff_count + '</td>';
            html += '<td>GH¢ ' + formatNumber(cat.gross_salary) + '</td>';
            html += '<td>GH¢ ' + formatNumber(cat.deductions) + '</td>';
            html += '<td>GH¢ ' + formatNumber(cat.net_salary) + '</td>';
            html += '</tr>';
        });
        $('#category_breakdown_body').html(html);
    }
    
    // Update month comparison chart
    function updateMonthComparisonChart(data) {
        const ctx = document.getElementById('month_comparison_chart').getContext('2d');
        
        if (monthComparisonChart) {
            monthComparisonChart.destroy();
        }
        
        monthComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Gross Salary',
                        data: data.gross,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Deductions',
                        data: data.deductions,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Net Salary',
                        data: data.net,
                        backgroundColor: 'rgba(75, 192, 192, 0.8)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'GH¢ ' + formatNumber(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': GH¢ ' + formatNumber(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update category donut chart
    function updateCategoryDonutChart(data) {
        const ctx = document.getElementById('category_donut_chart').getContext('2d');
        
        if (categoryDonutChart) {
            categoryDonutChart.destroy();
        }
        
        categoryDonutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': GH¢ ' + formatNumber(context.parsed);
                            }
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Update payroll trend chart
    function updatePayrollTrendChart(data) {
        const ctx = document.getElementById('payroll_trend_chart').getContext('2d');
        
        if (payrollTrendChart) {
            payrollTrendChart.destroy();
        }
        
        payrollTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Net Salary',
                    data: data.values,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'GH¢ ' + formatNumber(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Net Salary: GH¢ ' + formatNumber(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update top earners table
    function updateTopEarnersTable(earners) {
        let html = '';
        $.each(earners, function(index, earner) {
            html += '<tr>';
            html += '<td>' + (index + 1) + '</td>';
            html += '<td>' + earner.name + '</td>';
            html += '<td>' + earner.code + '</td>';
            html += '<td>' + earner.category + '</td>';
            html += '<td>GH¢ ' + formatNumber(earner.net_salary) + '</td>';
            html += '</tr>';
        });
        $('#top_earners_body').html(html);
        
        // Reinitialize DataTable
        if ($.fn.DataTable.isDataTable('#top_earners_table')) {
            $('#top_earners_table').DataTable().destroy();
        }
        $('#top_earners_table').DataTable({
            searching: false,
            paging: false,
            info: false,
            ordering: false
        });
    }
    
    // Format number with commas
    function formatNumber(num) {
        return parseFloat(num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    // Load button click
    $('#load_dashboard_btn').on('click', function() {
        loadDashboardData();
    });
    
    // Load initial data
    loadDashboardData();
});
</script>

<style>
.info-box {
    display: block;
    min-height: 90px;
    background: #fff;
    width: 100%;
    box-shadow: 0 1px 1px rgba(0,0,0,0.1);
    border-radius: 2px;
    margin-bottom: 15px;
}

.info-box-icon {
    border-top-left-radius: 2px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 2px;
    display: block;
    float: left;
    height: 90px;
    width: 90px;
    text-align: center;
    font-size: 45px;
    line-height: 90px;
    background: rgba(0,0,0,0.2);
}

.info-box-icon > i {
    color: #fff;
}

.bg-green {
    background-color: #00a65a !important;
}

.bg-yellow {
    background-color: #f39c12 !important;
}

.bg-red {
    background-color: #dd4b39 !important;
}

.info-box-content {
    padding: 5px 10px;
    margin-left: 90px;
}

.info-box-text {
    display: block;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.info-box-number {
    display: block;
    font-weight: bold;
    font-size: 24px;
}

.tile-stats {
    position: relative;
    display: block;
    margin-bottom: 12px;
    border-radius: 3px;
    background-color: #fff;
    border: 1px solid transparent;
    overflow: hidden;
    padding: 20px;
    min-height: 150px;
}

.tile-stats .icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 60px;
    opacity: 0.2;
}

.tile-stats .num {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 5px;
}

.tile-stats h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    color: #fff;
}

.tile-green {
    background-color: #1abc9c;
    color: #fff;
}

.tile-red {
    background-color: #e74c3c;
    color: #fff;
}

.tile-primary {
    background-color: #3498db;
    color: #fff;
}

.tile-aqua {
    background-color: #00c0ef;
    color: #fff;
}

.bg-danger {
    background-color: #dd4b39 !important;
    color: #fff !important;
}

.spin {
    animation: spin 2s infinite linear;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* ---- family design-language alignment (presentation only) ---- */
@keyframes payrollFadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Panels -> family cards */
.panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    animation: payrollFadeInUp .4s ease-out;
    margin-bottom: 20px;
}
.panel > .panel-heading {
    background: transparent;
    border-bottom: 1px solid #f3f4f6;
    border-radius: 16px 16px 0 0;
    padding: 18px 20px;
    color: #111827;
}
.panel > .panel-heading .panel-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 8px;
}
.panel > .panel-body { padding: 20px; }
.panel .panel-options a { text-decoration: none; }

/* Tiles -> family KPI cards */
.tile-stats {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-left: 5px solid #4f46e5;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    min-height: 0;
    padding: 22px;
    transition: transform .18s ease, box-shadow .18s ease;
}
.tile-stats:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(16, 24, 40, 0.10); }
.tile-green   { color: #111827; border-left-color: #10b981; }
.tile-red     { color: #111827; border-left-color: #ef4444; }
.tile-primary { color: #111827; border-left-color: #4f46e5; }
.tile-aqua    { color: #111827; border-left-color: #06b6d4; }
.tile-stats .num { font-size: 32px; font-weight: 800; color: #111827; }
.tile-stats h3 { color: #374151; font-weight: 600; letter-spacing: 0.3px; }
.tile-stats .icon { opacity: 0.12; }
.tile-green .icon { color: #10b981; }
.tile-red .icon { color: #ef4444; }
.tile-primary .icon { color: #4f46e5; }
.tile-aqua .icon { color: #06b6d4; }

/* Info boxes -> family status cards */
.info-box {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    overflow: hidden;
}
.info-box-icon {
    border-radius: 0;
    background: rgba(0, 0, 0, 0.03);
}
.bg-green  { background-color: #10b981 !important; }
.bg-yellow { background-color: #f59e0b !important; }
.bg-red    { background-color: #ef4444 !important; }
.bg-danger { background-color: #fee2e2 !important; color: #b91c1c !important; }
.info-box-text { color: #374151; font-size: 13px; font-weight: 600; }
.info-box-number { color: #111827; }
.info-box-number a { color: #1d4ed8; text-decoration: none; }
.info-box-number a:hover, .info-box-number a:focus-visible { text-decoration: underline; }

/* Tables -> family table treatment */
#category_breakdown_table,
#top_earners_table {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}
#category_breakdown_table th,
#top_earners_table th {
    background: #f9fafb;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border-bottom: 1px solid #e5e7eb !important;
}
#category_breakdown_table td,
#top_earners_table td {
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
}
#category_breakdown_table tbody tr:last-child td,
#top_earners_table tbody tr:last-child td { border-bottom: none; }

/* Buttons -> family shape */
.panel .btn {
    border-radius: 10px;
    font-weight: 600;
    transition: all .2s;
}
.panel .btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}
.panel .btn-primary { background: #2563eb; border-color: #2563eb; }
.panel .btn-primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
.panel .btn-success { background: #059669; border-color: #059669; }
.panel .btn-success:hover { background: #047857; border-color: #047857; }
.panel .btn-info { background: #0284c7; border-color: #0284c7; }
.panel .btn-info:hover { background: #0369a1; border-color: #0369a1; }

/* Form controls -> family inputs */
.panel .form-control {
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    height: 42px;
    font-size: 14px;
    transition: border-color .15s ease, box-shadow .15s ease;
}
.panel .form-control:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    outline: none;
}

/* 400px hardening tier */
@media (max-width: 400px) {
    .panel > .panel-heading { padding: 14px 15px; }
    .panel > .panel-body { padding: 15px; }
    .tile-stats { padding: 16px; border-radius: 14px; }
    .tile-stats .num { font-size: 26px; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
    .panel, .tile-stats { animation: none; transition: none; }
    .spin { animation: none; }
}
</style>
