<?php
$online_exam = $this->db->get_where('online_exam', ['online_exam_id' => $online_exam_id])->row_array();
if (!$online_exam) {
    show_error(get_phrase('online_exam_not_found'), 404);
    return;
}

$teacher_id = (int) $this->session->userdata('teacher_id');
$current_class_id = (int) ($online_exam['class_id'] ?? 0);
$class_row = $this->db->get_where('class', ['class_id' => $current_class_id])->row_array();
if (!$class_row) {
    show_error(get_phrase('class_not_found'), 404);
    return;
}

$class_name = (string) ($class_row['name'] ?? '');
$class_teacher = (int) ($class_row['teacher_id'] ?? 0);
$sections = $this->db->get_where('section', ['class_id' => $current_class_id])->result_array();

$teacher_class_options = [];
$class_sources = array_merge(
    (array) ($class_ids_creche ?? []),
    (array) ($class_ids_c ?? []),
    (array) ($class_ids ?? [])
);

foreach ($class_sources as $source) {
    $class_id = (int) ($source['class_id'] ?? 0);
    if ($class_id <= 0 || isset($teacher_class_options[$class_id])) {
        continue;
    }

    $option_class_row = $this->db->get_where('class', ['class_id' => $class_id])->row_array();
    if (!$option_class_row) {
        continue;
    }

    $section_row = $this->db->get_where('section', ['class_id' => $class_id])->row_array();
    $class_has_more_sections = $this->db
        ->where('name', $option_class_row['name'])
        ->where('name_numeric', $option_class_row['name_numeric'])
        ->count_all_results('class');

    $section_suffix = '';
    if ($class_has_more_sections > 1 && $section_row) {
        $section_suffix = (string) ($section_row['name'] ?? $section_row['section_name'] ?? '');
    }

    $teacher_class_options[$class_id] = [
        'class_id' => $class_id,
        'label' => trim((string) $option_class_row['name'] . ' ' . (string) $option_class_row['name_numeric'] . $section_suffix),
    ];
}

$subject_filters = [
    'class_id' => $current_class_id,
    'year' => $online_exam['running_year'],
];

if ($class_name === 'JHSS') {
    $subject_filters['sem'] = $online_exam['sem'];
} else {
    $subject_filters['term'] = $online_exam['term'];
}

if ($class_teacher !== $teacher_id) {
    $subject_filters['teacher_id'] = $teacher_id;
}

$subjects = $this->db->get_where('subject', $subject_filters)->result_array();
?>

<style>
.exam-form-shell{max-width:1180px;margin:0 auto}.exam-form-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap;background:#0f172a;color:#fff;border-radius:18px;padding:22px 24px;margin-bottom:16px;box-shadow:0 12px 30px rgba(15,23,42,.12)}.exam-form-hero h2{margin:0 0 6px;color:#fff;font-size:26px;font-weight:800}.exam-form-hero p{margin:0;color:#cbd5e1}.exam-form-back{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 14px;border-radius:10px;background:#fff;color:#334155;font-weight:800;text-decoration:none}.exam-form-back:hover{color:#0f172a;text-decoration:none}.exam-form-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.exam-form-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 5px 18px rgba(15,23,42,.05)}.exam-form-card h3{margin:0 0 18px;color:#0f172a;font-size:16px;font-weight:800}.exam-field{margin-bottom:16px}.exam-field:last-child{margin-bottom:0}.exam-field label{display:block;margin-bottom:6px;color:#334155;font-size:13px;font-weight:800}.exam-field .form-control,.exam-field select,.exam-field textarea{width:100%;min-height:42px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;box-shadow:none}.exam-field textarea{min-height:150px;resize:vertical}.exam-field .form-control:focus,.exam-field select:focus,.exam-field textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.exam-time-grid{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px}.exam-time-separator{font-weight:800;color:#64748b}.exam-percentage{display:flex;align-items:stretch}.exam-percentage .form-control{border-radius:9px 0 0 9px}.exam-percentage span{display:flex;align-items:center;padding:0 13px;border:1px solid #cbd5e1;border-left:0;border-radius:0 9px 9px 0;background:#f8fafc;font-weight:800;color:#475569}.exam-form-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:16px;padding:16px 0}.exam-submit{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 20px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800;box-shadow:0 8px 18px rgba(37,99,235,.22)}.exam-submit:hover,.exam-submit:focus{background:#1d4ed8;color:#fff}.exam-submit[disabled]{opacity:.65;cursor:not-allowed}
@media(max-width:900px){.exam-form-grid{grid-template-columns:1fr}}
@media(max-width:767px){.exam-form-hero{padding:18px;border-radius:14px}.exam-form-hero h2{font-size:22px}.exam-form-back{width:100%;justify-content:center}.exam-form-card{padding:16px;border-radius:13px}.exam-time-grid{grid-template-columns:1fr}.exam-time-separator{text-align:center}.exam-form-footer{justify-content:stretch}.exam-submit{width:100%}}
</style>

