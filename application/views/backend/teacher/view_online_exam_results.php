<?php
$online_exam_details = $this->db->get_where('online_exam', ['online_exam_id' => $online_exam_id])->row_array();
$students_array = $this->db->get_where('enroll', [
    'class_id' => $online_exam_details['class_id'],
    'mute' => '0',
    'section_id' => $online_exam_details['section_id'],
    'year' => $online_exam_details['running_year'],
])->result_array();
$subject_info = $this->crud_model->get_subject_info($online_exam_details['subject_id']);
$total_mark = (float) $this->crud_model->get_total_mark($online_exam_id);

// Load this exam's results once, then map by student. The legacy view queried
// the same result twice for every enrolled student.
$result_rows = $this->db->get_where('online_exam_result', ['online_exam_id' => $online_exam_id])->result_array();
$results_by_student = [];
foreach ($result_rows as $result_row) {
    $results_by_student[(int) $result_row['student_id']] = $result_row;
}

$student_results = [];
$summary = [
    'enrolled' => count($students_array),
    'attempted' => 0,
    'passed' => 0,
    'failed' => 0,
    'absent' => 0,
    'score_sum' => 0.0,
];

foreach ($students_array as $enrollment) {
    $student_id = (int) $enrollment['student_id'];
    $student_details = $this->crud_model->get_student_info_by_id($student_id);
    $result = $results_by_student[$student_id] ?? null;
    $is_absent = !$result;
    $obtained_mark = $result ? (float) ($result['obtained_mark'] ?? 0) : 0.0;
    $result_key = $result ? strtolower(trim((string) ($result['result'] ?? 'fail'))) : 'absent';

    if ($is_absent) {
        $summary['absent']++;
    } else {
        $summary['attempted']++;
        $summary['score_sum'] += $obtained_mark;
        if ($result_key === 'pass' || $result_key === 'passed') {
            $summary['passed']++;
        } else {
            $summary['failed']++;
        }
    }

    $student_results[] = [
        'student_id' => $student_id,
        'name' => (string) ($student_details['name'] ?? ''),
        'student_code' => (string) ($student_details['student_code'] ?? ''),
        'obtained_mark' => $obtained_mark,
        'result_key' => $result_key,
        'is_absent' => $is_absent,
    ];
}

$average_score = $summary['attempted'] > 0 ? ($summary['score_sum'] / $summary['attempted']) : 0;
$pass_rate = $summary['attempted'] > 0 ? (($summary['passed'] / $summary['attempted']) * 100) : 0;
$current_time = time();
$exam_end_time = strtotime(date('Y-m-d', (int) $online_exam_details['exam_date']) . ' ' . $online_exam_details['time_end']);
$exam_is_running = $current_time < $exam_end_time;
$subject_name = '';
foreach ($subject_info as $subject) {
    $subject_name = (string) ($subject['name'] ?? '');
    if ($subject_name !== '') {
        break;
    }
}
?>

