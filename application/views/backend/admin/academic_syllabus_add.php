<?php
$classes = $this->db->order_by('name_numeric', 'ASC')->get('class')->result_array();
?>
<style>
.syllabus-upload-modal {
    padding: 18px;
    color: #334155;
    background: #fff;
}
.syllabus-upload-intro {
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}
.syllabus-upload-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.syllabus-upload-intro h3 {
    margin: 0;
    color: #0f172a;
    font-size: 20px !important;
    line-height: 1.3;
    font-weight: 800;
}
.syllabus-upload-intro p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
}
.syllabus-upload-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.syllabus-upload-field {
    margin: 0;
}
.syllabus-upload-field.full {
    grid-column: 1 / -1;
}
.syllabus-upload-field label {
    display: block;
    margin: 0 0 6px;
    color: #334155;
    font-size: 13px;
    font-weight: 800;
}
.syllabus-upload-field input[type="text"],
.syllabus-upload-field select,
.syllabus-upload-field textarea,
.syllabus-upload-field input[type="file"] {
    width: 100%;
    min-height: 44px;
    padding: 9px 11px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #0f172a;
    font-size: 15px !important;
    line-height: 1.4;
    box-sizing: border-box;
}
.syllabus-upload-field textarea {
    min-height: 105px;
    resize: vertical;
}
.syllabus-upload-field input[type="file"] {
    padding: 8px 10px;
}
.syllabus-upload-field input:focus,
.syllabus-upload-field select:focus,
.syllabus-upload-field textarea:focus {
    border-color: #2563eb;
    outline: 0;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
}
.syllabus-upload-field select:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
}
.syllabus-upload-help {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.45;
}
.syllabus-upload-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
}
.syllabus-upload-actions .btn {
    min-height: 42px;
    padding: 8px 14px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.syllabus-upload-actions .btn-primary {
    background: #2563eb !important;
    border-color: #2563eb !important;
}
.syllabus-subject-loading {
    display: none;
    margin-top: 6px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
}
@media (max-width: 680px) {
    .syllabus-upload-modal { padding: 14px; }
    .syllabus-upload-grid { grid-template-columns: 1fr; }
    .syllabus-upload-field.full { grid-column: auto; }
    .syllabus-upload-field input[type="text"],
    .syllabus-upload-field select,
    .syllabus-upload-field textarea,
    .syllabus-upload-field input[type="file"] { font-size: 16px !important; }
    .syllabus-upload-actions { display: grid; grid-template-columns: 1fr; }
}
</style>

<div class="syllabus-upload-modal">
    <div class="syllabus-upload-intro">
        <p class="syllabus-upload-eyebrow">Academics</p>
        <h3><?php echo get_phrase('upload_academic_syllabus'); ?></h3>
        <p>Add a syllabus resource to a class and subject. The existing upload workflow and storage contract remain unchanged.</p>
    </div>

    <?php echo form_open(site_url('admin/upload_academic_syllabus'), array(
        'class' => 'validate',
        'target' => '_top',
        'enctype' => 'multipart/form-data',
        'id' => 'academic_syllabus_upload_form'
    )); ?>

    <div class="syllabus-upload-grid">
        <div class="syllabus-upload-field full">
            <label for="syllabus_title"><?php echo get_phrase('title'); ?> *</label>
            <input id="syllabus_title" type="text" name="title" maxlength="255" required
                   data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>"
                   placeholder="e.g. Basic 6 Mathematics Term 1 Syllabus">
        </div>

        <div class="syllabus-upload-field full">
            <label for="syllabus_description"><?php echo get_phrase('description'); ?></label>
            <textarea id="syllabus_description" name="description" placeholder="Optional note about the syllabus resource"></textarea>
        </div>

        <div class="syllabus-upload-field">
            <label for="class_id"><?php echo get_phrase('class'); ?> *</label>
            <select name="class_id" id="class_id" onchange="get_class_subject(this.value)" required>
                <option value=""><?php echo get_phrase('select'); ?></option>
                <?php foreach ($classes as $row):
                    $section = $this->db->get_where('section', array('class_id' => $row['class_id']))->row_array();
                    $section_name = $section['name'] ?? '';
                    $same_class_count = $this->db->get_where('class', array(
                        'name' => $row['name'],
                        'name_numeric' => $row['name_numeric']
                    ))->num_rows();
                    $suffix = ($same_class_count > 1 && $section_name !== '') ? ' ' . $section_name : '';
                    $class_label = trim($row['name'] . ' ' . $row['name_numeric'] . $suffix);
                ?>
                    <option value="<?php echo (int)$row['class_id']; ?>"><?php echo html_escape($class_label); ?></option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="syllabus-upload-field">
            <label for="subject_selector_holder"><?php echo get_phrase('subject'); ?> *</label>
            <select name="subject_id" id="subject_selector_holder" required disabled>
                <option value=""><?php echo get_phrase('select_class_first'); ?></option>
            </select>
            <div class="syllabus-subject-loading" id="syllabus_subject_loading"><i class="fa fa-spinner fa-spin"></i> Loading subjects…</div>
        </div>

        <div class="syllabus-upload-field full">
            <label for="syllabus_file"><?php echo get_phrase('file'); ?> *</label>
            <input id="syllabus_file" type="file" name="file_name" required
                   accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip">
            <p class="syllabus-upload-help">Choose the syllabus document teachers and administrators should download from the class syllabus list.</p>
        </div>
    </div>

    <div class="syllabus-upload-actions">
        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-primary" id="syllabus_upload_button">
            <i class="fa fa-upload"></i> <?php echo get_phrase('upload_syllabus'); ?>
        </button>
    </div>
    <?php echo form_close(); ?>
</div>

<script>
function get_class_subject(class_id) {
    var subject = $('#subject_selector_holder');
    var loading = $('#syllabus_subject_loading');

    if (!class_id) {
        subject.prop('disabled', true).html('<option value=""><?php echo addslashes(get_phrase('select_class_first')); ?></option>');
        return;
    }

    subject.prop('disabled', true).html('<option value="">Loading…</option>');
    loading.show();

    $.ajax({
        url: '<?php echo site_url('admin/get_subject/'); ?>' + class_id,
        method: 'GET'
    }).done(function(response) {
        subject.html(response).prop('disabled', false);
    }).fail(function() {
        subject.html('<option value="">Unable to load subjects</option>').prop('disabled', true);
        if (typeof showAjaxModal_alert === 'function') {
            showAjaxModal_alert('Could not load subjects for the selected class.', 'error');
        }
    }).always(function() {
        loading.hide();
    });
}

$('#academic_syllabus_upload_form').on('submit', function() {
    $('#syllabus_upload_button').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Uploading…');
});
</script>
