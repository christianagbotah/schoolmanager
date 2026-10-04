<?php
$terminal_report_style_row = $this->db->get_where('settings', array('type' => 'terminal_report_style'))->row();
$terminal_report_style = $terminal_report_style_row ? $terminal_report_style_row->description : 'style_1';
$grade_table = ($terminal_report_style === 'style_1') ? 'grade' : 'grade_2';
$row = $this->db->get_where($grade_table, array('grade_id' => $param2))->row_array();

if (!$row) {
    echo '<div class="alert alert-danger" style="margin:18px">Grade not found.</div>';
    return;
}
?>
<style>
.grade-edit-modal {
    padding: 18px;
    color: #334155;
    background: #fff;
}
.grade-edit-head {
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}
.grade-edit-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.grade-edit-head h3 {
    margin: 0;
    color: #0f172a;
    font-size: 20px !important;
    line-height: 1.3;
    font-weight: 800;
}
.grade-edit-head p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
}
.grade-edit-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.grade-edit-field {
    margin: 0;
}
.grade-edit-field.full {
    grid-column: 1 / -1;
}
.grade-edit-field label {
    display: block;
    margin: 0 0 6px;
    color: #334155;
    font-size: 13px;
    font-weight: 800;
}
.grade-edit-field label span {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 600;
}
.grade-edit-field input {
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
.grade-edit-field input:focus {
    border-color: #2563eb;
    outline: 0;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.grade-edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
}
.grade-edit-actions .btn {
    min-height: 42px;
    padding: 8px 14px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.grade-edit-actions .btn-primary {
    background: #2563eb !important;
    border-color: #2563eb !important;
}
@media (max-width: 640px) {
    .grade-edit-modal { padding: 14px; }
    .grade-edit-grid { grid-template-columns: 1fr; }
    .grade-edit-field.full { grid-column: auto; }
    .grade-edit-field input { font-size: 16px !important; }
    .grade-edit-actions { display: grid; grid-template-columns: 1fr; }
}
</style>

<div class="grade-edit-modal">
    <div class="grade-edit-head">
        <p class="grade-edit-eyebrow">Examination</p>
        <h3>Edit Grade</h3>
        <p>Update the grade label, score range and GPA points used by the current terminal report style.</p>
    </div>

    <?php echo form_open(site_url('admin/grade/do_update/'.(int)$row['grade_id']), array('id' => 'editGradeForm', 'target' => '_top')); ?>
        <input type="hidden" name="grade_table" value="<?php echo html_escape($grade_table); ?>">

        <div class="grade-edit-grid">
            <div class="grade-edit-field">
                <label for="edit_grade_name">Grade Name *</label>
                <input id="edit_grade_name" type="text" name="name" maxlength="100"
                       value="<?php echo html_escape($row['name']); ?>" placeholder="e.g. EXCELLENT" required>
            </div>

            <div class="grade-edit-field">
                <label for="edit_grade_symbol">Grade Symbol *</label>
                <input id="edit_grade_symbol" type="text" name="grade_point" maxlength="20"
                       value="<?php echo html_escape($row['grade_point']); ?>" placeholder="e.g. A+ or 1" required>
            </div>

            <div class="grade-edit-field">
                <label for="edit_grade_min">Minimum Mark (%) *</label>
                <input id="edit_grade_min" type="number" name="mark_from"
                       value="<?php echo html_escape($row['mark_from']); ?>" min="0" max="100" step="0.01" required>
            </div>

            <div class="grade-edit-field">
                <label for="edit_grade_max">Maximum Mark (%) *</label>
                <input id="edit_grade_max" type="number" name="mark_upto"
                       value="<?php echo html_escape($row['mark_upto']); ?>" min="0" max="100" step="0.01" required>
            </div>

            <div class="grade-edit-field full">
                <label for="edit_grade_gpa">GPA Points <span>(optional)</span></label>
                <input id="edit_grade_gpa" type="number" name="gpa"
                       value="<?php echo html_escape($row['grade_point_numeric'] ?? ''); ?>" step="0.1" min="0" max="5" placeholder="e.g. 4.0">
            </div>
        </div>

        <div class="grade-edit-actions">
            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="update_grade_button"><i class="fa fa-save"></i> Update Grade</button>
        </div>
    <?php echo form_close(); ?>
</div>

<script>
$('#editGradeForm').on('submit', function(e) {
    e.preventDefault();
    var form = this;
    var button = $('#update_grade_button');
    button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Updating…');
    showAjaxModal_alert('Updating grade...', 'loading');

    $.ajax({
        url: $(form).attr('action'),
        type: 'POST',
        data: new FormData(form),
        cache: false,
        contentType: false,
        processData: false,
        dataType: 'json'
    }).done(function(response) {
        if (response.status === 'success') {
            $('.modal:visible .close').first().click();
            showAjaxModal_alert(response.message || 'Grade updated successfully.', 'success');
            setTimeout(function() { location.reload(); }, 1200);
        } else {
            showAjaxModal_alert(response.message || 'Failed to update grade.', 'error');
            button.prop('disabled', false).html('<i class="fa fa-save"></i> Update Grade');
        }
    }).fail(function(xhr) {
        var message = 'An error occurred while updating the grade.';
        if (xhr.responseJSON && xhr.responseJSON.message) message = xhr.responseJSON.message;
        showAjaxModal_alert(message, 'error');
        button.prop('disabled', false).html('<i class="fa fa-save"></i> Update Grade');
    });
});
</script>
