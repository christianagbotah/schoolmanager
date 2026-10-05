<?php
$this->db->order_by('question_paper_id', 'desc');
$question_papers = $this->db->get('question_paper')->result_array();
$total_question_papers = count($question_papers);

$class_rows = $this->db->get('class')->result_array();
$classes_by_id = array();
$class_variant_counts = array();
foreach ($class_rows as $class_row) {
    $classes_by_id[$class_row['class_id']] = $class_row;
    $variant_key = $class_row['name'] . '|' . $class_row['name_numeric'];
    $class_variant_counts[$variant_key] = isset($class_variant_counts[$variant_key]) ? $class_variant_counts[$variant_key] + 1 : 1;
}

$section_rows = $this->db->get('section')->result_array();
$sections_by_class = array();
foreach ($section_rows as $section_row) {
    if (!isset($sections_by_class[$section_row['class_id']])) {
        $sections_by_class[$section_row['class_id']] = $section_row['name'];
    }
}

$exam_rows = $this->db->get('exam')->result_array();
$exams_by_id = array();
foreach ($exam_rows as $exam_row) $exams_by_id[$exam_row['exam_id']] = $exam_row['name'];

$teacher_rows = $this->db->get('teacher')->result_array();
$teachers_by_id = array();
foreach ($teacher_rows as $teacher_row) $teachers_by_id[$teacher_row['teacher_id']] = $teacher_row['name'];
?>

