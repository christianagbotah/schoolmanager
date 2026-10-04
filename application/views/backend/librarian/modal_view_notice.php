<?php
$edit_data = $this->db->get_where('noticeboard', array('notice_id' => $param2))->result_array();

//get id of the user who accessed this page and marked this message as read
$account_type = $this->session->userdata('login_type');

if($account_type == 'admin') {
    $user_id = $this->db->get_where('admin', array('admin_id' => $this->session->userdata('admin_id')))->row()->admin_id;
}elseif($account_type == 'accountant') {
    $user_id = $this->db->get_where('accountant', array('accountant_id' => $this->session->userdata('accountant_id')))->row()->accountant_id;
}elseif($account_type == 'parent') {
    $user_id = $this->db->get_where('parent', array('parent_id' => $this->session->userdata('parent_id')))->row()->parent_id;
}elseif($account_type == 'teacher') {
    $user_id = $this->db->get_where('teacher', array('teacher_id' => $this->session->userdata('teacher_id')))->row()->teacher_id;
}elseif($account_type == 'student') {
    $user_id = $this->db->get_where('student', array('student_id' => $this->session->userdata('student_id')))->row()->student_id;
}elseif($account_type == 'librarian') {
    $user_id = $this->db->get_where('librarian', array('librarian_id' => $this->session->userdata('librarian_id')))->row()->librarian_id;
}
?>

<style>
/* Direct UI/UX rebuild — Notice Detail modal */
.notice-detail-modal {
    padding: 4px 2px 2px;
}
.notice-detail-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 14px;
}
.notice-detail-toolbar .btn {
    min-height: 40px;
    padding: 8px 13px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 800 !important;
}
.notice-detail-card {
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #fff;
}
.notice-detail-card-body {
    padding: 20px;
}
.notice-detail-title-label,
.notice-detail-body-label {
    margin: 0 0 5px;
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
}
.notice-detail-title {
    margin: 0;
    color: #0f172a;
    font-size: 22px;
    line-height: 1.3;
    font-weight: 800;
}
.notice-detail-image {
    display: block;
    width: auto;
    max-width: 100%;
    max-height: 320px;
    margin: 16px 0;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    object-fit: contain;
}
.notice-detail-divider {
    height: 1px;
    margin: 16px 0;
    background: #e2e8f0;
}
.notice-detail-copy {
    color: #334155;
    font-size: 15px;
    line-height: 1.65;
}
.notice-detail-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding-top: 2px;
}
.notice-detail-date {
    color: #475569;
    font-size: 14px;
    font-weight: 700;
}
.notice-detail-read {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
}
.notice-detail-read .control-label {
    margin: 0;
    padding: 0;
    color: #334155;
    font-size: 14px;
    font-weight: 800;
}
@media (max-width: 767px) {
    .notice-detail-card-body { padding: 16px; }
    .notice-detail-title { font-size: 20px; }
    .notice-detail-footer {
        align-items: flex-start;
        flex-direction: column;
    }
}
@media print {
    .notice-detail-toolbar,
    .notice-detail-read { display: none !important; }
    .notice-detail-card {
        border: 0;
        box-shadow: none;
    }
}
</style>

<div class="notice-detail-modal">
    <?php foreach ($edit_data as $row): ?>
        <div class="notice-detail-toolbar hidden-print">
            <a onClick="PrintElem('#notice_print')" class="btn btn-info btn-icon icon-left">
                <?php echo get_phrase('print'); ?> <?php echo get_phrase('notice'); ?>
                <i class="entypo-print"></i>
            </a>
        </div>

        <div id="notice_print">
            <div class="notice-detail-card">
                <div class="notice-detail-card-body">
                    <p class="notice-detail-title-label"><?php echo get_phrase('title'); ?></p>
                    <h2 class="notice-detail-title"><?php echo $row['notice_title']; ?></h2>

                    <?php if (!empty($row['image'])): ?>
                        <img class="notice-detail-image"
                             src="<?php echo base_url(); ?>uploads/frontend/noticeboard/<?php echo $row['image'];?>"
                             alt="<?php echo $row['notice_title']; ?>">
                    <?php endif; ?>

                    <div class="notice-detail-divider"></div>

                    <p class="notice-detail-body-label"><?php echo get_phrase('notice'); ?></p>
                    <div class="notice-detail-copy"><?php echo $row['notice']; ?></div>

                    <div class="notice-detail-divider"></div>

                    <div class="notice-detail-footer">
                        <div class="notice-detail-date">
                            <strong><?php echo get_phrase('date'); ?>:</strong>
                            <?php echo date('d M Y', $row['create_timestamp']); ?>
                        </div>

                        <?php echo form_open('', array('class' => 'notice-detail-read')); ?>
                            <label class="control-label" for="marked_read"><?php echo get_phrase('mark_as_read'); ?></label>
                            <div class="switch-button showcase-switch-button">
                                <input id="marked_read"
                                       type="checkbox"
                                       value="<?php echo $param2; ?>"
                                       name="marked_read">
                                <label for="marked_read"></label>
                            </div>
                            <input type="hidden" name="user_id" id="user_id" value="<?php echo $user_id; ?>">
                        </form>
                    </div>
                </div>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<script type="text/javascript">
function PrintElem(elem)
{
    Popup($(elem).html());
}

function Popup(data)
{
    var mywindow = window.open('', 'notice', 'height=600,width=800');
    mywindow.document.write('<html><head><title>Notice</title>');
    mywindow.document.write('<link rel="stylesheet" href="<?php echo base_url(); ?>assets/css/neon-theme.css" type="text/css" />');
    mywindow.document.write('<link rel="stylesheet" href="<?php echo base_url(); ?>assets/css/design-system.css" type="text/css" />');
    mywindow.document.write('</head><body>');
    mywindow.document.write(data);
    mywindow.document.write('</body></html>');

    var is_chrome = Boolean(mywindow.chrome);
    if (is_chrome) {
        setTimeout(function() {
            mywindow.print();
            mywindow.close();
            return true;
        }, 250);
    } else {
        mywindow.print();
        mywindow.close();
        return true;
    }

    return true;
}
</script>