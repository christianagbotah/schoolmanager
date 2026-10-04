<?php
$exam_count = is_array($exams) ? count($exams) : 0;
$exam_categories = $this->db->order_by('name', 'ASC')->get('exam_category')->result_array();
?>
<style>
.exam-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    background: #f8fafc;
    min-height: 100%;
    color: #334155;
}
.exam-page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.exam-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.exam-page-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.exam-page-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.exam-count-badge {
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
    white-space: nowrap;
}
.exam-tabs {
    display: flex;
    gap: 4px;
    margin: 0 0 14px;
    padding: 0;
    border-bottom: 1px solid #e2e8f0;
}
.exam-tab {
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
    cursor: pointer;
}
.exam-tab:hover {
    color: #1d4ed8;
    background: #f8fafc;
}
.exam-tab.active {
    border-bottom-color: #2563eb;
    color: #2563eb;
}
.exam-card {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.exam-table-shell {
    overflow-x: auto;
}
#exam_table {
    width: 100% !important;
    min-width: 760px;
    margin: 0 !important;
    border-collapse: collapse !important;
}
#exam_table thead th {
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
#exam_table tbody td {
    padding: 12px 13px !important;
    border-bottom: 1px solid #eef2f7 !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle !important;
}
#exam_table tbody tr:hover {
    background: #f8fbff;
}
.exam-name {
    color: #0f172a;
    font-size: 14px;
    font-weight: 800;
}
.exam-date {
    color: #475569;
    font-size: 14px;
}
.exam-category {
    display: inline-flex;
    align-items: center;
    min-height: 27px;
    padding: 5px 9px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #475569;
    font-size: 12px;
    font-weight: 800;
}
.exam-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    white-space: nowrap;
}
.exam-actions button {
    min-height: 36px;
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    box-shadow: none;
}
.exam-actions button:hover {
    background: #f8fafc;
}
.exam-actions .danger {
    border-color: #fecaca;
    color: #b91c1c;
}
.exam-empty {
    padding: 42px 18px;
    text-align: center;
    color: #64748b;
}
.exam-empty i {
    display: block;
    margin-bottom: 12px;
    color: #94a3b8;
    font-size: 34px;
}
.exam-empty h3 {
    margin: 0 0 6px;
    color: #0f172a;
    font-size: 18px;
    font-weight: 800;
}
.exam-empty p {
    margin: 0 0 14px;
    font-size: 14px;
}
.exam-empty .btn {
    min-height: 42px;
    padding: 8px 14px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
}
.exam-form-card {
    max-width: 880px;
    margin: 0 auto;
    padding: 18px;
}
.exam-form-head {
    margin-bottom: 16px;
    padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}
