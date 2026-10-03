<div class="p-4 md:p-6 bg-gray-50 min-h-screen teacher-marks-selector-workspace">
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2"><?php echo get_phrase('manage_exam_marks'); ?></h1>
        <p class="text-gray-600"><?php echo get_phrase('enter_and_manage_student_marks'); ?></p>
    </div>
<?php
	if(isset($_GET['error']) && $_GET['error'] == 1) { 
		if(isset($_GET['term'])) {
		?>
		<div class="alert alert-danger alert-dismissable" role="alert" aria-label="alert" style="text-align: center;">
			<button class="close" data-dismiss="alert">&times;</button>
			<strong><?= get_phrase('seems_students_attendance_for_term_'.$_GET['term'].'_has_not_been_marked_yet._please_mark_students_attendance_first_to_enroll_students_for_this_term_before_you_proceed.'); ?></strong>
		</div>
<?php
		} else {
			if(isset($_GET['sem'])) {
		?>
		<div class="alert alert-danger alert-dismissable" role="alert" aria-label="alert" style="text-align: center;">
			<button class="close" data-dismiss="alert">&times;</button>
			<strong><?= get_phrase('seems_students_attendance_for_semester_'.$_GET['sem'].'_has_not_been_marked_yet._please_mark_students_attendance_first_to_enroll_students_for_this_semester_before_you_proceed.'); ?></strong>
		</div>
<?php
		}
		}
	}
 ?>

 <?php
 //No subject selected error
	if(isset($_GET['subjr']) && $_GET['subjr'] == 1) { ?>
		<div class="alert alert-danger alert-dismissable" role="alert" aria-label="alert" style="text-align: center;">
			<button class="close" data-dismiss="alert">&times;</button>
			<strong><?= get_phrase('no_subject_was_found_for_this_class._please_add_subjects_for_this_class_and_try_again!'); ?></strong>
		</div>
<?php
	}
 ?>
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-4"><?php echo get_phrase('select_exam_details'); ?></h3>
        <?php echo form_open(site_url('admin/marks_selector'), array('id' => 'marks_selector_form', 'class' => 'space-y-4'));?>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

	<div class="flex flex-col sm:flex-row gap-4 w-full">
		<div class="w-full">
			<div class="form-group">
			<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('exam');?></label>
				<select name="exam_id" class="select2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase">
					<option value=""><?php echo get_phrase('select_exam_type');?></option>
					<?php
						if(isset($class_name) && $class_name == 'JHSS') {
							$this->db->where('year', $running_year);
							$this->db->where('category_id !=', '1');
							$this->db->where('sem', $running_sem);
						} else {
							$this->db->where('year', $running_year);
							$this->db->where('category_id !=', '1');
							$this->db->where('term', $running_term);
						}
						$exams_query = $this->db->get('exam');
						$exams = $exams_query->result_array();

						if($exams_query->num_rows() > 0) {
						foreach($exams as $row):
					?>
					<option value="<?php echo $row['exam_id'];?>"><?php echo $row['name'];?></option>
					<?php endforeach;

				} else { ?>
					<option value="">Add exam first</option>
					<?php

				}
					?>
				</select>
			</div>
		</div>

		<?php
			if($account_type == 'teacher') {
				?>
					<div class="w-full">
						<div class="form-group">
						<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('class');?></label>
							<select name="class_id" class="select2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase" onchange="get_class_subject(this.value)">
								<option value=""><?php echo get_phrase('select_class');?></option>
								<?php
								// Track which class_ids we've already added to avoid duplicates
								$added_class_ids = array();
								
								// First, add classes where teacher is the class teacher (creche)
								foreach($class_ids_creche as $subj):
									// Skip if already added
									if(in_array($subj['class_id'], $added_class_ids)) continue;
									
									$classes = $this->db->get_where('class', array('class_id' => $subj['class_id']))->result_array();
									foreach($classes as $row):
									 
									 //add section A or B if the class has more than one section
				                    $section_name = $this->db->get_where('section', array('class_id' => $row['class_id']))->row()->name;
				                    $class_has_more_sections = $this->db->get_where('class', array('name' => $row['name'], 'name_numeric' => $row['name_numeric']))->num_rows();
				                    $sec_name = '';
				                    if($class_has_more_sections > 1) {
				                        $sec_name = ' '.$section_name;
				                    }
								?>
								<option value="<?php echo $row['class_id'];?>"><?php echo $row['name'].' '.$row['name_numeric'].$sec_name;?></option>
								<?php 
									// Mark this class_id as added
									$added_class_ids[] = $row['class_id'];
									endforeach; 
								endforeach; //FOR CRECHE 
								?> 
				                
				                <?php
								// Second, add classes where teacher teaches subjects
								foreach($class_ids as $subj):
									// Skip if already added
									if(in_array($subj['class_id'], $added_class_ids)) continue;
									
									$classes = $this->db->get_where('class', array('class_id' => $subj['class_id']))->result_array();
									foreach($classes as $row):
									
									//add section A or B if the class has more than one section
				                    $section_name = $this->db->get_where('section', array('class_id' => $row['class_id']))->row()->name;
				                    $class_has_more_sections = $this->db->get_where('class', array('name' => $row['name'], 'name_numeric' => $row['name_numeric']))->num_rows();
				                    $sec_name = '';
				                    if($class_has_more_sections > 1) {
				                        $sec_name = ' '.$section_name;
				                    }
								?>
								<option value="<?php echo $row['class_id'];?>"><?php echo $row['name'].' '.$row['name_numeric'].$sec_name;?></option>
								<?php 
									// Mark this class_id as added
									$added_class_ids[] = $row['class_id'];
									endforeach; 
								endforeach; 
								?>
							</select>
						</div>
					</div>
				<?php
			} else {
				?>
					<div class="w-full">
						<div class="form-group">
						<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('class');?></label>
							<select name="class_id" class="select2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase" onchange="get_class_subject(this.value)">
								<option value=""><?php echo get_phrase('select_class');?></option>
								<?php

	                    getFullClassList();
	                ?>
							</select>
						</div>
					</div>
				<?php
			}
		?>
	</div>
	

	<!-- Hidden section selector - value still submitted but not visible -->
	<div id="subject_holder" class="w-full flex flex-col sm:flex-row gap-4">
		<div class="w-full" style="display: none;">
			<div class="form-group">
			<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('section');?></label>
				<select name="section_id" id="section_id" class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase">
					<option value=""><?php echo get_phrase('select_class_first');?></option>		
				</select>
			</div>
		</div>
		<div class="w-full">
			<div class="form-group">
			<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('subject');?></label>
				<select name="subject_id" id="subject_id" class="select2 visible bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase">
					<option value=""><?php echo get_phrase('select_class_first');?></option>		
				</select>
			</div>
		</div>
		<div class="w-full" style="margin-top: 20px">

				<?php
					echo get_button('submit', "Manage Marks", '', 'submit')
				?>
		</div>
	</div>

        </div>
        <?php echo form_close();?>
    </div>
