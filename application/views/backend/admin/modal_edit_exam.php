<?php
$row = $this->db->get_where('exam', array('exam_id' => $param2))->row_array();
if (!$row) {
    echo '<div class="alert alert-danger" style="margin:18px">Exam not found.</div>';
    return;
}
$exam_categories = $this->db->order_by('name', 'ASC')->get('exam_category')->result_array();
?>
<style>
.exam-edit-modal {
    padding: 18px;
    color: #334155;
    background: #fff;
}
.exam-edit-head {
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}
.exam-edit-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.exam-edit-head h3 {
    margin: 0;
    color: #0f172a;
    font-size: 20px !important;
    line-height: 1.3;
    font-weight: 800;
}
.exam-edit-head p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
}
.exam-edit-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.exam-edit-field {
    margin: 0;
}
.exam-edit-field.full {
    grid-column: 1 / -1;
}
.exam-edit-field label {
    display: block;
    margin: 0 0 6px;
    color: #334155;
    font-size: 13px;
    font-weight: 800;
}
.exam-edit-field input,
.exam-edit-field select {
    width: 100%;
    min-height: 44px;
    height: 44px;
    padding: 9px 11px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #0f172a;
    font-size: 15px !important;
    box-sizing: border-box;
}
.exam-edit-field input:focus,
.exam-edit-field select:focus {
    border-color: #2563eb;
    outline: 0;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.exam-edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
}
.exam-edit-actions .btn {
    min-height: 42px;
    padding: 8px 14px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.exam-edit-actions .btn-primary {
    background: #2563eb !important;
    border-color: #2563eb !important;
}
@media (max-width: 640px) {
    .exam-edit-modal { padding: 14px; }
    .exam-edit-grid { grid-template-columns: 1fr; }
    .exam-edit-field.full { grid-column: auto; }
    .exam-edit-field input,
    .exam-edit-field select { font-size: 16px !important; }
    .exam-edit-actions { display: grid; grid-template-columns: 1fr; }
}
</style>

<div class="exam-edit-modal">
    <div class="exam-edit-head">
        <p class="exam-edit-eyebrow">Examination</p>
        <h3><?php echo get_phrase('edit_examination'); ?></h3>
        <p>Update the exam name, date and category. Existing marks and related records are not changed by this form.</p>
    </div>

    <?php echo form_open(site_url('admin/exam/edit/do_update/'.(int)$row['exam_id']), array(
        'class' => 'validate',
        'target' => '_top',
        'id' => 'edit_exam_form'
    )); ?>
        <div class="exam-edit-grid">
            <div class="exam-edit-field full">
                <label for="edit_exam_name"><?php echo get_phrase('name'); ?> *</label>
                <input id="edit_exam_name" type="text" name="name" maxlength="255"
                       value="<?php echo html_escape($row['name']); ?>" required
                       data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>">
            </div>

            <div class="exam-edit-field">
                <label for="edit_exam_date"><?php echo get_phrase('date'); ?> *</label>
                <input id="edit_exam_date" type="text" class="datepicker" name="date"
                       value="<?php echo html_escape($row['date']); ?>" required
                       data-validate="required" data-message-required="<?php echo get_phrase('value_required'); ?>">
            </div>

            <div class="exam-edit-field">
                <label for="edit_exam_category"><?php echo get_phrase('category'); ?> *</label>
                <select id="edit_exam_category" name="category_id" required>
                    <?php foreach($exam_categories as $rowc):
                        $category_label = $this->crud_model->get_exam_category($rowc['category_id']);
                    ?>
                        <option value="<?php echo (int)$rowc['category_id']; ?>" <?php echo (int)$rowc['category_id'] === (int)$row['category_id'] ? 'selected' : ''; ?>><?php echo html_escape($category_label); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <div class="exam-edit-actions">
            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="edit_exam_button"><i class="fa fa-save"></i> <?php echo get_phrase('edit_exam'); ?></button>
        </div>
    <?php echo form_close(); ?>
</div>

<script type="text/javascript">
$('#edit_exam_form').on('submit', function(event) {
    event.preventDefault();
    var form = this;
    var button = $('#edit_exam_button');
    button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Saving…');

    $.ajax({
        url: '<?php echo site_url('admin/exam/edit/do_update/'.(int)$row['exam_id']); ?>',
        type: 'POST',
        dataType: 'html',
        data: new FormData(form),
        cache: false,
        contentType: false,
        processData: false
    }).done(function() {
        $('.modal:visible .close').first().click();
        showAjaxModal_alert('Exam updated successfully.', 'success');
        navigation('<?php echo site_url('admin/exam'); ?>');
    }).fail(function(xhr) {
        showAjaxModal_alert(xhr.responseText || 'Could not update the exam.', 'error');
        button.prop('disabled', false).html('<i class="fa fa-save"></i> <?php echo addslashes(get_phrase('edit_exam')); ?>');
    });
});
</script>
