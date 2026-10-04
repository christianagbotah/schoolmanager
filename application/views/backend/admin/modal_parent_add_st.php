<?php 
$page_name = 'admit_student';
?>
<style>
/* Direct UI/UX rebuild — admission guardian creation modal */
.parent-admission-guardian-modal {
    margin: 0 !important;
}
.parent-admission-guardian-modal > .col-md-12 {
    padding: 0 !important;
}
.parent-admission-guardian-modal .panel.panel-primary {
    margin: 0 !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 14px !important;
    background: #fff;
    box-shadow: 0 10px 28px rgba(15,23,42,.10) !important;
    overflow: hidden;
}
.parent-admission-guardian-modal .panel-heading {
    padding: 15px 18px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #0f172a !important;
}
.parent-admission-guardian-modal .panel-title {
    color: #fff !important;
    font-size: 18px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.parent-admission-guardian-modal .panel-title i {
    margin-right: 7px;
    font-size: 15px;
}
.parent-admission-guardian-modal .panel-body {
    padding: 18px !important;
}
#parent_add_st_form {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 14px 16px;
}
#parent_add_st_form .form-group {
    margin: 0 !important;
    display: block;
}
#parent_add_st_form .form-group > .control-label,
#parent_add_st_form .form-group > [class*="col-"] {
    width: 100% !important;
    float: none !important;
    margin-left: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
}
#parent_add_st_form .control-label {
    display: block;
    margin: 0 0 7px;
    color: #334155;
    text-align: left;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700;
}
#parent_add_st_form .form-control {
    width: 100%;
    min-height: 46px;
    height: 46px;
    padding: 9px 11px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #0f172a;
    font-size: 15px;
    line-height: 1.4;
}
#parent_add_st_form .form-control:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
    outline: none;
}
#parent_add_st_form .form-group:nth-of-type(7),
#parent_add_st_form #designation_holder {
    grid-column: span 2;
}
#parent_add_st_form .form-group:nth-of-type(9) {
    grid-column: span 2;
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
}
#parent_add_st_form .form-check-inline {
    width: 18px;
    height: 18px;
    margin: 0 8px 0 0;
    vertical-align: middle;
    accent-color: #2563eb;
}
#parent_add_st_form #yes_no {
    font-size: 13px;
    font-weight: 800;
}
#parent_add_st_form > .form-group:last-of-type {
    grid-column: span 2;
    padding-top: 4px;
}
#parent_add_st_form > .form-group:last-of-type > div {
    width: 100% !important;
    float: none !important;
    margin-left: 0 !important;
    padding: 0 !important;
    display: flex;
    justify-content: flex-end;
}
#parent_add_st_form button[type="submit"] {
    min-height: 44px;
    padding: 9px 16px;
    border-radius: 9px;
    background: #2563eb;
    border-color: #2563eb;
    font-size: 14px;
    font-weight: 800;
}
#parent_add_st_form button[type="submit"]:hover {
    background: #1d4ed8;
    border-color: #1d4ed8;
}
@media (max-width: 767px) {
    .parent-admission-guardian-modal .panel-body { padding: 15px !important; }
    #parent_add_st_form { grid-template-columns: 1fr; }
    #parent_add_st_form .form-group:nth-of-type(7),
    #parent_add_st_form #designation_holder,
    #parent_add_st_form > .form-group:last-of-type {
        grid-column: 1;
    }
    #parent_add_st_form .form-control { font-size: 16px; }
    #parent_add_st_form > .form-group:last-of-type > div,
    #parent_add_st_form button[type="submit"] {
        width: 100%;
    }
}
</style>