</div>





<script type="text/javascript">
jQuery(document).ready(function($) {

	$("#submit").attr('disabled', 'disabled');
});
	
	function get_class_subject(class_id) {


		if (class_id !== '') {
		$.ajax({
            url: '<?php echo site_url('admin/marks_get_subject/');?>' + class_id,
            cache: false,
            dataType: 'json',
            type: 'post',
            success: function(response)
            {

            	if(response.section == 'creche') {
            		jQuery('#subject_holder').html(response.subject);

            	} else {

            		$('#category_holder').slideUp('slow');
        			$('#category_holder').css('display', 'none');
        			$('#subject_holder2').removeClass('col-span-2');
        			jQuery('#section_id').html(response.section);
	                jQuery('#subject_id').html(response.subject);
	                $('#subject_id').select2();
            	}
                
            }
        });
        $('#submit').removeAttr('disabled');
	  }
	  else{
	  	$('#submit').attr('disabled', 'disabled');
	  }
	}

	//ajax
$('#marks_selector_form').submit(function(event) {
	/* Act on the event */

	event.preventDefault();

	$('#main_page').empty();

	//SHOW LOADER
  $('#main_page').html('<center><div style="font-size: 20px; font-weight: bolder; margin-top: 200px; ">Fetching Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>');

  	let formUrl = $(this).attr('action');

	$.ajax({
      url: formUrl,
      type: 'POST',
      dataType: 'html',
      data: new FormData(this),
      cache: false,
      contentType: false,
      processData: false
  })
  .done(function(data) {
  	if(data == 'no subject') {
  		showAjaxModal_alert('Please select subject for this class.', 'Error');

  		setTimeout(() => {
  			navigation('<?php echo site_url('admin/marks_manage'); ?>')
  		}, 5000);
      
  	} else if(data == 'no enrollment') {
  		showAjaxModal_alert('Make sure students were enrolled before proceeding. Try marking attendance first and try again.', 'Error');

  		
  		setTimeout(() => {
  			navigation('<?php echo site_url('admin/marks_manage'); ?>')
  		}, 5000);
      
  	} else {
  		$('#main_page').empty();
  		
  		navigation(data);
  	}
  });
});
</script>

