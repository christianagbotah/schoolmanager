<?php
$name = $this->db->get_where(
    $this->session->userdata('login_type'),
    array($this->session->userdata('login_type') . '_id' => $this->session->userdata('login_user_id'))
)->row()->name;
$admin_level = $this->db->get_where('admin', array('name' => $name))->row()->level;

$display = 'none';
$alert_type = 'success';
$feedback = '';
if (isset($_GET['msg'])) {
    $msg_val = $_GET['msg'];
    if ($msg_val == 1) {
        $display = 'block';
        $alert_type = 'danger';
        $feedback = 'Did You Change This Student\'s ID No? Duplicate Found. Please Maintain The Old ID No!';
    } elseif ($msg_val == 2) {
        $display = 'block';
        $alert_type = 'danger';
        $feedback = 'Could Not Update. Invalid Email Found!';
    } elseif ($msg_val == 3) {
        $display = 'block';
        $alert_type = 'success';
        $feedback = 'Student\'s Information Updated Successfully';
    } elseif ($msg_val == 4) {
        $display = 'block';
        $alert_type = 'danger';
        $feedback = 'Did You Change This Student\'s Email? Duplicate Found. Please Maintain The Old Email Address!';
    } elseif ($msg_val == 5) {
        $display = 'block';
        $alert_type = 'success';
        $feedback = 'Student\'s Information Updated Successfully';
    }
}

$active_sms_service = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row()->description;
?>

<style>
.alumni-page { --al-border:#e5e7eb; --al-text:#172033; --al-muted:#667085; }
.alumni-page .al-hero,
.alumni-page .al-table-card {
    background:#fff;
    border:1px solid var(--al-border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
}
.alumni-page .al-hero { padding:24px; margin-bottom:18px; }
.alumni-page .al-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.alumni-page .al-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.alumni-page .al-icon {
    width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center;
    border-radius:14px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; font-size:22px;
}
.alumni-page .al-title { margin:0; color:var(--al-text); font-size:26px; line-height:1.2; font-weight:700; }
.alumni-page .al-subtitle { margin:6px 0 0; color:var(--al-muted); font-size:15px; line-height:1.5; }
.alumni-page .al-context {
    display:inline-flex; align-items:center; gap:7px; min-height:38px; padding:8px 12px; border-radius:999px;
    background:#f8fafc; border:1px solid var(--al-border); color:#475467; font-size:13px; font-weight:700; white-space:nowrap;
}
.alumni-page .alert { border-radius:12px; font-size:14px; line-height:1.5; margin-bottom:18px; }
.alumni-page .al-table-card { padding:18px; }
.alumni-page .al-table-scroll { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.alumni-page #old_students { width:100% !important; min-width:1080px; margin-bottom:0; }
.alumni-page #old_students thead th {
    background:#f8fafc; color:#475467; border-color:var(--al-border); padding:12px 10px;
    font-size:13px; font-weight:700; text-transform:none; vertical-align:middle;
}
.alumni-page #old_students tbody td { padding:11px 10px; border-color:var(--al-border); font-size:14px; color:#344054; vertical-align:middle; }
.alumni-page #old_students tbody tr:hover { background:#f9fbfd; }
.alumni-page .dataTables_wrapper .dataTables_length,
.alumni-page .dataTables_wrapper .dataTables_filter { margin-bottom:14px; color:#475467; font-size:14px; }
.alumni-page .dataTables_wrapper .dataTables_filter input,
.alumni-page .dataTables_wrapper .dataTables_length select {
    min-height:40px; border:1.5px solid var(--al-border); border-radius:10px; background:#fff; color:#172033;
    padding:7px 10px; font-size:14px; outline:none;
}
.alumni-page .dataTables_wrapper .dataTables_filter input:focus,
.alumni-page .dataTables_wrapper .dataTables_length select:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
.alumni-page .dataTables_wrapper .dataTables_info,
.alumni-page .dataTables_wrapper .dataTables_paginate { margin-top:14px; font-size:14px; color:#667085; }
.alumni-page .dataTables_wrapper .dataTables_paginate .paginate_button { border-radius:8px !important; }
.alumni-page .btn { min-height:38px; border-radius:9px; font-size:13px; font-weight:600; }
@media (max-width:767px) {
    .alumni-page .al-hero { padding:18px; }
    .alumni-page .al-hero-row { flex-direction:column; align-items:flex-start; }
    .alumni-page .al-title { font-size:22px; }
    .alumni-page .al-table-card { padding:12px; }
    .alumni-page .dataTables_wrapper .dataTables_filter,
    .alumni-page .dataTables_wrapper .dataTables_length { float:none; text-align:left; width:100%; }
    .alumni-page .dataTables_wrapper .dataTables_filter input { width:100%; margin:6px 0 0; }
}
</style>

<div class="alumni-page">
    <section class="al-hero" aria-labelledby="alumniTitle">
        <div class="al-hero-row">
            <div class="al-title-wrap">
                <div class="al-icon" aria-hidden="true"><i class="fa fa-user-graduate"></i></div>
                <div>
                    <h2 class="al-title" id="alumniTitle"><?php echo get_phrase('alumni/old_students'); ?></h2>
                    <p class="al-subtitle">Search and manage former students while retaining access to their profiles, results and account controls.</p>
                </div>
            </div>
            <span class="al-context"><i class="fa fa-database"></i><?php echo get_phrase('alumni_register'); ?></span>
        </div>
    </section>

    <?php if ($display === 'block' && $feedback !== ''): ?>
        <div class="alert alert-<?php echo htmlspecialchars($alert_type, ENT_QUOTES, 'UTF-8'); ?> alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <strong><?php echo htmlspecialchars($feedback, ENT_QUOTES, 'UTF-8'); ?></strong>
        </div>
    <?php endif; ?>

    <section class="al-table-card" aria-label="Alumni register">
        <div class="al-table-scroll">
            <table class="table table-bordered table-hover" id="old_students">
                <thead>
                    <tr>
                        <th><?php echo get_phrase('iD_no'); ?></th>
                        <th><?php echo get_phrase('photo'); ?></th>
                        <th><?php echo get_phrase('name'); ?></th>
                        <th><?php echo get_phrase('year_batch'); ?></th>
                        <th><?php echo get_phrase('address'); ?></th>
                        <th><?php echo get_phrase('email'); ?></th>
                        <th><?php echo get_phrase('auth_key'); ?></th>
                        <th><?php echo get_phrase('account_status'); ?></th>
                        <th><?php echo get_phrase('options'); ?></th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </section>
</div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    $.fn.dataTable.ext.errMode = 'throw';
    $('#old_students').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: "<?php echo site_url('admin/load_alumni'); ?>",
            dataType: 'json',
            type: 'POST'
        },
        columns: [
            { data: 'code' },
            { data: 'photo' },
            { data: 'name' },
            { data: 'year_batch' },
            { data: 'address' },
            { data: 'email' },
            { data: 'auth' },
            { data: 'account_status' },
            { data: 'options' }
        ],
        columnDefs: [
            { targets: [1, 5, 6, 7, 8], orderable: false }
        ],
        pageLength: 25,
        autoWidth: false
    });
});

