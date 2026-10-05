<?php
$teacher_id = $this->session->userdata('login_user_id');
$this->db->order_by('question_paper_id', 'desc');
$question_papers = $this->db->get_where('question_paper', array('teacher_id' => $teacher_id))->result_array();
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
?>

<style>
.teacher-qpaper-page { --tq-border:#e5e7eb; --tq-text:#172033; --tq-muted:#667085; }
.teacher-qpaper-page .tq-hero,
.teacher-qpaper-page .tq-stat,
.teacher-qpaper-page .tq-card {
    background:#fff;
    border:1px solid var(--tq-border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
}
.teacher-qpaper-page .tq-hero { padding:24px; margin-bottom:16px; }
.teacher-qpaper-page .tq-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.teacher-qpaper-page .tq-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.teacher-qpaper-page .tq-icon {
    width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center;
    border-radius:14px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; font-size:22px;
}
.teacher-qpaper-page .tq-title { margin:0; color:var(--tq-text); font-size:26px; line-height:1.2; font-weight:700; }
.teacher-qpaper-page .tq-subtitle { margin:6px 0 0; color:var(--tq-muted); font-size:15px; line-height:1.5; }
.teacher-qpaper-page .tq-hero-actions { display:flex; align-items:center; gap:10px; }
.teacher-qpaper-page .tq-stat { min-width:112px; padding:10px 14px; text-align:center; }
.teacher-qpaper-page .tq-stat strong { display:block; color:var(--tq-text); font-size:23px; line-height:1; }
.teacher-qpaper-page .tq-stat span { display:block; margin-top:4px; color:var(--tq-muted); font-size:12px; font-weight:700; }
.teacher-qpaper-page .tq-add {
    min-height:42px; padding:9px 15px; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    border:1px solid #2563eb; border-radius:10px; background:#2563eb; color:#fff; font-size:14px; font-weight:700;
}
.teacher-qpaper-page .tq-add:hover, .teacher-qpaper-page .tq-add:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
.teacher-qpaper-page .tq-card { padding:18px; }
.teacher-qpaper-page .tq-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.teacher-qpaper-page #table_export { width:100% !important; min-width:860px; margin-bottom:0; }
.teacher-qpaper-page #table_export thead th { background:#f8fafc; color:#475467; border-color:var(--tq-border); padding:12px 10px; font-size:13px; font-weight:700; vertical-align:middle; }
.teacher-qpaper-page #table_export tbody td { padding:11px 10px; border-color:var(--tq-border); color:#344054; font-size:14px; vertical-align:middle; }
.teacher-qpaper-page #table_export tbody tr:hover { background:#f9fbfd; }
.teacher-qpaper-page .tq-paper-title { color:var(--tq-text); font-weight:700; }
.teacher-qpaper-page .tq-actions { display:flex; align-items:center; gap:7px; }
.teacher-qpaper-page .tq-action {
    width:38px; height:38px; display:inline-flex; align-items:center; justify-content:center; border-radius:9px;
    border:1px solid #d0d5dd; background:#fff; color:#475467; text-decoration:none; cursor:pointer;
}
.teacher-qpaper-page .tq-action:hover, .teacher-qpaper-page .tq-action:focus { background:#f8fafc; color:#172033; text-decoration:none; }
.teacher-qpaper-page .tq-action.is-edit { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
.teacher-qpaper-page .tq-action.is-view { background:#f0fdf4; border-color:#bbf7d0; color:#15803d; }
.teacher-qpaper-page .tq-action.is-delete { background:#fef2f2; border-color:#fecaca; color:#b42318; }
.teacher-qpaper-page .dataTables_wrapper .dataTables_length,
.teacher-qpaper-page .dataTables_wrapper .dataTables_filter { margin-bottom:14px; color:#475467; font-size:14px; }
.teacher-qpaper-page .dataTables_wrapper .dataTables_filter input,
.teacher-qpaper-page .dataTables_wrapper .dataTables_length select { min-height:40px; border:1.5px solid #d0d5dd; border-radius:10px; padding:7px 10px; background:#fff; color:#172033; outline:none; }
.teacher-qpaper-page .dataTables_wrapper .dataTables_filter input:focus,
.teacher-qpaper-page .dataTables_wrapper .dataTables_length select:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
@media (max-width:767px) {
    .teacher-qpaper-page .tq-hero { padding:18px; }
    .teacher-qpaper-page .tq-hero-row { flex-direction:column; align-items:flex-start; }
    .teacher-qpaper-page .tq-hero-actions { width:100%; flex-direction:column; align-items:stretch; }
    .teacher-qpaper-page .tq-stat { width:100%; text-align:left; }
    .teacher-qpaper-page .tq-add { width:100%; }
    .teacher-qpaper-page .tq-title { font-size:22px; }
    .teacher-qpaper-page .tq-card { padding:12px; }
}
</style>

<div class="teacher-qpaper-page">
    <section class="tq-hero" aria-labelledby="teacherQuestionPaperTitle">
        <div class="tq-hero-row">
            <div class="tq-title-wrap">
                <div class="tq-icon"><i class="fa fa-file-alt"></i></div>
                <div>
                    <h2 class="tq-title" id="teacherQuestionPaperTitle"><?php echo get_phrase('question_paper'); ?></h2>
                    <p class="tq-subtitle">Create, update and review your examination question papers.</p>
                </div>
            </div>
            <div class="tq-hero-actions">
                <div class="tq-stat"><strong><?php echo (int) $total_question_papers; ?></strong><span><?php echo get_phrase('your_papers'); ?></span></div>
                <button type="button" onclick="showAjaxModal('<?php echo site_url('modal/popup/question_paper_add'); ?>');" class="tq-add"><i class="entypo-plus"></i><?php echo get_phrase('add_question_paper'); ?></button>
            </div>
        </div>
    </section>

    <section class="tq-card" aria-label="My question papers">
        <div class="tq-table-wrap">
            <table class="table table-bordered table-hover" id="table_export">
                <thead>
                    <tr>
                        <th style="width:60px;">#</th>
                        <th><?php echo get_phrase('title'); ?></th>
                        <th><?php echo get_phrase('class'); ?></th>
                        <th><?php echo get_phrase('exam'); ?></th>
                        <th style="width:150px;"><?php echo get_phrase('options'); ?></th>
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
                    ?>
                        <tr>
                            <td><?php echo $count++; ?></td>
                            <td><span class="tq-paper-title"><?php echo htmlspecialchars($row['title'], ENT_QUOTES, 'UTF-8'); ?></span></td>
                            <td><?php echo htmlspecialchars($class_label, ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><?php echo htmlspecialchars($exam_name, ENT_QUOTES, 'UTF-8'); ?></td>
                            <td>
                                <div class="tq-actions">
                                    <a href="#" class="tq-action is-edit" title="<?php echo get_phrase('edit'); ?>" onclick="showAjaxModal('<?php echo site_url('modal/popup/question_paper_edit/' . (int) $row['question_paper_id']); ?>'); return false;"><i class="entypo-pencil"></i></a>
                                    <a href="#" class="tq-action is-view" title="<?php echo get_phrase('view_question_paper'); ?>" onclick="showAjaxModal('<?php echo site_url('modal/popup/question_paper_view/' . (int) $row['question_paper_id']); ?>'); return false;"><i class="entypo-eye"></i></a>
                                    <a href="#" class="tq-action is-delete" title="<?php echo get_phrase('delete'); ?>" onclick="confirm_modal('<?php echo site_url('teacher/question_paper/delete/' . (int) $row['question_paper_id']); ?>'); return false;"><i class="entypo-trash"></i></a>
                                </div>
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
        $('#table_export').DataTable({ pageLength:25, autoWidth:false, order:[[0,'asc']] });
    }
});
</script>
