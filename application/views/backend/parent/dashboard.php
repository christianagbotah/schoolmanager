<?php
$parent_id = (int) $this->session->userdata('parent_id');
$dashboard_year = isset($running_year) && $running_year !== '' ? $running_year : get_settings('running_year');
$dashboard_term = isset($running_term) && $running_term !== '' ? $running_term : get_settings('running_term');

// Safe defaults are intentionally declared before any conditional query so the
// dashboard renders cleanly for a newly-created parent with no linked children.
$n_teachers = 0;
$subj_rows = 0;
$present_today = 0;
$teachers_ids_array = array();
$class_id_array = array();
$class_master_ids = array();
$subject_teacher_ids = array();
$active_array = array();
$child_context = array();
$attendance_names = array();
$form_master = 'No Class Master Found';
$s_teacher = 'teacher';

$active_students = $this->db
    ->select('student_id, name, student_code')
    ->from('student')
    ->where('parent_id', $parent_id)
    ->where('mute', '0')
    ->order_by('name', 'ASC')
    ->get()
    ->result_array();

$inactive_students = $this->db
    ->select('student_id, name, student_code')
    ->from('student')
    ->where('parent_id', $parent_id)
    ->where('mute', '1')
    ->order_by('name', 'ASC')
    ->get()
    ->result_array();

$allChildren = $this->db
    ->where('parent_id', $parent_id)
    ->order_by('name', 'ASC')
    ->get('student')
    ->result_array();

foreach ($active_students as $student) {
    $active_array[] = (int) $student['student_id'];
}

$query_rows = count($active_students);
$inactive_query = count($inactive_students);
$all_query_rows = count($allChildren);
$primary_student_id = !empty($active_array) ? (int) $active_array[0] : 0;

if (!empty($active_array)) {
    $enrollments = $this->db
        ->select('e.student_id, e.class_id, e.section_id, c.name AS class_name, sec.section_name')
        ->from('enroll e')
        ->join('class c', 'c.class_id = e.class_id', 'left')
        ->join('section sec', 'sec.section_id = e.section_id', 'left')
        ->where('e.year', $dashboard_year)
        ->where('e.term', $dashboard_term)
        ->where('e.mute', '0')
        ->where_in('e.student_id', $active_array)
        ->get()
        ->result_array();

    foreach ($enrollments as $enrollment) {
        $student_id = (int) $enrollment['student_id'];
        $child_context[$student_id] = $enrollment;
        if (!empty($enrollment['class_id'])) {
            $class_id_array[] = (int) $enrollment['class_id'];
        }
    }
    $class_id_array = array_values(array_unique($class_id_array));

    if (!empty($class_id_array)) {
        $class_master_rows = $this->db
            ->select('teacher_id')
            ->distinct()
            ->from('class')
            ->where_in('class_id', $class_id_array)
            ->where('teacher_id >', 0)
            ->get()
            ->result_array();

        foreach ($class_master_rows as $row) {
            $class_master_ids[] = (int) $row['teacher_id'];
        }
        $class_master_ids = array_values(array_unique(array_filter($class_master_ids)));
        $n_teachers = count($class_master_ids);

        $subject_teacher_rows = $this->db
            ->select('teacher_id')
            ->distinct()
            ->from('subject')
            ->where('year', $dashboard_year)
            ->where('term', $dashboard_term)
            ->where_in('class_id', $class_id_array)
            ->where('teacher_id >', 0)
            ->get()
            ->result_array();

        foreach ($subject_teacher_rows as $row) {
            $subject_teacher_ids[] = (int) $row['teacher_id'];
        }
        $subject_teacher_ids = array_values(array_unique(array_filter($subject_teacher_ids)));
        $subj_rows = count($subject_teacher_ids);
        $teachers_ids_array = array_values(array_unique(array_merge($class_master_ids, $subject_teacher_ids)));
    }

    $attendance_rows = $this->db
        ->select('student_id')
        ->from('attendance')
        ->where('timestamp', strtotime(date('Y-m-d')))
        ->where('status', '1')
        ->where('year', $dashboard_year)
        ->where('term', $dashboard_term)
        ->where_in('student_id', $active_array)
        ->get()
        ->result_array();

    $present_today = count($attendance_rows);
    if (!empty($attendance_rows)) {
        $present_ids = array();
        foreach ($attendance_rows as $attendance_row) {
            $present_ids[] = (int) $attendance_row['student_id'];
        }
        $present_students = $this->db
            ->select('name')
            ->from('student')
            ->where_in('student_id', array_values(array_unique($present_ids)))
            ->order_by('name', 'ASC')
            ->get()
            ->result_array();
        foreach ($present_students as $present_student) {
            $attendance_names[] = $present_student['name'];
        }
    }
}

