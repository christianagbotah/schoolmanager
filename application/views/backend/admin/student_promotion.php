

<style type="text/css">
/* ---- family design-language alignment (presentation only) ---- */
.form-control, select.form-control {
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    height: 42px;
    font-size: 14px;
    transition: border-color .15s ease, box-shadow .15s ease;
}
.form-control:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    outline: none;
}
.btn {
    border-radius: 10px;
    font-weight: 600;
    transition: all .2s;
}
.btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}
.btn-primary { background: #2563eb; border-color: #2563eb; }
.btn-primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
.btn-info { background: #0284c7; border-color: #0284c7; }
.btn-info:hover { background: #0369a1; border-color: #0369a1; }
.btn-success { background: #059669; border-color: #059669; }
.btn-success:hover { background: #047857; border-color: #047857; }
.panel {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
.panel > .panel-body { padding: 18px; }
.table-bordered, .table {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}
.table > thead > tr > th, .table thead td {
    background: #f9fafb;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border-bottom: 1px solid #e5e7eb !important;
    padding: 12px 10px;
}
.table tbody td {
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
}
.tile-stats {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-left: 5px solid #4f46e5;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    color: #111827;
    overflow: hidden;
    padding: 22px;
}
.tile-stats h3 { color: #374151; font-weight: 600; }
.tile-stats .icon { color: #4f46e5; opacity: 0.15; }
.blockquote-blue {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-left: 5px solid #4f46e5;
    border-radius: 14px;
    padding: 20px 24px;
    color: #374151;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
@media (prefers-reduced-motion: reduce) {
    .btn, .table tbody tr { transition: none; }
}
</style>

<hr />

<?php 
$running_term = get_settings('running_term');
if($running_term != '3'): ?>
<!-- Warning Message: Promotion only allowed in Term 3 -->
<div class="row">
    <div class="col-md-12">
        <div class="alert alert-warning" role="alert" style="padding: 30px; margin: 20px 0; border-left: 5px solid #ff9800;">
            <h3 style="margin-top: 0; color: #ff9800;">
                <i class="entypo-attention"></i> Promotion Not Available
            </h3>
            <p style="font-size: 16px; line-height: 1.6;">
                <strong>Student promotion can only be performed during Term 3.</strong>
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 15px;">
                You are currently in <strong>Term <?php echo $running_term; ?></strong> of academic year <strong><?php echo get_settings('running_year'); ?></strong>.<br>
                Please wait until Term 3 to promote students to the next academic year.
            </p>
            <hr style="border-color: #ff9800; margin: 20px 0;">
            <p style="margin-bottom: 0;">
                <i class="entypo-info-circled"></i> <em>Promotion ensures students are enrolled in the correct class for the next academic year.</em>
            </p>
        </div>
    </div>
</div>
<?php else: ?>
<!-- Promotion form - only shown in Term 3 -->
<div class="row">
    <div class="col-md-12">
        <blockquote class="blockquote-blue">
            <p>
                <strong>Student Promotion Notes</strong>
            </p>
            <p>
                Promoting student from the present class to the next class will create an enrollment of that student to
                the next session. Make sure to select the correct class options from the select menu before promoting. If you don't want
                to promote a student to the next class, please select that option that will not promote the student to the next class
                but it will create an enrollment to the next session but in the same class.
            </p>
        </blockquote>
    </div>
</div>
<?php echo form_open(site_url('admin/student_promotion/promote'), array('id' => 'promotion_form'));?>
<div class="row">
<?php 
    //Calculate the years
    $running_year_array             = explode ( "-" , $running_year ); 
    $next_year_first_index          = $running_year_array[1];
    $next_year_second_index         = $running_year_array[1]+1;
    $next_year                      = $next_year_first_index. "-" .$next_year_second_index;

    //Calculate the terms
    $next_term = $next_sem = 1;
?>
	<div class="form-group">
        <div class="col-sm-3" style="margin-top: 15px;">
        <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('current_session');?></label>
            <select name="running_year" class="form-control select2">
            <option value="<?php echo $running_year;?>">
            	<?php echo $running_year;?>
            </option>
            </select>
        </div>
    </div>

    <div class="form-group">
        <div class="col-sm-3">
        <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('promote_to_session');?></label>
            <select name="promotion_year" class="form-control select2" id="promotion_year">
            <option value="<?php echo $next_year;?>">
            	<?php echo $next_year;?>
            </option>
            </select>
        </div>
    </div>

    <?php
        if($account_type == 'teacher') {
            ?>
            <div class="form-group">
                <div class="col-sm-3">
                <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('promotion_from_class');?></label>
                    <select name="promotion_from_class_id" id="from_class_id" onchange="update_class_numeric('from', $(this).val())" class="form-control select2"
                        >
                        <option value=""><?php echo get_phrase('select');?></option>
                        <?php

                    getFullClassList($this->session->userdata('teacher_id'));
                ?>
                    </select>
                    <input type="hidden" name="from_class_num" id="from_class_num">
                    <input type="hidden" name="from_class_name" id="from_class_name">
                </div>
            </div>
            <?php
        } else {

    ?>
    <div class="form-group">
        <div class="col-sm-3">
        <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('promotion_from_class');?></label>
            <select name="promotion_from_class_id" id="from_class_id" onchange="update_class_numeric('from', $(this).val())" class="form-control select2"
                >
                <option value=""><?php echo get_phrase('select');?></option>
                <?php

                    getFullClassList();
                ?>
            </select>
            <input type="hidden" name="from_class_num" id="from_class_num">
            <input type="hidden" name="from_class_name" id="from_class_name">
        </div>
    </div>
<?php } ?>


    <div class="form-group">
        <div class="col-sm-3">
        <label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('promotion_to_class');?></label>
            <select name="promotion_to_class_id" id="to_class_id" onchange="update_class_numeric('to', $(this).val())" class="form-control select2">
                <option value=""><?php echo get_phrase('select');?></option>
                <?php

                    getFullClassList();
                ?>
            </select>
            <input type="hidden" name="to_class_num" id="to_class_num">
            <input type="hidden" name="to_class_name" id="to_class_name">
        </div>
    </div>
        <input type="hidden" name="running_term" id="running_term" value="<?php echo $running_term; ?>">
        <input type="hidden" name="next_term" id="next_term" value="<?php echo $next_term; ?>">
        <input type="hidden" name="running_sem" id="running_sem" value="<?php echo $running_sem; ?>">
        <input type="hidden" name="next_sem" id="next_sem" value="<?php echo $next_sem; ?>">

    <center>
        <button class="btn btn-info" type="button" style="margin:10px;" onclick="get_students_to_promote('<?php echo $running_year;?>')">
            <?php echo get_phrase('manage_promotion');?></button>
    </center>

</div>

<div id="students_for_promotion_holder"></div>

<?php echo form_close();?>
<?php endif; // End term 3 check ?>

<script type="text/javascript">

    function update_class_numeric(type, class_id) {
        
        $.ajax({
            url: '<?php echo site_url('admin/get_class_name_numeric/') ?>' + class_id,
            type: 'POST',
            dataType: 'json',

        })
        .done(function(data) {
            $('#' + type + '_class_num').val(data.class_numeric);
            $('#' + type + '_class_name').val(data.class_name);
        });
        
    }
    
    function get_students_to_promote(running_year)
    {
        //Scroll to the top
          $('html, body').animate({
              scrollTop: ($('#top').offset().top )
          }, 1000);

        let from_class_name   = $("#from_class_name").val();
        let from_class_id   = $("#from_class_id").val();
        let to_class_id     = $("#to_class_id").val();
        let from_class   = $("#from_class_num").val();
        let to_class     = $("#to_class_num").val();
        let promotion_year  = $("#promotion_year").val();
        let running_term    = $("#running_term").val();
        let running_sem    = $("#running_sem").val();

        
        
        if (from_class_id == "" || to_class_id == "") {
            toastr.error("<?php echo get_phrase('select_class_for_promotion_from_and_to');?>")
            return false;
        } else if(from_class_id == to_class_id) {
            toastr.error("<?php echo get_phrase('you_cannot_promote_student_to_the_same_class!');?>")
            return false;
        } else if(from_class == to_class) {
            toastr.error("<?php echo get_phrase('you_cannot_promote_student_to_the_same_class_with_different_section!');?>")
            return false;
        }

        if(from_class_name == 'JHSS') {
            if(running_sem != 2) {
                toastr.error("<?php echo get_phrase('student_is_not_due_for_promotion_in_semester_'.$running_sem.'. promotion_can_only_be_done_in_semester_2.');?>")
                return false;
            }

            showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder; margin-top: 0px; ">Fetching Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');
            //$('.modal-dialog').css('marginTop', '200px');

            $.ajax({
                url: '<?php echo site_url('admin/get_students_to_promote/');?>' + from_class_id + '/' + to_class_id + '/' + running_year + '/' + promotion_year + '/' + running_sem + '/' + from_class_name,
                success: function(response)
                {   
                    $('.close').click();
                    jQuery('#students_for_promotion_holder').html(response);
                }
            });

        } else {
            if(running_term != 3) {
                toastr.error("<?php echo get_phrase('student_is_not_due_for_promotion_in_term_'.$running_term.'. promotion_can_only_be_done_in_term_3.');?>")
                return false;
            }

            showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder; margin-top: 0px; ">Fetching Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');
            //$('.modal-dialog').css('marginTop', '200px');

            $.ajax({
                url: '<?php echo site_url('admin/get_students_to_promote/');?>' + from_class_id + '/' + to_class_id + '/' + running_year + '/' + promotion_year + '/' + running_term + '/' + from_class_name,
                success: function(response)
                {
                    $('.close').click();
                    jQuery('#students_for_promotion_holder').html(response);
                }
            });
        }

        
        return false;
    }


    //ajax
$('#promotion_form').submit(function(event) {
    /* Act on the event */
    
    event.preventDefault();

    //Scroll to the top
      $('html, body').animate({
          scrollTop: ($('#top').offset().top )
      }, 1000);

    //SHOW LOADER
  showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder; margin-top: 0px; ">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');
            //$('.modal-dialog').css('marginTop', '200px');


    $.ajax({
      url: '<?php echo site_url('admin/student_promotion/promote'); ?>',
      type: 'POST',
      dataType: 'html',
      data: new FormData(this),
      cache: false,
      contentType: false,
      processData: false
  })
  .done(function(data) {
    showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder; margin-top: 0px; ">Students promoted successfully.</div></center>', 'Success');
            //$('.modal-dialog').css('marginTop', '200px');
    
    setTimeout(() => {
        $('.close').click();
        navigation('<?php echo site_url($this->session->userdata('login_type') .'/student_promotion'); ?>');
    }, 3000);
  });
});

</script>

