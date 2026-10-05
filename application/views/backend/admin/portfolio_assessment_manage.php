<?php
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
?>
<style>
.portfolio-assessment-page{--pa-border:#e2e8f0;--pa-text:#0f172a;--pa-muted:#64748b;--pa-primary:#2563eb;--pa-soft:#eff6ff;color:#334155}
.portfolio-assessment-page .pa-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:16px;padding:18px 20px;border:1px solid var(--pa-border);border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.portfolio-assessment-page .pa-hero-copy{display:flex;align-items:center;gap:13px;min-width:0}.portfolio-assessment-page .pa-icon{width:44px;height:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:var(--pa-soft);color:var(--pa-primary);font-size:19px}
.portfolio-assessment-page .pa-title{margin:0;color:var(--pa-text);font-size:24px;line-height:1.25;font-weight:800}.portfolio-assessment-page .pa-subtitle{margin:5px 0 0;color:var(--pa-muted);font-size:14px;line-height:1.45}
.portfolio-assessment-page .pa-period{flex:0 0 auto;padding:8px 11px;border:1px solid #dbeafe;border-radius:9px;background:#f8fbff;color:#1e40af;font-size:12px;font-weight:800;white-space:nowrap}
.portfolio-assessment-page .pa-alert{margin-bottom:14px;border-radius:10px}.portfolio-assessment-page .pa-card{padding:18px;border:1px solid var(--pa-border);border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.portfolio-assessment-page .pa-card-head{margin-bottom:14px}.portfolio-assessment-page .pa-card-head h3{margin:0;color:var(--pa-text);font-size:18px;font-weight:800}.portfolio-assessment-page .pa-card-head p{margin:4px 0 0;color:var(--pa-muted);font-size:13px}
.portfolio-assessment-page .pa-filter-grid{display:grid;grid-template-columns:minmax(180px,1.15fr) minmax(170px,1fr) minmax(165px,.9fr) minmax(200px,1.15fr) auto;gap:12px;align-items:end}
.portfolio-assessment-page #subject_holder{display:contents}.portfolio-assessment-page .pa-field{min-width:0}.portfolio-assessment-page .pa-field label{display:block;margin:0 0 6px;color:#475569;font-size:13px;font-weight:700}.portfolio-assessment-page .pa-field .form-control,.portfolio-assessment-page .pa-field input[type="week"]{width:100%}
.portfolio-assessment-page .pa-action{display:flex;align-items:flex-end}.portfolio-assessment-page .pa-action .btn{white-space:nowrap;font-weight:800}.portfolio-assessment-page .pa-help{display:flex;align-items:flex-start;gap:9px;margin-top:14px;padding:11px 12px;border-radius:9px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.45}.portfolio-assessment-page .pa-help i{margin-top:2px;color:#2563eb}
@media(max-width:1100px){.portfolio-assessment-page .pa-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.portfolio-assessment-page .pa-action{grid-column:span 2}.portfolio-assessment-page .pa-action .btn{width:100%}}
@media(max-width:767px){.portfolio-assessment-page .pa-hero{display:block;padding:16px}.portfolio-assessment-page .pa-period{display:inline-block;margin-top:12px}.portfolio-assessment-page .pa-card{padding:14px}.portfolio-assessment-page .pa-filter-grid{grid-template-columns:1fr}.portfolio-assessment-page .pa-action{grid-column:auto}.portfolio-assessment-page .pa-title{font-size:22px}}
</style>

<div class="portfolio-assessment-page">
    <div class="pa-hero">
        <div class="pa-hero-copy">
            <div class="pa-icon"><i class="fa fa-clipboard-check"></i></div>
            <div>
                <h1 class="pa-title"><?php echo get_phrase('portfolio_assessment'); ?></h1>
                <p class="pa-subtitle">Select the exam, class, week and subject to record the week's portfolio assessment.</p>
            </div>
        </div>
        <div class="pa-period"><?php echo htmlspecialchars($running_year); ?> · <?php echo get_phrase('term'); ?> <?php echo htmlspecialchars($running_term); ?> / <?php echo get_phrase('semester'); ?> <?php echo htmlspecialchars($running_sem); ?></div>
    </div>

    <?php if(isset($_GET['error']) && $_GET['error'] == 1): ?>
        <?php if(isset($_GET['term'])): ?>
            <div class="alert alert-danger alert-dismissable pa-alert" role="alert">
                <button class="close" data-dismiss="alert">&times;</button>
                <strong><?php echo get_phrase('seems_students_attendance_for_term_'.$_GET['term'].'_has_not_been_marked_yet._please_mark_students_attendance_first_to_enroll_students_for_this_term_before_you_proceed.'); ?></strong>
            </div>
        <?php elseif(isset($_GET['sem'])): ?>
            <div class="alert alert-danger alert-dismissable pa-alert" role="alert">
                <button class="close" data-dismiss="alert">&times;</button>
                <strong><?php echo get_phrase('seems_students_attendance_for_semester_'.$_GET['sem'].'_has_not_been_marked_yet._please_mark_students_attendance_first_to_enroll_students_for_this_semester_before_you_proceed.'); ?></strong>
            </div>
        <?php endif; ?>
    <?php endif; ?>

    <?php if(isset($_GET['subjr']) && $_GET['subjr'] == 1): ?>
        <div class="alert alert-danger alert-dismissable pa-alert" role="alert">
            <button class="close" data-dismiss="alert">&times;</button>
            <strong><?php echo get_phrase('no_subject_was_found_for_this_class._please_add_subjects_for_this_class_and_try_again!'); ?></strong>
        </div>
    <?php endif; ?>

    <div class="pa-card">
        <div class="pa-card-head">
            <h3><?php echo get_phrase('assessment_selection'); ?></h3>
            <p>All filters use the current academic period. Choose a class first to load only the subjects available to you.</p>
        </div>
        <?php echo form_open(site_url('admin/portfolio_assessment_selector'), array('id' => 'portfolio_form', 'class' => 'pa-selector-form')); ?>
        <div class="pa-filter-grid">
            <div class="pa-field">
                <label for="portfolio_exam_id"><?php echo get_phrase('exam'); ?></label>
                <select name="exam_id" id="portfolio_exam_id" class="form-control selectboxit" required>
                    <option value=""><?php echo get_phrase('select_exam_type'); ?></option>
                    <?php foreach($portfolio_exams as $row): ?>
                        <option value="<?php echo (int)$row['exam_id']; ?>"><?php echo htmlspecialchars($row['name']); ?></option>
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
                            $class_row = $this->db->get_where('class', array('class_id' => $cid))->row();
                            if(!$class_row) continue;
                            $section_row = $this->db->get_where('section', array('class_id' => $cid))->row();
                            $same_class_count = $this->db->get_where('class', array('name' => $class_row->name, 'name_numeric' => $class_row->name_numeric))->num_rows();
                            $section_suffix = ($same_class_count > 1 && $section_row) ? ' '.$section_row->name : '';
                        ?>
                            <option value="<?php echo (int)$cid; ?>"><?php echo htmlspecialchars(trim($class_row->name.' '.$class_row->name_numeric.$section_suffix)); ?></option>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <?php getFullClassList(); ?>
                    <?php endif; ?>
                </select>
            </div>

            <div class="pa-field">
                <label for="week"><?php echo get_phrase('week'); ?></label>
                <input type="week" class="form-control" name="week" id="week" required>
            </div>

            <div id="subject_holder">
                <div class="pa-field">
                    <label><?php echo get_phrase('subject'); ?></label>
                    <select class="form-control" disabled>
                        <option><?php echo get_phrase('select_class_first'); ?></option>
                    </select>
                </div>
                <div class="pa-action">
                    <button type="submit" class="btn btn-primary" id="submit" disabled>
                        <i class="fa fa-arrow-right"></i> <?php echo get_phrase('manage_assessment'); ?>
                    </button>
                </div>
            </div>
        </div>
        <div class="pa-help"><i class="fa fa-info-circle"></i><span>The selected week covers Monday to Friday. Future-day score fields remain locked until their date is reached.</span></div>
        <?php echo form_close(); ?>
    </div>
</div>

<script>
function get_class_subject(class_id) {
    var $submit = $('#submit');
    if (!class_id) {
        $submit.prop('disabled', true);
        return;
    }
    $submit.prop('disabled', true);
    $.ajax({
        url: '<?php echo site_url('admin/marks_get_subject/'); ?>' + class_id + '/portfolio',
        success: function(response) {
            $('#subject_holder').html(response);
            $('#submit').prop('disabled', false);
        },
        error: function() {
            $('#subject_holder').html('<div class="pa-field"><label>Subject</label><div class="alert alert-danger" style="margin:0">Unable to load subjects for this class.</div></div><div class="pa-action"><button type="button" class="btn btn-default" disabled>Manage assessment</button></div>');
        }
    });
}
</script>
