<style>
/* Direct UI/UX rebuild — Librarian form modal */
.librarian-form-modal {
    margin: 0 !important;
}
.librarian-form-modal > .col-md-12 { padding: 0 !important; }
.librarian-form-modal .panel.panel-primary {
    margin: 0 !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 14px !important;
    background: #fff;
    box-shadow: 0 10px 28px rgba(15,23,42,.10) !important;
    overflow: hidden;
}
.librarian-form-modal .panel-heading {
    padding: 15px 18px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #0f172a !important;
}
.librarian-form-modal .panel-title {
    color: #fff !important;
    font-size: 18px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.librarian-form-modal .panel-title i {
    margin-right: 7px;
    font-size: 15px;
}
.librarian-form-modal .panel-body { padding: 18px !important; }
.librarian-form-modal form {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 14px 16px;
}
.librarian-form-modal .form-group {
    margin: 0 !important;
    display: block;
}
.librarian-form-modal .form-group > .control-label,
.librarian-form-modal .form-group > [class*="col-"] {
    width: 100% !important;
    float: none !important;
    margin-left: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
}
.librarian-form-modal .control-label {
    display: block;
    margin: 0 0 7px;
    color: #334155;
    text-align: left;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700;
}
.librarian-form-modal .form-control {
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
.librarian-form-modal .form-control:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
    outline: none;
}
.librarian-form-modal .form-group:last-of-type {
    grid-column: 1 / -1;
    padding-top: 4px;
}
.librarian-form-modal .form-group:last-of-type > div {
    width: 100% !important;
    float: none !important;
    margin-left: 0 !important;
    padding: 0 !important;
    display: flex;
    justify-content: flex-end;
}
.librarian-form-modal button[type="submit"] {
    min-height: 44px;
    padding: 9px 16px;
    border-radius: 9px;
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
    font-size: 14px;
    font-weight: 800;
}
@media (max-width: 767px) {
    .librarian-form-modal .panel-body { padding: 15px !important; }
    .librarian-form-modal form { grid-template-columns: 1fr; }
    .librarian-form-modal .form-group:last-of-type { grid-column: 1; }
    .librarian-form-modal .form-control { font-size: 16px; }
    .librarian-form-modal .form-group:last-of-type > div,
    .librarian-form-modal button[type="submit"] { width: 100%; }
}
</style>

<div class="row librarian-form-modal">
	<div class="col-md-12">
		<div class="panel panel-primary" data-collapsed="0">
        	<div class="panel-heading">
            	<div class="panel-title">
            		<i class="entypo-plus-circled"></i>
					<?php echo get_phrase('add_librarian');?>
            	</div>
            </div>

			<div class="panel-body">

                <?php echo form_open(site_url('admin/librarian/create') , array('class' => 'form-horizontal form-groups-bordered validate', 'enctype' => 'multipart/form-data'));?>
                    
					<div class="form-group">
						<label for="field-1" class="col-sm-3 control-label"><?php echo get_phrase('name');?></label>
                        
						<div class="col-sm-5">
							<input type="text" class="form-control" name="name" data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>"  autofocus
                            	value="<?php echo set_value('name'); ?>">
						</div>
					</div>

					<div class="form-group">
						<label for="field-1" class="col-sm-3 control-label"><?php echo get_phrase('phone');?></label>
						<div class="col-sm-5">
							<input type="tel" class="form-control" name="phone[]" value="<?php echo set_value('phone') ?>" data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>">
						</div>
					</div>
                    
					<div class="form-group">
						<label for="field-1" class="col-sm-3 control-label"><?php echo get_phrase('email');?></label>
						<div class="col-sm-5">
							<input type="text" class="form-control" name="email" value="<?php echo set_value('email'); ?>" data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>">
						</div>
					</div>
					
					<div class="form-group">
						<label for="field-2" class="col-sm-3 control-label"><?php echo get_phrase('password');?></label>
                        
						<div class="col-sm-5">
							<input type="password" class="form-control" name="password" value="" data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>">
						</div>
					</div>
                    
                    <div class="form-group">
						<div class="col-sm-offset-3 col-sm-5">
							<button type="submit" class="btn btn-info"><i class="glyphicon glyphicon-plus-sign"></i> <?php echo get_phrase('submit');?></button>
						</div>
					</div>

                <?php echo form_close();?>

            </div>
        </div>
    </div>
</div>