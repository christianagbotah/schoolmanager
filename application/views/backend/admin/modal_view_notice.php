<?php
$row = $this->db->get_where('noticeboard', array('notice_id' => $param2))->row_array();
if (!$row) {
    echo '<div style="padding:18px" class="alert alert-danger">Notice not found.</div>';
    return;
}

$account_type = $this->session->userdata('login_type');
$id_field = $account_type . '_id';
$user_id = (int)$this->session->userdata($id_field);
$read_ids = '';
if ($user_id && in_array($account_type, array('admin','accountant','librarian','parent','student','teacher'), true)) {
    $account_row = $this->db->select('read_notice_ids')->get_where($account_type, array($id_field => $user_id))->row_array();
    if ($account_row) $read_ids = (string)$account_row['read_notice_ids'];
}
$read_array = array_filter(array_map('trim', explode(',', $read_ids)), 'strlen');
$is_read = in_array((string)$param2, $read_array, true);
$image_file = !empty($row['image']) ? FCPATH . 'uploads/frontend/noticeboard/' . basename($row['image']) : '';
$has_image = $image_file && is_file($image_file);
?>
<style>
.notice-view{padding:18px;color:#334155;background:#fff}
.notice-view-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e2e8f0}
.notice-view-toolbar .btn{min-height:38px;padding:7px 11px!important;border-radius:8px!important;font-size:13px!important;font-weight:800!important}
.notice-read-state{display:inline-flex;align-items:center;gap:7px;padding:6px 9px;border-radius:999px;font-size:12px;font-weight:800}.notice-read-state.read{background:#ecfdf5;color:#047857}.notice-read-state.unread{background:#eff6ff;color:#1d4ed8}
.notice-print-card{max-width:760px;margin:0 auto;padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05)}
.notice-print-card h2{margin:0 0 7px;color:#0f172a;font-size:24px!important;line-height:1.25;font-weight:800}.notice-date{margin:0 0 14px;color:#64748b;font-size:13px;font-weight:700}.notice-hero{display:block;width:100%;max-height:320px;margin:0 0 16px;object-fit:cover;border-radius:11px;border:1px solid #e2e8f0}.notice-body{color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap}.notice-mark-read{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0}.notice-mark-read label{margin:0;color:#334155;font-size:14px;font-weight:800}.notice-mark-read input{width:20px;height:20px;cursor:pointer}
@media(max-width:600px){.notice-view{padding:14px}.notice-view-toolbar{align-items:flex-start;flex-direction:column}.notice-view-toolbar .btn{width:100%}.notice-print-card{padding:14px}.notice-print-card h2{font-size:21px!important}}
@media print{.notice-view-toolbar,.notice-mark-read{display:none!important}.notice-view{padding:0}.notice-print-card{max-width:none;border:0;box-shadow:none;padding:0}}
</style>
<div class="notice-view">
    <div class="notice-view-toolbar">
        <span id="notice_read_state" class="notice-read-state <?php echo $is_read ? 'read' : 'unread'; ?>"><i class="fa <?php echo $is_read ? 'fa-check-circle' : 'fa-circle'; ?>"></i> <?php echo $is_read ? 'Read' : 'Unread'; ?></span>
        <button type="button" class="btn btn-primary" onclick="PrintElem('#notice_print')"><i class="fa fa-print"></i> Print Notice</button>
    </div>

    <div id="notice_print" class="notice-print-card">
        <h2><?php echo html_escape($row['notice_title']); ?></h2>
        <p class="notice-date"><i class="fa fa-calendar"></i> <?php echo date('d M Y', (int)$row['create_timestamp']); ?></p>
        <?php if ($has_image): ?>
            <img class="notice-hero" src="<?php echo base_url('uploads/frontend/noticeboard/'.rawurlencode(basename($row['image']))); ?>" alt="Notice image">
        <?php endif; ?>
        <div class="notice-body"><?php echo html_escape($row['notice']); ?></div>
    </div>

    <?php if ($user_id): ?>
    <div class="notice-mark-read">
        <label for="marked_read">Mark this notice as read</label>
        <input id="marked_read" type="checkbox" value="<?php echo (int)$param2; ?>" name="marked_read" <?php echo $is_read ? 'checked disabled' : ''; ?>>
        <input type="hidden" name="user_id" id="user_id" value="<?php echo $user_id; ?>">
    </div>
    <?php endif; ?>
</div>
<script>
function PrintElem(elem){
    var content = $(elem).html();
    var mywindow = window.open('', 'notice', 'height=720,width=900');
    if(!mywindow) return false;
    mywindow.document.write('<!doctype html><html><head><title>Notice</title>');
    mywindow.document.write('<link rel="stylesheet" href="<?php echo base_url('assets/css/neon-theme.css'); ?>" type="text/css">');
    mywindow.document.write('<style>body{font-family:Arial,sans-serif;color:#1f2937;padding:30px}img{max-width:100%;height:auto}h2{font-size:24px}.notice-date{color:#64748b}.notice-body{font-size:15px;line-height:1.7;white-space:pre-wrap}</style>');
    mywindow.document.write('</head><body>'+content+'</body></html>');
    mywindow.document.close();
    mywindow.focus();
    setTimeout(function(){mywindow.print();mywindow.close();},250);
    return true;
}

$('#marked_read').on('change', function(){
    var checkbox = $(this);
    if(!checkbox.is(':checked')) return;
    var noticeId = checkbox.val();
    var userId = $('#user_id').val();
    var loggedInId = '<?php echo $user_id; ?>';
    $.ajax({
        url: '<?php echo site_url('admin/notifications_rows/'); ?>' + noticeId + '/' + userId + '/' + loggedInId,
        method: 'GET',
        success: function(){
            checkbox.prop('disabled', true);
            $('#notice_read_state').removeClass('unread').addClass('read').html('<i class="fa fa-check-circle"></i> Read');
        },
        error: function(){
            checkbox.prop('checked', false);
            if(typeof showAjaxModal_alert === 'function') showAjaxModal_alert('Could not mark this notice as read.','error');
        }
    });
});
</script>
