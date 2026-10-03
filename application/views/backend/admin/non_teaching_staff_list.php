<?php 
    $active_sms_service = $this->db->get_where('settings' , array('type' => 'active_sms_service'))->row()->description;
    $account_type = $this->session->userdata('login_type');
    $admin_level = 1; // Default to allow access
    
    // Check admin level if admin user
    if ($account_type == 'admin') {
        $name = $this->db->get_where($this->session->userdata('login_type'), array($this->session->userdata('login_type').'_id' => $this->session->userdata('login_user_id')))->row()->name;
        $admin_level = $this->db->get_where('admin', array('name' => $name))->row()->level;
    }

    // Feedback messages
    $display = 'none';
    $alert_type = 'success';
    if(isset($_GET['msg'])) {
        $msg_val = $_GET['msg'];
        if($msg_val == 1) {
            $display = 'block';
            $alert_type = 'danger';
            $feedback = 'Invalid Staff Email Address';
        } else if($msg_val == 2) {
            $display = 'block';
            $alert_type = 'success';
            $feedback = 'Non-Teaching Staff Data Added Successfully';
        } else if($msg_val == 3) {
            $display = 'block';
            $alert_type = 'danger';
            $feedback = get_phrase('this_email_address_is_not_available');
        } else if($msg_val == 4) {
            $display = 'block';
            $alert_type = 'success';
            $feedback = 'Non-Teaching Staff Data Updated Successfully';
        } else if($msg_val == 5) {
            $display = 'block';
            $alert_type = 'danger';
            $feedback = 'Could Not Update Your Data. Invalid Email Found!';
        } else if($msg_val == 6) {
            $display = 'block';
            $alert_type = 'success';
            $feedback = 'Selected Non-Teaching Staff Deleted Successfully!';
        } else if($msg_val == 7) {
            $display = 'block';
            $alert_type = 'success';
            $feedback = get_phrase('user_account_blocked_successfully');
        } else if($msg_val == 8) {
            $display = 'block';
            $alert_type = 'success';
            $feedback = get_phrase('user_account_unblocked_successfully');
        } else if($msg_val == 9) {
            $display = 'block';
            $alert_type = 'danger';
            $feedback = 'SMS service error - Could not send welcome message';
        } else {
            $feedback = '';
        }
    } else {
        $feedback = '';
    }
?>

