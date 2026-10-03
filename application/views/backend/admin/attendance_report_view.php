<style>
* { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.filter-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }
.form-control { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; height: 46px; transition: all 0.3s; }
.form-control:focus { border-color: #667eea; outline: none; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
.btn-enterprise { padding: 12px 24px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px; height: 46px; font-size: 15px; }
.btn-primary { background: #764ba2; color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
.btn-print { background: #059669; color: white; }
.btn-print:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
label { display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px; }
@media print { .filter-card, .btn-enterprise { display: none !important; } }
</style>

<style>
@media screen {
  body { background: #f8fafc; }
  .filter-card {
    padding: 16px 18px; margin-bottom: 16px !important;
    border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.05);
  }
  #attendance_report_form .filter-card > div {
    display: grid !important; grid-template-columns: minmax(170px,1.4fr) repeat(3,minmax(130px,1fr)) auto;
    gap: 12px !important; align-items: end !important;
  }
  #attendance_report_form label { margin-bottom: 7px; font-size: 14px; font-weight: 700; color: #334155; }
  #attendance_report_form .form-control {
    min-height: 44px; height: 44px; padding: 9px 11px;
    border: 1px solid #cbd5e1; border-radius: 9px; font-size: 14px; color: #0f172a; background: #fff;
  }
  #attendance_report_form .form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
  }
  #attendance_report_form .btn-enterprise {
    min-height: 44px; height: 44px; padding: 9px 16px;
    border-radius: 9px; background: #2563eb; font-size: 14px; font-weight: 800;
  }
  #attendance_report_form .btn-enterprise:hover { background: #1d4ed8; transform: none; box-shadow: 0 3px 9px rgba(37,99,235,.18); }

  #attendance_report_form + .filter-card h3 { font-size: 18px !important; font-weight: 800 !important; color: #0f172a !important; }
  #attendance_report_form + .filter-card p { font-size: 14px !important; color: #64748b !important; }
  .btn-print {
    min-height: 42px; height: 42px; padding: 9px 15px; border-radius: 9px;
    background: #059669; font-size: 14px; font-weight: 700;
  }
  .btn-print:hover { background: #047857; transform: none; box-shadow: 0 3px 9px rgba(5,150,105,.16); }

  #listing {
    margin-bottom: 12px; border: 1px solid #e2e8f0; background: #fff;
  }
  #listing td {
    padding: 9px 10px; color: #475569; font-size: 13px; line-height: 1.35;
    background: #f8fafc; border-color: #e2e8f0 !important;
  }

  #my_table {
    min-width: 1150px; width: max-content !important; background: #fff;
    border-collapse: separate !important; border-spacing: 0;
  }
  #my_table th {
    padding: 10px 8px !important; background: #f8fafc; color: #475569;
    font-size: 12px; line-height: 1.25; font-weight: 800; white-space: nowrap;
    border-color: #e2e8f0 !important;
  }
  #my_table td {
    padding: 10px 8px !important; color: #334155; font-size: 13px; line-height: 1.35;
    white-space: nowrap; border-color: #eef2f7 !important;
  }
  #my_table tbody tr:hover td { background: #f8fbff; }
  .row > .col-md-12:has(#my_table) {
    overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 8px;
  }

  @media (max-width: 1100px) {
    #attendance_report_form .filter-card > div { grid-template-columns: repeat(2,minmax(0,1fr)); }
  }
  @media (max-width: 767px) {
    hr { margin: 12px 0; }
    #attendance_report_form .filter-card > div { grid-template-columns: 1fr; }
    #attendance_report_form .btn-enterprise { width: 100%; justify-content: center; }
    #attendance_report_form + .filter-card > div {
      align-items: flex-start !important; flex-direction: column !important; gap: 12px !important;
    }
    #attendance_report_form + .filter-card .btn-print { width: 100%; justify-content: center; }
  }
}
</style>


<hr />

