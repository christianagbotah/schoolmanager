<style type="text/css">
/* ---- family design-language alignment (presentation only) ---- */
.nav-tabs > li > a {
    border-radius: 10px 10px 0 0;
    font-weight: 600;
    color: #374151;
}
.nav-tabs > li.active > a { color: #111827; }
.panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
.panel > .panel-heading {
    background: transparent;
    border-bottom: 1px solid #f3f4f6;
    border-radius: 16px 16px 0 0;
    color: #111827;
}
.panel > .panel-heading .panel-title { font-size: 15px; font-weight: 700; color: #111827; }
.panel > .panel-body { padding: 18px; }
.btn {
    border-radius: 10px;
    font-weight: 600;
    transition: all .2s;
}
.btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}
.btn-success { background: #059669; border-color: #059669; }
.btn-danger { background: #dc2626; border-color: #dc2626; }
.btn-info { background: #0284c7; border-color: #0284c7; }
.btn-info:hover { background: #0369a1; border-color: #0369a1; }
.form-control, select.form-control {
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    height: 42px;
    font-size: 14px;
    transition: border-color .15s ease, box-shadow .15s ease;
}
.form-control:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    outline: none;
}
#student_invoice {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    border-collapse: separate;
}
#student_invoice th {
    background: #f9fafb;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border-bottom: 1px solid #e5e7eb !important;
    padding: 12px 10px;
}
#student_invoice td {
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
}
.dropdown-menu {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 10px 24px rgba(16, 24, 40, 0.12);
}
.dropdown-menu > li > a { padding: 10px 16px; }
.dropdown-menu > li > a:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 3px rgba(59, 130, 246, 0.4);
}
@media (prefers-reduced-motion: reduce) { .btn, .form-control { transition: none; } }
@media (max-width: 400px) {
    .panel > .panel-body { padding: 14px; }
    .form-control, select.form-control { height: 40px; }
}

/* Direct UI/UX rebuild — Invoice workspace */
.invoice-workspace { margin: 0; padding: 24px 28px 40px; background: #f8fafc; }
.invoice-workspace > .col-md-12 { padding: 0; }
.invoice-page-head {
    margin: 0 0 18px; padding: 0 0 18px; border-bottom: 1px solid #e2e8f0;
}
.invoice-eyebrow {
    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
}
.invoice-page-head h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2; font-weight: 800; letter-spacing: -.02em;
}
.invoice-page-head p:last-child {
    margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5;
}

.invoice-workspace .nav.nav-tabs.bordered {
    display: inline-flex; gap: 5px; margin: 0 0 16px !important; padding: 5px;
    border: 1px solid #e2e8f0 !important; border-radius: 12px; background: #fff;
}
.invoice-workspace .nav.nav-tabs.bordered > li { margin: 0 !important; }
.invoice-workspace .nav.nav-tabs.bordered > li > a {
    min-height: 40px; padding: 9px 14px !important; border: 0 !important; border-radius: 8px !important;
    background: transparent !important; color: #475569 !important; font-size: 14px; font-weight: 700;
}
.invoice-workspace .nav.nav-tabs.bordered > li > a:hover { background: #f1f5f9 !important; color: #0f172a !important; }
.invoice-workspace .nav.nav-tabs.bordered > li.active > a,
.invoice-workspace .nav.nav-tabs.bordered > li.active > a:hover,
.invoice-workspace .nav.nav-tabs.bordered > li.active > a:focus {
    background: #2563eb !important; color: #fff !important; box-shadow: 0 2px 8px rgba(37,99,235,.18);
}

.invoice-workspace .tab-content { padding: 0; }
#list, #add { padding: 0 !important; }
#list {
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    border: 1px solid #e2e8f0; border-radius: 14px; background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#student_invoice {
    width: 100% !important; min-width: 900px; margin: 0 !important; border: 0 !important; border-radius: 0 !important;
}
#student_invoice th {
    padding: 12px 13px !important; background: #f8fafc !important; color: #475569 !important;
    font-size: 13px !important; line-height: 1.35; font-weight: 800 !important; letter-spacing: .035em;
}
#student_invoice td {
    padding: 12px 13px !important; color: #334155 !important; font-size: 14px !important;
    line-height: 1.45; vertical-align: middle; border-bottom: 1px solid #eef2f7 !important;
}
#student_invoice tbody tr:hover td { background: #f8fbff; }
#student_invoice .btn-xs {
    min-height: 30px; padding: 5px 9px; border-radius: 999px; font-size: 12px !important; font-weight: 800;
}
#student_invoice .btn-sm {
    min-height: 38px; padding: 7px 11px; border-radius: 8px; font-size: 13px !important; font-weight: 700;
}
#student_invoice .dropdown-menu { min-width: 180px; padding: 6px; }
#student_invoice .dropdown-menu > li > a {
    min-height: 38px; padding: 9px 11px !important; border-radius: 7px;
    display: flex; align-items: center; gap: 8px; font-size: 14px;
}

