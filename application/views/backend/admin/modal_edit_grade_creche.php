<?php
$row = $this->db->get_where('grade_creche', array('grade_id' => $param2))->row_array();
if (!$row) {
    echo '<div class="alert alert-danger" style="margin:18px">Grade not found.</div>';
    return;
}
?>
<style>
.creche-grade-edit-modal {
    padding: 18px;
    color: #334155;
    background: #fff;
}
.creche-grade-edit-head {
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}
.creche-grade-edit-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.creche-grade-edit-head h3 {
    margin: 0;
    color: #0f172a;
    font-size: 20px !important;
    line-height: 1.3;
    font-weight: 800;
}
.creche-grade-edit-head p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
}
.creche-grade-edit-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.creche-grade-edit-field label {
    display: block;
    margin: 0 0 6px;
    color: #334155;
    font-size: 13px;
    font-weight: 800;
}
.creche-grade-edit-field input {
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
.creche-grade-edit-field input:focus {
    border-color: #2563eb;
    outline: 0;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.creche-grade-edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
}
.creche-grade-edit-actions .btn {
    min-height: 42px;
    padding: 8px 14px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.creche-grade-edit-actions .btn-primary {
    background: #2563eb !important;
    border-color: #2563eb !important;
}
@media (max-width: 640px) {
    .creche-grade-edit-modal { padding: 14px; }
    .creche-grade-edit-grid { grid-template-columns: 1fr; }
    .creche-grade-edit-field input { font-size: 16px !important; }
    .creche-grade-edit-actions { display: grid; grid-template-columns: 1fr; }
}
</style>

<div class="creche-grade-edit-modal">
    <div class="creche-grade-edit-head">
        <p class="creche-grade-edit-eyebrow">Examination</p>
        <h3>Edit Creche/Nursery Grade</h3>
        <p>Update the descriptive grade name and abbreviation used in early-years assessment.</p>
    </div>

    <?php echo form_open(site_url('admin/grade_creche/do_update/'.(int)$row['grade_id']), array('id' => 'editGradeCrecheForm', 'target' => '_top')); ?>
        <div class="creche-grade-edit-grid">
            <div class="creche-grade-edit-field">
                <label for="edit_creche_grade_name">Full Name *</label>
                <input id="edit_creche_grade_name" type="text" name="name" maxlength="100"
                       value="<?php echo html_escape($row['full_name']); ?>" placeholder="e.g. EXCELLENT, VERY GOOD" required>
            </div>
            <div class="creche-grade-edit-field">
                <label for="edit_creche_grade_abbrev">Abbreviation *</label>
                <input id="edit_creche_grade_abbrev" type="text" name="grade_point" maxlength="20"
                       value="<?php echo html_escape($row['abbrev']); ?>" placeholder="e.g. EX, VG, G" required>
            </div>
        </div>

        <div class="creche-grade-edit-actions">
            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="update_creche_grade_button"><i class="fa fa-save"></i> Update Grade</button>
        </div>
    <?php echo form_close(); ?>
</div>

<script>
$('#editGradeCrecheForm').on('submit', function(e) {
    e.preventDefault();
    var form = this;
    var button = $('#update_creche_grade_button');
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