<style type="text/css">
/* Non-Teaching Staff workspace — modern enterprise presentation layer */
.non-teaching-workspace { padding: 24px 28px 40px; }
.non-teaching-page-head {
    display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;
    margin: 0 0 20px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;
}
.non-teaching-eyebrow {
    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
}
.non-teaching-page-title {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2; font-weight: 800; letter-spacing: -.02em;
}
.non-teaching-page-subtitle { margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5; }
.non-teaching-page-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
.non-teaching-page-actions a {
    min-height: 42px; padding: 9px 16px !important; border-radius: 9px !important;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 14px !important; font-weight: 700 !important; text-decoration: none !important;
}
.non-teaching-report-btn { background: #7c3aed; color: #fff !important; border: 1px solid #7c3aed; }
.non-teaching-report-btn:hover { background: #6d28d9; color: #fff !important; }

.non-teaching-table-card {
    width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;
    border: 1px solid #e2e8f0; border-radius: 14px; background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.04);
}
.non-teaching-table-card #non_teaching_staff {
    min-width: 1080px; margin: 0 !important; font-size: 14px !important;
}
.non-teaching-table-card #non_teaching_staff > thead > tr > th {
    padding: 12px 13px !important; background: #f8fafc !important; color: #475569 !important;
    font-size: 13px !important; font-weight: 800 !important; letter-spacing: .035em;
    border-bottom: 1px solid #e2e8f0 !important; vertical-align: middle;
}
.non-teaching-table-card #non_teaching_staff > tbody > tr > td {
    padding: 12px 13px !important; color: #334155; font-size: 14px !important;
    line-height: 1.45; vertical-align: middle; border-bottom: 1px solid #eef2f7;
}
.non-teaching-table-card #non_teaching_staff > tbody > tr:hover > td { background: #f8fbff; }
.non-teaching-table-card #non_teaching_staff thead tr:first-child th { padding: 12px 14px !important; }
.non-teaching-table-card #non_teaching_staff thead tr:first-child .grid {
    display: flex !important; align-items: center; gap: 8px !important; padding: 0 !important; text-transform: none;
}
.non-teaching-table-card #non_teaching_staff thead tr:first-child .grid > div {
    display: inline-flex; align-items: center; gap: 6px; min-height: 34px;
    padding: 6px 11px; border-radius: 999px; background: #f8fafc;
    border: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 700;
}
.non-teaching-table-card #non_teaching_staff thead tr:first-child strong {
    padding: 0 !important; background: transparent !important; border-radius: 0 !important;
    color: #0f172a; font-size: 14px;
}
.non-teaching-workspace .dataTables_wrapper { padding: 14px; }
.non-teaching-workspace .dataTables_wrapper .dataTables_length,
.non-teaching-workspace .dataTables_wrapper .dataTables_filter,
.non-teaching-workspace .dataTables_wrapper .dataTables_info,
.non-teaching-workspace .dataTables_wrapper .dataTables_paginate { font-size: 14px; color: #475569; }
.non-teaching-workspace .dataTables_wrapper select,
.non-teaching-workspace .dataTables_wrapper input[type="search"] {
    min-height: 40px; padding: 8px 10px; border: 1px solid #cbd5e1;
    border-radius: 8px; font-size: 14px; background: #fff; color: #0f172a;
}
.non-teaching-workspace .dataTables_wrapper input[type="search"]:focus,
.non-teaching-workspace .dataTables_wrapper select:focus {
    outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.non-teaching-workspace .alert { font-size: 14px; border-radius: 10px; }
.non-teaching-workspace .btn { min-height: 42px; font-size: 14px; font-weight: 700; border-radius: 9px; }

@media (max-width: 767px) {
    .non-teaching-workspace { padding: 18px 14px 32px; }
    .non-teaching-page-head { align-items: flex-start; flex-direction: column; }
    .non-teaching-page-actions { width: 100%; justify-content: flex-start; }
    .non-teaching-page-title { font-size: 26px; }
}
@media (max-width: 400px) {
    .non-teaching-page-actions a { width: 100%; }
}
</style>

<?php if(validation_errors()) :?>
<div class="alert alert-danger alert-dismissible" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
    </button>
    <strong><?php echo validation_errors(); ?></strong>
</div>
<?php endif;?>

<div style="display: <?= $display; ?>; margin-top: 10px" class="alert alert-<?= $alert_type; ?> alert-dismissible" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
    </button>
    <strong><?php echo $feedback; ?></strong>
</div>

<div class="non-teaching-workspace">
<div class="non-teaching-page-head">
    <div>
        <p class="non-teaching-eyebrow">People</p>
        <h1 class="non-teaching-page-title">Non-Teaching Staff</h1>
        <p class="non-teaching-page-subtitle">Manage administrative and support staff, contact details, positions, and account access.</p>
    </div>
    <div class="non-teaching-page-actions">
        <a href="<?= base_url().'admin/non_teaching_staff_gender_report/';?>" target="_blank" class="non-teaching-report-btn">
            <i class="fa fa-chart-pie"></i> Gender Report
        </a>
        <a href="javascript:;" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_non_teaching_staff_add/');?>');" class="btn btn-primary">
            <i class="fa-solid fa-user-plus"></i>
            Add New Non-Teaching Staff
        </a>
    </div>
</div>

<caption></caption>

<!-- Non-Teaching Staff DataTable -->
<div class="non-teaching-table-card">
<table class="table table-hover table-striped table-active w-full text-xl text-left rtl:text-right text-gray-500 dark:text-gray-600 datatable" id="non_teaching_staff">
    <thead class="text-lg font-bold text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 uppercase">
        <tr>
            <th colspan="9">
                <div class="grid grid-cols-3 gap-2 py-5">
                    <div>MALES: <strong id="males" class="p-3 bg-purple-100 rounded-full"></strong></div>
                    <div>FEMALES: <strong id="females" class="p-3 bg-purple-100 rounded-full"></strong></div>
                    <div>TOTAL: <strong id="total" class="p-3 bg-purple-100 rounded-full"></strong></div>
                </div>
            </th>
        </tr>
        <tr>
            <th scope="col" class="px-6 py-3">Photo</th>
            <th scope="col" class="px-6 py-3">Staff ID</th>
            <th scope="col" class="px-6 py-3">Name</th>
            <th scope="col" class="px-6 py-3">Gender</th>
            <th scope="col" class="px-6 py-3">Position</th>
            <th scope="col" class="px-6 py-3">Email</th>
            <th scope="col" class="px-6 py-3">Phone</th>
            <th scope="col" class="px-6 py-3">Account Status</th>
            <th scope="col" class="px-6 py-3">Options</th>
        </tr>
    </thead>
</table>
</div>
</div>



<!----- DATA TABLE EXPORT CONFIGURATIONS ---->
<script type="text/javascript">

jQuery(document).ready(function($) {
    $.fn.dataTable.ext.errMode = 'throw';
    let allNonTeachingStaff = $('#non_teaching_staff').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax":{
            "url": "<?php echo site_url('admin/get_non_teaching_staff') ?>",
            "dataType": "json",
            "type": "POST",
        },
        "columns": [
            { "data": "photo" },
            { "data": "staff_id" },
            { "data": "name" },
            { "data": "gender" },
            { "data": "position" },
            { "data": "email" },
            { "data": "phone" },
            { "data": "account_status" },
            { "data": "options" },
        ],
        "columnDefs": [
            {
                "targets": [0, 6, 7, 8],
                "orderable": false
            },
        ]
    });

    allNonTeachingStaff.on('xhr', function(json) {
        var json = allNonTeachingStaff.ajax.json();
        $('#males').text(json.totalMale || 0);
        $('#females').text(json.totalFemale || 0);
        $('#total').text(json.grandTotalGender || 0);
    });

    $(document).on('hidden.bs.modal', '#modal_confirm_staff', function() {
        toastr.info('Modal closed');
        location.reload();
    });
});