function account_block(student_id) {
    confirm_modal('<?php echo site_url('admin/student/block/'); ?>' + student_id, 'modal_block', 'old_students');
}
function account_unblock(student_id) {
    confirm_modal('<?php echo site_url('admin/student/unblock/'); ?>' + student_id, 'modal_unblock', 'old_students');
}
function account_mute(student_id) {
    confirm_modal('<?php echo site_url('admin/student/mute/'); ?>' + student_id, 'modal_mute', 'old_students', 'old_students');
}
function account_unmute(student_id) {
    confirm_modal('<?php echo site_url('admin/student/unmute/'); ?>' + student_id, 'modal_unmute', 'old_students');
}
function student_delete(student_id) {
    confirm_modal("<?php echo site_url('admin/delete_student/'); ?>" + student_id);
}
function student_id_card(student_id) {
    showAjaxModal("<?php echo site_url('modal/popup/student_id/'); ?>" + student_id);
}
function student_edit(student_id) {
    showAjaxModal("<?php echo site_url('modal/popup/modal_student_edit/'); ?>" + student_id);
}
function student_profile(student_id) {
    navigation("<?php echo site_url('admin/student_profile/'); ?>" + student_id);
}
function student_sms(student_id) {
    navigation("<?php echo site_url('admin/message/sms_send?si='); ?>" + student_id);
}
function student_marksheet(student_id) {
    navigation("<?php echo site_url('admin/student_marksheet/'); ?>" + student_id);
}
function student_marksheet_creche(student_id) {
    navigation("<?php echo site_url('admin/student_marksheet_creche/'); ?>" + student_id);
}
</script>
