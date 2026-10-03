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
    <?php echo form_open(base_url() . 'index.php/student/attendance_report_selector/');?>
<div class="row">
    <div class="col-md-offset-1 col-md-3">
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

    <div class="col-md-3">
        <div class="form-group">
            <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('sessional_year'); ?></label>
            <select class="form-control selectboxit" name="sessional_year">
                <?php
                $sessional_year_options = explode('-', $running_year); ?>
                <option value="<?php echo $sessional_year_options[0]; ?>"><?php echo $sessional_year_options[0]; ?></option>
                <option value="<?php echo $sessional_year_options[1]; ?>"><?php echo $sessional_year_options[1]; ?></option>
            </select>
        </div>
    </div>

    <div class="col-md-2">
        <div class="form-group">
            <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('term'); ?></label>
            <select class="form-control selectboxit" name="term">
                <?php
                    for($j = 1; $j <= 3; $j++){
                        ?>
                        <option value="<?php echo $j; ?>" <?php if($running_term == $j) echo 'selected';?>><?php echo $j;?></option>
                        <?php
                    }
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
</form>
