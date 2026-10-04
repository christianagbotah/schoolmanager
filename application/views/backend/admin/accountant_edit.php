<style>
/* Direct UI/UX rebuild — Accountant form modal */
.accountant-form-modal {
    margin: 0 !important;
}
.accountant-form-modal > .col-md-12 { padding: 0 !important; }
.accountant-form-modal .panel.panel-primary {
    margin: 0 !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 14px !important;
    background: #fff;
    box-shadow: 0 10px 28px rgba(15,23,42,.10) !important;
    overflow: hidden;
}
.accountant-form-modal .panel-heading {
    padding: 15px 18px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #0f172a !important;
}
.accountant-form-modal .panel-title {
    color: #fff !important;
    font-size: 18px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.accountant-form-modal .panel-title i {
    margin-right: 7px;
    font-size: 15px;
}
.accountant-form-modal .panel-body { padding: 18px !important; }
.accountant-form-modal form {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 14px 16px;
}
.accountant-form-modal .form-group {
    margin: 0 !important;
    display: block;
}
.accountant-form-modal .form-group > .control-label,
.accountant-form-modal .form-group > [class*="col-"] {
    width: 100% !important;
    float: none !important;
    margin-left: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
}
.accountant-form-modal .control-label {
    display: block;
    margin: 0 0 7px;
    color: #334155;
    text-align: left;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700;
}
.accountant-form-modal .form-control {
    width: 100%;
    min-height: 46px;
    height: 46px;
    padding: 9px 11px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #0f172a;
    font-size: 15px;
}
.accountant-form-modal .form-control:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
    outline: none;
}
.accountant-form-modal .form-group:last-of-type {
    grid-column: 1 / -1;
    padding-top: 4px;
}
.accountant-form-modal .form-group:last-of-type > div {
    width: 100% !important;
    float: none !important;
    margin-left: 0 !important;
    padding: 0 !important;
    display: flex;
    justify-content: flex-end;
}
.accountant-form-modal button[type="submit"] {
    min-height: 44px;
    padding: 9px 16px;
    border-radius: 9px;
    background: #0284c7 !important;
    border-color: #0284c7 !important;
    color: #fff !important;
    font-size: 14px;
    font-weight: 800;
}
@media (max-width: 767px) {
    .accountant-form-modal .panel-body { padding: 15px !important; }
    .accountant-form-modal form { grid-template-columns: 1fr; }
    .accountant-form-modal .form-group:last-of-type { grid-column: 1; }
    .accountant-form-modal .form-control { font-size: 16px; }
    .accountant-form-modal .form-group:last-of-type > div,
    .accountant-form-modal button[type="submit"] { width: 100%; }
}
</style>

<?php
$edit_data = $this->db->get_where('accountant', array('accountant_id' => $param2))->result_array();
foreach($edit_data as $row) { ?>	
	<div class="row accountant-form-modal">
		<div class="col-md-12">
			<div class="panel panel-primary" data-collapsed="0">
	        	<div class="panel-heading">
	            	<div class="panel-title">
	            		<i class="entypo-plus-circled"></i>
						<?php echo get_phrase('edit_accountant');?>
	            	</div>
	            </div>

				<div class="panel-body">
					
	                <?php echo form_open(site_url('admin/accountant/edit/' . $param2), array('class' => 'form-horizontal form-groups-bordered validate', 'enctype' => 'multipart/form-data'));?>
	                    
						<div class="form-group">
							<label for="field-1" class="col-sm-3 control-label"><?php echo get_phrase('name');?></label>
	                        
							<div class="col-sm-5">
								<input type="text" class="form-control" name="name" data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>"  autofocus
	                            	value="<?php echo $row['name']; ?>" data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>">
							</div>
						</div>

						<div class="form-group">
							<label for="field-1" class="col-sm-3 control-label"><?php echo get_phrase('phone');?></label>
	                        
							<div class="col-sm-5">
								<input type="tel" class="form-control" name="phone[]" data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>"
	                            	value="<?php echo $row['phone']; ?>">
							</div>
						</div>
	                    
						<div class="form-group">
							<label for="field-1" class="col-sm-3 control-label"><?php echo get_phrase('email');?></label>
							<div class="col-sm-5">
								<input type="text" class="form-control" name="email" value="<?php echo $row['email']; ?>" data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>">
							</div>
						</div>
	                    
	                    <div class="form-group">
							<div class="col-sm-offset-3 col-sm-5">
								<button type="submit" class="btn btn-info"><?php echo get_phrase('update');?></button>
							</div>
						</div>

	                <?php echo form_close();?>

	            </div>
	        </div>
	    </div>
	</div>
<?php } ?>