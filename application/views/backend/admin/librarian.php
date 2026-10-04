<style>
/* Direct UI/UX rebuild — Librarians workspace */
.librarians-workspace {
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.librarians-page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.librarians-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.librarians-page-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.librarians-page-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.librarians-add-btn {
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
.librarians-add-btn:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
}
.librarians-workspace .alert {
    margin-bottom: 14px;
    border-radius: 10px;
    font-size: 14px;
}
.librarians-table-card {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#table_export {
    width: 100% !important;
    min-width: 900px;
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
#table_export .btn-success { background: #059669; border-color: #059669; }
#table_export .btn-danger { background: #dc2626; border-color: #dc2626; }
#table_export .btn-info { background: #0284c7; border-color: #0284c7; }
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
.librarians-table-card .dataTables_wrapper {
    min-width: 900px;
    padding: 14px;
}
.librarians-table-card .dataTables_length,
.librarians-table-card .dataTables_filter,
.librarians-table-card .dataTables_info,
.librarians-table-card .dataTables_paginate {
    color: #475569;
    font-size: 14px;
}
.librarians-table-card .dataTables_length select,
.librarians-table-card .dataTables_filter input[type="search"] {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
}
@media (max-width: 767px) {
    .librarians-workspace { padding: 18px 14px 32px; }
    .librarians-page-head {
        align-items: stretch;
        flex-direction: column;
    }
    .librarians-page-head h1 { font-size: 26px; }
    .librarians-add-btn { width: 100%; text-align: center; }
}
</style>

<div class="librarians-workspace">
    <div class="librarians-page-head">
        <div>
            <p class="librarians-eyebrow">People & Library</p>
            <h1>Librarians</h1>
            <p>Manage library staff accounts, authentication access, status and account actions.</p>
        </div>
        <a href="javascript:;" onclick="showAjaxModal('<?php echo site_url('modal/popup/librarian_add');?>');"
           class="btn btn-primary librarians-add-btn">
            <i class="entypo-plus-circled"></i>
            <?php echo get_phrase('add_new_librarian');?>
        </a>
    </div>
<?php if(validation_errors()) :?>
<div class="alert alert-danger alert-dismissible" role="alert">
    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
    </button>
   <strong> <?php echo validation_errors(); ?></strong>
</div>
<?php endif;?>

<div class="librarians-table-card">
<table class="table table-bordered datatable" id="table_export">
    <thead>
        <tr>
            <th><div><?php echo get_phrase('name');?></div></th>
            <th><div><?php echo get_phrase('email');?></div></th>
            <th><div><?php echo get_phrase('auth_key');?></div></th>
            <th><div><?php echo get_phrase('phone');?></div></th>
            <th><div><?php echo get_phrase('account_status');?></div></th>
            <th><div><?php echo get_phrase('options');?></div></th>
        </tr>
    </thead>
    <tbody>
        <?php
        $count = 1;
        $librarians   =   $this->db->get('librarian')->result_array();
        foreach($librarians as $row): ?>

            <?php 
                if($row['block_limit'] == 3) {
                    $as_btn = 'Blocked';
                    $btn_style = 'danger';
                    $btn_cont = '<span class="caret"></span></button><ul class="dropdown-menu dropdown-default pull-right" role="menu"><li><a href="#" onclick="account_unblock('.$row['librarian_id'].')" style="color: green;"><i class="fa fa-unlock"></i>&nbsp;'.get_phrase('unblock').'</a></li></li></ul>';
                } else {
                    $as_btn = 'Active';
                    $btn_style = 'success';
                    $btn_cont = '<span class="caret"></span></button><ul class="dropdown-menu dropdown-default pull-right" role="menu"><li><a href="#" onclick="account_block('.$row['librarian_id'].')" style="color: red;"><i class="glyphicon glyphicon-lock"></i>&nbsp;'.get_phrase('block').'</a></li></li></ul>';
                }

            $account_status = '<div class="btn-group"><button type="button" class="btn btn-'.$btn_style.' btn-sm dropdown-toggle" data-toggle="dropdown">
                                '.$as_btn.' '.$btn_cont.'</div>';
            ?>

            <tr>
                <td><?php echo $row['name'];?></td>
                <td><?php echo $row['email'];?></td>
                <td style="font-weight: bolder; letter-spacing: 3px;"><?php echo $row['authentication_key'];?></td>
                <td><?php echo $row['phone'];?></td>
                <td><?php echo $account_status;?></td>
                <td>

                    <div class="btn-group">
                        <button type="button" class="btn btn-info btn-sm dropdown-toggle" data-toggle="dropdown">
                            Action <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu dropdown-default pull-right" role="menu">

                            <li>
                                <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/librarian_edit/'.$row['librarian_id']);?>');" style='color: green;'>
                                    <i class="entypo-pencil"></i>
                                    <?php echo get_phrase('edit');?>
                                </a>
                            </li>
                            <li class="divider"></li>

                            <li>
                                <a href="#" onclick="confirm_modal('<?php echo site_url('admin/librarian/delete/'.$row['librarian_id']);?>');" style='color: red;'>
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

    function account_block(librarian_id) {
        confirm_modal('<?php echo site_url('admin/librarian/block/');?>' + librarian_id, 'modal_block', 'librarian');   
    }

    function account_unblock(librarian_id) {
        confirm_modal('<?php echo site_url('admin/librarian/unblock/');?>' + librarian_id, 'modal_unblock', 'librarian');   
    }

</script>