.invoice-workspace .dataTables_wrapper { padding: 14px; }
.invoice-workspace .dataTables_wrapper .dataTables_length,
.invoice-workspace .dataTables_wrapper .dataTables_filter,
.invoice-workspace .dataTables_wrapper .dataTables_info,
.invoice-workspace .dataTables_wrapper .dataTables_paginate { font-size: 14px; color: #475569; }
.invoice-workspace .dataTables_wrapper select,
.invoice-workspace .dataTables_wrapper input[type="search"] {
    min-height: 40px; padding: 8px 10px; border: 1px solid #cbd5e1;
    border-radius: 8px; font-size: 14px; background: #fff; color: #0f172a;
}

#add > form > .row { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 18px; margin: 0; }
#add > form > .row > .col-md-6 { width: 100%; padding: 0; }
#add .panel {
    height: 100%; border-radius: 14px; border-color: #e2e8f0; box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#add .panel > .panel-heading {
    padding: 15px 18px; border-bottom-color: #eef2f7; background: #fff;
}
#add .panel > .panel-heading .panel-title { font-size: 17px; font-weight: 800; color: #0f172a; }
#add .panel > .panel-body { padding: 18px; }
#add .form-group { margin: 0 0 16px; }
#add .control-label {
    padding-top: 10px; color: #334155; font-size: 14px; line-height: 1.35; font-weight: 700;
}
#add .form-control, #add select.form-control {
    min-height: 46px; height: 46px; padding: 9px 12px; border: 1px solid #cbd5e1;
    border-radius: 9px; font-size: 15px; color: #0f172a; background: #fff;
}
#add .form-control:focus, #add select.form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.14); outline: none;
}
#add button[type="submit"] {
    min-height: 46px; padding: 10px 18px; border-radius: 9px; font-size: 15px; font-weight: 800;
    background: #2563eb; border-color: #2563eb;
}
#add button[type="submit"]:hover { background: #1d4ed8; border-color: #1d4ed8; }

