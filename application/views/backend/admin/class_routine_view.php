<style>
/* Direct UX rebuild — Admin Class Routine View */
body { background: #f8fafc; }
.routine-view-workspace { padding: 24px 28px 40px; }
.routine-view-head {
    display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
    margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;
}
.routine-view-head h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2; font-weight: 800; letter-spacing: -.02em;
}
.routine-view-head p { margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5; }
.routine-view-head .btn {
    min-height: 42px; padding: 9px 16px; border-radius: 9px; font-size: 14px; font-weight: 800;
}
.routine-view-workspace .row { margin: 0 0 14px; }
.routine-view-workspace .row > .col-md-12 { padding: 0; }
.routine-view-workspace .panel {
    border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;
    box-shadow: 0 1px 2px rgba(15,23,42,.05); background: #fff;
}
.routine-view-workspace .panel-heading {
    padding: 0; border-bottom: 1px solid #e2e8f0; background: #0f172a !important;
}
.routine-view-workspace .panel-title {
    min-height: 52px; padding: 11px 16px; display: flex; align-items: center; justify-content: center;
    color: #fff !important; font-size: 16px !important; line-height: 1.4; font-weight: 800;
}
.routine-view-workspace .panel-title .btn {
    min-height: 36px; padding: 7px 11px !important; border-radius: 8px;
    background: #fff; border-color: #fff; color: #1e3a8a; font-size: 13px; font-weight: 800;
}
.routine-view-workspace .panel-body { padding: 14px; overflow-x: auto; }
.routine-view-workspace table {
    min-width: 820px; margin: 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
}
.routine-view-workspace table td {
    padding: 12px 13px !important; color: #334155; font-size: 14px; line-height: 1.45; vertical-align: middle;
}
.routine-view-workspace table td:first-child {
    width: 120px !important; background: #f8fafc; color: #475569;
    font-size: 13px; font-weight: 800; letter-spacing: .035em;
}
.routine-view-workspace .btn-group { margin: 3px 5px 3px 0; }
.routine-view-workspace .btn-group > .btn {
    min-height: 38px; padding: 7px 11px; border-radius: 8px;
    background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a;
    font-size: 13px; font-weight: 700;
}
.routine-view-workspace .btn-group > .btn:hover { background: #dbeafe; }
.routine-view-workspace .dropdown-menu {
    min-width: 150px; padding: 6px 0; border: 1px solid #e2e8f0; border-radius: 9px;
    box-shadow: 0 8px 24px rgba(15,23,42,.12);
}
.routine-view-workspace .dropdown-menu a {
    min-height: 36px; padding: 8px 12px; display: flex; align-items: center; gap: 7px; font-size: 14px;
}
@media (max-width: 767px) {
    .routine-view-workspace { padding: 18px 14px 32px; }
    .routine-view-head { align-items: flex-start; flex-direction: column; }
    .routine-view-head h1 { font-size: 26px; }
    .routine-view-head .btn { width: 100%; justify-content: center; }
    .routine-view-workspace .panel-title { align-items: flex-start; flex-direction: column; gap: 8px; text-align: left !important; }
    .routine-view-workspace .panel-title .btn { float: none !important; align-self: stretch; }
}
</style>
<div class="routine-view-workspace">
<div class="routine-view-head">
    <div>
        <h1>Class Timetable</h1>
        <p>Review section routines, edit scheduled subjects, or print a section timetable.</p>
    </div>
<a href="<?php echo site_url('admin/class_routine_add/'.$class_id);?>"
    class="btn btn-primary pull-right">
        <i class="entypo-plus-circled"></i>
        <?php echo get_phrase('add_class_time_table');?>
    </a>
</div>


<?php

    $class_name = $this->crud_model->get_class_name($class_id);
	$query = $this->db->get_where('section' , array('class_id' => $class_id));

	if($query->num_rows() > 0):
		$sections = $query->result_array();
	foreach($sections as $row):
?>
<div class="row">
	
    <div class="col-md-12">

        <div class="panel panel-default" data-collapsed="0">
            <div class="panel-heading" >
                <div class="panel-title" style="font-size: 16px; color: white; text-align: center;">
                    <?php echo $this->db->get_where('class' , array('class_id' => $class_id))->row()->name.' '.$this->db->get_where('class' , array('class_id' => $class_id))->row()->name_numeric;?> | 
                    <?php echo get_phrase('section');?> - <?php echo $this->db->get_where('section' , array('section_id' => $row['section_id']))->row()->name;?>
                    <a href="<?php echo site_url('admin/class_routine_print_view/'.$class_id.'/'.$row['section_id']);?>"
                        class="btn btn-primary btn-xs pull-right" target="_blank">
                            <i class="entypo-print"></i> <?php echo get_phrase('print');?>
                    </a>
                </div>
            </div>
            <div class="panel-body">
                
                <table cellpadding="0" cellspacing="0" border="0"  class="table table-bordered table-striped table-hover table-active">
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
                                $this->db->where('class_id' , $class_id);
                                $this->db->where('section_id' , $row['section_id']);
                                
                                if($class_name == 'JHSS') {
                                    $this->db->where('sem' , $running_sem);
                                } else {
                                    $this->db->where('term' , $running_term);
                                }
                                $this->db->where('year' , $running_year);
                                $routines   =   $this->db->get('class_routine')->result_array();
                                foreach($routines as $row2):
                                ?>
                                <div class="btn-group">
                                    <button class="btn btn-info dropdown-toggle" data-toggle="dropdown">
                                        <?php echo strtoupper(strtolower( $this->crud_model->get_subject_name_by_id($row2['subject_id'])));?>
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
                                        <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_edit_class_routine/'.$row2['class_routine_id']);?>');" style="color: green;">
                                            <i class="entypo-pencil"></i>
                                                <?php echo get_phrase('edit');?>
                                                        </a>
                                 </li>
                                 
                                 <li>
                                    <a href="#" onclick="confirm_modal('<?php echo site_url('admin/class_routine/delete/'.$row2['class_routine_id']);?>');" style="color: red;">
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
                
            </div>
        </div>

    </div>

</div>
<?php endforeach;?>
<?php endif;?>
</div>
