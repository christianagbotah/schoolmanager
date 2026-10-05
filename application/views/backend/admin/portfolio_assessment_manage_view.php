<?php
$class_row = $this->db->get_where('class', array('class_id' => $class_id))->row();
$class_name = $class_row ? $class_row->name : '';
$class_teacher_id = $class_row ? $class_row->teacher_id : '';
$section_row = $this->db->get_where('section', array('section_id' => $section_id))->row();
$subject_row = $this->db->get_where('subject', array('subject_id' => $subject_id))->row();
$exam_row = $this->db->get_where('exam', array('exam_id' => $exam_id))->row();

$teacher_class_groups = array();
if (isset($class_ids_creche) && is_array($class_ids_creche)) $teacher_class_groups = array_merge($teacher_class_groups, $class_ids_creche);
if (isset($class_ids_c) && is_array($class_ids_c)) $teacher_class_groups = array_merge($teacher_class_groups, $class_ids_c);
if (isset($class_ids) && is_array($class_ids)) $teacher_class_groups = array_merge($teacher_class_groups, $class_ids);

$this->db->where('year', $running_year);
$this->db->where('category_id', '1');
$this->db->group_start();
$this->db->where('term', $running_term);
$this->db->or_where('sem', $running_sem);
$this->db->group_end();
$portfolio_exams = $this->db->get('exam')->result_array();

$subject_filter = array('class_id' => $class_id, 'year' => $running_year);
if ($class_name == 'JHSS') $subject_filter['sem'] = $running_sem;
else $subject_filter['term'] = $running_term;
if ($account_type == 'teacher' && $class_teacher_id != $this->session->userdata('teacher_id')) {
    $subject_filter['teacher_id'] = $this->session->userdata('teacher_id');
}
$subjects = $this->db->get_where('subject', $subject_filter)->result_array();

$dates_array = array();
if (preg_match('/^(\d{4})-W(\d{2})$/', $week, $week_parts)) {
    $week_start = new DateTime();
    $week_start->setTime(0, 0, 0);
    $week_start->setISODate((int)$week_parts[1], (int)$week_parts[2], 1);
    for ($day_index = 0; $day_index < 5; $day_index++) {
        $day = clone $week_start;
        if ($day_index > 0) $day->modify('+'.$day_index.' day');
        $dates_array[] = $day->getTimestamp();
    }
}
if (empty($dates_array)) {
    $base = strtotime(str_replace('-', '', $week));
    for ($day_index = 0; $day_index < 5; $day_index++) $dates_array[] = strtotime('+'.$day_index.' day', $base);
}
$today_timestamp = strtotime(date('Y-m-d'));

$assessment_filter = array(
    'class_id' => $class_id,
    'year' => $running_year,
    'subject_id' => $subject_id,
    'week' => $week,
    'exam_id' => $exam_id
);
if ($class_name == 'JHSS') $assessment_filter['sem'] = $running_sem;
else $assessment_filter['term'] = $running_term;
$assessment_rows = $this->db->get_where('portfolio_assessment', $assessment_filter)->result_array();

$assessment_map = array();
$student_ids = array();
$student_seen = array();
$day_codes = array();
foreach ($assessment_rows as $assessment) {
    $sid = $assessment['student_id'];
    $ts = (int)$assessment['timestamp'];
    $assessment_map[$sid][$ts] = $assessment;
    if (!isset($student_seen[$sid])) {
        $student_seen[$sid] = true;
        $student_ids[] = $sid;
    }
    if (!isset($day_codes[$ts]) && !empty($assessment['code'])) $day_codes[$ts] = $assessment['code'];
}

$student_map = array();
if (!empty($student_ids)) {
    $this->db->where_in('student_id', $student_ids);
    foreach ($this->db->get('student')->result_array() as $student) $student_map[$student['student_id']] = $student;
}

$preview_subject_filter = array('class_id' => $class_id, 'year' => $running_year);
if ($class_name == 'JHSS') $preview_subject_filter['sem'] = $running_sem;
else $preview_subject_filter['term'] = $running_term;
$preview_subjects = $this->db->get_where('subject', $preview_subject_filter)->result_array();

