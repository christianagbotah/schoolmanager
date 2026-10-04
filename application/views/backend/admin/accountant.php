<style>
/* Direct UI/UX rebuild — Accountants workspace */
.accountants-workspace {
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.accountants-page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.accountants-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.accountants-page-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.accountants-page-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.accountants-add-btn {
    min-height: 44px;
    padding: 10px 16px !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    white-space: nowrap;
}
.accountants-add-btn:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
}
.accountants-workspace .alert {
    margin-bottom: 14px;
    border-radius: 10px;
    font-size: 14px;
}
.accountants-table-card {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#table_export {
    width: 100% !important;
    min-width: 920px;
    margin: 0 !important;
    border: 0 !important;
}
#table_export thead th {
    padding: 12px 13px !important;
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    border-bottom: 1px solid #e2e8f0 !important;
}
#table_export tbody td {
    padding: 12px 13px !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle;
    border-bottom: 1px solid #eef2f7 !important;
}
#table_export tbody tr:hover td { background: #f8fbff; }
#table_export td[style*="letter-spacing"] {
    color: #475569 !important;
    font-size: 13px !important;
    letter-spacing: .12em !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
#table_export .btn-group > .btn {
    min-height: 36px;
    padding: 7px 10px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
}
#table_export .btn-group > .btn-success { background: #059669; border-color: #059669; }
#table_export .btn-group > .btn-danger { background: #dc2626; border-color: #dc2626; }
#table_export .btn-group > .btn-info { background: #0284c7; border-color: #0284c7; }
#table_export .dropdown-menu {
    min-width: 175px;
    padding: 6px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
}
#table_export .dropdown-menu > li > a {
    min-height: 38px;
    padding: 9px 11px !important;
    border-radius: 7px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #334155 !important;
    font-size: 14px;
}
#table_export .dropdown-menu > li > a:hover { background: #f1f5f9; }
.accountants-table-card .dataTables_wrapper {
    min-width: 920px;
    padding: 14px;
}
.accountants-table-card .dataTables_length,
.accountants-table-card .dataTables_filter,
.accountants-table-card .dataTables_info,
.accountants-table-card .dataTables_paginate {
    color: #475569;
    font-size: 14px;
}
.accountants-table-card .dataTables_length select,
.accountants-table-card .dataTables_filter input[type="search"] {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
}
@media (max-width: 767px) {
    .accountants-workspace { padding: 18px 14px 32px; }
    .accountants-page-head {
        align-items: stretch;
        flex-direction: column;
    }
    .accountants-page-head h1 { font-size: 26px; }
    .accountants-add-btn { width: 100%; text-align: center; }
}
</style>

<div class="accountants-workspace">
    <div class="accountants-page-head">
        <div>
            <p class="accountants-eyebrow">People & Finance</p>
            <h1>Accountants</h1>
            <p>Manage finance staff accounts, credentials, access status, and account lifecycle actions.</p>
        </div>
        <a href="javascript:;" onclick="showAjaxModal('<?php echo site_url('modal/popup/accountant_add');?>');"
           class="btn btn-primary accountants-add-btn">
            <i class="entypo-plus-circled"></i>
            <?php echo get_phrase('add_new_accountant');?>
        </a>
    </div>

<?php if(validation_errors()) :?>
<div class="alert alert-danger alert-dismissible" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
    </button>
   <strong> <?php echo validation_errors(); ?></strong>
</div>
<?php endif;?>