function non_teaching_staff_edit_modal(staff_id) {
    showAjaxModal('<?php echo site_url('modal/popup/modal_non_teaching_staff_edit/');?>' + staff_id);
}

function non_teaching_staff_delete_confirm(staff_id) {
    showConfirmModal(
        'Confirm Delete Non-Teaching Staff',
        'Are you sure you want to delete this non-teaching staff member? This action cannot be undone.',
        function() {
            $('.close').click();
            showAjaxModal_alert('Please wait...<i class="fa fa-3x fa-spinner fa-pulse"></i>.', 'Loading');
            $.ajax({
                url: '<?php echo site_url('admin/non_teaching_staff/delete/');?>' + staff_id,
                type: 'POST',
                dataType: 'json',
            })
            .done(function(response) {
                if(response.message == 'done') {
                    showAjaxModal_alert('Non-teaching staff deleted successfully.', 'Success');

                    setTimeout(() => {
                        $('.close').click();
                        navigation('<?php echo site_url('admin/'); ?>' + response.route);
                    }, 3000);
                } else {
                    showAjaxModal_alert('Deletion failed!', 'Error');
                }
            })
            .fail(function(err) {
                showAjaxModal_alert(err.responseText, 'Error');
            });
        },
        '<?php echo get_phrase('delete'); ?>',
        'danger'
    );
}

function account_block(staff_id) {
    showConfirmModal(
        'Confirm Block Non-Teaching Staff',
        'Are you sure you want to block this non-teaching staff account? They will not be able to log in until unblocked.',
        function() {
            $('.close').click();
            showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder;">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

            $.ajax({
                url: '<?php echo site_url('admin/non_teaching_staff/block/');?>' + staff_id,
                type: 'POST',
                dataType: 'html',
            })
            .done(function(response) {
                showAjaxModal_alert('Account Blocked Successfully', 'Success');

                setTimeout(() => {
                    navigation('<?php echo site_url('admin/non_teaching_staff');?>');
                    $('.modal').removeClass('modal-backdrop');
                    $('.modal').removeClass('fade');
                    $('.modal').removeClass('in');
                    $('.close').click();
                }, 3000);
            })
            .fail(function(err) {
                showAjaxModal_alert('Error: ' + err.responseText, 'Error');
            });
        },
        '<?php echo get_phrase('block'); ?>',
        'danger'
    );
}

function account_unblock(staff_id) {
    showConfirmModal(
        'Confirm Unblock Non-Teaching Staff',
        'Are you sure you want to unblock this non-teaching staff account? They will be able to log in again.',
        function() {
            $('.close').click();
            showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder;">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

            $.ajax({
                url: '<?php echo site_url('admin/non_teaching_staff/unblock/');?>' + staff_id,
                type: 'POST',
                dataType: 'html',
            })
            .done(function(response) {
                showAjaxModal_alert('Account Unblocked Successfully', 'Success');

                setTimeout(() => {
                    navigation('<?php echo site_url('admin/non_teaching_staff');?>');
                    $('.modal').removeClass('modal-backdrop');
                    $('.modal').removeClass('fade');
                    $('.modal').removeClass('in');
                    $('.close').click();
                }, 3000);
            })
            .fail(function(err) {
                showAjaxModal_alert('Error: ' + err.responseText, 'Error');
            });
        },
        '<?php echo get_phrase('unblock'); ?>',
        'success'
    );
}

function check_sms_status() {
    var active_sms_service = '<?php echo $active_sms_service; ?>';
    if(active_sms_service == '' || active_sms_service == 'disabled' || active_sms_service == null) {
        alert('No active SMS service found. Please go to System Settings and activate SMS service and try again');
        toastr.error('No active SMS service found. Please go to System Settings and activate SMS service and try again');
        return false;
    }
}

</script>