if ($n_teachers === 1) {
    $form_master = 'Class Master';
} elseif ($n_teachers > 1) {
    $form_master = 'Class Masters';
}
if ($subj_rows > 1) {
    $s_teacher = 'teachers';
}

$attendance_rate = $query_rows > 0 ? round(($present_today / $query_rows) * 100) : 0;
$family_label = $all_query_rows === 1 ? 'Child' : 'Children';
?>

<style>
.parent-command-center {
    --pcc-border: #e2e8f0;
    --pcc-muted: #64748b;
    --pcc-text: #0f172a;
    --pcc-surface: #ffffff;
    --pcc-soft: #f8fafc;
    --pcc-primary: #2563eb;
    --pcc-primary-soft: #eff6ff;
    margin: 18px 0 28px;
    color: var(--pcc-text);
}
.parent-command-center * { box-sizing: border-box; }
.parent-command-center a { text-decoration: none; }
.parent-command-center .pcc-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 24px;
    border: 1px solid var(--pcc-border);
    border-radius: 18px;
    background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
    box-shadow: 0 12px 30px rgba(15, 23, 42, .06);
}
.parent-command-center .pcc-eyebrow {
    margin: 0 0 6px;
    color: var(--pcc-primary);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.parent-command-center .pcc-title { margin: 0; font-size: 28px; font-weight: 800; line-height: 1.15; }
.parent-command-center .pcc-subtitle { margin: 8px 0 0; color: var(--pcc-muted); font-size: 14px; }
.parent-command-center .pcc-context { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.parent-command-center .pcc-chip {
    padding: 8px 11px;
    border: 1px solid #bfdbfe;
    border-radius: 999px;
    background: rgba(255,255,255,.86);
    color: #1e40af;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
}
.parent-command-center .pcc-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 16px;
}
.parent-command-center .pcc-metric {
    min-height: 126px;
    padding: 18px;
    border: 1px solid var(--pcc-border);
    border-radius: 16px;
    background: var(--pcc-surface);
    box-shadow: 0 8px 22px rgba(15, 23, 42, .04);
}
.parent-command-center .pcc-metric-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.parent-command-center .pcc-icon {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: var(--pcc-primary-soft);
    color: var(--pcc-primary);
    font-size: 18px;
}
.parent-command-center .pcc-value { margin: 14px 0 2px; font-size: 30px; font-weight: 800; line-height: 1; }
.parent-command-center .pcc-label { color: var(--pcc-muted); font-size: 13px; font-weight: 600; }
.parent-command-center .pcc-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(280px, .75fr);
    gap: 16px;
    margin-top: 16px;
}
.parent-command-center .pcc-panel {
    border: 1px solid var(--pcc-border);
    border-radius: 18px;
    background: var(--pcc-surface);
    box-shadow: 0 8px 22px rgba(15, 23, 42, .04);
    overflow: hidden;
}
.parent-command-center .pcc-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 17px 18px;
    border-bottom: 1px solid var(--pcc-border);
}
.parent-command-center .pcc-panel-head h3 { margin: 0; font-size: 16px; font-weight: 800; }
.parent-command-center .pcc-panel-head span { color: var(--pcc-muted); font-size: 12px; }
.parent-command-center .pcc-child-list { display: grid; gap: 0; }
.parent-command-center .pcc-child {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    padding: 16px 18px;
    border-bottom: 1px solid #f1f5f9;
}
.parent-command-center .pcc-child:last-child { border-bottom: 0; }
.parent-command-center .pcc-child-main { display: flex; align-items: center; gap: 12px; min-width: 0; }
.parent-command-center .pcc-avatar {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: #eef2ff;
    color: #4338ca;
    font-weight: 800;
}
.parent-command-center .pcc-child-name { margin: 0; font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.parent-command-center .pcc-child-meta { margin: 4px 0 0; color: var(--pcc-muted); font-size: 12px; }
.parent-command-center .pcc-child-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }
.parent-command-center .pcc-mini-link {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 7px 10px;
    border: 1px solid var(--pcc-border);
    border-radius: 10px;
    color: #334155;
    background: #fff;
    font-size: 12px;
    font-weight: 700;
}
.parent-command-center .pcc-mini-link:hover,
.parent-command-center .pcc-mini-link:focus-visible { border-color: #93c5fd; color: #1d4ed8; outline: 2px solid #dbeafe; outline-offset: 1px; }
.parent-command-center .pcc-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 16px; }
.parent-command-center .pcc-action {
    min-height: 86px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    padding: 14px;
    border: 1px solid var(--pcc-border);
    border-radius: 14px;
    background: var(--pcc-soft);
    color: #1e293b;
    font-weight: 800;
}
.parent-command-center .pcc-action i { color: var(--pcc-primary); font-size: 20px; }
.parent-command-center .pcc-action small { color: var(--pcc-muted); font-weight: 500; line-height: 1.35; }
.parent-command-center .pcc-action:hover,
.parent-command-center .pcc-action:focus-visible { border-color: #93c5fd; background: #eff6ff; outline: 2px solid #dbeafe; outline-offset: 1px; }
.parent-command-center .pcc-action.is-disabled { opacity: .52; cursor: not-allowed; }
.parent-command-center .pcc-empty { padding: 26px 18px; text-align: center; color: var(--pcc-muted); }
.parent-command-center .pcc-empty i { display: block; margin-bottom: 9px; color: #94a3b8; font-size: 26px; }
.parent-command-center .pcc-calendar { margin-top: 16px; }
.parent-command-center .pcc-calendar-body { padding: 10px 14px 16px; }
.parent-command-center .pcc-attendance-note { margin-top: 6px; color: var(--pcc-muted); font-size: 11px; line-height: 1.35; }
@media (max-width: 991px) {
    .parent-command-center .pcc-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .parent-command-center .pcc-layout { grid-template-columns: 1fr; }
}
@media (max-width: 575px) {
    .parent-command-center { margin-top: 10px; }
    .parent-command-center .pcc-hero { align-items: flex-start; flex-direction: column; padding: 18px; border-radius: 15px; }
    .parent-command-center .pcc-context { justify-content: flex-start; }
    .parent-command-center .pcc-title { font-size: 22px; }
    .parent-command-center .pcc-metrics { grid-template-columns: 1fr 1fr; gap: 10px; }
    .parent-command-center .pcc-metric { min-height: 112px; padding: 14px; }
    .parent-command-center .pcc-value { font-size: 25px; }
    .parent-command-center .pcc-child { grid-template-columns: 1fr; }
    .parent-command-center .pcc-child-actions { justify-content: flex-start; }
    .parent-command-center .pcc-actions { grid-template-columns: 1fr 1fr; padding: 12px; }
    .parent-command-center .pcc-action { min-height: 82px; padding: 12px; }
}
@media (max-width: 380px) {
    .parent-command-center .pcc-metrics,
    .parent-command-center .pcc-actions { grid-template-columns: 1fr; }
}
</style>

<!-- Parent Family Command Center -->
<div class="parent-command-center" data-parent-command-center="true">
    <section class="pcc-hero" aria-labelledby="family-command-center-title">
        <div>
            <p class="pcc-eyebrow">Parent &amp; Guardian Portal</p>
            <h2 class="pcc-title" id="family-command-center-title">Family command center</h2>
            <p class="pcc-subtitle">See your children, attendance, results, fees and school communication from one place.</p>
        </div>
        <div class="pcc-context" aria-label="Academic context">
            <span class="pcc-chip"><i class="fa fa-calendar-o" aria-hidden="true"></i> <?php echo html_escape($dashboard_year); ?></span>
            <span class="pcc-chip">Term <?php echo html_escape($dashboard_term); ?></span>
        </div>
    </section>

    <section class="pcc-metrics" aria-label="Family summary" data-parent-child-summary>
        <article class="pcc-metric">
            <div class="pcc-metric-top"><span class="pcc-label">Active <?php echo $family_label; ?></span><span class="pcc-icon"><i class="fa fa-users" aria-hidden="true"></i></span></div>
            <div class="pcc-value"><?php echo (int) $query_rows; ?></div>
            <div class="pcc-label"><?php echo $inactive_query > 0 ? (int) $inactive_query . ' inactive' : 'All linked records in view'; ?></div>
        </article>
        <article class="pcc-metric" data-parent-attendance-summary>
            <div class="pcc-metric-top"><span class="pcc-label">Present today</span><span class="pcc-icon"><i class="fa fa-check-circle" aria-hidden="true"></i></span></div>
            <div class="pcc-value"><?php echo (int) $present_today; ?><span style="font-size:14px;color:#64748b;font-weight:700;"> / <?php echo (int) $query_rows; ?></span></div>
            <div class="pcc-label"><?php echo (int) $attendance_rate; ?>% attendance today</div>
            <?php if (!empty($attendance_names)): ?><div class="pcc-attendance-note"><?php echo html_escape(implode(', ', $attendance_names)); ?></div><?php endif; ?>
        </article>
        <article class="pcc-metric">
            <div class="pcc-metric-top"><span class="pcc-label">Class masters</span><span class="pcc-icon"><i class="fa fa-user" aria-hidden="true"></i></span></div>
            <div class="pcc-value"><?php echo (int) $n_teachers; ?></div>
            <div class="pcc-label"><?php echo html_escape($form_master); ?></div>
        </article>
        <article class="pcc-metric">
            <div class="pcc-metric-top"><span class="pcc-label">Subject teachers</span><span class="pcc-icon"><i class="fa fa-graduation-cap" aria-hidden="true"></i></span></div>
            <div class="pcc-value"><?php echo (int) $subj_rows; ?></div>
            <div class="pcc-label">Current academic context</div>
        </article>
    </section>

    <div class="pcc-layout">
        <section class="pcc-panel" aria-labelledby="children-overview-title">
            <div class="pcc-panel-head">
                <div><h3 id="children-overview-title">Your children</h3><span>Current class context and direct actions</span></div>
                <?php if ($all_query_rows > 0): ?>
                    <button type="button" class="pcc-mini-link" onclick="allChildren()"><i class="fa fa-list" aria-hidden="true"></i>&nbsp; All children</button>
                <?php endif; ?>
            </div>
            <?php if (!empty($active_students)): ?>
                <div class="pcc-child-list">
                    <?php foreach ($active_students as $student):
                        $student_id = (int) $student['student_id'];
                        $context = isset($child_context[$student_id]) ? $child_context[$student_id] : array();
                        $class_name = !empty($context['class_name']) ? $context['class_name'] : 'Class not assigned';
                        $section_name = !empty($context['section_name']) ? ' · ' . $context['section_name'] : '';
                        $initial = strtoupper(substr(trim($student['name']), 0, 1));
                    ?>
                    <article class="pcc-child">
                        <div class="pcc-child-main">
                            <span class="pcc-avatar" aria-hidden="true"><?php echo html_escape($initial ?: 'S'); ?></span>
                            <div style="min-width:0;">
                                <h4 class="pcc-child-name"><?php echo html_escape($student['name']); ?></h4>
                                <p class="pcc-child-meta"><?php echo html_escape($class_name . $section_name); ?><?php echo !empty($student['student_code']) ? ' · ' . html_escape($student['student_code']) : ''; ?></p>
                            </div>
                        </div>
                        <div class="pcc-child-actions" aria-label="Actions for <?php echo html_escape($student['name']); ?>">
                            <a class="pcc-mini-link" href="<?php echo site_url('parents/attendance_report/' . $student_id); ?>">Attendance</a>
                            <a class="pcc-mini-link" href="<?php echo site_url('parents/marks/' . $student_id); ?>">Results</a>
                            <a class="pcc-mini-link" href="<?php echo site_url('parents/invoice/' . $student_id); ?>">Fees</a>
                        </div>
                    </article>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="pcc-empty">
                    <i class="fa fa-user-plus" aria-hidden="true"></i>
                    <strong>No active child is linked to this account yet.</strong><br>
                    The dashboard will populate automatically after the school links an active student record.
                </div>
            <?php endif; ?>
        </section>

        <aside class="pcc-panel" aria-labelledby="quick-actions-title" data-parent-quick-actions>
            <div class="pcc-panel-head"><div><h3 id="quick-actions-title">Quick actions</h3><span>Frequent parent tasks</span></div></div>
            <div class="pcc-actions">
                <?php if ($primary_student_id > 0): ?>
                    <a class="pcc-action" href="<?php echo site_url('parents/attendance_report/' . $primary_student_id); ?>"><i class="fa fa-calendar-check-o" aria-hidden="true"></i><span>Attendance</span><small>Review the selected child’s attendance.</small></a>
                    <a class="pcc-action" href="<?php echo site_url('parents/marks/' . $primary_student_id); ?>"><i class="fa fa-line-chart" aria-hidden="true"></i><span>Results</span><small>Open marks and academic performance.</small></a>
                    <a class="pcc-action" href="<?php echo site_url('parents/invoice/' . $primary_student_id); ?>"><i class="fa fa-credit-card" aria-hidden="true"></i><span>Fees &amp; invoices</span><small>Review bills, balances and payments.</small></a>
                <?php else: ?>
                    <span class="pcc-action is-disabled" aria-disabled="true"><i class="fa fa-calendar-check-o" aria-hidden="true"></i><span>Attendance</span><small>Available when a child is linked.</small></span>
                    <span class="pcc-action is-disabled" aria-disabled="true"><i class="fa fa-line-chart" aria-hidden="true"></i><span>Results</span><small>Available when a child is linked.</small></span>
                    <span class="pcc-action is-disabled" aria-disabled="true"><i class="fa fa-credit-card" aria-hidden="true"></i><span>Fees &amp; invoices</span><small>Available when a child is linked.</small></span>
                <?php endif; ?>
                <a class="pcc-action" href="<?php echo site_url('parents/message'); ?>"><i class="fa fa-envelope-o" aria-hidden="true"></i><span>Messages</span><small>Contact the school from your inbox.</small></a>
                <a class="pcc-action" href="<?php echo site_url('parents/noticeboard'); ?>"><i class="fa fa-bullhorn" aria-hidden="true"></i><span>Notices</span><small>See announcements and school updates.</small></a>
                <a class="pcc-action" href="<?php echo site_url('parents/manage_profile'); ?>"><i class="fa fa-user-circle-o" aria-hidden="true"></i><span>My account</span><small>Update profile and password.</small></a>
            </div>
        </aside>
    </div>

    <!-- Parent Events Calendar -->
    <section class="pcc-panel pcc-calendar" aria-labelledby="events-calendar-title">
        <div class="pcc-panel-head"><div><h3 id="events-calendar-title"><i class="fa fa-calendar" aria-hidden="true"></i> School calendar</h3><span>Notices, events and birthdays</span></div></div>
        <div class="pcc-calendar-body"><div id="notice_calendar"></div></div>
    </section>
</div>

<script>
$(document).ready(function() {
    $('#notice_calendar').fullCalendar({
        header: {
            left: 'title',
            right: 'today prev,next'
        },
        editable: false,
        firstDay: 1,
        height: 530,
        droppable: false,
        events: [
            <?php
            $notices = $this->db->get('noticeboard')->result_array();
            foreach ($notices as $row):
            ?>
            {
                title: <?php echo json_encode((string) $row['notice_title']); ?>,
                start: new Date(<?php echo (int) date('Y', $row['create_timestamp']); ?>, <?php echo (int) date('m', $row['create_timestamp']) - 1; ?>, <?php echo (int) date('d', $row['create_timestamp']); ?>),
                end: new Date(<?php echo (int) date('Y', $row['create_timestamp']); ?>, <?php echo (int) date('m', $row['create_timestamp']) - 1; ?>, <?php echo (int) date('d', $row['create_timestamp']); ?>)
            },
            <?php endforeach; ?>

            <?php
            $students_bd = $this->db->get_where('student', array('parent_id' => $parent_id))->result_array();
            foreach ($students_bd as $row_s):
                if (empty($row_s['birthday']) || strtotime($row_s['birthday']) === false) {
                    continue;
                }
            ?>
            {
                title: <?php echo json_encode(strtoupper($row_s['name'] . "'s birthday")); ?>,
                start: new Date(<?php echo (int) date('Y'); ?>, <?php echo (int) date('m', strtotime($row_s['birthday'])) - 1; ?>, <?php echo (int) date('d', strtotime($row_s['birthday'])); ?>),
                end: new Date(<?php echo (int) date('Y'); ?>, <?php echo (int) date('m', strtotime($row_s['birthday'])) - 1; ?>, <?php echo (int) date('d', strtotime($row_s['birthday'])); ?>)
            },
            <?php endforeach; ?>

            <?php
            if (!empty($teachers_ids_array)) {
                $teachers_bd = $this->db->where_in('teacher_id', $teachers_ids_array)->get('teacher')->result_array();
                foreach ($teachers_bd as $row_t):
                    if (empty($row_t['birthday']) || strtotime($row_t['birthday']) === false) {
                        continue;
                    }
            ?>
            {
                title: <?php echo json_encode(strtoupper($row_t['name'] . "'s birthday")); ?>,
                start: new Date(<?php echo (int) date('Y'); ?>, <?php echo (int) date('m', strtotime($row_t['birthday'])) - 1; ?>, <?php echo (int) date('d', strtotime($row_t['birthday'])); ?>),
                end: new Date(<?php echo (int) date('Y'); ?>, <?php echo (int) date('m', strtotime($row_t['birthday'])) - 1; ?>, <?php echo (int) date('d', strtotime($row_t['birthday'])); ?>)
            },
            <?php
                endforeach;
            }
            ?>
        ]
    });
});

function allChildren() {
    var url = <?php echo json_encode(site_url('parents/children_list')); ?>;
    var data = <?php echo json_encode($allChildren); ?>;

    $.ajax({
        url: url,
        type: 'POST',
        dataType: 'html',
        data: {data: data}
    })
    .done(function(resp) {
        showAjaxModalDisplay(resp, 'Children');
    })
    .fail(function(err) {
        showAjaxModal_alert(err.responseText, 'Error');
    });
}
</script>