<?php echo form_open(site_url('admin/attendance_report_selector'), ['id' => 'attendance_report_form']); ?>
<div class="filter-card">
    <div style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 150px;">
            <label><?php echo get_phrase('class'); ?></label>
            <select class="form-control" name="class_id" id="class_id" onchange="select_section(this.value)" required>
                <option value=""><?php echo get_phrase('select_class'); ?></option>
                <?php getFullClassList('', $class_id); ?>
            </select>
        </div>
        
        <input type="hidden" name="section_id" id="section_id" value="<?php echo $section_id; ?>">
        
        <div style="flex: 1; min-width: 120px;">
            <label><?php echo get_phrase('month'); ?></label>
            <select name="month" class="form-control" id="month" required>
                <?php
                $months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
                for ($i = 1; $i <= 12; $i++):
                ?>
                <option value="<?php echo $i; ?>" <?php echo ($month == $i) ? 'selected' : ''; ?>>
                    <?php echo get_phrase($months[$i-1]); ?>
                </option>
                <?php endfor; ?>
            </select>
        </div>

        <div style="flex: 1; min-width: 120px;">
            <label><?php echo get_phrase('academic_year'); ?></label>
            <select name="sessional_year" class="form-control" required>
                <option value=""><?php echo get_phrase('year'); ?></option>
                <?php echo populate_academic_year('yes', $sessional_year); ?>
            </select>
        </div>

        <div id="term_holder" style="flex: 1; min-width: 100px;">
            <label><?php echo get_phrase('term'); ?></label>
            <select class="form-control" name="term" id="term" required>
                <?php for ($i = 1; $i <= 3; $i++): ?>
                <option value="<?php echo $i; ?>" <?php echo ($term == $i) ? 'selected' : ''; ?>><?php echo $i; ?></option>
                <?php endfor; ?>
            </select>
        </div>

        <div id="sem_holder" style="flex: 1; min-width: 100px; display: none;">
            <label><?php echo get_phrase('semester'); ?></label>
            <select class="form-control" name="sem" id="sem">
                <?php for ($i = 1; $i <= 2; $i++): ?>
                <option value="<?php echo $i; ?>" <?php echo (isset($sem) && $sem == $i) ? 'selected' : ''; ?>><?php echo $i; ?></option>
                <?php endfor; ?>
            </select>
        </div>

        <div style="flex: 0 0 auto;">
            <button type="submit" class="btn-enterprise btn-primary">
                <i class="fa fa-search"></i> <?php echo get_phrase('show_report'); ?>
            </button>
        </div>
    </div>
</div>
<?php echo form_close(); ?>