<style>
/* Direct UX refinement — Teacher Marks Selector */
.teacher-marks-selector-workspace {
    padding: 24px 28px 40px !important;
    background: #f8fafc !important;
}
.teacher-marks-selector-workspace > .mb-6:first-child {
    margin-bottom: 18px !important;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.teacher-marks-selector-workspace > .mb-6:first-child h1 {
    margin: 0 0 4px !important;
    color: #0f172a !important;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800 !important;
    letter-spacing: -.02em;
}
.teacher-marks-selector-workspace > .mb-6:first-child p {
    margin: 0 !important;
    color: #64748b !important;
    font-size: 15px !important;
    line-height: 1.5;
}
.teacher-marks-selector-workspace .alert {
    margin-bottom: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 1.45;
}
.teacher-marks-selector-workspace > .bg-white.rounded-xl {
    padding: 18px !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.teacher-marks-selector-workspace > .bg-white.rounded-xl h3 {
    margin-bottom: 14px !important;
    color: #0f172a !important;
    font-size: 17px !important;
    font-weight: 800 !important;
}
#marks_selector_form {
    padding: 0 !important;
}
#marks_selector_form > .grid {
    gap: 14px !important;
}
#marks_selector_form > .grid > .flex {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0,1fr)) !important;
    gap: 14px !important;
}
#marks_selector_form .form-group {
    margin-bottom: 0 !important;
}
#marks_selector_form .control-label {
    display: block;
    margin-bottom: 7px !important;
    color: #334155;
    font-size: 14px !important;
    line-height: 1.35;
    font-weight: 700 !important;
}
#marks_selector_form select,
#marks_selector_form .select2-container .select2-selection--single,
#marks_selector_form .select2-container .select2-choice {
    min-height: 46px !important;
    height: 46px !important;
    padding: 8px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff !important;
    color: #0f172a !important;
    font-size: 15px !important;
    line-height: 1.4 !important;
    font-weight: 600 !important;
}
#marks_selector_form select {
    padding-right: 34px !important;
}
#marks_selector_form .select2-container {
    width: 100% !important;
}
#marks_selector_form .select2-container .select2-selection__rendered,
#marks_selector_form .select2-container .select2-choice > span:first-child {
    line-height: 28px !important;
    font-size: 15px !important;
    color: #0f172a !important;
    font-weight: 600 !important;
}
#marks_selector_form .select2-container .select2-selection__arrow {
    height: 44px !important;
}
#marks_selector_form select:focus,
#marks_selector_form .select2-container--focus .select2-selection--single {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
    outline: none;
}
#subject_holder {
    display: grid !important;
    grid-template-columns: minmax(0,1fr) auto !important;
    gap: 14px !important;
    align-items: end !important;
}
#subject_holder > .w-full[style*="display: none"] {
    display: none !important;
}
#subject_holder > .w-full[style*="margin-top"] {
    margin-top: 0 !important;
}
#marks_selector_form button[type="submit"],
#marks_selector_form input[type="submit"],
#marks_selector_form .btn {
    min-height: 46px !important;
    height: 46px !important;
    padding: 9px 16px !important;
    border-radius: 9px !important;
    font-size: 14px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.teacher-marks-selector-workspace .text-xl,
.teacher-marks-selector-workspace .text-2xl {
    font-size: 15px !important;
}
.teacher-marks-selector-workspace .h-20 {
    height: 46px !important;
    min-height: 46px !important;
}

@media (max-width: 767px) {
    .teacher-marks-selector-workspace {
        padding: 18px 14px 32px !important;
    }
    .teacher-marks-selector-workspace > .mb-6:first-child h1 {
        font-size: 26px !important;
    }
    #marks_selector_form > .grid > .flex {
        grid-template-columns: 1fr !important;
    }
    #subject_holder {
        grid-template-columns: 1fr !important;
    }
    #marks_selector_form select,
    #marks_selector_form .select2-container .select2-selection--single {
        font-size: 16px !important;
    }
    #marks_selector_form button[type="submit"],
    #marks_selector_form .btn {
        width: 100%;
    }
}

/* Mobile responsive styles for marks management filters */
@media (max-width: 640px) {
    .grid {
        grid-template-columns: 1fr !important;
    }
    
    .flex.gap-4 {
        flex-direction: column !important;
    }
    
    .w-full select {
        font-size: 16px !important;
        height: auto !important;
        min-height: 50px !important;
        padding: 12px !important;
    }
    
    .form-group label {
        font-size: 14px !important;
    }
    
    .bg-white.rounded-xl {
        padding: 1rem !important;
    }
}

@media (min-width: 641px) and (max-width: 768px) {
    .w-full select {
        font-size: 18px !important;
        height: auto !important;
        min-height: 60px !important;
    }
}
</style>