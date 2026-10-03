<?php
$running_year = get_settings('running_year');
$running_term = get_settings('running_term');

// Get teacher's classes and subjects
$teacher_id = $this->session->userdata('login_user_id');
$teacher_classes = $this->db->query("
    SELECT DISTINCT c.class_id, c.name, c.name_numeric
    FROM class c
    JOIN subject s ON s.class_id = c.class_id
    WHERE s.teacher_id = ?
    ORDER BY c.name, c.name_numeric
", [$teacher_id])->result_array();

$teacher_subjects = $this->db->query("
    SELECT s.subject_id, s.name, c.class_id, c.name as class_name, c.name_numeric
    FROM subject s
    JOIN class c ON c.class_id = s.class_id
    WHERE s.teacher_id = ?
    ORDER BY c.name, c.name_numeric, s.name
", [$teacher_id])->result_array();

// Get progress data
$progress_data = $this->Lesson_note_model->get_completion_progress($teacher_id, $running_term, $running_year);
$missing_notes = $this->Lesson_note_model->get_missing_lesson_notes($teacher_id, $running_term, $running_year);

// Extract data from progress array
$total_expected = $progress_data['total_expected'] ?? 0;
$total_submitted = $progress_data['submitted'] ?? 0;
$total_approved = $progress_data['approved'] ?? 0;
$total_pending = $progress_data['pending'] ?? 0;
$total_declined = $progress_data['declined'] ?? 0;

$completion_rate = $total_expected > 0 ? round(($total_approved / $total_expected) * 100, 1) : 0;
?>

<div class="content-wrapper lesson-progress-workspace">
    <section class="content-header">
        <h1>
            <i class="fa fa-chart-line"></i> <?php echo get_phrase('lesson_note_progress'); ?>
            <small><?php echo get_phrase('track_your_submissions'); ?></small>
        </h1>
        <ol class="breadcrumb">
            <li><a href="<?php echo site_url('teacher/dashboard'); ?>"><i class="fa fa-dashboard"></i> <?php echo get_phrase('dashboard'); ?></a></li>
            <li class="active"><?php echo get_phrase('lesson_note_progress'); ?></li>
        </ol>
    </section>

    <section class="content">
        <!-- Term Filter -->
        <div class="row">
            <div class="col-md-12">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-filter"></i> <?php echo get_phrase('filter_by_term'); ?></h3>
                    </div>
                    <div class="box-body">
                        <?php echo form_open('', array('id' => 'term-filter-form', 'class' => 'form-inline', 'method' => 'GET')); ?>
                            <div class="form-group">
                                <label><?php echo get_phrase('term'); ?>:</label>
                                <select name="term" id="term-select" class="form-control">
                                    <option value="1" <?php echo $running_term == 1 ? 'selected' : ''; ?>><?php echo get_phrase('term'); ?> 1</option>
                                    <option value="2" <?php echo $running_term == 2 ? 'selected' : ''; ?>><?php echo get_phrase('term'); ?> 2</option>
                                    <option value="3" <?php echo $running_term == 3 ? 'selected' : ''; ?>><?php echo get_phrase('term'); ?> 3</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label><?php echo get_phrase('year'); ?>:</label>
                                <select name="year" id="year-select" class="form-control">
                                    <option value="<?php echo $running_year; ?>" selected><?php echo $running_year; ?></option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fa fa-search"></i> <?php echo get_phrase('apply_filter'); ?>
                            </button>
                        <?php echo form_close(); ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Overall Progress Card -->
        <div class="row">
            <div class="col-md-12">
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-tasks"></i> <?php echo get_phrase('overall_completion_progress'); ?></h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="progress-container">
                                    <div class="progress-label">
                                        <span><?php echo get_phrase('completion_rate'); ?></span>
                                        <span class="progress-value"><?php echo $completion_rate; ?>%</span>
                                    </div>
                                    <div class="progress progress-lg">
                                        <div class="progress-bar progress-bar-success progress-bar-striped active" 
                                             role="progressbar" 
                                             aria-valuenow="<?php echo $completion_rate; ?>" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100" 
                                             style="width: <?php echo $completion_rate; ?>%">
                                            <span class="sr-only"><?php echo $completion_rate; ?>% Complete</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="stats-grid">
                                    <div class="stat-item">
                                        <div class="stat-icon bg-blue">
                                            <i class="fa fa-file-text"></i>
                                        </div>
                                        <div class="stat-info">
                                            <span class="stat-number"><?php echo $total_expected; ?></span>
                                            <span class="stat-label"><?php echo get_phrase('expected_notes'); ?></span>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-icon bg-green">
                                            <i class="fa fa-check-circle"></i>
                                        </div>
                                        <div class="stat-info">
                                            <span class="stat-number"><?php echo $total_approved; ?></span>
                                            <span class="stat-label"><?php echo get_phrase('approved'); ?></span>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-icon bg-yellow">
                                            <i class="fa fa-clock-o"></i>
                                        </div>
                                        <div class="stat-info">
                                            <span class="stat-number"><?php echo $total_pending; ?></span>
                                            <span class="stat-label"><?php echo get_phrase('pending'); ?></span>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-icon bg-red">
                                            <i class="fa fa-times-circle"></i>
                                        </div>
                                        <div class="stat-info">
                                            <span class="stat-number"><?php echo $total_declined; ?></span>
                                            <span class="stat-label"><?php echo get_phrase('declined'); ?></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="chart-container">
                                    <canvas id="statusChart" style="height: 250px;"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Progress by Subject and Class -->
        <div class="row">
            <div class="col-md-12">
                <div class="box box-info">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-book"></i> <?php echo get_phrase('progress_by_subject_and_class'); ?></h3>
                    </div>
                    <div class="box-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead>
                                    <tr>
                                        <th><?php echo get_phrase('class'); ?></th>
                                        <th><?php echo get_phrase('subject'); ?></th>
                                        <th><?php echo get_phrase('expected'); ?></th>
                                        <th><?php echo get_phrase('submitted'); ?></th>
                                        <th><?php echo get_phrase('approved'); ?></th>
                                        <th><?php echo get_phrase('pending'); ?></th>
                                        <th><?php echo get_phrase('declined'); ?></th>
                                        <th><?php echo get_phrase('progress'); ?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if (!empty($progress_data['by_subject'])): ?>
                                        <?php foreach ($progress_data['by_subject'] as $subject_id => $row): ?>
                                            <?php 
                                            $row_progress = $row['expected'] > 0 ? round(($row['approved'] / $row['expected']) * 100, 1) : 0;
                                            $progress_class = $row_progress >= 80 ? 'success' : ($row_progress >= 50 ? 'warning' : 'danger');
                                            ?>
                                            <tr>
                                                <td><?php echo $row['class_name']; ?></td>
                                                <td><?php echo $row['subject_name']; ?></td>
                                                <td><?php echo $row['expected']; ?></td>
                                                <td><?php echo $row['submitted']; ?></td>
                                                <td><span class="label label-success"><?php echo $row['approved']; ?></span></td>
                                                <td><span class="label label-warning"><?php echo $progress_data['pending']; ?></span></td>
                                                <td><span class="label label-danger"><?php echo $progress_data['declined']; ?></span></td>
                                                <td>
                                                    <div class="progress progress-sm">
                                                        <div class="progress-bar progress-bar-<?php echo $progress_class; ?>" 
                                                             style="width: <?php echo $row_progress; ?>%">
                                                            <?php echo $row_progress; ?>%
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php else: ?>
                                        <tr>
                                            <td colspan="8" class="text-center text-muted">
                                                <i class="fa fa-info-circle"></i> <?php echo get_phrase('no_progress_data_available'); ?>
                                            </td>
                                        </tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Missing Lesson Notes -->
        <div class="row">
            <div class="col-md-12">
                <div class="box box-danger">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-exclamation-triangle"></i> <?php echo get_phrase('missing_lesson_notes'); ?></h3>
                        <div class="box-tools pull-right">
                            <span class="label label-danger"><?php echo count($missing_notes); ?> <?php echo get_phrase('missing'); ?></span>
                        </div>
                    </div>
                    <div class="box-body">
                        <?php if (!empty($missing_notes)): ?>
                            <div class="table-responsive">
                                <table class="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th><?php echo get_phrase('week'); ?></th>
                                            <th><?php echo get_phrase('class'); ?></th>
                                            <th><?php echo get_phrase('subject'); ?></th>
                                            <th><?php echo get_phrase('action'); ?></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($missing_notes as $missing): ?>
                                            <tr class="danger">
                                                <td>
                                                    <span class="label label-danger">
                                                        <?php echo get_phrase('week'); ?> <?php echo $missing['week_number']; ?>
                                                    </span>
                                                </td>
                                                <td><?php echo $missing['class_name'] ?? 'N/A'; ?></td>
                                                <td><?php echo $missing['subject_name']; ?></td>
                                                <td>
                                                    <a href="<?php echo site_url('teacher/lesson_note_create?subject_id=' . $missing['subject_id'] . '&week=' . $missing['week_number']); ?>" 
                                                       class="btn btn-sm btn-primary">
                                                        <i class="fa fa-plus"></i> <?php echo get_phrase('create_now'); ?>
                                                    </a>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php else: ?>
                            <div class="alert alert-success">
                                <i class="fa fa-check-circle"></i> <?php echo get_phrase('all_lesson_notes_submitted'); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Last Submission Info -->
        <div class="row">
            <div class="col-md-6">
                <div class="info-box bg-aqua">
                    <span class="info-box-icon"><i class="fa fa-calendar-check-o"></i></span>
                    <div class="info-box-content">
                        <span class="info-box-text"><?php echo get_phrase('last_submission'); ?></span>
                        <span class="info-box-number" id="last-submission-date">
                            <?php 
                            $last_submission = $this->Lesson_note_model->get_last_submission($teacher_id);
                            echo $last_submission ? date('d M, Y', strtotime($last_submission)) : get_phrase('no_submissions_yet');
                            ?>
                        </span>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="info-box bg-green">
                    <span class="info-box-icon"><i class="fa fa-thumbs-up"></i></span>
                    <div class="info-box-content">
                        <span class="info-box-text"><?php echo get_phrase('last_approval'); ?></span>
                        <span class="info-box-number" id="last-approval-date">
                            <?php 
                            $last_approval = $this->Lesson_note_model->get_last_approval($teacher_id);
                            echo $last_approval ? date('d M, Y', strtotime($last_approval)) : get_phrase('no_approvals_yet');
                            ?>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>

<style>
.progress-container {
    margin-bottom: 20px;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-weight: 600;
}

.progress-value {
    color: #00a65a;
    font-size: 1.2em;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-top: 20px;
}

.stat-item {
    display: flex;
    align-items: center;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 8px;
}

.stat-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin-right: 15px;
    color: white;
    font-size: 1.5em;
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-number {
    font-size: 1.5em;
    font-weight: bold;
}

.stat-label {
    color: #777;
    font-size: 0.9em;
}

.bg-blue { background-color: #3c8dbc; }
.bg-green { background-color: #00a65a; }
.bg-yellow { background-color: #f39c12; }
.bg-red { background-color: #dd4b39; }

.chart-container {
    position: relative;
    height: 250px;
}

/* SchoolManager direct UX refinement — Lesson Note Progress */
body { background: #f8fafc; }
.lesson-progress-workspace {
    background: #f8fafc !important; min-height: 100%; padding: 24px 28px 40px !important;
}
.lesson-progress-workspace .content-header {
    margin: 0 0 18px; padding: 0 0 18px !important; border-bottom: 1px solid #e2e8f0;
}
.lesson-progress-workspace .content-header h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2;
    font-weight: 800; letter-spacing: -.02em;
}
.lesson-progress-workspace .content-header h1 small {
    display: block; margin-top: 7px; color: #64748b !important; font-size: 15px !important;
    line-height: 1.5; font-weight: 500;
}
.lesson-progress-workspace .breadcrumb {
    position: static !important; float: none !important; margin: 10px 0 0 !important;
    padding: 0 !important; background: transparent !important; font-size: 13px;
}
.lesson-progress-workspace .content { padding: 0 !important; }
.lesson-progress-workspace .row { margin-left: -8px; margin-right: -8px; }
.lesson-progress-workspace [class*="col-md-"] { padding-left: 8px; padding-right: 8px; }

.lesson-progress-workspace .box {
    margin-bottom: 16px; border: 1px solid #e2e8f0 !important; border-top: 1px solid #e2e8f0 !important;
    border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
    overflow: hidden; background: #fff;
}
.lesson-progress-workspace .box-header {
    padding: 14px 16px !important; border-bottom: 1px solid #eef2f7 !important; background: #fff;
}
.lesson-progress-workspace .box-title {
    color: #0f172a; font-size: 17px !important; line-height: 1.35; font-weight: 800 !important;
}
.lesson-progress-workspace .box-body { padding: 16px !important; }

.lesson-progress-workspace .form-inline {
    display: flex; align-items: flex-end; flex-wrap: wrap; gap: 12px;
}
.lesson-progress-workspace .form-inline .form-group { margin: 0; }
.lesson-progress-workspace .form-inline label {
    display: block; margin: 0 0 6px; color: #334155; font-size: 14px; font-weight: 700;
}
.lesson-progress-workspace .form-control {
    min-height: 44px; height: 44px; padding: 8px 11px; border: 1px solid #cbd5e1;
    border-radius: 8px; font-size: 15px; color: #0f172a; background: #fff;
}
.lesson-progress-workspace .form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
}
.lesson-progress-workspace .btn {
    min-height: 40px; padding: 8px 13px; border-radius: 8px;
    font-size: 14px; font-weight: 700;
}
.lesson-progress-workspace .btn-primary { min-height: 44px; background: #2563eb; border-color: #2563eb; }
.lesson-progress-workspace .btn-sm { min-height: 36px; padding: 7px 11px; font-size: 13px; }

.lesson-progress-workspace .progress-container { margin-bottom: 16px; }
.lesson-progress-workspace .progress-label {
    margin-bottom: 8px; color: #334155; font-size: 14px; font-weight: 700;
}
.lesson-progress-workspace .progress-value { color: #059669; font-size: 18px; font-weight: 800; }
.lesson-progress-workspace .progress { height: 28px; border-radius: 999px; background: #e2e8f0; box-shadow: none; }
.lesson-progress-workspace .progress-bar {
    min-height: 28px; border-radius: 999px; font-size: 13px; font-weight: 800;
}

.lesson-progress-workspace .stats-grid { gap: 10px; margin-top: 16px; }
.lesson-progress-workspace .stat-item {
    min-height: 76px; padding: 13px 14px; border: 1px solid #e2e8f0;
    border-radius: 10px; background: #f8fafc;
}
.lesson-progress-workspace .stat-icon {
    width: 42px; height: 42px; margin-right: 11px; font-size: 18px; border-radius: 10px;
}
.lesson-progress-workspace .stat-number {
    color: #0f172a; font-size: 23px; line-height: 1.15; font-weight: 800;
}
.lesson-progress-workspace .stat-label {
    margin-top: 2px; color: #64748b; font-size: 13px; font-weight: 700;
}
.lesson-progress-workspace .chart-container {
    height: 260px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;
}

.lesson-progress-workspace .table-responsive {
    border: 1px solid #e2e8f0; border-radius: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch;
}
.lesson-progress-workspace table.table {
    min-width: 820px; margin-bottom: 0; border: 0 !important;
}
.lesson-progress-workspace table.table thead th {
    padding: 12px 13px; background: #f8fafc; color: #475569;
    font-size: 13px; font-weight: 800; letter-spacing: .035em; border-bottom: 1px solid #e2e8f0 !important;
}
.lesson-progress-workspace table.table tbody td {
    padding: 12px 13px; color: #334155; font-size: 14px; line-height: 1.45; vertical-align: middle;
}
.lesson-progress-workspace table.table tbody tr:hover td { background: #f8fbff; }
.lesson-progress-workspace table.table .label {
    min-height: 28px; padding: 5px 9px; display: inline-flex; align-items: center;
    border-radius: 999px; font-size: 13px; font-weight: 700;
}
.lesson-progress-workspace table.table .progress {
    min-width: 120px; height: 26px; margin-bottom: 0;
}

.lesson-progress-workspace .info-box {
    min-height: 92px; border: 1px solid #e2e8f0; border-radius: 12px;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.lesson-progress-workspace .info-box-icon {
    width: 76px; line-height: 90px; border-radius: 12px 0 0 12px; font-size: 27px;
}
.lesson-progress-workspace .info-box-content { margin-left: 76px; padding: 14px 16px; }
.lesson-progress-workspace .info-box-text { font-size: 13px; font-weight: 700; }
.lesson-progress-workspace .info-box-number { margin-top: 3px; font-size: 19px; line-height: 1.3; font-weight: 800; }

@media (max-width: 767px) {
    .lesson-progress-workspace { padding: 18px 14px 32px !important; }
    .lesson-progress-workspace .content-header h1 { font-size: 26px; }
    .lesson-progress-workspace .row { margin-left: 0; margin-right: 0; }
    .lesson-progress-workspace [class*="col-md-"] { padding-left: 0; padding-right: 0; }
    .lesson-progress-workspace .form-inline { align-items: stretch; flex-direction: column; }
    .lesson-progress-workspace .form-inline .form-group,
    .lesson-progress-workspace .form-inline .form-control,
    .lesson-progress-workspace .form-inline .btn { width: 100%; }
    .lesson-progress-workspace .stats-grid { grid-template-columns: 1fr 1fr; }
    .lesson-progress-workspace .chart-container { margin-top: 14px; }
}
@media (max-width: 400px) {
    .lesson-progress-workspace .stats-grid { grid-template-columns: 1fr; }
}
</style>

<script src="<?php echo base_url(); ?>assets/cdn/js/chart-3.9.1.min.js"></script>
<script>
$(document).ready(function() {
    // Status Chart
    var ctx = document.getElementById('statusChart').getContext('2d');
    var statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                '<?php echo get_phrase("approved"); ?>',
                '<?php echo get_phrase("pending"); ?>',
                '<?php echo get_phrase("declined"); ?>',
                '<?php echo get_phrase("not_submitted"); ?>'
            ],
            datasets: [{
                data: [
                    <?php echo $total_approved; ?>,
                    <?php echo $total_pending; ?>,
                    <?php echo $total_declined; ?>,
                    <?php echo max(0, $total_expected - $total_submitted); ?>
                ],
                backgroundColor: [
                    '#00a65a',
                    '#f39c12',
                    '#dd4b39',
                    '#d2d6de'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Term filter form
    $('#term-filter-form').on('submit', function(e) {
        e.preventDefault();
        var term = $('#term-select').val();
        var year = $('#year-select').val();
        window.location.href = '<?php echo site_url('teacher/lesson_note_progress'); ?>?term=' + term + '&year=' + year;
    });
});
</script>
