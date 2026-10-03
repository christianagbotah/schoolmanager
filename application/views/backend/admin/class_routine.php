<style>
/* Direct UX rebuild — Admin Class Routine */
body { background: #f8fafc; }
.routine-admin-workspace { margin: 0 !important; padding: 24px 28px 40px; }
.routine-admin-workspace > .col-md-12 { padding: 0 !important; }
.routine-page-head {
    margin: 0 0 18px; padding: 0 0 18px; border-bottom: 1px solid #e2e8f0;
}
.routine-eyebrow {
    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
}
.routine-page-head h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2;
    font-weight: 800; letter-spacing: -.02em;
}
.routine-page-head p:last-child { margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5; }

.routine-admin-workspace .nav-tabs.bordered {
    display: inline-flex; gap: 5px; margin: 0 0 16px !important; padding: 5px !important;
    border: 1px solid #e2e8f0 !important; border-radius: 12px; background: #fff;
}
.routine-admin-workspace .nav-tabs.bordered > li { margin: 0 !important; }
.routine-admin-workspace .nav-tabs.bordered > li > a {
    min-height: 40px; padding: 9px 14px !important; border: 0 !important; border-radius: 8px !important;
    background: transparent !important; color: #475569 !important; font-size: 14px; font-weight: 700;
}
.routine-admin-workspace .nav-tabs.bordered > li.active > a,
.routine-admin-workspace .nav-tabs.bordered > li.active > a:hover {
    background: #2563eb !important; color: #fff !important;
}
.routine-admin-workspace .tab-content { padding: 0 !important; }
.routine-admin-workspace .tab-content > br { display: none; }

.routine-admin-workspace .panel-group { margin: 0; }
.routine-admin-workspace .panel {
    margin-bottom: 10px !important; border: 1px solid #e2e8f0 !important; border-radius: 12px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.04) !important; overflow: hidden;
}
.routine-admin-workspace .panel-heading {
    padding: 0 !important; background: #fff !important; border-bottom: 1px solid #eef2f7 !important;
}
.routine-admin-workspace .panel-title { margin: 0 !important; }
.routine-admin-workspace .panel-title > a {
    min-height: 48px; padding: 13px 16px !important; display: flex; align-items: center; gap: 8px;
    color: #0f172a !important; font-size: 15px; font-weight: 800; text-decoration: none !important;
}
.routine-admin-workspace .panel-title > a:hover { background: #f8fafc; }
.routine-admin-workspace .panel-body { padding: 14px !important; background: #fff; overflow-x: auto; }

.routine-admin-workspace table.table {
    min-width: 820px; margin: 0 !important; border: 1px solid #e2e8f0 !important;
    border-radius: 10px; overflow: hidden;
}
.routine-admin-workspace table.table td {
    padding: 11px 12px !important; color: #334155; font-size: 14px !important;
    line-height: 1.45; vertical-align: middle;
}
.routine-admin-workspace table.table td:first-child {
    width: 120px !important; background: #f8fafc; color: #475569;
    font-size: 13px !important; font-weight: 800; letter-spacing: .035em;
}
.routine-admin-workspace .btn-group { margin: 3px 5px 3px 0; }
.routine-admin-workspace .btn-group > .btn {
    min-height: 38px; padding: 7px 11px !important; border: 1px solid #cbd5e1;
    border-radius: 8px !important; background: #fff; color: #1e3a8a;
    font-size: 13px; font-weight: 700;
}
.routine-admin-workspace .btn-group > .btn:hover { background: #eff6ff; border-color: #93c5fd; }
.routine-admin-workspace .dropdown-menu {
    min-width: 150px; padding: 6px 0; border: 1px solid #e2e8f0; border-radius: 9px;
    box-shadow: 0 8px 24px rgba(15,23,42,.12);
}
.routine-admin-workspace .dropdown-menu > li > a {
    min-height: 36px; padding: 8px 12px; display: flex; align-items: center; gap: 7px;
    font-size: 14px;
}

.routine-admin-workspace #add {
    margin-top: 0; padding: 0 !important; border: 1px solid #e2e8f0;
    border-radius: 14px; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.04);
}
.routine-admin-workspace #add > br { display: none; }
.routine-admin-workspace #add .box-content { max-width: 980px; padding: 22px 20px; }
.routine-admin-workspace #add .form-group { margin-bottom: 16px; }
.routine-admin-workspace #add .control-label {
    padding-top: 11px; color: #334155; font-size: 14px; font-weight: 700;
}
.routine-admin-workspace #add .form-control,
.routine-admin-workspace #add .selectboxit-container .selectboxit {
    min-height: 46px; height: 46px; border: 1px solid #cbd5e1; border-radius: 9px;
    font-size: 15px; color: #0f172a; background: #fff;
}
.routine-admin-workspace #add .form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
}
.routine-admin-workspace #add button[type="submit"] {
    min-height: 44px; padding: 9px 17px; border-radius: 9px;
    background: #2563eb; border-color: #2563eb; font-size: 14px; font-weight: 800;
}

