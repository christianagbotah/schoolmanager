<?php
$paper = $this->db->get_where('question_paper', array('question_paper_id' => $param2))->row_array();
$running_year_row = $this->db->get_where('settings', array('type' => 'running_year'))->row();
$running_term_row = $this->db->get_where('settings', array('type' => 'running_term'))->row();
$running_year = $running_year_row ? $running_year_row->description : '';
$running_term = $running_term_row ? $running_term_row->description : '';
$teacher_id = $this->session->userdata('teacher_id');

$eligible_class_ids = array();
$this->db->select('class_id')->distinct();
foreach ($this->db->get_where('subject_creche', array('teacher_id' => $teacher_id, 'year' => $running_year, 'term' => $running_term))->result_array() as $assignment) {
    $eligible_class_ids[(int) $assignment['class_id']] = true;
}
$this->db->select('class_id')->distinct();
foreach ($this->db->get_where('subject', array('teacher_id' => $teacher_id, 'year' => $running_year, 'term' => $running_term))->result_array() as $assignment) {
    $eligible_class_ids[(int) $assignment['class_id']] = true;
}

$eligible_classes = array();
foreach (array_keys($eligible_class_ids) as $eligible_class_id) {
    $class_row = $this->db->get_where('class', array('class_id' => $eligible_class_id))->row_array();
    if (!$class_row) continue;
    $section_row = $this->db->get_where('section', array('class_id' => $eligible_class_id))->row_array();
    $variant_count = $this->db->get_where('class', array('name' => $class_row['name'], 'name_numeric' => $class_row['name_numeric']))->num_rows();
    $section_name = ($variant_count > 1 && $section_row) ? $section_row['name'] : '';
    $class_row['display_name'] = trim($class_row['name'] . ' ' . $class_row['name_numeric'] . $section_name);
    $eligible_classes[] = $class_row;
}
usort($eligible_classes, function($a, $b) { return strcasecmp($a['display_name'], $b['display_name']); });
$exams = $this->db->order_by('exam_id', 'desc')->get('exam')->result_array();
?>

