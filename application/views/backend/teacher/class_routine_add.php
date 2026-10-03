<style>
/* Direct UX rebuild — Teacher Add Class Routine */
body { background: #f8fafc; }
.routine-add-workspace { margin: 0 !important; padding: 24px 28px 40px; }
.routine-add-workspace > .col-md-12 { padding: 0 !important; }
.routine-add-head {
    margin: 0 0 18px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;
}
.routine-add-head .eyebrow {
    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
}
.routine-add-head h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2; font-weight: 800; letter-spacing: -.02em;
}
.routine-add-head p {
    margin: 7px 0 0; max-width: 760px; color: #64748b; font-size: 15px; line-height: 1.5;
}
.routine-add-workspace form {
    max-width: 980px; padding: 22px 20px; border: 1px solid #e2e8f0;
    border-radius: 14px; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.routine-add-workspace .form-group { margin-bottom: 16px; }
.routine-add-workspace .control-label {
    padding-top: 11px; color: #334155; font-size: 14px; font-weight: 700;
}
.routine-add-workspace .form-control,
.routine-add-workspace .selectboxit-container .selectboxit {
    min-height: 46px; height: 46px; border: 1px solid #cbd5e1; border-radius: 9px;
    background: #fff; color: #0f172a; font-size: 15px;
}
.routine-add-workspace .form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
}
.routine-add-workspace .selectboxit-container { width: 100% !important; }
.routine-add-workspace .selectboxit-container .selectboxit { width: 100% !important; }
.routine-add-workspace .col-sm-9 > .col-md-3 { padding-left: 0; padding-right: 10px; }
.routine-add-workspace #section_subject_selection_holder .form-group { margin-bottom: 16px; }
.routine-add-workspace #add_class_routine {
    min-height: 44px; padding: 9px 18px; border-radius: 9px;
    background: #2563eb; border-color: #2563eb; color: #fff; font-size: 14px; font-weight: 800;
}
.routine-add-workspace #add_class_routine:hover { background: #1d4ed8; border-color: #1d4ed8; }

@media (max-width: 767px) {
    .routine-add-workspace { padding: 18px 14px 32px; }
    .routine-add-head h1 { font-size: 26px; }
    .routine-add-workspace form { padding: 18px 14px; }
    .routine-add-workspace .control-label { padding-top: 0; margin-bottom: 6px; text-align: left; }
    .routine-add-workspace .col-sm-5,
    .routine-add-workspace .col-sm-9,
    .routine-add-workspace .col-md-3 { width: 100%; padding-left: 15px; padding-right: 15px; margin-bottom: 8px; }
    .routine-add-workspace #add_class_routine { width: 100%; }
}
</style>
<div class="routine-add-head">
    <p class="eyebrow">Academics</p>
    <h1>Add Class Routine</h1>
    <p>Choose the class, section, subject, day and time range to add a timetable entry.</p>