@media (max-width: 767px) {
    .routine-admin-workspace { padding: 18px 14px 32px; }
    .routine-page-head h1 { font-size: 26px; }
    .routine-admin-workspace .nav-tabs.bordered { display: grid; grid-template-columns: 1fr; width: 100%; }
    .routine-admin-workspace .nav-tabs.bordered > li > a { width: 100%; }
    .routine-admin-workspace #add .control-label { padding-top: 0; margin-bottom: 6px; text-align: left; }
    .routine-admin-workspace #add .col-sm-5,
    .routine-admin-workspace #add .col-sm-9,
    .routine-admin-workspace #add .col-md-3 { width: 100%; padding: 0 15px; margin-bottom: 8px; }
}
</style>

<div class="row routine-admin-workspace">
    <div class="col-md-12">
    
        <div class="routine-page-head">
            <div>
                <p class="routine-eyebrow">Academics</p>
                <h1>Class Routine & Timetable</h1>
                <p>Review class schedules or create a new routine using the existing class, section, subject and time workflow.</p>
            </div>
        </div>

        <!------CONTROL TABS START------>
        <ul class="nav nav-tabs bordered">
            <li class="active">
                <a href="#list" data-toggle="tab"><i class="entypo-menu"></i> 
                    <?php echo get_phrase('class_routine_list');?>
                        </a></li>
            <li>
                <a href="#add" data-toggle="tab"><i class="entypo-plus-circled"></i>
                    <?php echo get_phrase('add_class_routine');?>
                        </a></li>
        </ul>
        <!------CONTROL TABS END------>
        
    
        <div class="tab-content">
        <br>
            <!----TABLE LISTING STARTS-->
            <div class="tab-pane active" id="list">
                <div class="panel-group joined" id="accordion-test-2">
                    <?php 
                    $toggle = true;
                    $classes = $this->db->get('class')->result_array();
                    foreach($classes as $row):
                        ?>
                        
                
                            <div class="panel panel-default">
                                <div class="panel-heading">
                                        <h4 class="panel-title">
                                    <a data-toggle="collapse" data-parent="#accordion-test-2" href="#collapse<?php echo $row['class_id'];?>">
                                        <i class="entypo-rss"></i> Class <?php echo $row['name'];?>
                                    </a>
                                    </h4>
                                </div>
                
                                <div id="collapse<?php echo $row['class_id'];?>" class="panel-collapse collapse <?php if($toggle){echo 'in';$toggle=false;}?>">
                                    <div class="panel-body">
                                        <?php
                                            $query_for_section = $this->db->get_where('section' , array(
                                                'class_id' => $row['class_id']));
                                            if($query_for_section->num_rows() <= 0):
                                        ?>

                                        <table cellpadding="0" cellspacing="0" border="0"  class="table table-bordered">
                                            <tbody>
                                                <?php 
                                                for($d=1;$d<=7;$d++):
                                                
                                                if($d==1)$day='sunday';
                                                else if($d==2)$day='monday';
                                                else if($d==3)$day='tuesday';
                                                else if($d==4)$day='wednesday';
                                                else if($d==5)$day='thursday';
                                                else if($d==6)$day='friday';
                                                else if($d==7)$day='saturday';
                                                ?>
                                                <tr class="gradeA">
                                                    <td width="100"><?php echo strtoupper($day);?></td>
                                                    <td>
                                                        <?php
                                                        $this->db->order_by("time_start", "asc");
                                                        $this->db->where('day' , $day);
                                                        $this->db->where('class_id' , $row['class_id']);
                                                        $routines   =   $this->db->get('class_routine')->result_array();
                                                        foreach($routines as $row2):
                                                        ?>
                                                        <div class="btn-group">
                                                            <button class="btn btn-default dropdown-toggle" data-toggle="dropdown">
                                                                <?php echo $this->crud_model->get_subject_name_by_id($row2['subject_id']);?>
                                                                <?php
                                                                    if ($row2['time_start_min'] == 0 && $row2['time_end_min'] == 0) 
                                                                        echo '('.$row2['time_start'].'-'.$row2['time_end'].')';
                                                                    if ($row2['time_start_min'] != 0 || $row2['time_end_min'] != 0)
                                                                        echo '('.$row2['time_start'].':'.$row2['time_start_min'].'-'.$row2['time_end'].':'.$row2['time_end_min'].')';
                                                                ?>
                                                                <span class="caret"></span>
                                                            </button>
                                                            <ul class="dropdown-menu">
                                                                <li>
                                                                <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_edit_class_routine/'.$row2['class_routine_id']);?>');">
                                                                    <i class="entypo-pencil"></i>
                                                                        <?php echo get_phrase('edit');?>
                                                                                </a>
                                                         </li>
                                                         
                                                         <li>
                                                            <a href="#" onclick="confirm_modal('<?php echo site_url('admin/class_routine/delete/'.$row2['class_routine_id']);?>');">
                                                                <i class="entypo-trash"></i>
                                                                    <?php echo get_phrase('delete');?>
                                                                </a>
                                                            </li>
                                                            </ul>
                                                        </div>
                                                        <?php endforeach;?>

                                                    </td>
                                                </tr>
                                                <?php endfor;?>
                                                
                                            </tbody>
                                        </table>


                                        <?php endif;?>
                                        
                                    </div>
                                </div>
                            </div>
                        <?php
                    endforeach;
                    ?>
                </div>
            </div>
            <!----TABLE LISTING ENDS--->
            
            
            <!----CREATION FORM STARTS---->
            <div class="tab-pane box" id="add" style="padding: 5px">
            <br><br>
                <div class="box-content">
                    <?php echo form_open(site_url('admin/class_routine/create') , array('class' => 'form-horizontal form-groups validate','target'=>'_top'));?>
                            <div class="form-group">
                                <label class="col-sm-3 control-label"><?php echo get_phrase('class');?></label>
                                <div class="col-sm-5">
                                    <select name="class_id" class="form-control" style="width:100%;"
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
                                        <option value="sunday">sunday</option>
                                        <option value="monday">monday</option>
                                        <option value="tuesday">tuesday</option>
                                        <option value="wednesday">wednesday</option>
                                        <option value="thursday">thursday</option>
                                        <option value="friday">friday</option>
                                        <option value="saturday">saturday</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-sm-3 control-label"><?php echo get_phrase('starting_time');?></label>
                                <div class="col-sm-9">
                                    <div class="col-md-3">
                                        <select name="time_start" class="form-control selectboxit">
                                            <option value=""><?php echo get_phrase('hour');?></option>
                                            <?php for($i = 0; $i <= 12 ; $i++):?>
                                                <option value="<?php echo $i;?>"><?php echo $i;?></option>
                                            <?php endfor;?>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <select name="time_start_min" class="form-control selectboxit">
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
                                        <select name="time_end" class="form-control selectboxit">
                                            <option value=""><?php echo get_phrase('hour');?></option>
                                            <?php for($i = 0; $i <= 12 ; $i++):?>
                                                <option value="<?php echo $i;?>"><?php echo $i;?></option>
                                            <?php endfor;?>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <select name="time_end_min" class="form-control selectboxit">
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
                                  <button type="submit" class="btn btn-info"><?php echo get_phrase('add_class_routine');?></button>
                              </div>
                            </div>
                   <?php echo form_close();?>                
                </div>                
            </div>
            <!----CREATION FORM ENDS-->
            
        </div>
    </div>
</div>

<script type="text/javascript">
    function get_class_section_subject(class_id) {
        $.ajax({
            url: '<?php echo site_url('admin/get_class_section_subject/');?>' + class_id ,
            success: function(response)
            {
                jQuery('#section_subject_selection_holder').html(response);
            }
        });
    }
</script>