<div class="accountants-table-card">
<table class="table table-bordered datatable" id="table_export">
    <thead>
        <tr>
            <th><div><?php echo get_phrase('name');?></div></th>
            <th><div><?php echo get_phrase('phone');?></div></th>
            <th><div><?php echo get_phrase('email');?></div></th>
            <th><div><?php echo get_phrase('auth_key');?></div></th>
            <th><div><?php echo get_phrase('account_status');?></div></th>
            <th><div><?php echo get_phrase('options');?></div></th>
        </tr>
    </thead>
    <tbody>
        <?php
        $count = 1;
        $accountants   =   $this->db->get('accountant')->result_array();
        foreach($accountants as $row): ?>

            <?php 
                if($row['block_limit'] == 3) {
                    $as_btn = 'Blocked';
                    $btn_style = 'danger';
                    $btn_cont = '<span class="caret"></span></button><ul class="dropdown-menu dropdown-default pull-right" role="menu"><li><a href="#" onclick="account_unblock('.$row['accountant_id'].')" style="color: green;"><i class="fa fa-unlock"></i>&nbsp;'.get_phrase('unblock').'</a></li></li></ul>';
                } else {
                    $as_btn = 'Active';
                    $btn_style = 'success';
                    $btn_cont = '<span class="caret"></span></button><ul class="dropdown-menu dropdown-default pull-right" role="menu"><li><a href="#" onclick="account_block('.$row['accountant_id'].')" style="color: red;"><i class="glyphicon glyphicon-lock"></i>&nbsp;'.get_phrase('block').'</a></li></li></ul>';
                }

            $account_status = '<div class="btn-group"><button type="button" class="btn btn-'.$btn_style.' btn-sm dropdown-toggle" data-toggle="dropdown">
                                '.$as_btn.' '.$btn_cont.'</div>';
            ?>

            <tr>
                <td><?php echo $row['name'];?></td>
                <td><?php echo $row['phone'];?></td>
                <td><?php echo $row['email'];?></td>
                <td style="font-weight: bolder; letter-spacing: 3px;"><?php echo $row['authentication_key'];?></td>
                <td><?php echo $account_status;?></td>
                <td>

                    <div class="btn-group">
                        <button type="button" class="btn btn-info btn-sm dropdown-toggle" data-toggle="dropdown">
                            Action <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu dropdown-default pull-right" role="menu">

                            <li>
                                <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/accountant_edit/' . $row['accountant_id']);?>')" style='color: green;'>
                                    <i class="entypo-pencil"></i>
                                    <?php echo get_phrase('edit');?>
                                </a>
                            </li>
                            <li class="divider"></li>

                            <li>
                                <a href="#" onclick="accountant_delete_confirm(<?php echo $row['accountant_id'];?>);" style='color: red;'>
                                    <i class="entypo-trash"></i>
                                    <?php echo get_phrase('delete');?>
                                </a>
                            </li>
                        </ul>
                    </div>

                </td>
            </tr>
        <?php endforeach;?>
    </tbody>
</table>
</div>
</div>


<!-----  DATA TABLE EXPORT CONFIGURATIONS ---->
<script type="text/javascript">

    jQuery(document).ready(function($)
    {
        $('#table_export').dataTable();
    });

    function accountant_delete_confirm(accountant_id) {
        showConfirmModal(
            'Confirm Delete Accountant',
            'Are you sure you want to delete this accountant? This action cannot be undone.',
            function() {
                $('.close').click();
                showAjaxModal_alert('Please wait...<i class="fa fa-3x fa-spinner fa-pulse"></i>.', 'Loading');
                $.ajax({
                    url: '<?php echo site_url('admin/accountant/delete/');?>' + accountant_id,
                    type: 'POST',
                    dataType: 'json',
                })
                .done(function(response) {
                    if(response.message == 'done') {
                        showAjaxModal_alert('Accountant deleted successfully.', 'Success');

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

    function account_block(accountant_id) {
        showConfirmModal(
            'Confirm Block Accountant',
            'Are you sure you want to block this accountant account? They will not be able to log in until unblocked.',
            function() {
                $('.close').click();
                showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder;">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

                $.ajax({
                    url: '<?php echo site_url('admin/accountant/block/');?>' + accountant_id,
                    type: 'POST',
                    dataType: 'html',
                })
                .done(function(response) {
                    showAjaxModal_alert('Account Blocked Successfully', 'Success');

                    setTimeout(() => {
                        navigation('<?php echo site_url('admin/accountant');?>');
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

    function account_unblock(accountant_id) {
        showConfirmModal(
            'Confirm Unblock Accountant',
            'Are you sure you want to unblock this accountant account? They will be able to log in again.',
            function() {
                $('.close').click();
                showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder;">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

                $.ajax({
                    url: '<?php echo site_url('admin/accountant/unblock/');?>' + accountant_id,
                    type: 'POST',
                    dataType: 'html',
                })
                .done(function(response) {
                    showAjaxModal_alert('Account Unblocked Successfully', 'Success');

                    setTimeout(() => {
                        navigation('<?php echo site_url('admin/accountant');?>');
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

</script>
