<?php
$grade_count = is_array($grades) ? count($grades) : 0;
$highest_mark = !empty($grades) ? max(array_column($grades, 'mark_upto')) : 0;
$lowest_mark = !empty($grades) ? min(array_column($grades, 'mark_from')) : 0;
$pass_grades = array_filter($grades, function($grade) { return $grade['mark_from'] >= 50; });
$pass_mark = !empty($pass_grades) ? min(array_column($pass_grades, 'mark_from')) : 50;
?>
<style>
.grade-workspace {
    margin: 0 !important;
    padding: 0 0 32px !important;
    background: #f8fafc;
    min-height: 100%;
    color: #334155;
}
.grade-page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.grade-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.grade-page-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 24px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.grade-page-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.5;
}
.grade-add-button {
    min-height: var(--sm-ui-control-height, 42px);
    height: var(--sm-ui-control-height, 42px);
    padding: 9px 14px !important;
    border: 1px solid #2563eb !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    color: #fff !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.grade-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}
.grade-stat {
    min-height: 106px;
    padding: 15px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #2563eb;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.grade-stat-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
}
.grade-stat-value {
    margin-top: 8px;
    color: #0f172a;
    font-size: 27px;
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: -.02em;
}
.grade-card {
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.grade-table-shell {
    overflow-x: auto;
}
#grade_table {
    width: 100% !important;
    min-width: 860px;
    margin: 0 !important;
    border-collapse: collapse !important;
}
#grade_table thead th {
    padding: 12px 13px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    text-transform: uppercase;
}
#grade_table tbody td {
    padding: 12px 13px !important;
    border-bottom: 1px solid #eef2f7 !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle !important;
}
#grade_table tbody tr:hover { background: #f8fbff; }
.grade-name { color: #0f172a; font-weight: 800; }
.grade-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 27px;
    padding: 5px 9px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 800;
}
.grade-range {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #475569;
    font-weight: 700;
    white-space: nowrap;
}
.grade-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    white-space: nowrap;
}
.grade-actions a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 36px;
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none !important;
}
.grade-actions a:hover { background: #f8fafc; }
.grade-actions .danger { border-color: #fecaca; color: #b91c1c; }
.grade-create-card {
    display: none;
    max-width: 940px;
    margin: 0 auto 16px;
    padding: 18px;
}
.grade-create-card.show { display: block; }
.grade-create-head {
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}
.grade-create-head h2 {
    margin: 0;
    color: #0f172a;
    font-size: 20px !important;
    font-weight: 800;
}
.grade-create-head p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
}
.grade-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}
.grade-field { margin: 0; }
.grade-field.full { grid-column: 1 / -1; }
.grade-field label {
    display: block;
    margin: 0 0 6px;
    color: #334155;
    font-size: 13px;
    font-weight: 800;
}
.grade-field input {
    width: 100%;
    min-height: var(--sm-ui-control-height, 42px);
    height: var(--sm-ui-control-height, 42px);
    padding: 9px 11px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #0f172a;
    font-size: 14px !important;
    box-sizing: border-box;
}
.grade-field input:focus {
    border-color: #2563eb;
    outline: 0;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.grade-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
}
.grade-form-actions button {
    min-height: var(--sm-ui-control-height, 42px);
    height: var(--sm-ui-control-height, 42px);
    padding: 9px 14px !important;
    border-radius: 9px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.grade-form-actions .primary {
    border: 1px solid #2563eb;
    background: #2563eb;
    color: #fff;
}
.grade-workspace .dataTables_wrapper {
    min-width: 860px;
    padding: 14px;
}
.grade-workspace .dataTables_length,
.grade-workspace .dataTables_filter,
.grade-workspace .dataTables_info,
.grade-workspace .dataTables_paginate {
    color: #475569;
    font-size: 13px;
}
.grade-workspace .dataTables_length label,
.grade-workspace .dataTables_filter label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
}
.grade-workspace .dataTables_length select,
.grade-workspace .dataTables_filter input {
    min-height: 38px;
    height: 38px;
    padding: 7px 9px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
}
@media (max-width: 900px) {
    .grade-stats { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 767px) {
    .grade-workspace { padding: 0 0 28px !important; }
    .grade-page-head { display: block; }
    .grade-page-head h1 { font-size: 22px !important; }
    .grade-add-button { width: 100%; margin-top: 14px; }
    .grade-form-grid { grid-template-columns: 1fr; }
    .grade-field.full { grid-column: auto; }
    .grade-field input { font-size: 16px !important; }
    .grade-form-actions { display: grid; grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
    .grade-stats { grid-template-columns: 1fr; }
}
</style>

<div class="grade-workspace">
    <div class="grade-page-head">
        <div>
            <p class="grade-eyebrow">Examination</p>
            <h1>Grading System Management</h1>
            <p>Configure grade labels, score ranges and GPA points used by examination and reporting workflows.</p>
        </div>
        <button type="button" class="btn grade-add-button" id="gradeAddButton" onclick="toggleGradeForm(true)"><i class="fa fa-plus"></i> Add Grade</button>
    </div>

    <div class="grade-stats">
        <div class="grade-stat"><div class="grade-stat-label">Total Grades</div><div class="grade-stat-value"><?php echo (int)$grade_count; ?></div></div>
        <div class="grade-stat"><div class="grade-stat-label">Highest Mark</div><div class="grade-stat-value"><?php echo html_escape($highest_mark); ?>%</div></div>
        <div class="grade-stat"><div class="grade-stat-label">Lowest Mark</div><div class="grade-stat-value"><?php echo html_escape($lowest_mark); ?>%</div></div>
        <div class="grade-stat"><div class="grade-stat-label">Pass Mark</div><div class="grade-stat-value"><?php echo html_escape($pass_mark); ?>%</div></div>
    </div>

    <div class="grade-card grade-create-card" id="addGradeForm">
        <div class="grade-create-head">
            <h2>Create New Grade</h2>
            <p>Define the label, symbol, mark range and GPA points for the new grade.</p>
        </div>

        <?php echo form_open(site_url('admin/grade/create'), array('id' => 'gradeForm')); ?>
            <div class="grade-form-grid">
                <div class="grade-field">
                    <label for="grade_name"><i class="fa fa-tag"></i> Grade Name *</label>
                    <input id="grade_name" type="text" name="name" maxlength="100" placeholder="e.g. EXCELLENT" required>
                </div>
                <div class="grade-field">
                    <label for="grade_symbol"><i class="fa fa-certificate"></i> Grade Symbol *</label>
                    <input id="grade_symbol" type="text" name="grade_point" maxlength="20" placeholder="e.g. A+ or 1" required>
                </div>
                <div class="grade-field">
                    <label for="grade_min"><i class="fa fa-arrow-down"></i> Minimum Mark (%) *</label>
                    <input id="grade_min" type="number" name="mark_from" placeholder="e.g. 80" min="0" max="100" step="0.1" required>
                </div>
                <div class="grade-field">
                    <label for="grade_max"><i class="fa fa-arrow-up"></i> Maximum Mark (%) *</label>
                    <input id="grade_max" type="number" name="mark_upto" placeholder="e.g. 100" min="0" max="100" step="0.1" required>
                </div>
                <div class="grade-field full">
                    <label for="grade_gpa"><i class="fa fa-star"></i> GPA Points *</label>
                    <input id="grade_gpa" type="number" name="gpa" placeholder="e.g. 4.0" step="0.1" min="0" max="5" required>
                </div>
            </div>
            <div class="grade-form-actions">
                <button type="button" class="btn btn-default" onclick="toggleGradeForm(false)">Cancel</button>
                <button type="submit" class="btn primary" id="create_grade_button"><i class="fa fa-plus-circle"></i> Create Grade</button>
            </div>
        <?php echo form_close(); ?>
    </div>

    <div class="grade-card grade-table-shell">
        <table class="table" id="grade_table">
            <thead>
                <tr>
                    <th style="width:60px">#</th>
                    <th>Grade Name</th>
                    <th>Grade</th>
                    <th>Mark Range</th>
                    <th>GPA</th>
                    <th style="text-align:right">Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php $count = 1; foreach($grades as $row): ?>
                <tr>
                    <td><?php echo $count++; ?></td>
                    <td><span class="grade-name"><?php echo html_escape($row['name']); ?></span></td>
                    <td><span class="grade-badge"><?php echo html_escape($row['grade_point']); ?></span></td>
                    <td><span class="grade-range"><span><?php echo html_escape($row['mark_from']); ?>%</span><span>–</span><span><?php echo html_escape($row['mark_upto']); ?>%</span></span></td>
                    <td><strong><?php echo html_escape($row['grade_point_numeric'] ?? 'N/A'); ?></strong></td>
                    <td>
                        <div class="grade-actions">
                            <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_edit_grade/'.(int)$row['grade_id']); ?>'); return false;"><i class="fa fa-edit"></i> Edit</a>
                            <a href="#" class="danger" onclick="deleteGrade(<?php echo (int)$row['grade_id']; ?>); return false;"><i class="fa fa-trash"></i> Delete</a>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
function toggleGradeForm(show) {
    var form = $('#addGradeForm');
    if (show) {
        form.addClass('show');
        $('#gradeAddButton').prop('disabled', true);
        setTimeout(function() { $('#grade_name').focus(); }, 100);
    } else {
        form.removeClass('show');
        $('#gradeAddButton').prop('disabled', false);
        if ($('#gradeForm').length) $('#gradeForm')[0].reset();
    }
}

function deleteGrade(id) {
    showConfirmModal(
        'Confirm Delete',
        'Are you sure you want to delete this grade? This action cannot be undone.',
        function() {
            showAjaxModal_alert('Deleting...', 'loading');
            $.ajax({
                url: '<?php echo site_url("admin/grade/delete/"); ?>' + id,
                type: 'GET',
                dataType: 'json'
            }).done(function(response) {
                if (response.message === 'done') {
                    showAjaxModal_alert('Grade deleted successfully', 'success');
                    setTimeout(function() { location.reload(); }, 1200);
                } else {
                    showAjaxModal_alert('Failed to delete grade', 'error');
                }
            }).fail(function() {
                showAjaxModal_alert('An error occurred while deleting the grade', 'error');
            });
        },
        'Delete',
        'danger'
    );
}

$('#gradeForm').on('submit', function(e) {
    e.preventDefault();
    var form = this;
    var button = $('#create_grade_button');
    button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Creating…');
    showAjaxModal_alert('Creating grade...', 'loading');

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
            showAjaxModal_alert(response.message, 'success');
            setTimeout(function() { location.reload(); }, 1200);
        } else {
            showAjaxModal_alert(response.message || 'Failed to create grade', 'error');
            button.prop('disabled', false).html('<i class="fa fa-plus-circle"></i> Create Grade');
        }
    }).fail(function(xhr) {
        var message = 'An error occurred while creating the grade';
        if (xhr.responseJSON && xhr.responseJSON.message) message = xhr.responseJSON.message;
        showAjaxModal_alert(message, 'error');
        button.prop('disabled', false).html('<i class="fa fa-plus-circle"></i> Create Grade');
    });
});

$(function() {
    if ($('#grade_table').length && $.fn.DataTable && !$.fn.DataTable.isDataTable('#grade_table')) {
        $('#grade_table').DataTable({
            responsive: true,
            pageLength: 10,
            order: [[2, 'asc']],
            columnDefs: [{ orderable: false, targets: [5] }]
        });
    }
});
</script>
