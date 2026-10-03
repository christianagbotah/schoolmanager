<style>
/* Family design-language alignment (attendance wave) - presentation only.
   Scoped to this page's shell container; form actions, input names,
   month-grid logic and print links untouched. */
#main_page label.control-label {
    font-size: 13px; font-weight: 600; color: #374151;
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
}
#main_page .form-group { margin-bottom: 18px; }
#main_page .form-control {
    border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 14px;
    font-size: 14px; height: 42px; box-shadow: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}
#main_page .form-control:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); outline: none;
}
#main_page .btn { border-radius: 10px; font-weight: 600; font-size: 14px;
    border: none; padding: 10px 20px; transition: all 0.2s; }
#main_page .btn-info { background: #2563eb; color: #fff; }
#main_page .btn-primary { background: #7c3aed; color: #fff; }
#main_page .btn-default { background: #f3f4f6; color: #374151;
    border: 1px solid #e5e7eb; }
#main_page .btn:hover { transform: translateY(-1px); }
#main_page .btn:focus-visible,
#main_page .form-control:focus-visible {
    outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}
#main_page .tile-stats {
    background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05); padding: 24px;
}
#main_page .tile-stats h3 { font-size: 18px; color: #111827; }
#main_page .tile-stats h4 { font-size: 15px; color: #4b5563; }
#main_page table.table { border: 1px solid #e5e7eb; border-radius: 12px;
    overflow: hidden; }
#main_page table.table thead { background: #f9fafb; }
#main_page table.table thead th,
#main_page table.table thead td {
    padding: 12px 10px; font-size: 13px; font-weight: 600; color: #374151;
    border-bottom: 2px solid #e5e7eb !important;
}
#main_page table.table tbody td {
    padding: 10px; font-size: 14px; vertical-align: middle;
}
#main_page table.table tbody tr:hover { background: #f9fafb; }
@media (prefers-reduced-motion: reduce) {
    #main_page .btn, #main_page .form-control { transition: none; }
    #main_page .btn:hover { transform: none; }
}
@media (max-width: 768px) {
    #main_page .form-control { font-size: 16px; }
    #main_page table.table thead th,
    #main_page table.table thead td { padding: 6px; font-size: 11px; }
    #main_page table.table tbody td { padding: 6px; font-size: 12px; }
}
@media (max-width: 400px) {
    #main_page .tile-stats { padding: 15px; border-radius: 14px; }
}
</style>
<hr />
<?php echo form_open(site_url('parents/attendance_report_selector/'.$student_id)); ?>
<div class="row">

    <div class="col-md-offset-3 col-md-2">
         <div class="form-group">
            <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('month'); ?></label>
            <select name="month" class="form-control selectboxit">
                <?php
                for ($i = 1; $i <= 12; $i++):
                    if ($i == 1)
                        $m = 'january';
                    else if ($i == 2)
                        $m = 'february';
                    else if ($i == 3)
                        $m = 'march';
                    else if ($i == 4)
                        $m = 'april';
                    else if ($i == 5)
                        $m = 'may';
                    else if ($i == 6)
                        $m = 'june';
                    else if ($i == 7)
                        $m = 'july';
                    else if ($i == 8)
                        $m = 'august';
                    else if ($i == 9)
                        $m = 'september';
                    else if ($i == 10)
                        $m = 'october';
                    else if ($i == 11)
                        $m = 'november';
                    else if ($i == 12)
                        $m = 'december';
                    ?>
                    <option value="<?php echo $i; ?>"
                          <?php if($month == $i) echo 'selected'; ?>  >
                                <?php echo get_phrase($m); ?>
                    </option>
                    <?php
                endfor;
                ?>
            </select>
         </div>
    </div>
    
    <div class="col-md-2">
        <div class="form-group">
            <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('academic_year'); ?></label>
            <select class="form-control selectboxit" name="sessional_year">
                <?php
                          echo populate_academic_year('No', $sessional_year);
                        ?>
            </select>
        </div>
    </div>

    <input type="hidden" name="operation" value="selection">
    <input type="hidden" name="year" value="<?php echo $running_year;?>">

	<div class="col-md-2" style="margin-top: 20px;">
		<button type="submit" class="btn btn-info"><?php echo get_phrase('show_report');?></button>
	</div>
</div>

<?php echo form_close(); ?>


