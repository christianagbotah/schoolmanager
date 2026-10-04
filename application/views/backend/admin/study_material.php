<script src="<?php echo base_url(); ?>assets/cdn/js/tailwindcss.js"></script>

<style>
.study-material-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    background: #f8fafc;
    min-height: 100%;
    color: #334155;
}
.study-material-head {
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.study-material-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.study-material-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.study-material-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.study-filter-card,
.study-table-card {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.study-filter-card {
    margin-bottom: 16px;
    padding: 14px;
}
.study-filter-row {
    display: grid;
    grid-template-columns: minmax(150px,1.05fr) minmax(170px,1.1fr) minmax(145px,.8fr) minmax(145px,.8fr) auto;
    gap: 10px;
    align-items: end;
}
.study-filter-field {
    min-width: 0;
}
.study-filter-field label {
    display: block;
    margin: 0 0 6px;
    color: #475569;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.study-filter-field select,
.study-filter-field input {
    width: 100%;
    height: 44px !important;
    min-height: 44px !important;
    padding: 9px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff !important;
    color: #0f172a !important;
    font-size: 14px !important;
    line-height: 1.35;
    box-sizing: border-box;
}
.study-filter-field input[type="date"] { cursor: pointer; }
.study-filter-field select:focus,
.study-filter-field input:focus {
    border-color: #2563eb !important;
    outline: 0 !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
}
.study-filter-actions {
    display: flex;
    gap: 7px;
    align-items: center;
    white-space: nowrap;
}
.study-filter-actions button {
    min-height: 44px;
    padding: 9px 13px !important;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #334155;
    font-size: 13px !important;
    font-weight: 800;
    box-shadow: none;
}
.study-filter-actions button.primary {
    border-color: #2563eb;
    background: #2563eb;
    color: #fff;
}
.study-filter-actions button:hover { background: #f8fafc; }
.study-filter-actions button.primary:hover { background: #1d4ed8; }
.study-table-card { overflow: hidden; }
.study-table-holder { min-height: 180px; overflow-x: auto; }
.study-loading,
.study-error {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    padding: 28px;
    color: #64748b;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
}
.study-error { color: #b91c1c; }

/* Styles applied to the table returned by admin/study_material/load. */
.study-material-workspace #table-2 {
    width: 100% !important;
    min-width: 980px;
    margin: 0 !important;
    border-collapse: collapse !important;
    font-size: 14px !important;
    line-height: 1.45;
}
.study-material-workspace #table-2 thead th {
    padding: 11px 12px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 12px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    text-transform: uppercase;
    white-space: nowrap;
}
.study-material-workspace #table-2 tbody td {
    padding: 11px 12px !important;
    border-bottom: 1px solid #eef2f7 !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle !important;
}
.study-material-workspace #table-2 tbody tr:hover { background: #f8fbff; }
.study-material-workspace .table-responsive-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}
.study-material-workspace .dataTables_wrapper {
    width: 100% !important;
    min-width: 980px;
    padding: 14px !important;
}
.study-material-workspace .dataTables_length,
.study-material-workspace .dataTables_filter,
.study-material-workspace .dataTables_info,
.study-material-workspace .dataTables_paginate {
    color: #475569 !important;
    font-size: 13px !important;
}
.study-material-workspace .dataTables_length select,
.study-material-workspace .dataTables_filter input {
    min-height: 38px !important;
    height: 38px !important;
    padding: 7px 9px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    background: #fff !important;
    color: #0f172a !important;
    font-size: 14px !important;
}
.study-material-workspace .dataTables_length label,
.study-material-workspace .dataTables_filter label {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    color: #475569 !important;
    font-size: 13px !important;
    font-weight: 700 !important;
}
.study-material-workspace .bulk-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #2563eb;
}

.bulk-actions-bar {
    position: fixed;
    left: 50%;
    bottom: 14px;
    z-index: 9999;
    display: none;
    align-items: center;
    gap: 7px;
    width: max-content;
    max-width: calc(100vw - 28px);
    padding: 9px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 11px;
    background: rgba(255,255,255,.98);
    box-shadow: 0 12px 28px rgba(15,23,42,.18);
    transform: translateX(-50%) translateY(18px);
    opacity: 0;
    transition: transform .2s ease, opacity .2s ease;
    backdrop-filter: blur(8px);
}
.bulk-actions-bar.show {
    display: flex;
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}
.bulk-actions-count {
    padding: 0 8px;
    color: #0f172a;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
}
.bulk-actions-bar button {
    min-height: 38px;
    padding: 7px 10px !important;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    font-size: 12px !important;
    font-weight: 800;
    white-space: nowrap;
    box-shadow: none;
}
.bulk-actions-bar button.approve { border-color: #10b981; color: #047857; }
.bulk-actions-bar button.decline { border-color: #ef4444; color: #b91c1c; }
.bulk-actions-bar button.pending { border-color: #f59e0b; color: #b45309; }

@media (max-width: 1120px) {
    .study-filter-row { grid-template-columns: 1fr 1fr 1fr 1fr; }
    .study-filter-actions { grid-column: 1 / -1; justify-content: flex-end; }
}
@media (max-width: 767px) {
    .study-material-workspace { padding: 18px 14px 32px !important; }
    .study-material-head h1 { font-size: 26px !important; }
    .study-filter-row { grid-template-columns: 1fr; }
    .study-filter-actions { grid-column: auto; display: grid; grid-template-columns: 1fr 1fr; }
    .study-filter-field select,
    .study-filter-field input { font-size: 16px !important; }
    .bulk-actions-bar {
        width: calc(100vw - 20px);
        max-width: none;
        flex-wrap: wrap;
        justify-content: center;
        bottom: 10px;
    }
    .bulk-actions-count { width: 100%; text-align: center; }
}
@media (max-width: 460px) {
    .study-filter-actions { grid-template-columns: 1fr; }
    .bulk-actions-bar button { flex: 1 1 45%; }
}
</style>

<?php
$classes = $this->db->order_by('name_numeric', 'ASC')->get('class')->result_array();
$teachers = $this->db->order_by('name', 'ASC')->get('teacher')->result_array();
?>

<div class="study-material-workspace">
    <div class="study-material-head">
        <p class="study-material-eyebrow">Academics</p>
        <h1><?php echo get_phrase('study_materials'); ?></h1>
        <p><?php echo get_phrase('review_and_approve_study_materials'); ?> Filter by class, teacher or date, then review individual or bulk status changes.</p>
    </div>

    <div class="study-filter-card">
        <div class="study-filter-row">
            <div class="study-filter-field">
                <label for="filter_class"><i class="fa fa-users"></i> Class</label>
                <select id="filter_class">
                    <option value="">All Classes</option>
                    <?php foreach($classes as $class):
                        $section = $this->db->get_where('section', array('class_id' => $class['class_id']))->row_array();
                        $section_name = !empty($section['name']) ? ' - ' . $section['name'] : '';
                        $class_label = trim($class['name'] . ' ' . $class['name_numeric'] . $section_name);
                    ?>
                        <option value="<?php echo (int)$class['class_id']; ?>"><?php echo html_escape($class_label); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="study-filter-field">
                <label for="filter_teacher"><i class="fa fa-user"></i> Teacher</label>
                <select id="filter_teacher">
                    <option value="">All Teachers</option>
                    <?php foreach($teachers as $teacher): ?>
                        <option value="<?php echo (int)$teacher['teacher_id']; ?>"><?php echo html_escape($teacher['name']); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="study-filter-field">
                <label for="filter_start_date"><i class="fa fa-calendar"></i> From</label>
                <input type="date" id="filter_start_date">
            </div>

            <div class="study-filter-field">
                <label for="filter_end_date"><i class="fa fa-calendar"></i> To</label>
                <input type="date" id="filter_end_date">
            </div>

            <div class="study-filter-actions">
                <button type="button" class="primary" onclick="applyFilters()"><i class="fa fa-search"></i> Apply</button>
                <button type="button" onclick="clearFilters()"><i class="fa fa-undo"></i> Clear</button>
            </div>
        </div>
    </div>

    <div class="study-table-card">
        <div class="study-table-holder" id="table_holder">
            <div class="study-loading"><span>Loading study materials… <i class="fa fa-spinner fa-spin"></i></span></div>
        </div>
    </div>
</div>

<div class="bulk-actions-bar" id="bulk-actions-bar" aria-live="polite">
    <span class="bulk-actions-count" id="selected-count">0 selected</span>
    <button type="button" class="approve" onclick="bulkApprove()"><i class="fa fa-check"></i> Approve</button>
    <button type="button" class="decline" onclick="bulkDecline()"><i class="fa fa-times"></i> Decline</button>
    <button type="button" class="pending" onclick="bulkPending()"><i class="fa fa-clock"></i> Pending</button>
    <button type="button" onclick="clearSelection()"><i class="fa fa-undo"></i> Clear</button>
</div>

<script>
$(function() {
    loadTable();
});

function studyNotify(message, type) {
    if (typeof showAjaxModal_alert === 'function') {
        showAjaxModal_alert(message, type || 'info');
    } else {
        alert(message);
    }
}

function currentStudyFilters() {
    return {
        class_id: $('#filter_class').val(),
        teacher_id: $('#filter_teacher').val(),
        start_date: $('#filter_start_date').val(),
        end_date: $('#filter_end_date').val()
    };
}

function loadTable(filters) {
    filters = filters || {};
    $('#table_holder').html('<div class="study-loading"><span>Loading study materials… <i class="fa fa-spinner fa-spin"></i></span></div>');

    $.ajax({
        url: '<?php echo site_url('admin/study_material/load'); ?>',
        type: 'POST',
        dataType: 'html',
        cache: false,
        data: filters
    }).done(function(response) {
        $('#table_holder').html(response);
        updateBulkActions();
    }).fail(function() {
        $('#table_holder').html('<div class="study-error">Could not load study materials. Please try again.</div>');
    });
}

function applyFilters() {
    loadTable(currentStudyFilters());
}

function clearFilters() {
    $('#filter_class, #filter_teacher').val('');
    $('#filter_start_date, #filter_end_date').val('');
    clearSelection();
    loadTable();
}

function updateStatus(status, id) {
    if (!status || !id) return;

    $.ajax({
        url: '<?php echo site_url('admin/study_material/update_status'); ?>',
        type: 'POST',
        dataType: 'text',
        cache: false,
        data: {id: id, status: status}
    }).done(function() {
        loadTable(currentStudyFilters());
    }).fail(function(xhr) {
        studyNotify(xhr.responseText || 'Could not update the material status.', 'error');
    });
}

function updateBulkActions() {
    var count = $('.material-checkbox:checked').length;
    $('#selected-count').text(count + ' selected');
    $('#bulk-actions-bar').toggleClass('show', count > 0);
}

function getSelectedIds() {
    var ids = [];
    $('.material-checkbox:checked').each(function() {
        ids.push($(this).data('id'));
    });
    return ids;
}

function bulkApprove() {
    var ids = getSelectedIds();
    if (!ids.length) return;
    showConfirmModal(
        'Approve Materials',
        'Are you sure you want to approve ' + ids.length + ' selected material(s)?',
        function() { bulkUpdateStatus(ids, 'Approved'); },
        'Approve',
        'success'
    );
}

function bulkDecline() {
    var ids = getSelectedIds();
    if (!ids.length) return;
    showConfirmModal(
        'Decline Materials',
        'Are you sure you want to decline ' + ids.length + ' selected material(s)?',
        function() { bulkUpdateStatus(ids, 'Declined'); },
        'Decline',
        'danger'
    );
}

function bulkPending() {
    var ids = getSelectedIds();
    if (!ids.length) return;
    showConfirmModal(
        'Mark as Pending',
        'Are you sure you want to mark ' + ids.length + ' selected material(s) as pending?',
        function() { bulkUpdateStatus(ids, 'Pending'); },
        'Mark Pending',
        'warning'
    );
}

function bulkUpdateStatus(ids, status) {
    $.ajax({
        url: '<?php echo site_url('admin/study_material/bulk_update_status'); ?>',
        type: 'POST',
        dataType: 'json',
        data: {ids: ids, status: status}
    }).done(function(response) {
        if (response.status === 'success') {
            studyNotify(response.message || 'Status updated successfully.', 'success');
            clearSelection();
            loadTable(currentStudyFilters());
        } else {
            studyNotify(response.message || 'Failed to update status.', 'error');
        }
    }).fail(function(xhr) {
        studyNotify(xhr.responseText || 'Could not update the selected materials.', 'error');
    });
}

function clearSelection() {
    $('.material-checkbox').prop('checked', false);
    $('#select-all').prop('checked', false);
    updateBulkActions();
}

function toggleSelectAll(checked) {
    $('.material-checkbox').prop('checked', checked);
    updateBulkActions();
}
</script>