<?php if ($class_id != '' && $section_id != '' && $month != '' && $sessional_year != '' && $term != ''): ?>

    <div class="filter-card" style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h3 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #1f2937;">
                    <?php echo get_phrase('attendance_sheet'); ?>
                </h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    <?php 
                    $class_name = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;
                    $class_name_numeric = $this->db->get_where('class', array('class_id' => $class_id))->row()->name_numeric;
                    $months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
                    echo $class_name . ' ' . $class_name_numeric . ' • ' . $months[$month] . ', ' . $sessional_year;
                    ?>
                </p>
            </div>
            <a href="<?php echo site_url('admin/attendance_report_print_view/' . $class_id . '/' . $section_id . '/' . $month . '/' . $sessional_year . '/' . ($class_name == 'JHSS' ? $sem : $term)); ?>" 
               class="btn-enterprise btn-print" target="_blank">
                <i class="fa fa-print"></i> <?php echo get_phrase('print_report'); ?>
            </a>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <table class="table table-bordered" id="listing">
                <tbody>
                    <tr>
                        <?php
                            for($a = 1; $a <= 5; $a++) {

                                ?>
                                <td align="center" valign="middle"><strong><?=getAttendanceStatusCode($a); ?> = <?=getAttendanceStatusPhrase($a); ?></strong></td>
                                <?php
                            }
                        ?>
                    </tr>
                </tbody>
            </table>
        </div>

        <hr>
        <div class="col-md-12">
            <table class="table table-bordered" id="my_table">
                <thead>
                    <tr>
                        <td style="text-align: center;">
    <?php echo get_phrase('students'); ?> <i class="entypo-down-thin"></i> | <?php echo get_phrase('date'); ?> <i class="entypo-right-thin"></i>
                        </td>
    <?php

    $year_parts = explode('-', $sessional_year);
    $days = cal_days_in_month(CAL_GREGORIAN, $month, isset($term) && $term == 1 ? $year_parts[0] : $year_parts[1]);

    for ($i = 1; $i <= $days; $i++) {
        ?>
                            <td style="text-align: center;"><?php echo $i; ?></td>
                    <?php }?>

                    </tr>
                </thead>

                <tbody>
                    <?php

    if ($term) {

        //Check for the term selected and display the content accordingly
        if ($term == 1) {

            $data = array();

            $students = $this->db->get_where('enroll', array('class_id' => $class_id, 'year' => $sessional_year, 'mute' => '0', 'term' => 1, 'section_id' => $section_id));

            if ($students->num_rows() < 1) {
                ?>
                    <tr>
                        <td colspan="32">
                            <h4 style="color: red; text-align: center;">No Record Found!</h4>
                        </td>
                    </tr>
                <?php
    }
        $students_array = $students->result_array();

        foreach ($students_array as $row):
        ?>
                 <tr>
                    <td>
                    <?php echo $this->db->get_where('student', array('student_id' => $row['student_id']))->row()->name; ?>
                    </td>
                    <?php
        $counter = 0;
        $status = '-';
        for ($i = 1; $i <= $days; $i++) {
            $year_parts = explode('-', $sessional_year);
            $timestamp = strtotime($i . '-' . $month . '-' . $year_parts[0]);
            //$this->db->group_by('timestamp');
            $attendance = $this->db->get_where('attendance', array('section_id' => $section_id, 'class_id' => $class_id, 'year' => $sessional_year, 'term' => 1, 'timestamp' => $timestamp, 'student_id' => $row['student_id']));

            $attendance_array = $attendance->result_array();

            if ($attendance->num_rows() > 0) {
                $counter++;
            }

            foreach ($attendance_array as $row1):
                $month_dummy = date('d', $row1['timestamp']);

                if ($i == $month_dummy) {

                    $status = getAttendanceStatusCode($row1['status']);
                }

            endforeach;
            ?>
        <td style="text-align: center;">
           <?php 
            echo '<strong>'.$status.'</strong>';
            $status = '-';
            ?>
        </td>

                                <?php }?>
                            <?php endforeach;?>
                             <h4 style="color: red; text-align: center;"><?php if ($counter < 1) {
            echo 'No Attendance Record Found For This Month';
        }
        ?></h4>
                        </tr>

                        <?php
    } elseif ($term == 2) {
            $data = array();

            $students = $this->db->get_where('enroll', array('class_id' => $class_id, 'year' => $sessional_year, 'mute' => '0', 'term' => 2, 'section_id' => $section_id));

            if ($students->num_rows() < 1) {
                ?>
                                            <tr>
                                                <td colspan="32">
                                                    <h4 style="color: red; text-align: center;">No Record Found!</h4>
                                                </td>
                                            </tr>
                                        <?php
    }
        $students_array = $students->result_array();

        foreach ($students_array as $row):
        ?>
                             <tr>
                                <td>
                                <?php echo $this->db->get_where('student', array('student_id' => $row['student_id']))->row()->name; ?>
                                </td>
                                <?php
        $counter = 0;
        $status = '-';
        for ($i = 1; $i <= $days; $i++) {
            $year_parts = explode('-', $sessional_year);
            $timestamp = strtotime($i . '-' . $month . '-' . $year_parts[1]);
            //$this->db->group_by('timestamp');
            $attendance = $this->db->get_where('attendance', array('section_id' => $section_id, 'class_id' => $class_id, 'year' => $sessional_year, 'term' => 2, 'timestamp' => $timestamp, 'student_id' => $row['student_id']));

            $attendance_array = $attendance->result_array();

            if ($attendance->num_rows() > 0) {
                $counter++;
            }

            foreach ($attendance_array as $row1):
                $month_dummy = date('d', $row1['timestamp']);

                if ($i == $month_dummy) {
                    $status = getAttendanceStatusCode($row1['status']);
                }

            endforeach;
            ?>
        <td style="text-align: center;">
           <?php 
            echo '<strong>'.$status.'</strong>';
            $status = '-';
            ?>
        </td>

                                <?php }?>
                            <?php endforeach;?>
                             <h4 style="color: red; text-align: center;"><?php if ($counter < 1) {
            echo 'No Attendance Record Found For This Month';
        }
        ?></h4>
                        </tr>

                        <?php
    } elseif ($term == 3) {
            $data = array();

            $students = $this->db->get_where('enroll', array('class_id' => $class_id, 'year' => $sessional_year, 'mute' => '0', 'term' => 3, 'section_id' => $section_id));

            if ($students->num_rows() < 1) {
                ?>
                                            <tr>
                                                <td colspan="32">
                                                    <h4 style="color: red; text-align: center;">No Record Found!</h4>
                                                </td>
                                            </tr>
                                        <?php
    }   
        $students_array = $students->result_array();

        foreach ($students_array as $row):
        ?>
                            <tr>
                                <td>
                                <?php echo $this->db->get_where('student', array('student_id' => $row['student_id']))->row()->name; ?>
                                </td>
                                <?php
        $counter = 0;
        $status = '-';
        for ($i = 1; $i <= $days; $i++) {
            $year_parts = explode('-', $sessional_year);
            $timestamp = strtotime($i . '-' . $month . '-' . $year_parts[1]);
            //$this->db->group_by('timestamp');
            $attendance = $this->db->get_where('attendance', array('section_id' => $section_id, 'class_id' => $class_id, 'year' => $sessional_year, 'term' => 3, 'timestamp' => $timestamp, 'student_id' => $row['student_id']));

            $attendance_array = $attendance->result_array();

            if ($attendance->num_rows() > 0) {
                $counter++;
            }

            foreach ($attendance_array as $row1):
                $month_dummy = date('d', $row1['timestamp']);

                if ($i == $month_dummy) {
                    $status = getAttendanceStatusCode($row1['status']);
                }

            endforeach;
            ?>
        <td style="text-align: center;">
           <?php 
            echo '<strong>'.$status.'</strong>';
            $status = '-';
            ?>
        </td>

                                <?php }?>
                            <?php endforeach;?>
                             <h4 style="color: red; text-align: center;"><?php if ($counter < 1) {
            echo 'No Attendance Record Found For This Month';
        }
        ?></h4>
                        </tr>

                        <?php
    } else {
            $this->session->set_flashdata('error_message', get_phrase('no_record_was_found'));
        }

}

