<?php
$grade_count = is_array($grades) ? count($grades) : 0;
?>
<style>
.creche-grade-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    background: #f8fafc;
    min-height: 100%;
    color: #334155;
}
.creche-grade-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.creche-grade-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.creche-grade-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.creche-grade-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.creche-grade-count {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 38px;
    padding: 7px 11px;
    border: 1px solid #dbeafe;
    border-radius: 9px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 13px;
    font-weight: 800;
}
.creche-grade-tabs {
    display: flex;
    gap: 4px;
    margin: 0 0 14px;
    border-bottom: 1px solid #e2e8f0;
}
.creche-grade-tab {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 -1px;
    padding: 10px 14px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #64748b;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none !important;
}
.creche-grade-tab:hover { color: #1d4ed8; background: #f8fafc; }
.creche-grade-tab.active { border-bottom-color: #2563eb; color: #2563eb; }
.creche-grade-card {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.creche-grade-table-shell { overflow-x: auto; }
#creche_grade_table {
    width: 100% !important;
    min-width: 680px;
    margin: 0 !important;
    border-collapse: collapse !important;
}
#creche_grade_table thead th {
    padding: 12px 13px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    letter-spacing: .035em;
    text-transform: uppercase;
}
#creche_grade_table tbody td {
    padding: 12px 13px !important;
    border-bottom: 1px solid #eef2f7 !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle !important;
}
#creche_grade_table tbody tr:hover { background: #f8fbff; }
.creche-grade-name { color: #0f172a; font-weight: 800; }
.creche-grade-badge {
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
.creche-grade-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    white-space: nowrap;
}
.creche-grade-actions button {
    min-height: 36px;
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
}
.creche-grade-actions button:hover { background: #f8fafc; }
.creche-grade-actions .danger { border-color: #fecaca; color: #b91c1c; }
.creche-grade-empty {
    padding: 42px 18px;
    text-align: center;
    color: #64748b;
}
.creche-grade-empty i {
    display: block;
    margin-bottom: 12px;
    color: #94a3b8;
    font-size: 34px;
}
.creche-grade-empty h3 { margin: 0 0 6px; color: #0f172a; font-size: 18px; font-weight: 800; }
.creche-grade-empty p { margin: 0 0 14px; font-size: 14px; }
.creche-grade-empty .btn { min-height: 42px; padding: 8px 14px !important; border-radius: 8px !important; font-size: 14px !important; font-weight: 800 !important; }
.creche-grade-form {
    max-width: 820px;
    margin: 0 auto;
    padding: 18px;
}
.creche-grade-form-head {
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}
.creche-grade-form-head h2 { margin: 0; color: #0f172a; font-size: 20px !important; font-weight: 800; }
.creche-grade-form-head p { margin: 6px 0 0; color: #64748b; font-size: 13px; }
.creche-grade-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.creche-grade-field label { display: block; margin: 0 0 6px; color: #334155; font-size: 13px; font-weight: 800; }
.creche-grade-field input {
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
.creche-grade-field input:focus { border-color: #2563eb; outline: 0; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.creche-grade-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
}
.creche-grade-form-actions .btn { min-height: 44px; padding: 9px 15px !important; border-radius: 9px !important; font-size: 14px !important; font-weight: 800 !important; box-shadow: none !important; }
.creche-grade-form-actions .btn-primary { background: #2563eb !important; border-color: #2563eb !important; }
.creche-grade-workspace .dataTables_wrapper { min-width: 680px; padding: 14px; }
.creche-grade-workspace .dataTables_length,
.creche-grade-workspace .dataTables_filter,
.creche-grade-workspace .dataTables_info,
.creche-grade-workspace .dataTables_paginate { color: #475569; font-size: 13px; }
.creche-grade-workspace .dataTables_length label,
.creche-grade-workspace .dataTables_filter label { display: flex; align-items: center; gap: 6px; color: #475569; font-size: 13px; font-weight: 700; }
.creche-grade-workspace .dataTables_length select,
.creche-grade-workspace .dataTables_filter input { min-height: 38px; height: 38px; padding: 7px 9px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #0f172a; font-size: 14px; }
@media (max-width: 767px) {
    .creche-grade-workspace { padding: 18px 14px 32px !important; }
    .creche-grade-head { display: block; }
    .creche-grade-head h1 { font-size: 26px !important; }
    .creche-grade-count { margin-top: 12px; }
    .creche-grade-tabs { overflow-x: auto; white-space: nowrap; }
    .creche-grade-form-grid { grid-template-columns: 1fr; }
    .creche-grade-field input { font-size: 16px !important; }
    .creche-grade-form-actions { display: grid; grid-template-columns: 1fr; }
}
</style>

<div class="creche-grade-workspace">
    <div class="creche-grade-head">
        <div>
            <p class="creche-grade-eyebrow">Examination</p>
            <h1>Creche &amp; Nursery Grades</h1>
            <p>Manage descriptive assessment grades used for early-years reporting.</p>
        </div>
        <span class="creche-grade-count"><i class="fa fa-star"></i> <?php echo (int)$grade_count; ?> grade<?php echo $grade_count === 1 ? '' : 's'; ?></span>
    </div>

    <div class="creche-grade-tabs">
        <a href="#list" class="creche-grade-tab active" id="list-tab" data-toggle="tab"><i class="fa fa-list"></i> Grade List</a>
        <a href="#add" class="creche-grade-tab" id="add-tab" data-toggle="tab"><i class="fa fa-plus"></i> Add New Grade</a>
    </div>

    <div class="tab-content">
        <div class="tab-pane active" id="list">
            <div class="creche-grade-card creche-grade-table-shell">
                <?php if(empty($grades)): ?>
                    <div class="creche-grade-empty">
                        <i class="fa fa-star"></i>
                        <h3>No grades found</h3>
                        <p>Create the first descriptive grade for Creche/Nursery assessment.</p>
                        <button type="button" class="btn btn-primary" onclick="$('#add-tab').click();"><i class="fa fa-plus"></i> Create First Grade</button>
                    </div>
                <?php else: ?>
                    <table class="table" id="creche_grade_table">
                        <thead>
                            <tr><th style="width:60px">#</th><th><?php echo get_phrase('grade_full_name'); ?></th><th><?php echo get_phrase('grade_abbreviation'); ?></th><th style="text-align:right"><?php echo get_phrase('options'); ?></th></tr>
                        </thead>
                        <tbody>
                        <?php $count = 1; foreach($grades as $row): ?>
                            <tr>
                                <td><?php echo $count++; ?></td>
                                <td><span class="creche-grade-name"><?php echo html_escape($row['full_name']); ?></span></td>
                                <td><span class="creche-grade-badge"><?php echo html_escape($row['abbrev']); ?></span></td>
                                <td><div class="creche-grade-actions">
                                    <button type="button" onclick="editGrade(<?php echo (int)$row['grade_id']; ?>)"><i class="fa fa-edit"></i> Edit</button>
                                    <button type="button" class="danger" onclick="deleteGrade(<?php echo (int)$row['grade_id']; ?>)"><i class="fa fa-trash"></i> Delete</button>
                                </div></td>
                            </tr>
                        <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>
        </div>

        <div class="tab-pane" id="add">
            <div class="creche-grade-card creche-grade-form">
                <div class="creche-grade-form-head">
                    <h2>Create New Grade</h2>
                    <p>Add a descriptive grade name and abbreviation for early-years assessment.</p>
                </div>
                <?php echo form_open(site_url('admin/grade_creche/create'), array('id' => 'add_grade_form')); ?>
                    <div class="creche-grade-form-grid">
                        <div class="creche-grade-field">
                            <label for="creche_grade_name"><i class="fa fa-star"></i> <?php echo get_phrase('full_name'); ?> *</label>
                            <input id="creche_grade_name" type="text" name="name" maxlength="100" placeholder="e.g. Needs Attention, Excellent" required>
                        </div>
                        <div class="creche-grade-field">
                            <label for="creche_grade_abbrev"><i class="fa fa-tag"></i> <?php echo get_phrase('grade_abbreviation'); ?> *</label>
                            <input id="creche_grade_abbrev" type="text" name="grade_point" maxlength="20" placeholder="e.g. NA, EX" required>
                        </div>
                    </div>
                    <div class="creche-grade-form-actions">
                        <button type="button" class="btn btn-default" onclick="$('#list-tab').click();">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="create_creche_grade_button"><i class="fa fa-save"></i> Create Grade</button>
                    </div>
                <?php echo form_close(); ?>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
$(function() {
    if ($('#creche_grade_table').length && $.fn.DataTable && !$.fn.DataTable.isDataTable('#creche_grade_table')) {
        $('#creche_grade_table').DataTable({
            responsive: true,
            pageLength: 10,
            order: [[1, 'asc']],
            columnDefs: [{ orderable: false, targets: [3] }],
            language: {
                search: 'Search grades:',
                lengthMenu: 'Show _MENU_ grades per page',
                info: 'Showing _START_ to _END_ of _TOTAL_ grades',
                paginate: { first: 'First', last: 'Last', next: 'Next', previous: 'Previous' }
            }
        });
    }

    $('.creche-grade-tab').on('click', function(e) {
        e.preventDefault();
        $('.creche-grade-tab').removeClass('active');
        $(this).addClass('active');
        $('.creche-grade-workspace .tab-pane').removeClass('active');
        $($(this).attr('href')).addClass('active');
    });

    $('#add_grade_form').on('submit', function(e) {
        e.preventDefault();
        var form = this;
        var button = $('#create_creche_grade_button');
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
        }).done(function() {
            showAjaxModal_alert('Grade created successfully!', 'success');
            setTimeout(function() { location.reload(); }, 1200);
        }).fail(function(xhr) {
            var errorMsg = 'Failed to create grade';
            if (xhr.responseJSON && xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
            showAjaxModal_alert(errorMsg, 'error');
            button.prop('disabled', false).html('<i class="fa fa-save"></i> Create Grade');
        });
    });
});

function editGrade(gradeId) {
    showAjaxModal('<?php echo site_url("modal/popup/modal_edit_grade_creche/"); ?>' + gradeId);
}

function deleteGrade(gradeId) {
    showConfirmModal(
        'Delete Grade',
        'Are you sure you want to delete this grade? This action cannot be undone.',
        function() {
            showAjaxModal_alert('Deleting grade...', 'loading');
            $.ajax({
                url: '<?php echo site_url("admin/grade_creche/delete/"); ?>' + gradeId,
                type: 'GET',
                dataType: 'json'
            }).done(function() {
                showAjaxModal_alert('Grade deleted successfully!', 'success');
                setTimeout(function() { location.reload(); }, 1200);
            }).fail(function() {
                showAjaxModal_alert('An error occurred while deleting the grade', 'error');
            });
        },
        'Delete',
        'danger'
    );
}
</script>