@media (max-width: 991px) {
    #add > form > .row { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
    .invoice-workspace { padding: 18px 14px 32px; }
    .invoice-page-head h1 { font-size: 26px; }
    .invoice-workspace .nav.nav-tabs.bordered { display: grid; grid-template-columns: 1fr; width: 100%; }
    .invoice-workspace .nav.nav-tabs.bordered > li > a { width: 100%; }
    #add .control-label { padding-top: 0; margin-bottom: 7px; text-align: left; }
    #add .form-group > .col-sm-3,
    #add .form-group > .col-sm-9 { width: 100%; float: none; padding-left: 0; padding-right: 0; }
}
</style>
<div class="row invoice-workspace">
	<div class="col-md-12">
        <div class="invoice-page-head">
            <div>
                <p class="invoice-eyebrow">Fees & Finance</p>
                <h1>Invoices & Payments</h1>
                <p>Review student invoices and payments, or create a new invoice without leaving this workspace.</p>
            </div>
        </div>
    
    	<!------CONTROL TABS START------>
		<ul class="nav nav-tabs bordered">
			<li class="active">
            	<a href="#list" data-toggle="tab"><i class="entypo-menu"></i> 
					<?php echo get_phrase('invoice/payment_list');?>
                    	</a></li>
			<li>
            	<a href="#add" data-toggle="tab"><i class="entypo-plus-circled"></i>
					<?php echo get_phrase('add_invoice/payment');?>
                    	</a></li>
		</ul>
    	<!------CONTROL TABS END------>
		<div class="tab-content">
            <!----TABLE LISTING STARTS-->
            <div class="tab-pane box active" id="list">
				
                <table  class="table table-bordered datatable" id="student_invoice">
                	<thead>
                		<tr>
                            <th><div><?php echo get_phrase('title');?></div></th>
                    		<th><div><?php echo get_phrase('student');?></div></th>
                            <th><div><?php echo get_phrase('total');?></div></th>
                            <th><div><?php echo get_phrase('paid');?></div></th>
                    		<th><div><?php echo get_phrase('status');?></div></th>
                    		<th><div><?php echo get_phrase('date');?></div></th>
                    		<th><div><?php echo get_phrase('options');?></div></th>
						</tr>
					</thead>
                    <tbody>
                    	<?php foreach($invoices as $row):?>
                        <tr>
							<td><?php echo $row['title'];?></td>
							<td><?php echo $this->crud_model->get_type_name_by_id('student',$row['student_id']);?></td>
                            <td><?php echo $row['amount'];?></td>
                            <td><?php echo $row['amount_paid'];?></td>
                            <?php if($row['due'] == 0):?>
                                <td>
                                    <button class="btn btn-success btn-xs"><?php echo get_phrase('paid');?></button>
                                </td>
                            <?php endif;?>
                            <?php if($row['due'] > 0):?>
                                <td>
                                    <button class="btn btn-danger btn-xs"><?php echo get_phrase('unpaid');?></button>
                                </td>
                            <?php endif;?>
							<td><?php echo date('d M,Y', $row['creation_timestamp']);?></td>
							<td>
                            <div class="btn-group">
                                <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown">
                                    Action <span class="caret"></span>
                                </button>
                                <ul class="dropdown-menu dropdown-default pull-right" role="menu">

                                    <?php if ($row['due'] != 0):?>

                                    <li>
                                        <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment/'.$row['invoice_id']);?>');">
                                            <i class="entypo-bookmarks"></i>
                                                <?php echo get_phrase('take_payment');?>
                                        </a>
                                    </li>
                                    <li class="divider"></li>
                                    <?php endif;?>
                                    
                                    <!-- VIEWING LINK -->
                                    <li>
                                        <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup_professional/modal_view_invoice_professional/'.$row['invoice_code']);?>');">
                                            <i class="entypo-credit-card"></i>
                                                <?php echo get_phrase('view_invoice');?>
                                            </a>
                                                    </li>
                                    <li class="divider"></li>
                                    
                                    <!-- EDITING LINK -->
                                    <li>
                                        <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_edit_invoice/'.$row['invoice_id']);?>');">
                                            <i class="entypo-pencil"></i>
                                                <?php echo get_phrase('edit');?>
                                        </a>
                                    </li>
                                    <li class="divider"></li>

                                    <!-- DELETION LINK -->
                                    <li>
                                        <a href="#" onclick="confirm_modal('<?php echo site_url('admin/invoice/delete/'.$row['invoice_id']);?>');">
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
            <!----TABLE LISTING ENDS--->
            
            
			<!----CREATION FORM STARTS---->
			<div class="tab-pane box" id="add" style="padding: 5px">
            <?php echo form_open(site_url('admin/invoice/create'), array('class' => 'form-horizontal form-groups-bordered validate','target'=>'_top'));?>
                <div class="row">
                    <div class="col-md-6">
                        <div class="panel panel-default panel-shadow" data-collapsed="0">
                            <div class="panel-heading">
                                <div class="panel-title"><?php echo get_phrase('invoice_informations');?></div>
                            </div>
                            <div class="panel-body">
                                
                                <div class="form-group">
                                    <label class="col-sm-3 control-label"><?php echo get_phrase('student');?></label>
                                    <div class="col-sm-9">
                                        <select name="student_id" class="form-control" style="" >
                                            <?php 
                                            $this->db->order_by('class_id','asc');
                                            $students = $this->db->get('student')->result_array();
                                            foreach($students as $row):
                                            ?>
                                                <option value="<?php echo $row['student_id'];?>">
                                                    class <?php echo $this->crud_model->get_class_name($row['class_id']);?> -
                                                    roll <?php echo $row['roll'];?> -
                                                    <?php echo $row['name'];?>
                                                </option>
                                            <?php
                                            endforeach;
                                            ?>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-sm-3 control-label"><?php echo get_phrase('title');?></label>
                                    <div class="col-sm-9">
                                        <input type="text" class="form-control" name="title"/>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-3 control-label"><?php echo get_phrase('description');?></label>
                                    <div class="col-sm-9">
                                        <input type="text" class="form-control" name="description"/>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-sm-3 control-label"><?php echo get_phrase('date');?></label>
                                    <div class="col-sm-9">
                                        <input type="text" class="datepicker form-control" name="date"/>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="panel panel-default panel-shadow" data-collapsed="0">
                            <div class="panel-heading">
                                <div class="panel-title"><?php echo get_phrase('payment_informations');?></div>
                            </div>
                            <div class="panel-body">
                                
                                <div class="form-group">
                                    <label class="col-sm-3 control-label"><?php echo get_phrase('total');?></label>
                                    <div class="col-sm-9">
                                        <input type="text" class="form-control" name="amount"
                                            placeholder="<?php echo get_phrase('enter_total_amount');?>"/>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-sm-3 control-label"><?php echo get_phrase('payment');?></label>
                                    <div class="col-sm-9">
                                        <input type="text" class="form-control" name="amount_paid"
                                            placeholder="<?php echo get_phrase('enter_payment_amount');?>"/>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-sm-3 control-label"><?php echo get_phrase('status');?></label>
                                    <div class="col-sm-9">
                                        <select name="status" class="form-control">
                                            <option value="paid"><?php echo get_phrase('paid');?></option>
                                            <option value="unpaid"><?php echo get_phrase('unpaid');?></option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="col-sm-3 control-label"><?php echo get_phrase('method');?></label>
                                    <div class="col-sm-9">
                                        <select name="method" class="form-control">
                                            <option value="1"><?php echo get_phrase('cash');?></option>
                                            <option value="2"><?php echo get_phrase('check');?></option>
                                            <option value="3"><?php echo get_phrase('card');?></option>
                                        </select>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="col-sm-5">
                                <button type="submit" class="btn btn-info"><?php echo get_phrase('add_invoice');?></button>
                            </div>
                        </div>
                    </div>
                </div>
            <?php echo form_close();?>
			</div>
			<!----CREATION FORM ENDS-->
            
		</div>
	</div>
</div>

<script type="text/javascript">
    $(document).ready(function() {
        $('#student_invoice').dataTable();
    });
</script>