?>

                </tbody>

            </table>
        </div>
    </div>
<?php endif;?>

<script type="text/javascript">

    // ajax form plugin calls at each modal loading,
    $(document).ready(function() {

        let class_id = '<?php echo $class_id; ?>';
        get_class_students(class_id);//call this as soon as the page loads

        // SelectBoxIt Dropdown replacement
        if($.isFunction($.fn.selectBoxIt))
        {
            $("select.selectboxit").each(function(i, el)
            {
                var $this = $(el),
                    opts = {
                        showFirstOption: attrDefault($this, 'first-option', true),
                        'native': attrDefault($this, 'native', false),
                        defaultText: attrDefault($this, 'text', ''),
                    };

                $this.addClass('visible');
                $this.selectBoxIt(opts);
            });
        }
    });

</script>

<script type="text/javascript">

function select_section(class_id) {
    if(!class_id) return;
    
    $.ajax({
        url: '<?php echo site_url('admin/get_section/'); ?>' + class_id,
        success: function (response) {
            const $temp = $('<div>').html(response);
            const sectionId = $temp.find('select[name="section_id"] option:first').val();
            $('#section_id').val(sectionId);
        }
    });
    
    get_class_students(class_id);
}

function get_class_students(class_id) {
        if (class_id !== '') {

          $('.submit').removeAttr('disabled');

          let running_sem = '<?php echo $this->db->get_where('settings', array('type' => 'running_sem'))->row()->description ?>';
          let running_term = '<?php echo $this->db->get_where('settings', array('type' => 'running_term'))->row()->description ?>';

          $.ajax({
            url: '<?php echo site_url('admin/get_class_name/'); ?>' + class_id,
            type: 'POST',
            dataType: 'text',

          })
          .done(function(class_name) {

            if(class_name == 'JHS') {
              $('#term').removeAttr('required');
              $('#term_holder').slideUp('slow');
              $('#term_holder').attr('style', 'display: none');
              $('#sem_holder').slideDown('slow');
              $('#sem').attr('required', 'required');
              $('#sem').val(running_sem);

            } else {
              $('#sem').removeAttr('required');
              $('#term_holder').removeAttr('style');
              $('#sem_holder').slideUp('slow');
              $('#term_holder').slideDown('slow');
              $('#term').attr('required', 'required');
              $('#term').val(running_term);
            }
          });//

          $.ajax({
            url: '<?php echo site_url('admin/get_class_students/'); ?>' + class_id,
            type: 'POST',
            dataType: 'html',

          })
          .done(function(response) {

              jQuery('#student_selection_holder').html(response);
          })
          .fail(function() {
            alert('error');
          });

      } else {
        $('.submit').attr('disabled', 'disabled');
      }
    }

    $('#attendance_report_form').submit(function(ev) {
        const class_id = $('#class_id').val();
        
        if(!class_id) {
            ev.preventDefault();
            showAjaxModal_alert('<?php echo get_phrase('please_select_class_first'); ?>', 'error');
            return false;
        }
        
        showAjaxModal_alert('<?php echo get_phrase('generating_report'); ?>...', 'loading');
    });

</script>