<style>
.exam-results-workspace{max-width:1440px;margin:0 auto;padding:4px 0 30px}.exam-results-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;background:#0f172a;color:#fff;border-radius:18px;padding:22px 24px;box-shadow:0 12px 30px rgba(15,23,42,.12);margin-bottom:16px}.exam-results-copy{min-width:0}.exam-results-copy h2{margin:0 0 7px;color:#fff;font-size:27px;font-weight:800;line-height:1.2}.exam-results-copy p{margin:0;color:#cbd5e1;font-size:13px}.exam-results-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.exam-results-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14);color:#e2e8f0;font-size:11px;font-weight:800}.exam-results-actions{display:flex;gap:8px;flex-wrap:wrap}.exam-results-actions a{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;border-radius:9px;padding:0 13px;text-decoration:none;font-weight:800}.exam-results-actions a:hover{text-decoration:none}.exam-results-back{background:#fff;color:#0f172a}.exam-results-questions{background:#2563eb;color:#fff}.exam-running-alert{display:flex;align-items:flex-start;gap:9px;margin:-2px 0 16px;border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:12px;padding:12px 14px;font-size:12px;font-weight:700}.result-kpi-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:16px}.result-kpi{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 15px;box-shadow:0 4px 14px rgba(15,23,42,.04)}.result-kpi span{display:block;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.result-kpi strong{display:block;margin-top:5px;color:#0f172a;font-size:23px;line-height:1.1}.result-kpi small{display:block;margin-top:4px;color:#94a3b8;font-size:10px}.result-kpi.is-success{border-color:#bbf7d0}.result-kpi.is-danger{border-color:#fecaca}.result-kpi.is-accent{border-color:#bfdbfe}.results-table-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 5px 18px rgba(15,23,42,.05)}.results-table-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 17px;border-bottom:1px solid #e2e8f0;background:#f8fafc}.results-table-head h3{margin:0;color:#0f172a;font-size:15px;font-weight:800}.results-table-head p{margin:3px 0 0;color:#64748b;font-size:11px}.results-table-wrap{overflow-x:auto}.results-table{width:100%;min-width:720px;margin:0!important;border-collapse:collapse}.results-table thead{background:#0f172a;color:#fff}.results-table th,.results-table td{padding:12px 14px!important;vertical-align:middle!important}.results-table tbody tr{border-bottom:1px solid #e2e8f0}.results-table tbody tr:hover{background:#f8fafc}.student-result-cell{display:flex;align-items:center;gap:10px}.student-result-avatar{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 38px;background:#e0f2fe;color:#0369a1;font-weight:900}.student-result-name{color:#0f172a;font-weight:800}.student-result-code{margin-top:2px;color:#94a3b8;font-size:10px}.score-value{font-weight:900;color:#0f172a}.score-out-of{color:#94a3b8;font-size:11px}.result-status{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900}.result-status:before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor}.result-status.is-pass{background:#dcfce7;color:#166534}.result-status.is-fail{background:#fee2e2;color:#991b1b}.result-status.is-absent{background:#f1f5f9;color:#475569}.empty-results{text-align:center!important;padding:36px!important;color:#64748b}.results-progress{height:7px;border-radius:999px;background:#e2e8f0;overflow:hidden;margin-top:7px}.results-progress span{display:block;height:100%;background:#2563eb;border-radius:999px}.results-progress-label{display:flex;justify-content:space-between;gap:10px;color:#64748b;font-size:10px;font-weight:700;margin-top:5px}
@media(max-width:1050px){.result-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:767px){.exam-results-workspace{padding-top:0}.exam-results-hero{display:block;padding:18px;border-radius:14px}.exam-results-copy h2{font-size:22px}.exam-results-actions{display:grid;grid-template-columns:1fr 1fr;margin-top:15px}.result-kpi-grid{grid-template-columns:1fr 1fr}.result-kpi{padding:12px}.result-kpi strong{font-size:20px}.results-table-card{border-radius:12px}.results-table-head{display:block}.results-table-head p{margin-top:4px}.results-table th,.results-table td{white-space:nowrap;padding:10px 11px!important}.student-result-cell{min-width:220px}}
@media(max-width:420px){.exam-results-actions{grid-template-columns:1fr}.result-kpi-grid{grid-template-columns:1fr 1fr}.result-kpi:last-child{grid-column:1/-1}}
</style>