<!-- Attendance Table starts from here -->
<?php if ($class_id != '' && $section_id != '' && $month != '' && $sessional_year != '' && $student_id != ''): ?>

    <br>
    <div class="row">
        <div class="col-md-4"></div>
        <div class="col-md-4" style="text-align: center;">
            <div class="tile-stats tile-gray">
                <div class="icon"><i class="entypo-docs"></i></div>
                <h3 style="color: #696969;">
                    <?php
                    $section_name = $this->db->get_where('section', array('section_id' => $section_id))->row()->name;
                    $class_name = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;
                    $class_name_numeric = $this->db->get_where('class', array('class_id' => $class_id))->row()->name_numeric;
                    if ($month == 1)
                        $m = 'January';
                    else if ($month == 2)
                        $m = 'February';
                    else if ($month == 3)
                        $m = 'March';
                    else if ($month == 4)
                        $m = 'April';
                    else if ($month == 5)
                        $m = 'May';
                    else if ($month == 6)
                        $m = 'June';
                    else if ($month == 7)
                        $m = 'July';
                    else if ($month == 8)
                        $m = 'August';
                    else if ($month == 9)
                        $m = 'Sepetember';
                    else if ($month == 10)
                        $m = 'October';
                    else if ($month == 11)
                        $m = 'November';
                    else if ($month == 12)
                        $m = 'December';
                    echo get_phrase('attendance_sheet');
                    ?>
                </h3>
                <h4 style="color: #696969;">
    <?php echo $class_name.' '.$class_name_numeric; ?> : <?php echo get_phrase('section');?> <?php echo $section_name; ?><br>
    <?php echo $m . ', ' . explode('-', $sessional_year)[1]; ?>
                </h4>
            </div>
        </div>
        <div class="col-md-4"></div>
    </div>


    <hr />

    <div class="row">
        <div class="col-md-12">
            <table class="table table-bordered" id="my_table">
                <thead>
                    <tr>
                        <td style="text-align: center;">
    <?php echo get_phrase('students'); ?> <i class="entypo-down-thin"></i> | <?php echo get_phrase('date'); ?> <i class="entypo-right-thin"></i>
                        </td>
    <?php
    $year = explode('-', $running_year);
    $days = cal_days_in_month(CAL_GREGORIAN, $month, explode('-', $sessional_year)[1]);
    for ($i = 1; $i <= $days; $i++) {
        ?>
                            <td style="text-align: center;"><?php echo $i; ?></td>
                    <?php } ?>

                    </tr>
                </thead>

                <tbody>
                            <?php
                            $data = array();

                                ?>
                        <tr>
                            <td style="text-align: center;">
                            <?php echo $this->db->get_where('student', array('student_id' => $student_id))->row()->name; ?>
                            </td>
                            <?php
                            $status = 0;
                            for ($i = 1; $i <= $days; $i++) {
                                $timestamp = strtotime($i . '-' . $month . '-' . explode('-', $sessional_year)[1]);
                                //$this->db->group_by('timestamp');
                                $attendance = $this->db->get_where('attendance', array('section_id' => $section_id, 'class_id' => $class_id, 'year' => $sessional_year, 'timestamp' => $timestamp, 'student_id' => $student_id))->result_array();


                                foreach ($attendance as $row1):
                                    $month_dummy = date('d', $row1['timestamp']);

                                    if ($i == $month_dummy)
                                        $status = $row1['status'];


                                endforeach;

                                ?>
                                <td style="text-align: center;">

                        <?php if ($status == 1) { ?>
                            <i class="entypo-record" style="color: #00a651;"></i>
                        <?php  } else if($status == 2)  { ?>
                            <i class="entypo-record" style="color: #ee4749;"></i>
                        <?php  } else { ?>
                            <p>n/a</p>
                        <?php  }

                        $status =0;?>

                                </td>

                    <?php } ?>


                    </tr>

    <?php ?>

                </tbody>
            </table>
            <center>
                <a href="<?php echo site_url('parents/attendance_report_print_view/'.$class_id.'/'.$section_id.'/'.$month.'/'.$sessional_year.'/'.$student_id); ?>"
                   class="btn btn-primary" target="_blank">
    <?php echo get_phrase('print_attendance_sheet'); ?>
                </a>
            </center>
        </div>
    </div>
<?php 
    else:
        ?>
    <center><h4 style="color: red;">No Record Found For The Selected Year!</h4></center>
    <?php
endif;
 ?>