<style>
.qp-form { --qpf-border:#e5e7eb; --qpf-text:#172033; --qpf-muted:#667085; }
.qp-form .qpf-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:18px 20px; border-bottom:1px solid var(--qpf-border); background:#fff; }
.qp-form .qpf-heading { display:flex; align-items:center; gap:12px; min-width:0; padding-right:28px; }
.qp-form .qpf-icon { width:42px; height:42px; flex:0 0 42px; display:flex; align-items:center; justify-content:center; border-radius:11px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; }
.qp-form .qpf-title { margin:0; color:var(--qpf-text); font-size:20px; font-weight:700; }
.qp-form .qpf-subtitle { margin:4px 0 0; color:var(--qpf-muted); font-size:13px; line-height:1.45; }
.qp-form .qpf-body { padding:20px; background:#f8fafc; }
.qp-form .qpf-card { padding:20px; border:1px solid var(--qpf-border); border-radius:14px; background:#fff; }
.qp-form .qpf-grid { display:grid; grid-template-columns:minmax(0,1.4fr) minmax(180px,.8fr); gap:14px; }
.qp-form .qpf-field { margin-bottom:16px; }
.qp-form .qpf-field:last-child { margin-bottom:0; }
.qp-form .qpf-label { display:block; margin:0 0 7px; color:#344054; font-size:14px; font-weight:700; }
.qp-form .qpf-required { color:#b42318; }
.qp-form .qpf-control { width:100%; min-height:44px; border:1.5px solid #d0d5dd; border-radius:10px; background:#fff; color:#172033; font-size:14px; padding:9px 12px; outline:none; }
.qp-form .qpf-control:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
.qp-form .qpf-help { display:block; margin-top:6px; color:var(--qpf-muted); font-size:12px; line-height:1.45; }
.qp-form .qpf-editor-wrap { border:1.5px solid #d0d5dd; border-radius:10px; background:#fff; overflow:hidden; }
.qp-form .qpf-editor-wrap textarea { min-height:260px; border:0 !important; border-radius:0 !important; box-shadow:none !important; }
.qp-form .qpf-empty { padding:12px 14px; border:1px solid #fed7aa; border-radius:10px; background:#fff7ed; color:#9a3412; font-size:13px; line-height:1.45; }
.qp-form .qpf-footer { display:flex; justify-content:flex-end; gap:10px; padding:15px 20px; border-top:1px solid var(--qpf-border); background:#fff; }
.qp-form .qpf-btn { min-height:40px; padding:8px 15px; border-radius:9px; font-size:14px; font-weight:700; }
.qp-form .qpf-cancel { border:1px solid #d0d5dd; background:#fff; color:#475467; }
.qp-form .qpf-save { border:1px solid #2563eb; background:#2563eb; color:#fff; }
.qp-form .qpf-save:hover, .qp-form .qpf-save:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
.qp-form .qpf-not-found { padding:36px 20px; text-align:center; color:#667085; }
@media (max-width:767px) {
    .qp-form .qpf-grid { grid-template-columns:1fr; gap:0; }
    .qp-form .qpf-body { padding:14px; }
    .qp-form .qpf-card { padding:16px; }
    .qp-form .qpf-footer { flex-direction:column-reverse; }
    .qp-form .qpf-btn { width:100%; }
}
</style>

<div class="qp-form">
    <?php if ($paper): ?>
        <?php echo form_open(site_url('teacher/question_paper/update/' . (int) $param2), array('id' => 'teacherQuestionPaperEditForm', 'enctype' => 'multipart/form-data')); ?>
            <div class="modal-header qpf-head">
                <div class="qpf-heading">
                    <div class="qpf-icon"><i class="entypo-pencil"></i></div>
                    <div>
                        <h4 class="qpf-title"><?php echo get_phrase('edit_question_paper'); ?></h4>
                        <p class="qpf-subtitle">Update the paper details while keeping the existing teacher ownership and submission workflow.</p>
                    </div>
                </div>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">&times;</button>
            </div>

            <div class="modal-body qpf-body">
                <div class="qpf-card">
                    <div class="qpf-field">
                        <label class="qpf-label" for="qp_edit_title"><?php echo get_phrase('title'); ?> <span class="qpf-required">*</span></label>
                        <input type="text" class="qpf-control" id="qp_edit_title" name="title" maxlength="160" required value="<?php echo htmlspecialchars($paper['title'], ENT_QUOTES, 'UTF-8'); ?>">
                    </div>

                    <div class="qpf-grid">
                        <div class="qpf-field">
                            <label class="qpf-label" for="qp_edit_class"><?php echo get_phrase('class'); ?> <span class="qpf-required">*</span></label>
                            <select name="class_id" id="qp_edit_class" class="qpf-control" required>
                                <option value=""><?php echo get_phrase('select_a_class'); ?></option>
                                <?php foreach ($eligible_classes as $class_row): ?>
                                    <option value="<?php echo (int) $class_row['class_id']; ?>" <?php echo ((int) $paper['class_id'] === (int) $class_row['class_id']) ? 'selected' : ''; ?>><?php echo htmlspecialchars($class_row['display_name'], ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                            <?php if (empty($eligible_classes)): ?>
                                <div class="qpf-empty">No class assignment is available for the current academic year and term.</div>
                            <?php endif; ?>
                        </div>

                        <div class="qpf-field">
                            <label class="qpf-label" for="qp_edit_exam"><?php echo get_phrase('exam'); ?> <span class="qpf-required">*</span></label>
                            <select name="exam_id" id="qp_edit_exam" class="qpf-control" required>
                                <option value=""><?php echo get_phrase('select_an_exam'); ?></option>
                                <?php foreach ($exams as $exam): ?>
                                    <option value="<?php echo (int) $exam['exam_id']; ?>" <?php echo ((int) $paper['exam_id'] === (int) $exam['exam_id']) ? 'selected' : ''; ?>><?php echo htmlspecialchars($exam['name'], ENT_QUOTES, 'UTF-8'); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="qpf-field">
                        <label class="qpf-label" for="qp_edit_body"><?php echo get_phrase('question_paper'); ?> <span class="qpf-required">*</span></label>
                        <div class="qpf-editor-wrap">
                            <textarea id="qp_edit_body" class="form-control wysihtml5" data-stylesheet-url="<?php echo base_url('assets/css/wysihtml5-color.css'); ?>" name="question_paper" required><?php echo htmlspecialchars($paper['question_paper'], ENT_QUOTES, 'UTF-8'); ?></textarea>
                        </div>
                        <small class="qpf-help">Formatting already stored with this paper remains editable in the rich-text editor.</small>
                    </div>
                </div>
            </div>

            <div class="modal-footer qpf-footer">
                <button type="button" class="btn qpf-btn qpf-cancel" data-dismiss="modal"><i class="entypo-cancel"></i> <?php echo get_phrase('cancel'); ?></button>
                <button type="submit" class="btn qpf-btn qpf-save" <?php echo empty($eligible_classes) ? 'disabled' : ''; ?>><i class="entypo-check"></i> <?php echo get_phrase('update'); ?></button>
            </div>
        <?php echo form_close(); ?>
    <?php else: ?>
        <div class="qpf-not-found">
            <i class="fa fa-file-alt" style="display:block;font-size:36px;color:#cbd5e1;margin-bottom:10px;"></i>
            <strong style="display:block;color:#172033;margin-bottom:5px;"><?php echo get_phrase('question_paper_not_found'); ?></strong>
            <?php echo get_phrase('no_record_found'); ?>
        </div>
    <?php endif; ?>
</div>

<script type="text/javascript">
(function($) {
    setTimeout(function() { $('#qp_edit_title').focus(); }, 150);
})(jQuery);
</script>