<div class="exam-results-workspace" aria-labelledby="examResultsHeading">
    <section class="exam-results-hero">
        <div class="exam-results-copy">
            <h2 id="examResultsHeading"><i class="entypo-chart-bar"></i> <?php echo html_escape($online_exam_details['title']); ?></h2>
            <p>Review participation and performance for this online examination.</p>
            <div class="exam-results-meta">
                <?php if ($subject_name !== ''): ?><span class="exam-results-chip"><i class="entypo-book"></i><?php echo html_escape($subject_name); ?></span><?php endif; ?>
                <span class="exam-results-chip"><i class="entypo-trophy"></i><?php echo get_phrase('total_mark'); ?>: <?php echo number_format($total_mark, 0); ?></span>
                <span class="exam-results-chip"><i class="entypo-gauge"></i><?php echo get_phrase('minimum_percentage'); ?>: <?php echo html_escape($online_exam_details['minimum_percentage']); ?>%</span>
                <span class="exam-results-chip"><i class="entypo-calendar"></i><?php echo date('M d, Y', (int) $online_exam_details['exam_date']); ?></span>
            </div>
        </div>
        <div class="exam-results-actions">
            <a class="exam-results-back" href="<?php echo site_url('teacher/manage_online_exam'); ?>"><i class="entypo-left"></i><?php echo get_phrase('back'); ?></a>
            <a class="exam-results-questions" href="<?php echo site_url('teacher/manage_online_exam_question/' . $online_exam_id); ?>"><i class="entypo-list"></i><?php echo get_phrase('questions'); ?></a>
        </div>
    </section>

    <?php if ($exam_is_running): ?>
        <div class="exam-running-alert" role="status"><i class="entypo-info-circled"></i><span><?php echo get_phrase('exam_has_not_finished_yet'); ?> Results can continue changing until the exam closes.</span></div>
    <?php endif; ?>

    <section class="result-kpi-grid" aria-label="Exam results summary">
        <div class="result-kpi"><span>Enrolled</span><strong><?php echo (int) $summary['enrolled']; ?></strong><small>Students in this class and section</small></div>
        <div class="result-kpi is-accent"><span>Attempted</span><strong><?php echo (int) $summary['attempted']; ?></strong><small><?php echo number_format($summary['enrolled'] > 0 ? ($summary['attempted'] / $summary['enrolled']) * 100 : 0, 0); ?>% participation</small></div>
        <div class="result-kpi is-success"><span>Passed</span><strong><?php echo (int) $summary['passed']; ?></strong><small><?php echo number_format($pass_rate, 0); ?>% of attempts</small></div>
        <div class="result-kpi is-danger"><span>Absent</span><strong><?php echo (int) $summary['absent']; ?></strong><small>No submitted result</small></div>
        <div class="result-kpi"><span>Average score</span><strong><?php echo number_format($average_score, 1); ?></strong><small>out of <?php echo number_format($total_mark, 0); ?></small></div>
    </section>

    <section class="results-table-card">
        <div class="results-table-head">
            <div><h3>Student results</h3><p>Pass, fail and absence states are based on the existing stored online-exam results.</p></div>
            <div style="min-width:180px">
                <div class="results-progress"><span style="width:<?php echo number_format($pass_rate, 2, '.', ''); ?>%"></span></div>
                <div class="results-progress-label"><span>Pass rate</span><span><?php echo number_format($pass_rate, 0); ?>%</span></div>
            </div>
        </div>
        <div class="results-table-wrap">
            <table class="table results-table" id="table_export">
                <thead>
                    <tr>
                        <th><?php echo get_phrase('student_name'); ?></th>
                        <th><?php echo get_phrase('obtained_marks'); ?></th>
                        <th><?php echo get_phrase('result'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($student_results)): ?>
                        <tr><td colspan="3" class="empty-results">No enrolled students were found for this exam.</td></tr>
                    <?php else: ?>
                        <?php foreach ($student_results as $student_result): ?>
                            <?php
                            $status_class = 'is-fail';
                            $status_label = get_phrase('fail');
                            if ($student_result['is_absent']) {
                                $status_class = 'is-absent';
                                $status_label = get_phrase('fail') . ' (' . get_phrase('absent') . ')';
                            } elseif ($student_result['result_key'] === 'pass' || $student_result['result_key'] === 'passed') {
                                $status_class = 'is-pass';
                                $status_label = get_phrase('pass');
                            } else {
                                $stored_label = get_phrase($student_result['result_key']);
                                if (!empty($stored_label)) {
                                    $status_label = $stored_label;
                                }
                            }
                            $initial = strtoupper(substr(trim($student_result['name']), 0, 1));
                            ?>
                            <tr>
                                <td>
                                    <div class="student-result-cell">
                                        <span class="student-result-avatar" aria-hidden="true"><?php echo html_escape($initial ?: '?'); ?></span>
                                        <span><span class="student-result-name"><?php echo html_escape($student_result['name']); ?></span><?php if ($student_result['student_code'] !== ''): ?><span class="student-result-code"><?php echo html_escape($student_result['student_code']); ?></span><?php endif; ?></span>
                                    </div>
                                </td>
                                <td><span class="score-value"><?php echo number_format($student_result['obtained_mark'], 1); ?></span> <span class="score-out-of">/ <?php echo number_format($total_mark, 0); ?></span></td>
                                <td><span class="result-status <?php echo $status_class; ?>"><?php echo html_escape($status_label); ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </section>
</div>