<style>
.question-paper-page { --qp-border:#e5e7eb; --qp-text:#172033; --qp-muted:#667085; }
.question-paper-page .qp-hero,
.question-paper-page .qp-stat,
.question-paper-page .qp-card {
    background:#fff;
    border:1px solid var(--qp-border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
}
.question-paper-page .qp-hero { padding:24px; margin-bottom:16px; }
.question-paper-page .qp-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.question-paper-page .qp-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.question-paper-page .qp-icon {
    width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center;
    border-radius:14px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; font-size:22px;
}
.question-paper-page .qp-title { margin:0; color:var(--qp-text); font-size:26px; line-height:1.2; font-weight:700; }
.question-paper-page .qp-subtitle { margin:6px 0 0; color:var(--qp-muted); font-size:15px; line-height:1.5; }
.question-paper-page .qp-stat { min-width:145px; padding:12px 16px; text-align:right; }
.question-paper-page .qp-stat strong { display:block; color:var(--qp-text); font-size:26px; line-height:1; }
.question-paper-page .qp-stat span { display:block; margin-top:5px; color:var(--qp-muted); font-size:13px; font-weight:700; }
.question-paper-page .qp-card { padding:18px; }
.question-paper-page .qp-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.question-paper-page #table_export { width:100% !important; min-width:900px; margin-bottom:0; }
.question-paper-page #table_export thead th {
    background:#f8fafc; color:#475467; border-color:var(--qp-border); padding:12px 10px; font-size:13px; font-weight:700; vertical-align:middle;
}
.question-paper-page #table_export tbody td { padding:11px 10px; border-color:var(--qp-border); color:#344054; font-size:14px; vertical-align:middle; }
.question-paper-page #table_export tbody tr:hover { background:#f9fbfd; }
.question-paper-page .qp-title-cell { color:var(--qp-text); font-weight:700; }
.question-paper-page .qp-view {
    min-height:38px; padding:8px 12px; display:inline-flex; align-items:center; justify-content:center; gap:7px;
    border:1px solid #bfdbfe; border-radius:9px; background:#eff6ff; color:#1d4ed8; font-size:13px; font-weight:700; text-decoration:none;
}
.question-paper-page .qp-view:hover, .question-paper-page .qp-view:focus { background:#dbeafe; color:#1e40af; text-decoration:none; }
.question-paper-page .dataTables_wrapper .dataTables_length,
.question-paper-page .dataTables_wrapper .dataTables_filter { margin-bottom:14px; color:#475467; font-size:14px; }
.question-paper-page .dataTables_wrapper .dataTables_filter input,
.question-paper-page .dataTables_wrapper .dataTables_length select {
    min-height:40px; border:1.5px solid #d0d5dd; border-radius:10px; padding:7px 10px; background:#fff; color:#172033; outline:none;
}
.question-paper-page .dataTables_wrapper .dataTables_filter input:focus,
.question-paper-page .dataTables_wrapper .dataTables_length select:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
.question-paper-page .dataTables_wrapper .dataTables_info,
.question-paper-page .dataTables_wrapper .dataTables_paginate { margin-top:14px; color:#667085; font-size:14px; }
@media (max-width:767px) {
    .question-paper-page .qp-hero { padding:18px; }
    .question-paper-page .qp-hero-row { flex-direction:column; align-items:flex-start; }
    .question-paper-page .qp-stat { width:100%; text-align:left; }
    .question-paper-page .qp-title { font-size:22px; }
    .question-paper-page .qp-card { padding:12px; }
    .question-paper-page .dataTables_wrapper .dataTables_filter,
    .question-paper-page .dataTables_wrapper .dataTables_length { float:none; width:100%; text-align:left; }
    .question-paper-page .dataTables_wrapper .dataTables_filter input { width:100%; margin:6px 0 0; }
}
</style>

<div class="question-paper-page">
    <section class="qp-hero" aria-labelledby="questionPaperTitle">
        <div class="qp-hero-row">
            <div class="qp-title-wrap">
                <div class="qp-icon" aria-hidden="true"><i class="fa fa-file-alt"></i></div>
                <div>
                    <h2 class="qp-title" id="questionPaperTitle"><?php echo get_phrase('question_paper'); ?></h2>
                    <p class="qp-subtitle">Review question papers submitted by teachers across classes and examinations.</p>
                </div>
            </div>
            <div class="qp-stat"><strong><?php echo (int) $total_question_papers; ?></strong><span><?php echo get_phrase('question_papers'); ?></span></div>
        </div>
    </section>

    <section class="qp-card" aria-label="Question paper register">
        <div class="qp-table-wrap">
            <table class="table table-bordered table-hover" id="table_export">
                <thead>
                    <tr>
                        <th style="width:60px;">#</th>
                        <th><?php echo get_phrase('title'); ?></th>
                        <th><?php echo get_phrase('class'); ?></th>
                        <th><?php echo get_phrase('exam'); ?></th>
                        <th><?php echo get_phrase('teacher'); ?></th>
                        <th style="width:170px;"><?php echo get_phrase('options'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php $count = 1; foreach ($question_papers as $row):
                        $class = isset($classes_by_id[$row['class_id']]) ? $classes_by_id[$row['class_id']] : null;
                        $class_label = get_phrase('not_available');
                        if ($class) {
                            $variant_key = $class['name'] . '|' . $class['name_numeric'];
                            $section_name = isset($sections_by_class[$row['class_id']]) ? $sections_by_class[$row['class_id']] : '';
                            $sec_name = isset($class_variant_counts[$variant_key]) && $class_variant_counts[$variant_key] > 1 ? $section_name : '';
                            $class_label = trim($class['name'] . ' ' . $class['name_numeric'] . $sec_name);
                        }
                        $exam_name = isset($exams_by_id[$row['exam_id']]) ? $exams_by_id[$row['exam_id']] : get_phrase('not_available');
                        $teacher_name = isset($teachers_by_id[$row['teacher_id']]) ? $teachers_by_id[$row['teacher_id']] : get_phrase('not_available');
                    ?>
                        <tr>
                            <td><?php echo $count++; ?></td>
                            <td><span class="qp-title-cell"><?php echo htmlspecialchars($row['title'], ENT_QUOTES, 'UTF-8'); ?></span></td>
                            <td><?php echo htmlspecialchars($class_label, ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><?php echo htmlspecialchars($exam_name, ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><?php echo htmlspecialchars($teacher_name, ENT_QUOTES, 'UTF-8'); ?></td>
                            <td>
                                <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/question_paper_view/' . (int) $row['question_paper_id']); ?>'); return false;" class="qp-view">
                                    <i class="entypo-eye"></i><?php echo get_phrase('view_question_paper'); ?>
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>
</div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    if ($.fn.DataTable && !$.fn.DataTable.isDataTable('#table_export')) {
        $('#table_export').DataTable({
            pageLength: 25,
            autoWidth: false,
            order: [[0, 'asc']]
        });
    }
});
</script>