$preview_filter = array('class_id' => $class_id, 'year' => $running_year, 'week' => $week, 'exam_id' => $exam_id);
if ($class_name == 'JHSS') $preview_filter['sem'] = $running_sem;
else $preview_filter['term'] = $running_term;
$preview_rows = $this->db->get_where('portfolio_assessment', $preview_filter)->result_array();
$preview_map = array();
$preview_codes = array();
foreach ($preview_rows as $assessment) {
    $sid = $assessment['student_id'];
    $ts = (int)$assessment['timestamp'];
    $subid = $assessment['subject_id'];
    $preview_map[$sid][$ts][$subid] = $assessment;
    if (!empty($assessment['code'])) $preview_codes[$ts][$subid] = $assessment['code'];
}

$assessment_ids = array();
$missing_assessment_cells = 0;
$period_label = $class_name == 'JHSS' ? get_phrase('semester').' '.$running_sem : get_phrase('term').' '.$running_term;
$class_label = $class_row ? trim($class_row->name.' '.$class_row->name_numeric) : get_phrase('class');
if ($section_row && !empty($section_row->name)) $class_label .= ' · '.$section_row->name;
$exam_label = $exam_row ? $exam_row->name : get_phrase('exam');
$subject_label = $subject_row ? $subject_row->name : get_phrase('subject');
?>
<style>
.portfolio-entry-page{--pa-border:#e2e8f0;--pa-text:#0f172a;--pa-muted:#64748b;--pa-primary:#2563eb;--pa-soft:#eff6ff;color:#334155}
.portfolio-entry-page .pa-hero{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px;padding:16px 18px;border:1px solid var(--pa-border);border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.portfolio-entry-page .pa-hero-copy{display:flex;align-items:center;gap:12px;min-width:0}.portfolio-entry-page .pa-icon{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--pa-soft);color:var(--pa-primary);font-size:18px}.portfolio-entry-page .pa-title{margin:0;color:var(--pa-text);font-size:24px;font-weight:800;line-height:1.25}.portfolio-entry-page .pa-subtitle{margin:4px 0 0;color:var(--pa-muted);font-size:13px;line-height:1.45}.portfolio-entry-page .pa-week{padding:8px 11px;border:1px solid #dbeafe;border-radius:9px;background:#f8fbff;color:#1e40af;font-size:12px;font-weight:800;white-space:nowrap}
.portfolio-entry-page .pa-filter-card,.portfolio-entry-page .pa-sheet-card{margin-bottom:14px;padding:16px;border:1px solid var(--pa-border);border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)}.portfolio-entry-page .pa-filter-grid{display:grid;grid-template-columns:minmax(165px,1.05fr) minmax(165px,1fr) minmax(155px,.85fr) minmax(190px,1.1fr) auto;gap:11px;align-items:end}.portfolio-entry-page #subject_holder{display:contents}.portfolio-entry-page .pa-field label{display:block;margin:0 0 6px;color:#475569;font-size:13px;font-weight:700}.portfolio-entry-page .pa-action{display:flex;align-items:flex-end}.portfolio-entry-page .pa-action .btn{white-space:nowrap;font-weight:800}
.portfolio-entry-page .pa-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}.portfolio-entry-page .pa-summary-item{min-width:0;padding:12px 13px;border:1px solid var(--pa-border);border-radius:11px;background:#fff}.portfolio-entry-page .pa-summary-label{margin-bottom:4px;color:var(--pa-muted);font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.portfolio-entry-page .pa-summary-value{overflow:hidden;color:var(--pa-text);font-size:14px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}
.portfolio-entry-page .pa-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.portfolio-entry-page .pa-sheet-head h3{margin:0;color:var(--pa-text);font-size:18px;font-weight:800}.portfolio-entry-page .pa-sheet-head p{margin:3px 0 0;color:var(--pa-muted);font-size:12px}.portfolio-entry-page .pa-mode-actions{display:flex;gap:8px;flex-wrap:wrap}.portfolio-entry-page .pa-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--pa-border);border-radius:11px}.portfolio-entry-page .pa-table{min-width:840px;margin:0!important;background:#fff}.portfolio-entry-page .pa-table thead th{padding:9px 8px!important;background:#f8fafc!important;color:#475569!important;font-size:12px!important;font-weight:800!important;vertical-align:bottom!important;text-align:center}.portfolio-entry-page .pa-table tbody td{padding:8px!important;vertical-align:middle!important}.portfolio-entry-page .pa-table .pa-student{text-align:left}.portfolio-entry-page .pa-student-name{color:var(--pa-text);font-weight:800}.portfolio-entry-page .pa-student-code{color:var(--pa-muted);font-size:12px}.portfolio-entry-page .pa-day-name{color:var(--pa-text);font-size:12px;font-weight:800}.portfolio-entry-page .pa-day-date{margin-top:2px;color:var(--pa-muted);font-size:11px;font-weight:600}.portfolio-entry-page .pa-code-input{min-width:92px;margin-top:7px;text-align:center;text-transform:uppercase}.portfolio-entry-page .pa-score{min-width:78px;text-align:center;font-weight:800}.portfolio-entry-page .pa-today{border-color:#60a5fa!important;background:#eff6ff!important;box-shadow:0 0 0 1px #93c5fd inset}.portfolio-entry-page .pa-future{background:#f8fafc!important;color:#94a3b8!important}.portfolio-entry-page .pa-save-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}.portfolio-entry-page .pa-save-note{color:var(--pa-muted);font-size:12px}.portfolio-entry-page .pa-warning{margin:0 0 12px;border-radius:10px}.portfolio-entry-page #preview_holder{display:none}.portfolio-entry-page .pa-preview-header{margin-bottom:10px;color:var(--pa-text);font-size:15px;font-weight:800}.portfolio-entry-page .pa-preview-grade{text-align:center;font-weight:800}
@media(max-width:1100px){.portfolio-entry-page .pa-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.portfolio-entry-page .pa-action{grid-column:span 2}.portfolio-entry-page .pa-action .btn{width:100%}.portfolio-entry-page .pa-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:767px){.portfolio-entry-page .pa-hero{display:block;padding:14px}.portfolio-entry-page .pa-week{display:inline-block;margin-top:10px}.portfolio-entry-page .pa-filter-grid,.portfolio-entry-page .pa-summary{grid-template-columns:1fr}.portfolio-entry-page .pa-action{grid-column:auto}.portfolio-entry-page .pa-filter-card,.portfolio-entry-page .pa-sheet-card{padding:13px}.portfolio-entry-page .pa-sheet-head,.portfolio-entry-page .pa-save-row{align-items:stretch;flex-direction:column}.portfolio-entry-page .pa-mode-actions{display:grid;grid-template-columns:1fr 1fr}.portfolio-entry-page .pa-save-row .btn{width:100%}.portfolio-entry-page .pa-title{font-size:22px}}
@media print{.portfolio-entry-page .pa-hero,.portfolio-entry-page .pa-filter-card,.portfolio-entry-page .pa-summary,.portfolio-entry-page .pa-mode-actions,.portfolio-entry-page .pa-save-row{display:none!important}.portfolio-entry-page .pa-sheet-card{padding:0!important;border:0!important;box-shadow:none!important}.portfolio-entry-page .pa-table-wrap{overflow:visible;border:0}.portfolio-entry-page .pa-table{min-width:0;font-size:10px}}
</style>

<div class="portfolio-entry-page">
    <div class="pa-hero">
        <div class="pa-hero-copy">
            <div class="pa-icon"><i class="fa fa-clipboard-check"></i></div>
            <div>
                <h1 class="pa-title"><?php echo get_phrase('portfolio_assessment_marks'); ?></h1>
                <p class="pa-subtitle">Enter strand scores for the selected school week. Past days are locked and future days remain unavailable until their date.</p>
            </div>
        </div>
        <div class="pa-week"><i class="fa fa-calendar-week"></i> <?php echo htmlspecialchars($week); ?></div>
    </div>

    <div class="pa-filter-card">
        <?php echo form_open(site_url('admin/portfolio_assessment_selector'), array('id' => 'subject_loder_form')); ?>
        <div class="pa-filter-grid">
            <div class="pa-field">
                <label for="portfolio_exam_id"><?php echo get_phrase('exam'); ?></label>
                <select name="exam_id" id="portfolio_exam_id" class="form-control selectboxit" required>
                    <?php foreach($portfolio_exams as $row): ?>
                        <option value="<?php echo (int)$row['exam_id']; ?>" <?php echo $exam_id == $row['exam_id'] ? 'selected' : ''; ?>><?php echo htmlspecialchars($row['name']); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="pa-field">
                <label for="portfolio_class_id"><?php echo get_phrase('class'); ?></label>
                <select name="class_id" id="portfolio_class_id" class="form-control selectboxit" onchange="get_class_subject(this.value)" required>
                    <option value=""><?php echo get_phrase('select_class'); ?></option>
                    <?php if($account_type == 'teacher'): ?>
                        <?php
                        $seen_classes = array();
                        foreach($teacher_class_groups as $class_access):
                            $cid = isset($class_access['class_id']) ? $class_access['class_id'] : '';
                            if($cid === '' || isset($seen_classes[$cid])) continue;
                            $seen_classes[$cid] = true;
                            $option_class = $this->db->get_where('class', array('class_id' => $cid))->row();
                            if(!$option_class) continue;
                            $option_section = $this->db->get_where('section', array('class_id' => $cid))->row();
                            $same_class_count = $this->db->get_where('class', array('name' => $option_class->name, 'name_numeric' => $option_class->name_numeric))->num_rows();
                            $section_suffix = ($same_class_count > 1 && $option_section) ? ' '.$option_section->name : '';
                        ?>
                            <option value="<?php echo (int)$cid; ?>" <?php echo $class_id == $cid ? 'selected' : ''; ?>><?php echo htmlspecialchars(trim($option_class->name.' '.$option_class->name_numeric.$section_suffix)); ?></option>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <?php getFullClassList('', $class_id); ?>
                    <?php endif; ?>
                </select>
            </div>

            <div class="pa-field">
                <label for="week"><?php echo get_phrase('week'); ?></label>
                <input type="week" class="form-control" name="week" id="week" value="<?php echo htmlspecialchars($week); ?>" required>
            </div>

            <input type="hidden" name="section_id" id="section_id" value="<?php echo htmlspecialchars($section_id); ?>">
            <div id="subject_holder">
                <div class="pa-field">
                    <label for="subject_id"><?php echo get_phrase('subject'); ?></label>
                    <select name="subject_id" id="subject_id" class="form-control selectboxit" required>
                        <?php foreach($subjects as $row): ?>
                            <option value="<?php echo (int)$row['subject_id']; ?>" <?php echo $subject_id == $row['subject_id'] ? 'selected' : ''; ?>><?php echo htmlspecialchars($row['name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="pa-action">
                    <button type="submit" class="btn btn-primary" id="btn_marks"><i class="fa fa-sync-alt"></i> <?php echo get_phrase('load_assessment'); ?></button>
                </div>
            </div>
        </div>
        <?php echo form_close(); ?>
    </div>

    <div class="pa-summary">
        <div class="pa-summary-item"><div class="pa-summary-label"><?php echo get_phrase('exam'); ?></div><div class="pa-summary-value" title="<?php echo htmlspecialchars($exam_label); ?>"><?php echo htmlspecialchars($exam_label); ?></div></div>
        <div class="pa-summary-item"><div class="pa-summary-label"><?php echo get_phrase('class'); ?></div><div class="pa-summary-value" title="<?php echo htmlspecialchars($class_label); ?>"><?php echo htmlspecialchars($class_label); ?></div></div>
        <div class="pa-summary-item"><div class="pa-summary-label"><?php echo get_phrase('subject'); ?></div><div class="pa-summary-value" title="<?php echo htmlspecialchars($subject_label); ?>"><?php echo htmlspecialchars($subject_label); ?></div></div>
        <div class="pa-summary-item"><div class="pa-summary-label"><?php echo get_phrase('academic_period'); ?></div><div class="pa-summary-value"><?php echo htmlspecialchars($period_label.' · '.$running_year); ?></div></div>
    </div>

    <div class="pa-sheet-card">
        <div class="pa-sheet-head">
            <div><h3><?php echo get_phrase('weekly_score_sheet'); ?></h3><p><?php echo count($student_ids); ?> student(s) · Monday to Friday</p></div>
            <div class="pa-mode-actions">
                <button type="button" class="btn btn-primary preview_mode" id="view_toggle"><i class="fa fa-eye"></i> <?php echo get_phrase('preview'); ?></button>
                <button type="button" class="btn btn-default" onclick="window.location.href='<?php echo site_url('admin/portfolio_assessment_manage'); ?>'"><i class="fa fa-sliders-h"></i> <?php echo get_phrase('change_selection'); ?></button>
            </div>
        </div>

        <div id="edit_holder">
            <?php echo form_open(site_url('admin/portfolio_assessment_update/'), array('id' => 'portfolio_update_form')); ?>
            <input type="hidden" name="exam_id" value="<?php echo htmlspecialchars($exam_id); ?>">
            <input type="hidden" name="class_id" value="<?php echo htmlspecialchars($class_id); ?>">
            <input type="hidden" name="section_id" value="<?php echo htmlspecialchars($section_id); ?>">
            <input type="hidden" name="subject_id" value="<?php echo htmlspecialchars($subject_id); ?>">
            <input type="hidden" name="week" value="<?php echo htmlspecialchars($week); ?>">

            <?php if(empty($student_ids)): ?>
                <div class="alert alert-warning pa-warning"><i class="fa fa-exclamation-triangle"></i> No portfolio rows are available for this selection. Reload the selection so enrolled students can be initialized.</div>
            <?php endif; ?>

            <div class="pa-table-wrap">
                <table class="table table-bordered pa-table" id="mark_sheet">
                    <thead>
                        <tr>
                            <th style="width:100px"><?php echo get_phrase('ID'); ?></th>
                            <th class="pa-student" style="min-width:220px"><?php echo get_phrase('student'); ?></th>
                            <?php foreach($dates_array as $date_timestamp):
                                $is_today = $date_timestamp == $today_timestamp;
                                $is_future = $date_timestamp > $today_timestamp;
                                $is_past = $date_timestamp < $today_timestamp;
                                $code_value = isset($day_codes[$date_timestamp]) ? $day_codes[$date_timestamp] : '';
                            ?>
                                <th style="min-width:125px">
                                    <div class="pa-day-name"><?php echo date('D', $date_timestamp); ?></div>
                                    <div class="pa-day-date"><?php echo date('d M Y', $date_timestamp); ?></div>
                                    <input type="text" class="form-control pa-code-input <?php echo $is_today ? 'pa-today' : ($is_future ? 'pa-future' : ''); ?>" name="code_<?php echo $date_timestamp; ?>" value="<?php echo htmlspecialchars($code_value); ?>" maxlength="20" <?php echo $is_today ? 'required' : ''; ?> <?php echo $is_future ? 'disabled' : ''; ?> <?php echo $is_past ? 'readonly' : ''; ?> aria-label="<?php echo date('l', $date_timestamp); ?> code">
                                </th>
                            <?php endforeach; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($student_ids as $sid):
                            $student = isset($student_map[$sid]) ? $student_map[$sid] : array('name' => 'Student #'.$sid, 'student_code' => '—');
                        ?>
                            <tr>
                                <td><span class="pa-student-code"><?php echo htmlspecialchars(isset($student['student_code']) ? $student['student_code'] : '—'); ?></span></td>
                                <td class="pa-student"><span class="pa-student-name"><?php echo htmlspecialchars(isset($student['name']) ? $student['name'] : 'Student #'.$sid); ?></span></td>
                                <?php foreach($dates_array as $date_timestamp):
                                    $cell = isset($assessment_map[$sid][$date_timestamp]) ? $assessment_map[$sid][$date_timestamp] : null;
                                    $assessment_id_value = $cell ? $cell['assessment_id'] : '';
                                    $score_value = $cell ? $cell['strand_score'] : '';
                                    $is_today = $date_timestamp == $today_timestamp;
                                    $is_future = $date_timestamp > $today_timestamp;
                                    $is_past = $date_timestamp < $today_timestamp;
                                    if($assessment_id_value !== '') $assessment_ids[] = $assessment_id_value;
                                    else $missing_assessment_cells++;
                                ?>
                                    <td style="text-align:center">
                                        <input type="number" step="0.01" min="0" max="100" class="form-control pa-score <?php echo $is_today ? 'pa-today' : ($is_future ? 'pa-future' : ''); ?>" <?php if($assessment_id_value !== ''): ?>name="strand_<?php echo (int)$assessment_id_value; ?>"<?php endif; ?> value="<?php echo htmlspecialchars($score_value); ?>" <?php echo ($is_future || $assessment_id_value === '') ? 'disabled' : ''; ?> <?php echo $is_past ? 'readonly' : ''; ?> aria-label="<?php echo htmlspecialchars((isset($student['name']) ? $student['name'] : 'Student').' '.date('l', $date_timestamp)); ?> score">
                                    </td>
                                <?php endforeach; ?>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <?php if($missing_assessment_cells > 0): ?>
                <div class="alert alert-danger pa-warning" style="margin-top:12px"><strong><?php echo $missing_assessment_cells; ?></strong> assessment cell(s) are missing database rows. Change the selection and load it again before saving.</div>
            <?php endif; ?>

            <div class="pa-save-row">
                <div class="pa-save-note"><i class="fa fa-lock"></i> Past scores remain visible but read-only. Today's column is editable.</div>
                <button type="submit" class="btn btn-success" id="submit_button" <?php echo (empty($student_ids) || $missing_assessment_cells > 0) ? 'disabled' : ''; ?>><i class="fa fa-check"></i> <?php echo get_phrase('save_changes'); ?></button>
            </div>
            <?php echo form_close(); ?>
        </div>

        <div id="preview_holder">
            <div id="print_preview">
                <div class="pa-preview-header"><?php echo htmlspecialchars($class_label.' · '.$period_label.' · '.$running_year); ?></div>
                <div class="pa-table-wrap">
                    <table class="table table-bordered pa-table" id="mark_sheet_preview">
                        <thead>
                            <tr>
                                <th rowspan="2" class="pa-student" style="min-width:210px"><?php echo get_phrase('student'); ?></th>
                                <?php foreach($dates_array as $date_timestamp): ?>
                                    <th colspan="<?php echo max(1, count($preview_subjects)); ?>"><div class="pa-day-name"><?php echo date('D', $date_timestamp); ?></div><div class="pa-day-date"><?php echo date('d M', $date_timestamp); ?></div></th>
                                <?php endforeach; ?>
                            </tr>
                            <tr>
                                <?php foreach($dates_array as $date_timestamp): ?>
                                    <?php if(empty($preview_subjects)): ?><th>—</th><?php endif; ?>
                                    <?php foreach($preview_subjects as $preview_subject):
                                        $preview_code = isset($preview_codes[$date_timestamp][$preview_subject['subject_id']]) ? $preview_codes[$date_timestamp][$preview_subject['subject_id']] : '';
                                    ?>
                                        <th title="<?php echo htmlspecialchars($preview_subject['name']); ?>"><?php echo htmlspecialchars(substr($preview_subject['name'], 0, 7)); ?><br><small><?php echo htmlspecialchars($preview_code); ?></small></th>
                                    <?php endforeach; ?>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach($student_ids as $sid):
                                $student = isset($student_map[$sid]) ? $student_map[$sid] : array('name' => 'Student #'.$sid);
                            ?>
                                <tr>
                                    <td class="pa-student"><span class="pa-student-name"><?php echo htmlspecialchars(isset($student['name']) ? $student['name'] : 'Student #'.$sid); ?></span></td>
                                    <?php foreach($dates_array as $date_timestamp): ?>
                                        <?php if(empty($preview_subjects)): ?><td>—</td><?php endif; ?>
                                        <?php foreach($preview_subjects as $preview_subject):
                                            $preview_cell = isset($preview_map[$sid][$date_timestamp][$preview_subject['subject_id']]) ? $preview_map[$sid][$date_timestamp][$preview_subject['subject_id']] : null;
                                            $preview_score = $preview_cell ? $preview_cell['strand_score'] : '';
                                            $grade_point = '—';
                                            if($preview_score !== '' && $preview_score !== null) {
                                                $grade = $this->crud_model->get_grade($preview_score);
                                                $grade_point = isset($grade['grade_point']) ? $grade['grade_point'] : '—';
                                            }
                                        ?>
                                            <td class="pa-preview-grade"><?php echo htmlspecialchars($grade_point); ?></td>
                                        <?php endforeach; ?>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="pa-save-row">
                <div class="pa-save-note">Preview displays grade points across all subjects available for the class.</div>
                <button type="button" class="btn btn-primary" onclick="PrintElem('#print_preview')"><i class="fa fa-print"></i> <?php echo get_phrase('print'); ?></button>
            </div>
        </div>
    </div>
</div>

<script>
$(function(){
    if ($.fn.dataTable) {
        $('#mark_sheet').dataTable({
            bPaginate: false,
            bLengthChange: false,
            bFilter: true,
            bInfo: true,
            bSort: false
        });
    }
});

$('#view_toggle').on('click', function(){
    var $button = $(this);
    if ($button.hasClass('preview_mode')) {
        $('#edit_holder').hide();
        $('#preview_holder').show();
        $button.removeClass('preview_mode btn-primary').addClass('edit_mode btn-success').html('<i class="fa fa-pencil-alt"></i> <?php echo addslashes(get_phrase('edit')); ?>');
    } else {
        $('#preview_holder').hide();
        $('#edit_holder').show();
        $button.removeClass('edit_mode btn-success').addClass('preview_mode btn-primary').html('<i class="fa fa-eye"></i> <?php echo addslashes(get_phrase('preview')); ?>');
    }
});

function get_class_subject(class_id) {
    if (!class_id) return;
    $('#btn_marks').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Loading');
    $.ajax({
        url: '<?php echo site_url('admin/marks_get_subject/'); ?>' + class_id + '/portfolio',
        success: function(response){ $('#subject_holder').html(response); },
        error: function(){ showAjaxModal_alert('Unable to load subjects for this class.', 'Error'); }
    });
}

$('#portfolio_update_form').on('submit', function(e){
    e.preventDefault();
    var dates = '<?php echo implode('-', array_map('intval', $dates_array)); ?>';
    var studentIds = '<?php echo implode('-', array_map('intval', $student_ids)); ?>';
    var assessmentIds = '<?php echo implode('-', array_map('intval', $assessment_ids)); ?>';
    if (!studentIds || !assessmentIds) {
        showAjaxModal_alert('No complete assessment rows are available to save.', 'Error');
        return;
    }
    var $button = $('#submit_button');
    $button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Saving');
    $.ajax({
        url: '<?php echo site_url('admin/portfolio_assessment_update/'); ?>' + dates + '/' + studentIds + '/' + assessmentIds,
        type: 'POST',
        dataType: 'json',
        data: $(this).serialize()
    }).done(function(response){
        if (response && response.success == 1) {
            showAjaxModal_alert((response.message || 'Portfolio Assessment Updated Successfully.'), 'Success');
            setTimeout(function(){ window.location.reload(); }, 500);
        } else {
            showAjaxModal_alert((response && response.message) ? response.message : 'Update failed. Please verify the class and exam selection and try again.', 'Error');
            $button.prop('disabled', false).html('<i class="fa fa-check"></i> <?php echo addslashes(get_phrase('save_changes')); ?>');
        }
    }).fail(function(xhr){
        showAjaxModal_alert('Error: ' + (xhr.responseText || 'Unable to save assessment.'), 'Error');
        $button.prop('disabled', false).html('<i class="fa fa-check"></i> <?php echo addslashes(get_phrase('save_changes')); ?>');
    });
});

function PrintElem(selector) {
    var content = $(selector).html();
    var mywindow = window.open('', '', 'width=1200,height=800');
    mywindow.document.write('<!doctype html><html><head><title>Portfolio Assessment</title>');
    mywindow.document.write('<link rel="stylesheet" href="<?php echo base_url('assets/css/bootstrap.css'); ?>">');
    mywindow.document.write('<style>body{font-family:Arial,sans-serif;font-size:11px;padding:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:5px;text-align:center}th{background:#f8fafc}.pa-student{text-align:left!important}.pa-table-wrap{overflow:visible}</style>');
    mywindow.document.write('</head><body>' + content + '</body></html>');
    mywindow.document.close();
    mywindow.onload = function(){ mywindow.focus(); mywindow.print(); mywindow.close(); };
}
</script>