<div class="row parent-admission-guardian-modal">
	<div class="col-md-12">
		<div class="panel panel-primary" data-collapsed="0">
        	<div class="panel-heading">
            	<div class="panel-title">
            		<i class="entypo-plus-circled"></i>
					<?php echo get_phrase('add_parent');?>
            	</div>
            </div>
			<div class="panel-body">
				
                <?php echo form_open(site_url('admin/parent/create/'.$page_name) , array('class' => 'form-horizontal form-groups-bordered validate', 'enctype' => 'multipart/form-data', 'id' => 'parent_add_st_form'));?>
                    
					<div class="form-group">
						<label for="field-1" class="col-sm-3 control-label"><?php echo get_phrase('name');?></label>
                        
						<div class="col-sm-5">
							<input type="text" class="form-control" name="name" id="p_name" data-validate="required" required="required" data-message-required="<?php echo get_phrase('value_required');?>" autofocus value="">
						</div>
					</div>
					
					<div class="form-group">
						<label for="guardian_relationship" class="col-sm-3 control-label">Guardian is the <span style="color:red">*</span></label>
						<div class="col-sm-5">
							<select name="guardian_is_the" class="form-control" id="guardian_relationship" required>
								<option value="">Select Relationship</option>
								<option value="father">Father</option>
								<option value="mother">Mother</option>
								<option value="other">Other Person</option>
							</select>
						</div>
					</div>

					<div class="form-group">
						<label for="guardian_gender" class="col-sm-3 control-label">Guardian Gender</label>
						<div class="col-sm-5">
							<select name="guardian_gender" class="form-control" id="guardian_gender">
								<option value="Male">Male</option>
								<option value="Female">Female</option>
							</select>
						</div>
					</div>
                    
					<div class="form-group">
						<label for="field-1" class="col-sm-3 control-label"><?php echo get_phrase('email');?></label>
						<div class="col-sm-5">
							<input type="email" class="form-control" name="email" value="">
						</div>
					</div>
					
					<div class="form-group">
						<label for="field-2" class="col-sm-3 control-label"><?php echo get_phrase('password');?></label>
                        
						<div class="col-sm-5">
							<input type="password" class="form-control" name="password" value="">
						</div>
					</div>
					
					<div class="form-group">
						<label for="field-2" class="col-sm-3 control-label"><?php echo get_phrase('phone');?></label>
                        
						<div class="col-sm-5">
							<input type="tel" class="form-control" name="phone[]" value="" required="required">
						</div>
					</div>
					
					<div class="form-group">
						<label for="field-2" class="col-sm-3 control-label"><?php echo get_phrase('address');?></label>
                        
						<div class="col-sm-5">
							<input type="text" class="form-control" name="address" value="" required="required">
						</div>
					</div>
					
					<div class="form-group">
						<label for="field-2" class="col-sm-3 control-label"><?php echo get_phrase('profession');?></label>
                        
						<div class="col-sm-5">
							<input type="text" class="form-control" name="profession" value="">
						</div>
					</div>
           
           <div class="form-group">
						<label for="field-2" class="col-sm-3 control-label">A PTA Executive</label>
                        
						<div class="col-sm-5">
							<input type="checkbox" class="form-check-inline" name="executive" id="executive" value="0" onchange="value_change()"> <span id="yes_no" style="color: #b3afaf">No</span>
						</div>
					</div>   

					<div class="form-group" id="designation_holder" style="display: none">
						<label for="field-2" class="col-sm-3 control-label"><?php echo get_phrase('designation');?></label>
                        
						<div class="col-sm-5">
							<input type="text" class="form-control" name="designation" id="designation" value="">
						</div>
					</div>

          <div class="form-group">
						<div class="col-sm-offset-3 col-sm-5">
							<button type="submit" class="btn btn-primary"><i class="glyphicon glyphicon-plus-sign"></i> <?php echo get_phrase('add_parent');?></button>
						</div>
					</div>
                <?php echo form_close();?>
            </div>
        </div>
    </div>
</div>

<script type="text/javascript">
	$(function() {
		value_change();
	});
	
	function value_change() {
       let is_executive = $('#executive').filter(':checked').length;
       if(is_executive > 0) {
            $('#executive').val(1);
            $('#yes_no').removeAttr('style');
            $('#designation').attr('required', 'required');
            $('#designation_holder').fadeIn('slow');
            $('#yes_no').text('YES');
            $('#yes_no').css('color', '#000000');
       } else {
        $('#executive').val(0);
        		$('#designation').removeAttr('required');
        		$('#designation_holder').fadeOut('slow');
        		$('#yes_no').text('NO');
        		$('#yes_no').css('color', '#b3afaf');
       }
    }

$('#parent_add_st_form').submit(function(event) {
    event.preventDefault();
    showAjaxModal_alert('Saving parent...', 'loading');
    
    var guardianRelationship = $('#guardian_relationship').val();

    $.ajax({
        url: $(this).attr('action'),
        type: 'POST',
        dataType: 'json',
        data: new FormData(this),
        cache: false,
        contentType: false,
        processData: false
    })
    .done(function(data) {
        if(data.status === 'success') {
            showAjaxModal_alert('Parent added successfully', 'success', false);
            setTimeout(() => {
                $('#modal_ajax .close').click();
                $('#modal_alert .close').click();
                reloadParentDropdownWithRelationship(data.parent_id, guardianRelationship);
            }, 2000);
        } else {
            showAjaxModal_alert(data.message || 'Failed to add parent', 'error');
        }
    })
    .fail(function() {
        showAjaxModal_alert('An error occurred. Please try again.', 'error');
    });
});

function reloadParentDropdownWithRelationship(newParentId, relationship) {
    $.ajax({
        url: '<?php echo site_url('admin/get_parent_dropdown'); ?>',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if(response.status === 'success') {
                let options = '<option value=""></option>';
                options += '<option value="new">➕ Register New Guardian</option>';
                
                response.parents.forEach(function(parent) {
                    let selected = parent.parent_id == newParentId ? 'selected' : '';
                    let phone = parent.phone ? ' • ' + parent.phone : '';
                    let profession = parent.profession ? ' • ' + parent.profession : '';
                    options += '<option value="' + parent.parent_id + '" ' + selected;
                    options += ' data-name="' + (parent.name || '') + '"';
                    options += ' data-phone="' + (parent.phone || '') + '"';
                    options += ' data-email="' + (parent.email || '') + '"';
                    options += ' data-address="' + (parent.address || '') + '"';
                    options += ' data-profession="' + (parent.profession || '') + '"';
                    options += '>' + parent.name + phone + profession + '</option>';
                });
                
                $('#parent_id').html(options).val(newParentId);
                
                if(typeof $.fn.select2 !== 'undefined') {
                    $('#parent_id').select2('destroy').select2({
                        allowClear: true,
                        placeholder: 'Search or select guardian...',
                        width: '100%'
                    });
                }
                
                $('#guardian_type_field').slideDown();
                $('#guardian_type').val(relationship).trigger('change');
            }
        }
    });
}

</script>