</div>
<div class="row routine-add-workspace">
	<div class="col-md-12">
		
		<?php echo form_open(site_url('teacher/class_routine/create') , array('id' => 'class_routine_form', 'class' => 'form-horizontal form-groups validate','target'=>'_top'));?>
            <div class="form-group">
                <label class="col-sm-3 control-label"><?php echo get_phrase('class');?></label>
                <div class="col-sm-5">
                    <select name="class_id" id = "class_id" class="form-control selectboxit" style="width:100%;"
                        onchange="return get_class_section_subject(this.value)">
                        <option value=""><?php echo get_phrase('select_class');?></option>
                        <?php

                    getFullClassList();
                ?>
                    </select>
                </div>
            </div>
            <div id="section_subject_selection_holder"></div>
            
            <div class="form-group">
                <label class="col-sm-3 control-label"><?php echo get_phrase('day');?></label>
                <div class="col-sm-5">
                    <select name="day" class="form-control selectboxit" style="width:100%;">
                        <option value="sunday">Sunday</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="col-sm-3 control-label"><?php echo get_phrase('starting_time');?></label>
                <div class="col-sm-9">
                    <div class="col-md-3">
                        <select name="time_start" id= "starting_hour" class="form-control selectboxit">
                            <option value=""><?php echo get_phrase('hour');?></option>
                            <?php for($i = 0; $i <= 12 ; $i++):?>
                                <option value="<?php echo $i;?>"><?php echo $i;?></option>
                            <?php endfor;?>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="time_start_min" id= "starting_minute" class="form-control selectboxit">
                            <option value=""><?php echo get_phrase('minutes');?></option>
                            <?php for($i = 0; $i <= 11 ; $i++):?>
                                <option value="<?php echo $i * 5;?>"><?php echo $i * 5;?></option>
                            <?php endfor;?>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="starting_ampm" class="form-control selectboxit">
                            <option value="1">am</option>
                            <option value="2">pm</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="col-sm-3 control-label"><?php echo get_phrase('ending_time');?></label>
                <div class="col-sm-9">
                    <div class="col-md-3">
                        <select name="time_end" id= "ending_hour" class="form-control selectboxit">
                            <option value=""><?php echo get_phrase('hour');?></option>
                            <?php for($i = 0; $i <= 12 ; $i++):?>
                                <option value="<?php echo $i;?>"><?php echo $i;?></option>
                            <?php endfor;?>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="time_end_min" id= "ending_minute" class="form-control selectboxit">
                            <option value=""><?php echo get_phrase('minutes');?></option>  
                            <?php for($i = 0; $i <= 11 ; $i++):?>
                                <option value="<?php echo $i * 5;?>"><?php echo $i * 5;?></option>
                            <?php endfor;?>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select name="ending_ampm" class="form-control selectboxit">
                            <option value="1">am</option>
                            <option value="2">pm</option>
                        </select>
                    </div>
                </div>
            </div>
        <div class="form-group">
              <div class="col-sm-offset-3 col-sm-5">
                  <button type="submit" id= "add_class_routine" class="btn btn-info"><?php echo get_phrase('add_class_time_table');?></button>
              </div>
            </div>
    <?php echo form_close();?>

	</div>
</div>


<script type="text/javascript">
var class_id = '';
var starting_hour = '';
var starting_minute = '';
var ending_hour = '';
var ending_minute = '';
jQuery(document).ready(function($) {
    let loaded_class_id = '<?php echo $class_id; ?>';
    if(loaded_class_id != '' || loaded_class_id != null) {
        get_class_section_subject(loaded_class_id);
    }
    
    $('#class_routine_form').submit(function(e) {
        e.preventDefault();
        showAjaxModal_alert('Adding class routine...', 'loading');
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false
        }).done(function(response) {
            var data = typeof response === 'string' ? JSON.parse(response) : response;
            if(data.status === 'success') {
                showAjaxModal_alert(data.message, 'success');
                setTimeout(() => location.reload(), 2000);
            } else {
                showAjaxModal_alert(data.message || 'Operation failed', 'error');
            }
        }).fail(function() {
            showAjaxModal_alert('An error occurred', 'error');
        });
    });
});

function get_class_section_subject(class_id) {
    $.ajax({
        url: '<?php echo site_url('teacher/get_class_section_subject/');?>' + class_id ,
        success: function(response)
        {
            jQuery('#section_subject_selection_holder').html(response);
        }
    });
}

function check_validation(){
    if(class_id !== '' && starting_hour !== '' && starting_minute  !== '' && ending_hour  !== '' && ending_minute !== ''){
        $('#add_class_routine').removeAttr('disabled');
    }    
}

$('#class_id').change(function() {
    class_id = $('#class_id').val();
    check_validation();
});
$('#starting_hour').change(function() {
    starting_hour = $('#starting_hour').val();
    check_validation();
});
$('#starting_minute').change(function() {
    starting_minute = $('#starting_minute').val();
    check_validation();
});
$('#ending_hour').change(function() {
    ending_hour = $('#ending_hour').val();
    check_validation();
});
$('#ending_minute').change(function() {
    ending_minute = $('#ending_minute').val();
    check_validation();
});
</script>