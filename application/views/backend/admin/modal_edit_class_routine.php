<?php 
$edit_data		=	$this->db->get_where('class_routine' , array('class_routine_id' => $param2) )->result_array();
?>
<style>
/* Direct UX refinement — Edit Class Routine modal */
.routine-edit-modal { padding: 4px !important; }
.routine-edit-modal .box-content { padding: 14px 10px 4px; }
.routine-edit-modal form { margin: 0; }
.routine-edit-modal .form-group { margin-bottom: 15px; }
.routine-edit-modal .control-label {
    padding-top: 11px; color: #334155; font-size: 14px; font-weight: 700;
}
.routine-edit-modal .form-control,
.routine-edit-modal .selectboxit-container .selectboxit {
    min-height: 46px; height: 46px; border: 1px solid #cbd5e1;
    border-radius: 9px; background: #fff; color: #0f172a; font-size: 15px;
}
.routine-edit-modal .form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
}
.routine-edit-modal .selectboxit-container,
.routine-edit-modal .selectboxit-container .selectboxit { width: 100% !important; }
.routine-edit-modal .col-sm-9 > .col-md-3 { padding-left: 0; padding-right: 10px; }
.routine-edit-modal #section_subject_edit_holder .form-group { margin-bottom: 15px; }
.routine-edit-modal button[type="submit"] {
    min-height: 44px; padding: 9px 18px; border-radius: 9px;
    background: #2563eb; border-color: #2563eb; color: #fff;
    font-size: 14px; font-weight: 800;
}
.routine-edit-modal button[type="submit"]:hover { background: #1d4ed8; border-color: #1d4ed8; }

@media (max-width: 767px) {
    .routine-edit-modal .box-content { padding: 10px 4px 2px; }
    .routine-edit-modal .control-label { padding-top: 0; margin-bottom: 6px; text-align: left; }
    .routine-edit-modal .col-sm-5,
    .routine-edit-modal .col-sm-9,
    .routine-edit-modal .col-md-3 { width: 100%; padding-left: 15px; padding-right: 15px; margin-bottom: 8px; }
    .routine-edit-modal button[type="submit"] { width: 100%; }
}
</style>

<div class="tab-pane box active routine-edit-modal" id="edit" style="padding: 5px">
    <div class="box-content">
        <?php foreach($edit_data as $row):?>
        <?php echo form_open(site_url('admin/class_routine/do_update/'.$row['class_routine_id'])  , array('class' => 'form-horizontal validatable','target'=>'_top'));?>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('class');?></label>
                    <div class="col-sm-5">
                        <select id="class_id" name="class_id" class="form-control selectboxit" onchange="section_subject_select(this.value , <?php echo $param2;?>)">
                            <?php 
                            $classes = $this->db->get('class')->result_array();
                            foreach($classes as $row2):
                            ?>
                                <option value="<?php echo $row2['class_id'];?>" <?php if($row['class_id']==$row2['class_id'])echo 'selected';?>>
                                    <?php echo $row2['name'].' '.$row2['name_numeric'];?></option>
                            <?php
                            endforeach;
                            ?>
                        </select>
                    </div>
                </div>
                <div id="section_subject_edit_holder"></div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('day');?></label>
                    <div class="col-sm-5">
                        <select name="day" class="form-control selectboxit">
                            <option value="saturday" 	<?php if($row['day']=='saturday')echo 'selected="selected"';?>>Saturday</option>
                            <option value="sunday" 		<?php if($row['day']=='sunday')echo 'selected="selected"';?>>Sunday</option>
                            <option value="monday" 		<?php if($row['day']=='monday')echo 'selected="selected"';?>>Monday</option>
                            <option value="tuesday" 	<?php if($row['day']=='tuesday')echo 'selected="selected"';?>>Tuesday</option>
                            <option value="wednesday" 	<?php if($row['day']=='wednesday')echo 'selected="selected"';?>>Wednesday</option>
                            <option value="thursday" 	<?php if($row['day']=='thursday')echo 'selected="selected"';?>>Thursday</option>
                            <option value="friday" 		<?php if($row['day']=='friday')echo 'selected="selected"';?>>Friday</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('starting_time');?></label>
                    <div class="col-sm-9">
                        <?php 
                            if($row['time_start'] < 13)
                            {
                                $time_start		=	$row['time_start'];
                                $time_start_min =   $row['time_start_min'];
                                $starting_ampm	=	1;
                            }
                            else if($row['time_start'] > 12)
                            {
                                $time_start		=	$row['time_start'] - 12;
                                $time_start_min =   $row['time_start_min'];
                                $starting_ampm	=	2;
                            }
                            
                        ?>
                        <div class="col-md-3">
                            <select name="time_start" class="form-control" required>
                            <option value=""><?php echo get_phrase('hour');?></option>
                                <?php for($i = 0; $i <= 12 ; $i++):?>
                                    <option value="<?php echo $i;?>" <?php if($i ==$time_start)echo 'selected="selected"';?>>
                                        <?php echo $i;?></option>
                                <?php endfor;?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select name="time_start_min" class="form-control" required>
                            <option value=""><?php echo get_phrase('minutes');?></option>
                                <?php for($i = 0; $i <= 11 ; $i++):

                                    if(strlen($i) == 1) $i = '0'.$i;
                                    ?>
                                    <option value="<?php echo $i * 5;?>" <?php if (($i * 5) == $time_start_min) echo 'selected';?>><?php echo $i * 5;?></option>
                                <?php endfor;?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select name="starting_ampm" class="form-control selectboxit">
                                <option value="1" <?php if($starting_ampm	==	'1')echo 'selected="selected"';?>>am</option>
                                <option value="2" <?php if($starting_ampm	==	'2')echo 'selected="selected"';?>>pm</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('ending_time');?></label>
                    <div class="col-sm-9">
                        
                        
                        <?php 
                            if($row['time_end'] < 13)
                            {
                                $time_end		=	$row['time_end'];
                                $time_end_min   =   $row['time_end_min'];
                                $ending_ampm	=	1;
                            }
                            else if($row['time_end'] > 12)
                            {
                                $time_end		=	$row['time_end'] - 12;
                                $time_end_min   =   $row['time_end_min'];
                                $ending_ampm	=	2;
                            }
                            
                        ?>
                        <div class="col-md-3">
                            <select name="time_end" class="form-control" required>
                            <option value=""><?php echo get_phrase('hour');?></option>
                                <?php for($i = 0; $i <= 12 ; $i++):?>
                                    <option value="<?php echo $i;?>" <?php if($i ==$time_end)echo 'selected="selected"';?>>
                                        <?php echo $i;?></option>
                                <?php endfor;?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select name="time_end_min" class="form-control" required>
                            <option value=""><?php echo get_phrase('minutes');?></option>
                                <?php for($i = 0; $i <= 11 ; $i++):

                                    if(strlen($i) == 1) $i = '0'.$i;
                                    ?>
                                    <option value="<?php echo $i * 5;?>" <?php if (($i * 5) == $time_end_min) echo 'selected';?>><?php echo $i * 5;?></option>
                                <?php endfor;?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select name="ending_ampm" class="form-control selectboxit">
                                <option value="1" <?php if($ending_ampm	==	'1')echo 'selected="selected"';?>>am</option>
                                <option value="2" <?php if($ending_ampm	==	'2')echo 'selected="selected"';?>>pm</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                  <div class="col-sm-offset-3 col-sm-5">
                      <button type="submit" class="btn btn-success"><?php echo get_phrase('edit_class_routine');?></button>
                  </div>
                </div>
        </form>
        <?php endforeach;?>
    </div>
</div>

<script type="text/javascript">
    function section_subject_select(class_id , class_routine_id) {
        $.ajax({
            url: '<?php echo site_url('admin/section_subject_edit/');?>' + class_id + '/' + class_routine_id ,
            success: function(response)
            {
                jQuery('#section_subject_edit_holder').html(response);
            }
        });
    }
</script>

<script type="text/javascript">
    $(document).ready(function() {
        var class_id = $('#class_id').val();
        var class_routine_id = '<?php echo $param2;?>';
        section_subject_select(class_id,class_routine_id);
        
    }); 
</script>