.exam-form-head h2 {
    margin: 0;
    color: #0f172a;
    font-size: 20px !important;
    font-weight: 800;
}
.exam-form-head p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 13px;
}
.exam-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.exam-field {
    margin: 0;
}
.exam-field.full {
    grid-column: 1 / -1;
}
.exam-field label {
    display: block;
    margin: 0 0 6px;
    color: #334155;
    font-size: 13px;
    font-weight: 800;
}
.exam-field input,
.exam-field select {
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
.exam-field input[type="date"] {
    cursor: pointer;
}
.exam-field input:focus,
.exam-field select:focus {
    border-color: #2563eb;
    outline: 0;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.exam-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
}
.exam-form-actions .btn {
    min-height: 44px;
    padding: 9px 15px !important;
    border-radius: 9px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.exam-form-actions .btn-primary {
    background: #2563eb !important;
    border-color: #2563eb !important;
}
.exam-workspace .dataTables_wrapper {
    min-width: 760px;
    padding: 14px;
}
.exam-workspace .dataTables_length,
.exam-workspace .dataTables_filter,
.exam-workspace .dataTables_info,
.exam-workspace .dataTables_paginate {
    color: #475569;
    font-size: 13px;
}
.exam-workspace .dataTables_length label,
.exam-workspace .dataTables_filter label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
}
.exam-workspace .dataTables_length select,
.exam-workspace .dataTables_filter input {
    min-height: 38px;
    height: 38px;
    padding: 7px 9px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
}
@media (max-width: 767px) {
    .exam-workspace { padding: 18px 14px 32px !important; }
    .exam-page-head { display: block; }
    .exam-page-head h1 { font-size: 26px !important; }
    .exam-count-badge { margin-top: 12px; }
    .exam-tabs { overflow-x: auto; white-space: nowrap; }
    .exam-form-grid { grid-template-columns: 1fr; }
    .exam-field.full { grid-column: auto; }
    .exam-field input,
    .exam-field select { font-size: 16px !important; }
    .exam-form-actions { display: grid; grid-template-columns: 1fr; }
}
</style>

<div class="exam-workspace">
    <div class="exam-page-head">
        <div>
            <p class="exam-eyebrow">Examination</p>
            <h1><?php echo get_phrase('exam_list'); ?></h1>
            <p>Create examination periods, review dates and categories, and manage existing exam definitions.</p>
        </div>
        <span class="exam-count-badge"><i class="fa fa-clipboard-list"></i> <?php echo (int)$exam_count; ?> exam<?php echo $exam_count === 1 ? '' : 's'; ?></span>
    </div>

    <div class="exam-tabs" role="tablist">
        <a href="#list" class="exam-tab active" id="list-tab" data-toggle="tab"><i class="fa fa-list"></i> Exam List</a>
        <a href="#add" class="exam-tab" id="add-tab" data-toggle="tab"><i class="fa fa-plus"></i> Add New Exam</a>
    </div>

    <div class="tab-content">
        <div class="tab-pane active" id="list">
            <div class="exam-card exam-table-shell">
                <?php if(empty($exams)): ?>
                    <div class="exam-empty">
                        <i class="fa fa-graduation-cap"></i>
                        <h3>No exams found</h3>
                        <p>Create the first exam definition to begin examination setup.</p>
                        <button type="button" class="btn btn-primary" onclick="$('#add-tab').click();"><i class="fa fa-plus"></i> Create First Exam</button>
                    </div>
                <?php else: ?>
                    <table class="table" id="exam_table">
                        <thead>
                            <tr>
                                <th><?php echo get_phrase('exam_name'); ?></th>
                                <th><?php echo get_phrase('date'); ?></th>
                                <th><?php echo get_phrase('category'); ?></th>
                                <th style="text-align:right"><?php echo get_phrase('actions'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php foreach($exams as $row):
                            $category_name = $this->crud_model->get_exam_category($row['category_id']);
                        ?>
                            <tr>
                                <td><div class="exam-name"><?php echo html_escape($row['name']); ?></div></td>
                                <td><div class="exam-date"><i class="fa fa-calendar" style="margin-right:6px"></i><?php echo html_escape(date('d M Y', strtotime($row['date']))); ?></div></td>
                                <td><span class="exam-category"><?php echo html_escape($category_name); ?></span></td>
                                <td>
                                    <div class="exam-actions">
                                        <button type="button" onclick="editExam(<?php echo (int)$row['exam_id']; ?>)" title="Edit Exam"><i class="fa fa-edit"></i> Edit</button>
                                        <button type="button" class="danger" onclick="deleteExam(<?php echo (int)$row['exam_id']; ?>)" title="Delete Exam"><i class="fa fa-trash"></i> Delete</button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>
        </div>

        <div class="tab-pane" id="add">
            <div class="exam-card exam-form-card">
                <div class="exam-form-head">
                    <h2>Create New Exam</h2>
                    <p>Define the exam name, date and category. Existing backend validation and workflow remain unchanged.</p>
                </div>

                <?php echo form_open(site_url('admin/exam/create'), array('id' => 'add_exam_form')); ?>
                    <div class="exam-form-grid">
                        <div class="exam-field full">
                            <label for="exam_name"><i class="fa fa-graduation-cap"></i> <?php echo get_phrase('exam_name'); ?> *</label>
                            <input id="exam_name" type="text" name="name" maxlength="255" placeholder="e.g. Mid-Term Examination" required>
                        </div>

                        <div class="exam-field">
                            <label for="exam_date"><i class="fa fa-calendar"></i> <?php echo get_phrase('exam_date'); ?> *</label>
                            <input id="exam_date" type="date" name="date" required>
                        </div>

                        <div class="exam-field">
                            <label for="exam_category"><i class="fa fa-folder"></i> <?php echo get_phrase('category'); ?> *</label>
                            <select id="exam_category" name="category_id" required>
                                <option value="">Select exam category</option>
                                <?php foreach($exam_categories as $rowc):
                                    $category_label = $this->crud_model->get_exam_category($rowc['category_id']);
                                ?>
                                    <option value="<?php echo (int)$rowc['category_id']; ?>"><?php echo html_escape($category_label); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="exam-form-actions">
                        <button type="button" class="btn btn-default" onclick="$('#list-tab').click();">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="create_exam_button"><i class="fa fa-save"></i> Create Exam</button>
                    </div>
                <?php echo form_close(); ?>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
$(function() {
    if ($('#exam_table').length && $.fn.DataTable && !$.fn.DataTable.isDataTable('#exam_table')) {
        $('#exam_table').DataTable({
            responsive: true,
            pageLength: 10,
            order: [[1, 'desc']],
            columnDefs: [{ orderable: false, targets: [3] }],
            language: {
                search: 'Search exams:',
                lengthMenu: 'Show _MENU_ exams per page',
                info: 'Showing _START_ to _END_ of _TOTAL_ exams',
                paginate: { first: 'First', last: 'Last', next: 'Next', previous: 'Previous' }
            }
        });
    }

    $('.exam-tab').on('click', function(e) {
        e.preventDefault();
        $('.exam-tab').removeClass('active');
        $(this).addClass('active');
        $('.exam-workspace .tab-pane').removeClass('active');
        $($(this).attr('href')).addClass('active');
    });

    $('#add_exam_form').on('submit', function(e) {
        e.preventDefault();
        var form = this;
        var button = $('#create_exam_button');
        button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Creating…');
        showAjaxModal_alert('Creating exam...', 'loading');

        $.ajax({
            url: $(form).attr('action'),
            type: 'POST',
            data: new FormData(form),
            cache: false,
            contentType: false,
            processData: false,
            dataType: 'json'
        }).done(function() {
            showAjaxModal_alert('Exam created successfully!', 'success');
            setTimeout(function() { location.reload(); }, 1200);
        }).fail(function(xhr) {
            var errorMsg = 'Failed to create exam';
            if (xhr.responseJSON && xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
            showAjaxModal_alert(errorMsg, 'error');
            button.prop('disabled', false).html('<i class="fa fa-save"></i> Create Exam');
        });
    });
});

function editExam(examId) {
    showAjaxModal('<?php echo site_url("modal/popup/modal_edit_exam/"); ?>' + examId);
}

function deleteExam(examId) {
    showConfirmModal(
        'Delete Exam',
        'Are you sure you want to delete this exam? This action cannot be undone and will also remove associated marks and aggregations.',
        function() {
            showAjaxModal_alert('Deleting exam...', 'loading');
            $.ajax({
                url: '<?php echo site_url("admin/exam/delete/"); ?>' + examId,
                type: 'GET',
                dataType: 'json'
            }).done(function(response) {
                if (response.message === 'done') {
                    showAjaxModal_alert('Exam deleted successfully!', 'success');
                    setTimeout(function() { location.reload(); }, 1200);
                } else {
                    showAjaxModal_alert('Failed to delete exam', 'error');
                }
            }).fail(function() {
                showAjaxModal_alert('An error occurred while deleting the exam', 'error');
            });
        },
        'Delete',
        'danger'
    );
}
</script>