<div class="exam-form-shell">
    <header class="exam-form-hero">
        <div>
            <h2><i class="entypo-pencil"></i> <?php echo get_phrase('update_online_exam'); ?></h2>
            <p><?php echo html_escape($online_exam['title']); ?> · <?php echo get_phrase('online_exam'); ?></p>
        </div>
        <a class="exam-form-back" href="<?php echo site_url('teacher/manage_online_exam'); ?>"><i class="entypo-left-open"></i> <?php echo get_phrase('manage_online_exams'); ?></a>
    </header>

    <?php echo form_open(site_url('teacher/manage_online_exam/edit'), ['id' => 'edit_online_exam_form', 'class' => 'validate', 'target' => '_top']); ?>
        <input type="hidden" name="online_exam_id" value="<?php echo (int) $online_exam['online_exam_id']; ?>">

        <div class="exam-form-grid">
            <section class="exam-form-card" aria-labelledby="editExamAudienceHeading">
                <h3 id="editExamAudienceHeading"><i class="entypo-users"></i> <?php echo get_phrase('exam_details'); ?></h3>

                <div class="exam-field">
                    <label for="exam_title"><?php echo get_phrase('exam_title'); ?></label>
                    <input id="exam_title" type="text" class="form-control" name="exam_title" value="<?php echo html_escape($online_exam['title']); ?>" autocomplete="off" data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>" required>
                </div>

                <div class="exam-field">
                    <label for="class_id"><?php echo get_phrase('class'); ?></label>
                    <select name="class_id" class="form-control select2" id="class_id" data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>" onchange="return get_class_sections(this.value)" required>
                        <option value=""><?php echo get_phrase('select_class'); ?></option>
                        <?php foreach ($teacher_class_options as $option): ?>
                            <option value="<?php echo (int) $option['class_id']; ?>" <?php echo $current_class_id === (int) $option['class_id'] ? 'selected' : ''; ?>><?php echo html_escape($option['label']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="exam-field">
                    <label for="section_id"><?php echo get_phrase('section'); ?></label>
                    <div id="section_selector_holder">
                        <select name="section_id" class="form-control select2" id="section_id" required>
                            <?php foreach ($sections as $section): ?>
                                <option value="<?php echo (int) $section['section_id']; ?>" <?php echo (int) $section['section_id'] === (int) $online_exam['section_id'] ? 'selected' : ''; ?>><?php echo html_escape($section['name'] ?? $section['section_name'] ?? ''); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="exam-field">
                    <label for="subject_id"><?php echo get_phrase('subject'); ?></label>
                    <div id="subject_selector_holder">
                        <select name="subject_id" class="form-control select2" id="subject_id" required>
                            <?php foreach ($subjects as $subject): ?>
                                <option value="<?php echo (int) $subject['subject_id']; ?>" <?php echo (int) $subject['subject_id'] === (int) $online_exam['subject_id'] ? 'selected' : ''; ?>><?php echo html_escape($subject['name'] ?? ''); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
            </section>

            <section class="exam-form-card" aria-labelledby="editExamScheduleHeading">
                <h3 id="editExamScheduleHeading"><i class="entypo-calendar"></i> <?php echo get_phrase('schedule'); ?></h3>

                <div class="exam-field">
                    <label for="exam_date"><?php echo get_phrase('exam_date'); ?></label>
                    <input id="exam_date" type="text" class="datepicker form-control" name="exam_date" value="<?php echo html_escape(date('M d, Y', (int) $online_exam['exam_date'])); ?>" autocomplete="off" data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>" required>
                </div>

                <div class="exam-field">
                    <label><?php echo get_phrase('exam_time'); ?></label>
                    <div class="exam-time-grid">
                        <input type="text" class="form-control timepicker" name="time_start" id="time_start" data-template="dropdown" data-show-seconds="true" data-default-time="<?php echo html_escape($online_exam['time_start']); ?>" data-show-meridian="false" data-minute-step="5" data-second-step="5" value="<?php echo html_escape($online_exam['time_start']); ?>" data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>" required>
                        <span class="exam-time-separator"><?php echo get_phrase('to'); ?></span>
                        <input type="text" class="form-control timepicker" name="time_end" id="time_end" data-template="dropdown" data-show-seconds="true" data-default-time="<?php echo html_escape($online_exam['time_end']); ?>" data-show-meridian="false" data-minute-step="5" data-second-step="5" value="<?php echo html_escape($online_exam['time_end']); ?>" data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>" required>
                    </div>
                </div>

                <div class="exam-field">
                    <label for="minimum_percentage"><?php echo get_phrase('minimum_percentage'); ?></label>
                    <div class="exam-percentage">
                        <input type="number" class="form-control" name="minimum_percentage" id="minimum_percentage" min="0" max="100" step="0.01" value="<?php echo html_escape($online_exam['minimum_percentage']); ?>" placeholder="<?php echo get_phrase('minimum_percentage_for_passing'); ?>" data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>" required>
                        <span>%</span>
                    </div>
                </div>

                <div class="exam-field">
                    <label for="instruction"><?php echo get_phrase('instruction'); ?></label>
                    <textarea id="instruction" name="instruction" class="form-control" rows="7" data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>" required><?php echo html_escape($online_exam['instruction']); ?></textarea>
                </div>
            </section>
        </div>

        <div class="exam-form-footer">
            <button type="submit" class="exam-submit" id="edit_online_exam_submit"><i class="entypo-check"></i> <?php echo get_phrase('update_exam'); ?></button>
        </div>
    </form>
</div>

<script type="text/javascript">
$('#edit_online_exam_form').submit(function(e) {
    e.preventDefault();
    var $form = $(this);
    var $submit = $('#edit_online_exam_submit');
    $submit.prop('disabled', true);
    showAjaxModal_alert('Updating online exam...', 'loading');

    $.ajax({
        url: $form.attr('action'),
        type: 'POST',
        data: new FormData(this),
        cache: false,
        contentType: false,
        processData: false
    }).done(function(response) {
        var data;
        try {
            data = typeof response === 'string' ? JSON.parse(response) : response;
        } catch (error) {
            data = {status: 'error', message: 'Operation failed'};
        }

        if (data.status === 'success') {
            showAjaxModal_alert(data.message, 'success');
            setTimeout(function() {
                window.location.href = '<?php echo site_url('teacher/manage_online_exam'); ?>';
            }, 1200);
            return;
        }

        $submit.prop('disabled', false);
        showAjaxModal_alert(data.message || 'Operation failed', 'error');
    }).fail(function() {
        $submit.prop('disabled', false);
        showAjaxModal_alert('An error occurred', 'error');
    });
});

function get_class_sections(class_id) {
    if (!class_id) {
        return false;
    }

    $.ajax({
        url: '<?php echo site_url('teacher/get_class_section_selector/'); ?>' + class_id,
        success: function(response) {
            $('#section_selector_holder').html(response);
        }
    });

    get_class_subject(class_id);
    return false;
}

function get_class_subject(class_id) {
    $.ajax({
        url: '<?php echo site_url('teacher/get_class_subject_selector/'); ?>' + class_id,
        success: function(response) {
            $('#subject_selector_holder').html(response);
        }
    });
}
</script>
